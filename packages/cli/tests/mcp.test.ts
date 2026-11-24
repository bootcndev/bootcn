import { lstat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PassThrough } from 'node:stream';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

/** A JSON-RPC reply as the tests read it. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- protocol payloads vary per method
type Reply = { id: number; result?: any; error?: any };

import { mcpCommand } from '../src/commands/mcp.js';
import { EXIT } from '../src/constants.js';
import type { Context } from '../src/context.js';
import { nonInteractivePrompter } from '../src/io.js';
import {
  builtRegistry,
  cleanupTempDirs,
  memoryOutput,
  runCli,
  tempDir,
  writeFiles,
} from './helpers.js';

let registry: string;
let dispose: () => Promise<void>;

beforeAll(async () => {
  ({ dir: registry, dispose } = await builtRegistry());
});
afterAll(() => dispose());
afterEach(cleanupTempDirs);

function context(root: string): Context {
  return {
    root,
    launchDir: root,
    registry,
    interactive: false,
    yes: true,
    dryRun: false,
    overwrite: false,
    verbose: false,
    out: memoryOutput(),
    prompt: nonInteractivePrompter,
    fetch,
  };
}

/** Sends JSON-RPC messages to the server and returns its responses by id. */
async function session(root: string, messages: object[]) {
  const input = new PassThrough();
  const output = new PassThrough();
  let raw = '';
  output.on('data', (chunk: Buffer) => (raw += chunk.toString()));
  const done = mcpCommand(context(root), '0.0.0-test', { input, output });
  for (const message of messages) input.write(`${JSON.stringify(message)}\n`);
  input.end();
  expect(await done).toBe(EXIT.ok);
  const responses = raw
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as Reply);
  return new Map(responses.map((response) => [response.id, response]));
}

const call = (id: number, name: string, args: object = {}) => ({
  jsonrpc: '2.0',
  id,
  method: 'tools/call',
  params: { name, arguments: args },
});

describe('mcp server', () => {
  it('initializes and lists its tools; notifications get no reply', async () => {
    const root = await tempDir();
    const replies = await session(root, [
      { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      { jsonrpc: '2.0', id: 2, method: 'tools/list' },
      { jsonrpc: '2.0', id: 3, method: 'nope' },
    ]);
    expect(replies.get(1)!.result.serverInfo.name).toBe('bootcn');
    expect(replies.get(1)!.result.capabilities.tools).toBeDefined();
    expect(replies.get(2)!.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      'list_items',
      'search_items',
      'get_item',
      'add_items',
      'get_project_config',
    ]);
    expect(replies.get(3)!.error.code).toBe(-32601);
    expect(replies.size).toBe(3);
  });

  it('lists, searches and reads items', async () => {
    const root = await tempDir();
    const replies = await session(root, [
      call(1, 'list_items', { type: 'template' }),
      call(2, 'search_items', { query: 'date range' }),
      call(3, 'get_item', { name: 'dialog' }),
      call(4, 'get_item', { name: 'no-such-item' }),
    ]);
    const list = replies.get(1)!.result.content[0].text as string;
    expect(list).toContain('admin-dashboard (template)');
    expect(list).not.toContain('dialog (ui)');
    expect(replies.get(2)!.result.content[0].text).toContain('date-range-picker');
    const item = JSON.parse(replies.get(3)!.result.content[0].text as string);
    expect(item.name).toBe('dialog');
    expect(
      item.files.some((file: { content: string }) => file.content.includes('bootcn-dialog')),
    ).toBe(true);
    expect(replies.get(4)!.result.isError).toBe(true);
  });

  it('installs items into an initialized project, and explains when not set up', async () => {
    const root = await tempDir();
    await writeFiles(root, { 'index.html': '<!doctype html>' });
    const before = await session(root, [call(1, 'add_items', { names: ['button'] })]);
    expect(before.get(1)!.result.isError).toBe(true);
    expect(before.get(1)!.result.content[0].text).toMatch(/bootcn@latest init/);

    expect((await runCli(['init', '--yes', '--cwd', root, '--registry', registry])).code).toBe(
      EXIT.ok,
    );
    const replies = await session(root, [
      call(1, 'add_items', { names: ['dialog'] }),
      call(2, 'get_project_config'),
    ]);
    expect(replies.get(1)!.result.isError).toBeUndefined();
    expect(replies.get(1)!.result.content[0].text).toContain('wrote components/ui/dialog.html');
    expect(await lstat(resolve(root, 'assets/js/dialog.js')).catch(() => null)).not.toBeNull();
    expect(replies.get(2)!.result.content[0].text).toContain('"components": "components/ui"');
  });
});
