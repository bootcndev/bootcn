import { resolve } from 'node:path';

import { Command, CommanderError } from 'commander';

import pkg from '../package.json' with { type: 'json' };
import { addCommand } from './commands/add.js';
import { diffCommand } from './commands/diff.js';
import { infoCommand } from './commands/info.js';
import { type InitOptions, initCommand } from './commands/init.js';
import { listCommand } from './commands/list.js';
import { mcpCommand } from './commands/mcp.js';
import { BRAND, BRAND_TITLE, EXIT } from './constants.js';
import type { Context } from './context.js';
import { CliError } from './errors.js';
import {
  type Output,
  type Prompter,
  createClackPrompter,
  createConsoleOutput,
  nonInteractivePrompter,
} from './io.js';
import type { FetchLike } from './registry.js';

export const VERSION: string = pkg.version;

interface GlobalOptions {
  cwd?: string;
  registry?: string;
  yes?: boolean;
  dryRun?: boolean;
  overwrite?: boolean;
  verbose?: boolean;
}

export interface RunDeps {
  out?: Output;
  prompt?: Prompter;
  fetch?: FetchLike;
  /** Overrides TTY detection. */
  interactive?: boolean;
  launchDir?: string;
}

/** Runs the CLI and returns the exit code. Never calls process.exit. */
export async function run(argv: readonly string[], deps: RunDeps = {}): Promise<number> {
  const out = deps.out ?? createConsoleOutput();
  const launchDir = deps.launchDir ?? process.cwd();
  let verbose = argv.includes('--verbose');
  let exitCode: number = EXIT.ok;

  const buildContext = (options: GlobalOptions): Context => {
    verbose = Boolean(options.verbose);
    const tty = deps.interactive ?? Boolean(process.stdin.isTTY && process.stdout.isTTY);
    const interactive = !options.yes && tty;
    if (!options.yes && !tty && deps.interactive === undefined) {
      out.warn('No interactive terminal detected: using defaults (same as --yes).');
    }
    return {
      root: resolve(launchDir, options.cwd ?? '.'),
      launchDir,
      registry: options.registry,
      interactive,
      yes: Boolean(options.yes),
      dryRun: Boolean(options.dryRun),
      overwrite: Boolean(options.overwrite),
      verbose,
      out,
      prompt: interactive ? (deps.prompt ?? createClackPrompter()) : nonInteractivePrompter,
      fetch: deps.fetch ?? fetch,
    };
  };

  const program = new Command()
    .name(BRAND)
    .description(`${BRAND_TITLE}: install copy-paste Bootstrap components into your project.`)
    .version(VERSION, '-v, --version')
    .option('--cwd <path>', 'project directory', '.')
    .option(
      '--registry <url-or-path>',
      'registry https URL or local directory (overrides the config)',
    )
    .option('-y, --yes', 'accept defaults and never prompt (existing files are skipped)')
    .option('--dry-run', 'show what would happen without writing anything')
    .option('--overwrite', 'overwrite existing files that differ from the registry')
    .option('--verbose', 'show stack traces on errors')
    .showHelpAfterError()
    .exitOverride()
    .configureOutput({
      writeOut: (text) => out.raw(text),
      writeErr: (text) => out.raw(text),
    });

  program
    .command('init')
    .description(`create ${BRAND}.json, set up directories and install the design tokens`)
    .option('--bootstrap <version>', 'Bootstrap version to set up for: 5.3, or 6.0 (preview)')
    .option('--style <style>', 'default or soft')
    .action(async (options: InitOptions, command: Command) => {
      exitCode = await initCommand(buildContext(command.optsWithGlobals<GlobalOptions>()), {
        bootstrap: options.bootstrap,
        style: options.style,
      });
    });

  program
    .command('add')
    .description('install one or more items and their dependencies')
    .argument('<names...>', 'item names, e.g. button dialog')
    .action(async (names: string[], _options: unknown, command: Command) => {
      exitCode = await addCommand(buildContext(command.optsWithGlobals<GlobalOptions>()), names);
    });

  program
    .command('list')
    .description('list registry items and mark the installed ones')
    .action(async (_options: unknown, command: Command) => {
      exitCode = await listCommand(buildContext(command.optsWithGlobals<GlobalOptions>()));
    });

  program
    .command('diff')
    .description('compare installed files with the registry (all installed items by default)')
    .argument('[names...]', 'item names to compare')
    .action(async (names: string[], _options: unknown, command: Command) => {
      exitCode = await diffCommand(buildContext(command.optsWithGlobals<GlobalOptions>()), names);
    });

  program
    .command('mcp')
    .description('run a Model Context Protocol server on stdio for AI assistants')
    .action(async (_options: unknown, command: Command) => {
      // stdout carries the protocol: never prompt, never warn there.
      const ctx = buildContext({ ...command.optsWithGlobals<GlobalOptions>(), yes: true });
      exitCode = await mcpCommand(ctx, VERSION);
    });

  program
    .command('info')
    .description('show details about an item')
    .argument('<name>', 'item name')
    .action(async (name: string, _options: unknown, command: Command) => {
      exitCode = await infoCommand(buildContext(command.optsWithGlobals<GlobalOptions>()), name);
    });

  try {
    await program.parseAsync([...argv], { from: 'user' });
    return exitCode;
  } catch (error) {
    if (error instanceof CommanderError) {
      // --help and --version also end up here, with exit code 0.
      return error.exitCode === 0 ? EXIT.ok : EXIT.user;
    }
    if (error instanceof CliError) {
      out.error(error.message);
      if (error.hint) out.info(`  ${error.hint}`);
      if (verbose && error.cause instanceof Error && error.cause.stack)
        out.raw(`${error.cause.stack}\n`);
      return error.exitCode;
    }
    out.error(`Unexpected error: ${(error as Error).message ?? String(error)}`);
    if (verbose && error instanceof Error && error.stack) out.raw(`${error.stack}\n`);
    else out.info('  Run again with --verbose for details.');
    return EXIT.user;
  }
}
