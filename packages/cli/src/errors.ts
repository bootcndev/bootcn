import { EXIT } from './constants.js';

/** An expected failure with a user-facing message and an exit code. */
export class CliError extends Error {
  readonly exitCode: number;
  readonly hint: string | undefined;

  constructor(
    message: string,
    options: { exitCode?: number; hint?: string; cause?: unknown } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = 'CliError';
    this.exitCode = options.exitCode ?? EXIT.user;
    this.hint = options.hint;
  }
}

export function userError(message: string, hint?: string): CliError {
  return new CliError(message, { exitCode: EXIT.user, hint });
}

export function registryError(message: string, hint?: string, cause?: unknown): CliError {
  return new CliError(message, { exitCode: EXIT.registry, hint, cause });
}
