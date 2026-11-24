import { lstat, mkdir } from 'node:fs/promises';

import {
  BOOTSTRAP_CSS_TAG,
  BOOTSTRAP_JS_TAG,
  BRAND,
  CONFIG_FILE,
  DEFAULT_BOOTSTRAP,
  DEFAULT_REGISTRY,
  EXIT,
} from '../constants.js';
import {
  type Config,
  type PathKey,
  createConfig,
  parseConfig,
  serializeConfig,
} from '../config.js';
import type { Context } from '../context.js';
import { userError } from '../errors.js';
import { atomicWrite } from '../installer.js';
import { resolveInsideRoot, unsafePathReason } from '../paths.js';
import { detectBootstrap, defaultPaths, detectProject, type ProjectType } from '../project.js';
import { RegistryClient, parseRegistryLocation, registryConfigValue } from '../registry.js';
import { installItems } from './add.js';

const PATH_LABELS: Record<PathKey, string> = {
  components: 'Where should component snippets (HTML, PHP or Blade) go?',
  css: 'Where should CSS files go?',
  js: 'Where should JavaScript files go?',
  lib: 'Where should shared JavaScript helpers go?',
};

export async function initCommand(ctx: Context): Promise<number> {
  const { out } = ctx;
  const rootInfo = await lstat(ctx.root).catch(() => null);
  if (!rootInfo?.isDirectory()) throw userError(`Project directory ${ctx.root} does not exist.`);

  // 1. Existing configuration.
  const configAbs = await resolveInsideRoot(ctx.root, CONFIG_FILE);
  if (await lstat(configAbs).catch(() => null)) {
    if (!ctx.interactive) {
      out.info(`${CONFIG_FILE} already exists in ${ctx.root}; nothing to do.`);
      out.info(`Run "${BRAND} add <item>" to install components.`);
      return EXIT.ok;
    }
    const again = await ctx.prompt.confirm(
      `${CONFIG_FILE} already exists. Re-initialize it?`,
      false,
    );
    if (!again) {
      out.info('Kept the existing configuration.');
      return EXIT.ok;
    }
  }

  // 2. Project type.
  const project = await detectProject(ctx.root);
  let type: ProjectType = project.type ?? 'html';
  const TYPE_NAMES: Record<ProjectType, string> = {
    php: 'native PHP',
    html: 'plain HTML',
    laravel: 'Laravel',
  };
  if (project.type) {
    out.info(`Detected a ${TYPE_NAMES[type]} project.`);
    if (type === 'laravel') {
      out.info(
        '  Components and pages will be Blade views; CSS and JS go under public/vendor/bootcn.',
      );
    }
  } else if (ctx.interactive) {
    type = await ctx.prompt.select<ProjectType>(
      'What kind of project is this?',
      [
        { value: 'html', label: 'Plain HTML' },
        { value: 'php', label: 'Native PHP' },
        { value: 'laravel', label: 'Laravel (Blade)' },
      ],
      'html',
    );
  } else {
    out.info('Could not detect the project type; using plain HTML defaults.');
  }

  // 3. Bootstrap.
  const bootstrap = await detectBootstrap(ctx.root);
  if (bootstrap.found) {
    out.info(`Found Bootstrap (${bootstrap.where}).`);
  } else {
    out.warn('Bootstrap 5.3+ was not found. Components need it. Add these tags to your layout:');
    out.info(`    ${BOOTSTRAP_CSS_TAG}`);
    out.info(`    ${BOOTSTRAP_JS_TAG}`);
    out.info(`  ${BRAND} does not edit your HTML or PHP files.`);
  }

  // 4. Paths.
  const paths = defaultPaths(type, project.hasPublicDir);
  if (ctx.interactive) {
    for (const key of Object.keys(PATH_LABELS) as PathKey[]) {
      paths[key] = await ctx.prompt.text(PATH_LABELS[key], paths[key], (value) => {
        const reason = unsafePathReason(value.trim());
        return reason ? `Path ${reason}. Use a relative path such as "assets/css".` : undefined;
      });
      paths[key] = paths[key].trim();
    }
  }

  // 5. Registry and config.
  const location = parseRegistryLocation(ctx.registry ?? DEFAULT_REGISTRY, ctx.launchDir);
  const config: Config = parseConfig(
    createConfig(
      registryConfigValue(location, ctx.root),
      DEFAULT_BOOTSTRAP,
      paths,
      type === 'laravel' ? 'laravel' : undefined,
    ),
  );
  const client = new RegistryClient(location, ctx.fetch);

  if (ctx.dryRun) {
    out.info(`Would write ${CONFIG_FILE}:`);
    out.raw(serializeConfig(config));
    return installItems(ctx, config, client, []);
  }

  // Validate the registry before writing anything.
  await client.getItem('tokens');

  await atomicWrite(configAbs, serializeConfig(config));
  out.success(`wrote ${CONFIG_FILE}`);
  for (const key of Object.keys(paths) as PathKey[]) {
    await mkdir(await resolveInsideRoot(ctx.root, paths[key]), { recursive: true });
  }

  // 6. Base tokens.
  const code = await installItems(ctx, config, client, []);
  if (code !== EXIT.ok) return code;

  out.info('');
  out.success(`${BRAND} is ready. Next: ${BRAND} add button`);
  return EXIT.ok;
}
