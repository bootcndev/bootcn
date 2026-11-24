import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRegistry } from '../../registry/tooling/registry.js';
import { type RunDeps, run } from '../src/cli.js';
import type { Output, Prompter } from '../src/io.js';

const here = dirname(fileURLToPath(import.meta.url));
export const REGISTRY_SOURCE = resolve(here, '../../registry');

const cleanups: string[] = [];

export async function tempDir(prefix = 'bootcn-cli-'): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  cleanups.push(dir);
  return dir;
}

export async function cleanupTempDirs(): Promise<void> {
  await Promise.all(cleanups.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
}

/**
 * Builds the real registry into a temporary directory that survives
 * per-test cleanup. Call the returned `dispose` in afterAll.
 */
export async function builtRegistry(): Promise<{ dir: string; dispose: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'bootcn-dist-'));
  await buildRegistry(REGISTRY_SOURCE, dir);
  return { dir, dispose: () => rm(dir, { recursive: true, force: true }) };
}

export async function writeFiles(root: string, files: Record<string, string>): Promise<void> {
  for (const [path, content] of Object.entries(files)) {
    const full = resolve(root, path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }
}

export function read(root: string, path: string): Promise<string> {
  return readFile(resolve(root, path), 'utf8');
}

export interface MemoryOutput extends Output {
  text(): string;
}

export function memoryOutput(): MemoryOutput {
  const lines: string[] = [];
  return {
    info: (message) => lines.push(message),
    success: (message) => lines.push(`✔ ${message}`),
    warn: (message) => lines.push(`! ${message}`),
    error: (message) => lines.push(`✖ ${message}`),
    raw: (message) => lines.push(message),
    text: () => lines.join('\n'),
  };
}

type Answer = boolean | string;

/** A prompter that replays scripted answers and records the questions. */
export function scriptedPrompter(answers: Answer[]): Prompter & { asked: string[] } {
  const queue = [...answers];
  const asked: string[] = [];
  const next = (message: string): Answer => {
    asked.push(message);
    if (queue.length === 0) throw new Error(`Unexpected prompt: ${message}`);
    return queue.shift() as Answer;
  };
  return {
    asked,
    confirm: async (message) => Boolean(next(message)),
    select: async <T extends string>(message: string) => next(message) as T,
    text: async (message, initialValue) => {
      const answer = next(message);
      return answer === '' ? initialValue : String(answer);
    },
  };
}

export interface RunResult {
  code: number;
  output: string;
}

export async function runCli(argv: string[], deps: RunDeps = {}): Promise<RunResult> {
  const out = memoryOutput();
  const code = await run(argv, { interactive: false, ...deps, out });
  return { code, output: out.text() };
}
