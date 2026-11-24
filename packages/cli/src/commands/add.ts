import { BOOTSTRAP_JS_TAG, BRAND, EXIT, TOKENS_ITEM } from '../constants.js';
import { type Config, loadConfig } from '../config.js';
import type { Context } from '../context.js';
import { userError } from '../errors.js';
import {
  type InstallReport,
  type PlannedFile,
  applyPlan,
  planInstall,
  targetPath,
} from '../installer.js';
import { RegistryClient, type RegistryItem, parseRegistryLocation } from '../registry.js';
import { resolveItems } from '../resolver.js';

/** Registry client for a project: --registry wins, then bootcn.json. */
export function clientFor(ctx: Context, config: Config | null): RegistryClient {
  const location = ctx.registry
    ? parseRegistryLocation(ctx.registry, ctx.launchDir)
    : config
      ? parseRegistryLocation(config.registry, ctx.root)
      : null;
  if (!location)
    throw userError('No registry configured.', `Run "${BRAND} init" or pass --registry.`);
  return new RegistryClient(location, ctx.fetch);
}

const STATUS_LABEL: Record<PlannedFile['status'], string> = {
  create: 'create   ',
  unchanged: 'unchanged',
  conflict: 'exists   ',
};

function printPlan(
  ctx: Context,
  items: readonly RegistryItem[],
  plan: readonly PlannedFile[],
): void {
  const { out } = ctx;
  out.info(`Items: ${items.map((item) => item.name).join(', ')}`);
  out.info('Files:');
  for (const file of plan) {
    const note = file.status === 'conflict' ? '  (differs from the registry)' : '';
    out.info(`  ${STATUS_LABEL[file.status]}  ${file.relPath}${note}`);
  }

  const platform = [...new Set(items.flatMap((item) => item.compatibility?.platform ?? []))];
  if (platform.length > 0) out.info(`Requires: ${platform.join(', ')} (5.3+).`);
  const external = [...new Set(items.flatMap((item) => item.dependencies ?? []))];
  if (external.length > 0)
    out.info(`External dependencies to install yourself: ${external.join(', ')}`);
  if (plan.some((file) => file.type === 'registry:script' || file.type === 'registry:lib')) {
    out.info('Note: installed JavaScript runs in your application. Review it like your own code.');
  }
}

/** Turns a project path into a href, dropping a leading public/ web root. */
function href(relPath: string): string {
  return relPath.startsWith('public/') ? relPath.slice('public/'.length) : relPath;
}

function printManualSteps(ctx: Context, config: Config, items: readonly RegistryItem[]): void {
  const { out } = ctx;
  const styles: string[] = [];
  const scripts: string[] = [];
  const snippets: string[] = [];
  for (const item of items) {
    for (const file of item.files) {
      const path = targetPath(config, file);
      if (file.type === 'registry:style') styles.push(path);
      else if (file.type === 'registry:script' || file.type === 'registry:lib') scripts.push(path);
      else if (file.type === 'registry:component') snippets.push(path);
    }
  }
  const needsBootstrapJs = items.some((item) =>
    (item.compatibility?.platform ?? []).some((entry) => /bootstrap js/i.test(entry)),
  );

  out.info('');
  out.info('Next steps:');
  if (styles.length > 0) {
    out.info('  In <head>, after the Bootstrap CSS link (tokens first):');
    for (const path of styles) out.info(`    <link rel="stylesheet" href="${href(path)}">`);
  }
  if (scripts.length > 0 || needsBootstrapJs) {
    out.info('  Before </body> (Bootstrap bundle first):');
    if (needsBootstrapJs) out.info(`    ${BOOTSTRAP_JS_TAG}`);
    for (const path of scripts) out.info(`    <script src="${href(path)}"></script>`);
  }
  if (snippets.length > 0) {
    out.info('  Copy the markup into your pages, or include it from PHP:');
    for (const path of snippets) out.info(`    <?php include __DIR__ . '/${path}'; ?>`);
  }
  if ([...styles, ...scripts].some((path) => path.startsWith('public/'))) {
    out.info(
      '  Paths under public/ are shown relative to your web root; adjust them to your layout.',
    );
  }
}

function printReport(ctx: Context, report: InstallReport): void {
  const { out } = ctx;
  for (const file of report.written) out.success(`wrote ${file.relPath}`);
  for (const file of report.unchanged) out.info(`  unchanged ${file.relPath}`);
  for (const file of report.skipped) {
    out.warn(
      `skipped ${file.relPath} (kept your version; use --overwrite or answer "overwrite" to replace)`,
    );
  }
  for (const { file, reason } of report.failed) out.error(`failed ${file.relPath}: ${reason}`);
}

/**
 * Resolves, plans and installs items. Shared by `add` and `init`.
 * Returns the exit code.
 */
export async function installItems(
  ctx: Context,
  config: Config,
  client: RegistryClient,
  names: readonly string[],
): Promise<number> {
  const items = await resolveItems(names, (name) => client.getItem(name));
  const plan = await planInstall(ctx.root, config, items);
  printPlan(ctx, items, plan);

  if (ctx.dryRun) {
    ctx.out.info('');
    ctx.out.info('Dry run: nothing was written.');
    return EXIT.ok;
  }

  const pending = plan.filter((file) => file.status !== 'unchanged');
  if (pending.length > 0 && ctx.interactive) {
    const proceed = await ctx.prompt.confirm(`Install ${pending.length} file(s)?`, true);
    if (!proceed) {
      ctx.out.info('Nothing was written.');
      return EXIT.ok;
    }
  }

  const report = await applyPlan(ctx, plan);
  ctx.out.info('');
  printReport(ctx, report);
  printManualSteps(ctx, config, items);

  if (report.failed.length > 0) {
    ctx.out.error(
      `${report.failed.length} file(s) failed; ${report.written.length} written. Fix the errors above and run the command again.`,
    );
    return EXIT.partial;
  }
  return EXIT.ok;
}

export async function addCommand(ctx: Context, names: readonly string[]): Promise<number> {
  if (names.length === 0)
    throw userError('Name at least one item to add.', `Example: ${BRAND} add button`);
  const config = await loadConfig(ctx.root);
  const client = clientFor(ctx, config);
  const unique = [...new Set(names.filter((name) => name !== TOKENS_ITEM))];
  return installItems(ctx, config, client, unique);
}
