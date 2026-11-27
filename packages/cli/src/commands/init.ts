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
import {
  bootstrapMinor,
  detectBootstrap,
  defaultPaths,
  detectProject,
  type ProjectType,
} from '../project.js';
import { RegistryClient, parseRegistryLocation, registryConfigValue } from '../registry.js';
import { installItems } from './add.js';

const PATH_LABELS: Record<PathKey, string> = {
  components: 'Where should component snippets (HTML, PHP or Blade) go?',
  css: 'Where should CSS files go?',
  js: 'Where should JavaScript files go?',
  lib: 'Where should shared JavaScript helpers go?',
};

/** Styles `init` can set up; anything but "default" is also a registry item. */
export const STYLES = {
  default: 'Default: outlined fields and cards with a hairline border',
  soft: 'Soft: tinted fields, cards on soft shadows, larger corners',
} as const;
export type Style = keyof typeof STYLES;

/** Bootstrap minors `init` accepts; 6 is a preview while Bootstrap 6 is in alpha. */
const BOOTSTRAP_CHOICES = ['5.3', '6.0'] as const;

export interface InitOptions {
  /** --bootstrap: the version to configure (5.3 or 6.0). */
  bootstrap?: string;
  /** --style: default or soft. */
  style?: string;
}

function checkBootstrapOption(value: string): string {
  const minor = bootstrapMinor(value);
  if (!minor || !(BOOTSTRAP_CHOICES as readonly string[]).includes(minor)) {
    throw userError(
      `--bootstrap ${value} is not supported.`,
      'Use 5.3, or 6.0 to try Bootstrap 6.',
    );
  }
  return minor;
}

function checkStyleOption(value: string): Style {
  if (!(value in STYLES)) {
    throw userError(
      `--style ${value} is not a style.`,
      `Use one of: ${Object.keys(STYLES).join(', ')}.`,
    );
  }
  return value as Style;
}

export async function initCommand(ctx: Context, options: InitOptions = {}): Promise<number> {
  // Check the flags before anything else, so a typo writes nothing.
  const bootstrapFlag = options.bootstrap ? checkBootstrapOption(options.bootstrap) : undefined;
  const styleFlag = options.style ? checkStyleOption(options.style) : undefined;
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

  // 3. Bootstrap: what the project has, and which version to set up for.
  const bootstrap = await detectBootstrap(ctx.root);
  const detected = bootstrapMinor(bootstrap.version);
  if (bootstrap.found) {
    out.info(
      `Found Bootstrap${bootstrap.version ? ` ${bootstrap.version}` : ''} (${bootstrap.where}).`,
    );
  }
  let bootstrapVersion = bootstrapFlag ?? (detected?.startsWith('6.') ? '6.0' : DEFAULT_BOOTSTRAP);
  if (!bootstrapFlag && ctx.interactive) {
    bootstrapVersion = await ctx.prompt.select(
      'Which Bootstrap version does this project use?',
      [
        { value: '5.3', label: 'Bootstrap 5.3', hint: 'recommended' },
        { value: '6.0', label: 'Bootstrap 6', hint: 'alpha: a preview' },
      ],
      bootstrapVersion,
    );
  }
  if (detected && Number(detected) < 5.3 && detected.startsWith('5.')) {
    out.warn(
      `Bootstrap ${bootstrap.version} is older than 5.3. Bootcn needs 5.3 or newer: update it.`,
    );
  } else if (detected && Number(detected.split('.')[0]) < 5) {
    out.warn(`Bootstrap ${bootstrap.version} is too old for Bootcn, which needs 5.3 or newer.`);
  }
  if (bootstrapVersion.startsWith('6.')) {
    out.warn(
      'Bootstrap 6 is still in alpha. Bootcn items are built and tested for Bootstrap 5.3; most work with 6, but check each one in your pages.',
    );
  }
  if (!bootstrap.found) {
    out.warn('Bootstrap was not found. Components need it. Add these tags to your layout:');
    out.info(`    ${BOOTSTRAP_CSS_TAG}`);
    out.info(`    ${BOOTSTRAP_JS_TAG}`);
    out.info(`  ${BRAND} does not edit your HTML or PHP files.`);
  }

  // 4. Style.
  let style: Style = styleFlag ?? 'default';
  if (!styleFlag && ctx.interactive) {
    style = await ctx.prompt.select<Style>(
      'Which style?',
      (Object.keys(STYLES) as Style[]).map((value) => ({ value, label: STYLES[value] })),
      'default',
    );
  }

  // 5. Paths: the defaults for this kind of project, or the user's own.
  const paths = defaultPaths(type, project.hasPublicDir);
  if (ctx.interactive) {
    out.info(
      `Default folders: components in ${paths.components}, CSS in ${paths.css}, JavaScript in ${paths.js}.`,
    );
    const keep = await ctx.prompt.confirm('Use these folders?', true);
    if (!keep) {
      for (const key of Object.keys(PATH_LABELS) as PathKey[]) {
        paths[key] = await ctx.prompt.text(PATH_LABELS[key], paths[key], (value) => {
          const reason = unsafePathReason(value.trim());
          return reason ? `Path ${reason}. Use a relative path such as "assets/css".` : undefined;
        });
        paths[key] = paths[key].trim();
      }
    }
  }

  // 6. Registry and config.
  const location = parseRegistryLocation(ctx.registry ?? DEFAULT_REGISTRY, ctx.launchDir);
  const config: Config = parseConfig(
    createConfig(
      registryConfigValue(location, ctx.root),
      bootstrapVersion,
      paths,
      type === 'laravel' ? 'laravel' : undefined,
      style,
    ),
  );
  const client = new RegistryClient(location, ctx.fetch);

  if (ctx.dryRun) {
    out.info(`Would write ${CONFIG_FILE}:`);
    out.raw(serializeConfig(config));
    return installItems(ctx, config, client, style === 'default' ? [] : [style]);
  }

  // Validate the registry before writing anything.
  await client.getItem('tokens');

  await atomicWrite(configAbs, serializeConfig(config));
  out.success(`wrote ${CONFIG_FILE}`);
  for (const key of Object.keys(paths) as PathKey[]) {
    await mkdir(await resolveInsideRoot(ctx.root, paths[key]), { recursive: true });
  }

  // 7. The design tokens, and the style when it is not the default.
  const code = await installItems(ctx, config, client, style === 'default' ? [] : [style]);
  if (code !== EXIT.ok) return code;

  if (style !== 'default') {
    out.info(`Keep ${style}.css last: after the CSS of the components you add.`);
  }
  out.info('');
  out.success(`${BRAND} is ready.`);
  out.info('Next:');
  out.info(`  ${BRAND} add button dialog   install components`);
  out.info(`  ${BRAND} list                see everything you can add`);
  out.info(`Browse them with live previews: https://${BRAND}.dev/components`);
  out.info(
    `Using an AI assistant? Give it the skill at https://${BRAND}.dev/skills/${BRAND}/SKILL.md`,
  );
  return EXIT.ok;
}
