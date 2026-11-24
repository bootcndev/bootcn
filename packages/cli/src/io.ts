import * as clack from '@clack/prompts';

import { userError } from './errors.js';

/** Where messages go. Injectable so tests can capture output. */
export interface Output {
  info(message: string): void;
  success(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  /** Raw text, printed as-is. */
  raw(message: string): void;
}

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/** Interactive questions. Only called when the run is interactive. */
export interface Prompter {
  confirm(message: string, initialValue: boolean): Promise<boolean>;
  select<T extends string>(
    message: string,
    options: SelectOption<T>[],
    initialValue: T,
  ): Promise<T>;
  text(
    message: string,
    initialValue: string,
    validate?: (value: string) => string | undefined,
  ): Promise<string>;
}

export function createConsoleOutput(
  stdout: NodeJS.WritableStream = process.stdout,
  stderr: NodeJS.WritableStream = process.stderr,
): Output {
  return {
    info: (message) => stdout.write(`${message}\n`),
    success: (message) => stdout.write(`✔ ${message}\n`),
    warn: (message) => stderr.write(`! ${message}\n`),
    error: (message) => stderr.write(`✖ ${message}\n`),
    raw: (message) => stdout.write(message),
  };
}

function unwrap<T>(value: T): Exclude<T, symbol> {
  if (clack.isCancel(value)) {
    clack.cancel('Cancelled.');
    throw userError('Cancelled by user.');
  }
  return value as Exclude<T, symbol>;
}

export function createClackPrompter(): Prompter {
  return {
    async confirm(message, initialValue) {
      return unwrap(await clack.confirm({ message, initialValue }));
    },
    async select(message, options, initialValue) {
      return unwrap(
        await clack.select({
          message,
          initialValue,
          // Option<T> is a conditional type that TypeScript cannot resolve for a generic T.
          options: options as unknown as clack.Option<typeof initialValue>[],
        }),
      ) as typeof initialValue;
    },
    async text(message, initialValue, validate) {
      return unwrap(
        await clack.text({
          message,
          initialValue,
          validate: validate ? (value) => validate(value ?? '') : undefined,
        }),
      );
    },
  };
}

/** A prompter that must never be called (non-interactive runs). */
export const nonInteractivePrompter: Prompter = {
  confirm: () => Promise.reject(userError('Internal error: prompted in non-interactive mode.')),
  select: () => Promise.reject(userError('Internal error: prompted in non-interactive mode.')),
  text: () => Promise.reject(userError('Internal error: prompted in non-interactive mode.')),
};
