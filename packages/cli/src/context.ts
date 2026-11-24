import type { Output, Prompter } from './io.js';
import type { FetchLike } from './registry.js';

/** Everything a command needs; built once from the global flags. */
export interface Context {
  /** Absolute project root (from --cwd or the current directory). */
  root: string;
  /** Directory the command was launched from; --registry paths resolve against it. */
  launchDir: string;
  /** --registry override, if given. */
  registry: string | undefined;
  /** True when prompts may be shown (TTY and no --yes). */
  interactive: boolean;
  yes: boolean;
  dryRun: boolean;
  overwrite: boolean;
  verbose: boolean;
  out: Output;
  prompt: Prompter;
  fetch: FetchLike;
}
