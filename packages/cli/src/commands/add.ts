import { BOOTSTRAP_JS_TAG, BRAND, EXIT, TOKENS_ITEM } from '../constants.js';
import { type Config, componentFramework, loadConfig } from '../config.js';
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

/** Laravel: asset('...') for files under public/. */
function laravelHref(relPath: string): string {
  return relPath.startsWith('public/')
    ? `{{ asset('${relPath.slice('public/'.length)}') }}`
    : `/${relPath}`;
}

/** Blade view name: resources/views/bootcn/x.blade.php -> bootcn.x */
export function bladeView(relPath: string): string {
  return relPath
    .replace(/^resources\/views\//, '')
    .replace(/\.blade\.php$/, '')
    .split('/')
    .join('.');
}

/** How to use a Blade view: <x-ui.button /> for components, else @include. */
export function bladeUsage(relPath: string): string {
  const view = bladeView(relPath);
  return view.startsWith('components.')
    ? `<x-${view.slice('components.'.length)} />`
    : `@include('${view}')`;
}

function printManualSteps(ctx: Context, config: Config, items: readonly RegistryItem[]): void {
  const { out } = ctx;
  const styles: string[] = [];
  const scripts: string[] = [];
  const snippets: string[] = [];
  const pages: string[] = [];
  for (const item of items) {
    for (const file of item.files) {
      const path = targetPath(config, file);
      if (file.type === 'registry:style') styles.push(path);
      else if (file.type === 'registry:script' || file.type === 'registry:lib') scripts.push(path);
      else if (file.type === 'registry:component') snippets.push(path);
      else if (file.type === 'registry:page') pages.push(path);
    }
  }
  const needsBootstrapJs = items.some((item) =>
    (item.compatibility?.platform ?? []).some((entry) => /bootstrap js/i.test(entry)),
  );

  out.info('');
  out.info('Next steps:');
  const framework = componentFramework(config);
  if (framework) {
    const components = items.flatMap((item) =>
      item.files
        .filter((file) => file.type === `registry:${framework}`)
        .map((file) => targetPath(config, file)),
    );
    if (components.length > 0) {
      out.info('  Import the components where you need them (paths from the project root):');
      for (const path of components) {
        const name = path
          .split('/')
          .pop()!
          .replace(/\.(tsx|vue)$/, '');
        const from = framework === 'react' ? path.replace(/\.tsx$/, '') : path;
        out.info(`    import ${framework === 'react' ? `{ ${name} }` : name} from '${from}';`);
      }
      out.info('  Each component imports its own CSS and loads its JavaScript in the browser.');
    }
    if (needsBootstrapJs) out.info("  It uses Bootstrap's JavaScript: npm install bootstrap");
    return;
  }
  if (config.framework === 'laravel') {
    printLaravelSteps(ctx, { styles, scripts, snippets, pages, needsBootstrapJs });
    return;
  }
  if (pages.length > 0) {
    out.info('  Open the page (it already links its CSS and JavaScript):');
    for (const path of pages) out.info(`    ${path}`);
    out.info('  For your other pages:');
  }
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

function printLaravelSteps(
  ctx: Context,
  files: {
    styles: string[];
    scripts: string[];
    snippets: string[];
    pages: string[];
    needsBootstrapJs: boolean;
  },
): void {
  const { out } = ctx;
  if (files.pages.length > 0) {
    out.info('  Route to the page (it already links its CSS and JavaScript with asset()):');
    for (const path of files.pages) {
      const view = bladeView(path);
      out.info(`    Route::view('/${view.split('.').pop()}', '${view}');`);
    }
    out.info('  For your other views:');
  }
  if (files.styles.length > 0) {
    out.info('  In your layout <head>, after the Bootstrap CSS link (tokens first):');
    for (const path of files.styles) {
      out.info(`    <link rel="stylesheet" href="${laravelHref(path)}">`);
    }
  }
  if (files.scripts.length > 0 || files.needsBootstrapJs) {
    out.info('  Before </body> (Bootstrap bundle first):');
    if (files.needsBootstrapJs) out.info(`    ${BOOTSTRAP_JS_TAG}`);
    for (const path of files.scripts) out.info(`    <script src="${laravelHref(path)}"></script>`);
  }
  if (files.snippets.length > 0) {
    out.info('  Use the markup in your Blade views (edit it like any other view):');
    for (const path of files.snippets) out.info(`    ${bladeUsage(path)}`);
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
/**
 * React and Vue projects: each item's HTML snippet and pages give way to its
 * .tsx or .vue component (a registry overlay); its CSS and JavaScript stay.
 */
async function withFramework(
  ctx: Context,
  config: Config,
  client: RegistryClient,
  items: RegistryItem[],
  requested: readonly string[],
): Promise<RegistryItem[]> {
  const framework = componentFramework(config);
  if (!framework) return items;
  const label = framework === 'react' ? 'React' : 'Vue';
  const missing: string[] = [];
  const result: RegistryItem[] = [];
  for (const item of items) {
    const overlay = await client.getOverlay(framework, item.name);
    if (!overlay && requested.includes(item.name)) missing.push(item.name);
    const files = item.files.filter(
      (file) => file.type !== 'registry:component' && file.type !== 'registry:page',
    );
    // npm packages the component imports (Bootstrap's plugins need Popper).
    const dependencies = [
      ...new Set([...(item.dependencies ?? []), ...(overlay?.dependencies ?? [])]),
    ];
    result.push({
      ...item,
      dependencies,
      files: [...files, ...(overlay?.files ?? [])],
    });
  }
  for (const name of missing) {
    ctx.out.warn(
      `"${name}" has no ${label} component yet: its CSS and JavaScript are installed; use its markup from https://${BRAND}.dev in your templates.`,
    );
  }
  return result;
}

export async function installItems(
  ctx: Context,
  config: Config,
  client: RegistryClient,
  names: readonly string[],
): Promise<number> {
  const resolved = await resolveItems(names, (name) => client.getItem(name));
  const items = await withFramework(ctx, config, client, resolved, names);
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
  if (config.bootstrap.startsWith('6.')) {
    ctx.out.warn(
      'This project is set up for Bootstrap 6 (alpha). Bootcn items are tested with Bootstrap 5.3: check them in your pages.',
    );
  }
  const client = clientFor(ctx, config);
  const unique = [...new Set(names.filter((name) => name !== TOKENS_ITEM))];
  return installItems(ctx, config, client, unique);
}
