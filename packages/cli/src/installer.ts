import { randomBytes } from 'node:crypto';
import { lstat, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, join, posix } from 'node:path';

import { createTwoFilesPatch } from 'diff';

import { type Config, FILE_TYPE_TO_PATH } from './config.js';
import type { Context } from './context.js';
import { registryError, userError } from './errors.js';
import { resolveInsideRoot } from './paths.js';
import type { RegistryItem } from './registry.js';

export type FileStatus = 'create' | 'unchanged' | 'conflict';

export interface PlannedFile {
  item: string;
  type: string;
  /** Project-relative POSIX path. */
  relPath: string;
  absPath: string;
  content: string;
  status: FileStatus;
  existing?: string;
}

export interface InstallReport {
  written: PlannedFile[];
  unchanged: PlannedFile[];
  skipped: PlannedFile[];
  failed: { file: PlannedFile; reason: string }[];
}

/** Project-relative install path for a registry file. */
export function targetPath(config: Config, file: { type: string; target: string }): string {
  const key = FILE_TYPE_TO_PATH[file.type];
  if (!key) throw registryError(`Unknown registry file type "${file.type}".`);
  const base = config.paths[key];
  // Pages without a configured directory go to the project root.
  return base ? posix.join(base, file.target) : posix.normalize(file.target);
}

/** `{{bootcn:css}}` and friends, allowed in registry:page files only. */
const PAGE_PLACEHOLDER = /\{\{bootcn:(components|css|js|lib)\}\}/g;

/**
 * Content to write for a registry file. Pages reference the project's
 * directories through placeholders, replaced with paths relative to the
 * page, so the page works with any bootcn.json paths.
 */
export function renderContent(
  config: Config,
  file: { type: string; target: string; content: string },
): string {
  if (file.type !== 'registry:page') return file.content;
  const pageDir = posix.dirname(targetPath(config, file));
  return file.content.replace(PAGE_PLACEHOLDER, (_match, key: keyof Config['paths']) => {
    const dir = config.paths[key] ?? '.';
    return posix.relative(pageDir, dir) || '.';
  });
}

/** Computes what would be written, without touching the file system. */
export async function planInstall(
  root: string,
  config: Config,
  items: readonly RegistryItem[],
): Promise<PlannedFile[]> {
  const planned: PlannedFile[] = [];
  const byPath = new Map<string, PlannedFile>();

  for (const item of items) {
    for (const file of item.files) {
      const relPath = targetPath(config, file);
      const absPath = await resolveInsideRoot(root, relPath);

      const content = renderContent(config, file);
      const previous = byPath.get(relPath);
      if (previous) {
        if (previous.content !== content) {
          throw registryError(
            `Items "${previous.item}" and "${item.name}" both install "${relPath}" with different content.`,
          );
        }
        continue;
      }

      const info = await lstat(absPath).catch(() => null);
      let status: FileStatus = 'create';
      let existing: string | undefined;
      if (info) {
        if (!info.isFile()) {
          throw userError(
            `"${relPath}" exists and is not a regular file.`,
            'Move it away and run the command again.',
          );
        }
        existing = await readFile(absPath, 'utf8');
        status = existing === content ? 'unchanged' : 'conflict';
      }

      const entry: PlannedFile = {
        item: item.name,
        type: file.type,
        relPath,
        absPath,
        content,
        status,
        existing,
      };
      byPath.set(relPath, entry);
      planned.push(entry);
    }
  }
  return planned;
}

/** Writes via a temporary file in the same directory, then renames. */
export async function atomicWrite(absPath: string, content: string): Promise<void> {
  const dir = dirname(absPath);
  await mkdir(dir, { recursive: true });
  const temp = join(
    dir,
    `.${basename(absPath)}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`,
  );
  try {
    await writeFile(temp, content, { encoding: 'utf8', flag: 'wx' });
    await rename(temp, absPath);
  } catch (error) {
    await unlink(temp).catch(() => undefined);
    throw error;
  }
}

export function unifiedDiff(file: PlannedFile): string {
  return createTwoFilesPatch(
    `a/${file.relPath}`,
    `b/${file.relPath}`,
    file.existing ?? '',
    file.content,
    'installed',
    'registry',
  );
}

type Decision = 'skip' | 'overwrite';

async function decide(ctx: Context, file: PlannedFile): Promise<Decision> {
  if (ctx.overwrite) return 'overwrite';
  if (!ctx.interactive) return 'skip';
  for (;;) {
    const choice = await ctx.prompt.select<'skip' | 'overwrite' | 'diff'>(
      `${file.relPath} already exists and differs from the registry.`,
      [
        { value: 'skip', label: 'Skip', hint: 'keep your file' },
        { value: 'overwrite', label: 'Overwrite', hint: 'replace with the registry version' },
        { value: 'diff', label: 'Show diff' },
      ],
      'skip',
    );
    if (choice !== 'diff') return choice;
    ctx.out.raw(`${unifiedDiff(file)}\n`);
  }
}

/** Resolves conflicts (asking when interactive) and writes the files. */
export async function applyPlan(
  ctx: Context,
  plan: readonly PlannedFile[],
): Promise<InstallReport> {
  const report: InstallReport = { written: [], unchanged: [], skipped: [], failed: [] };
  const toWrite: PlannedFile[] = [];

  for (const file of plan) {
    if (file.status === 'unchanged') report.unchanged.push(file);
    else if (file.status === 'create') toWrite.push(file);
    else if ((await decide(ctx, file)) === 'overwrite') toWrite.push(file);
    else report.skipped.push(file);
  }

  for (const file of toWrite) {
    try {
      // Re-check right before writing: the tree may have changed since planning.
      await resolveInsideRoot(ctx.root, file.relPath);
      await atomicWrite(file.absPath, file.content);
      report.written.push(file);
    } catch (error) {
      report.failed.push({ file, reason: (error as Error).message });
    }
  }
  return report;
}
