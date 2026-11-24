/**
 * `bootcn mcp`: a Model Context Protocol server over stdio, so AI assistants
 * (Claude, Cursor, VS Code…) can search the registry, read items and install
 * them into the project. JSON-RPC 2.0, one message per line; nothing but
 * protocol messages is written to stdout.
 */
import { createInterface } from 'node:readline';

import { type Config, loadConfig } from '../config.js';
import { BRAND, BRAND_TITLE, DEFAULT_REGISTRY, EXIT } from '../constants.js';
import type { Context } from '../context.js';
import { CliError } from '../errors.js';
import type { Output } from '../io.js';
import { targetPath } from '../installer.js';
import { RegistryClient, parseRegistryLocation } from '../registry.js';
import { installItems } from './add.js';

const PROTOCOL_VERSION = '2025-06-18';
const TYPES: Record<string, string> = {
  ui: 'registry:ui',
  block: 'registry:block',
  template: 'registry:template',
  theme: 'registry:theme',
};

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

interface ToolResult {
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export interface McpStreams {
  input: NodeJS.ReadableStream;
  output: NodeJS.WritableStream;
}

const TOOLS = [
  {
    name: 'list_items',
    title: 'List Bootcn items',
    description:
      'Lists the components, blocks, templates and themes in the Bootcn registry (Bootstrap 5.3, plain HTML/CSS/vanilla JS). Optionally filter by type.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: Object.keys(TYPES), description: 'Only this kind of item.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'search_items',
    title: 'Search Bootcn items',
    description:
      'Finds registry items whose name, title, description or categories contain every word of the query (for example "date range" or "login").',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', minLength: 1 } },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_item',
    title: 'Get a Bootcn item',
    description:
      'Returns one item: description, dependencies, where its files install in this project, and the full source of every file (HTML, CSS, JS). Read it before using or adapting a component.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', minLength: 1 } },
      required: ['name'],
      additionalProperties: false,
    },
  },
  {
    name: 'add_items',
    title: 'Install Bootcn items',
    description:
      'Installs items and their dependencies into the project (needs bootcn.json; run "npx bootcn init" first). Existing files that differ are kept unless overwrite is true. Returns the files written and the <link>/<script> tags to add.',
    inputSchema: {
      type: 'object',
      properties: {
        names: { type: 'array', items: { type: 'string' }, minItems: 1 },
        overwrite: { type: 'boolean', default: false },
        dryRun: { type: 'boolean', default: false, description: 'Only show what would happen.' },
      },
      required: ['names'],
      additionalProperties: false,
    },
    annotations: { destructiveHint: true },
  },
  {
    name: 'get_project_config',
    title: 'Read bootcn.json',
    description:
      "Returns the project's bootcn.json (registry, framework, install paths), or says that the project is not set up yet.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
];

const INSTRUCTIONS = `${BRAND_TITLE} is a copy-paste component library for Bootstrap 5.3: each item is plain HTML, CSS and (sometimes) a small vanilla JavaScript file installed into the user's project. Search or list items, read one with get_item before writing markup that uses it, and install with add_items. Keep the bootcn- classes and data-bootcn-* attributes: the CSS and JS rely on them. Pages must load Bootstrap 5.3 CSS (and its JS bundle for interactive items), then tokens.css, then the item styles.`;

/** Collects command output instead of printing it (stdout is the protocol). */
function captureOutput(): Output & { text(): string } {
  const lines: string[] = [];
  return {
    info: (message) => lines.push(message),
    success: (message) => lines.push(`✔ ${message}`),
    warn: (message) => lines.push(`! ${message}`),
    error: (message) => lines.push(`✖ ${message}`),
    raw: (message) => lines.push(message.replace(/\n$/, '')),
    text: () => lines.join('\n'),
  };
}

function text(value: string, isError = false): ToolResult {
  return { content: [{ type: 'text', text: value }], ...(isError ? { isError: true } : {}) };
}

async function projectConfig(ctx: Context): Promise<Config | null> {
  try {
    return await loadConfig(ctx.root);
  } catch {
    return null;
  }
}

function client(ctx: Context, config: Config | null): RegistryClient {
  const location = ctx.registry
    ? parseRegistryLocation(ctx.registry, ctx.launchDir)
    : config
      ? parseRegistryLocation(config.registry, ctx.root)
      : parseRegistryLocation(DEFAULT_REGISTRY, ctx.root);
  return new RegistryClient(location, ctx.fetch);
}

function stringArg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new CliError(`"${key}" must be a non-empty string.`);
  }
  return value.trim();
}

async function callTool(
  ctx: Context,
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  const config = await projectConfig(ctx);
  const registry = client(ctx, config);

  if (name === 'list_items' || name === 'search_items') {
    const index = await registry.getIndex();
    let items = index.items;
    if (name === 'list_items' && typeof args.type === 'string') {
      const type = TYPES[args.type];
      if (!type)
        return text(`Unknown type "${args.type}". Use ${Object.keys(TYPES).join(', ')}.`, true);
      items = items.filter((item) => item.type === type);
    }
    if (name === 'search_items') {
      const words = stringArg(args, 'query').toLowerCase().split(/\s+/);
      items = items.filter((item) => {
        const haystack = [item.name, item.title, item.description, ...(item.categories ?? [])]
          .join(' ')
          .toLowerCase();
        return words.every((word) => haystack.includes(word));
      });
    }
    if (items.length === 0) return text('No items match.');
    return text(
      items
        .map(
          (item) =>
            `${item.name} (${item.type.replace('registry:', '')}): ${item.title}. ${item.description}`,
        )
        .join('\n'),
    );
  }

  if (name === 'get_item') {
    const item = await registry.getItem(stringArg(args, 'name'));
    const files = item.files.map((file) => ({
      type: file.type,
      installsTo: config ? targetPath(config, file) : file.target,
      content: file.content,
    }));
    return text(
      JSON.stringify(
        {
          name: item.name,
          title: item.title,
          type: item.type,
          version: item.version,
          description: item.description,
          requires: item.compatibility?.platform ?? ['Bootstrap CSS'],
          registryDependencies: item.registryDependencies ?? [],
          files,
        },
        null,
        2,
      ),
    );
  }

  if (name === 'add_items') {
    if (!config) {
      return text(
        `This project has no bootcn.json. Run "npx ${BRAND}@latest init" in ${ctx.root} first.`,
        true,
      );
    }
    const names = Array.isArray(args.names)
      ? args.names.filter((n): n is string => typeof n === 'string')
      : [];
    if (names.length === 0) return text('"names" must list at least one item.', true);
    const out = captureOutput();
    const code = await installItems(
      {
        ...ctx,
        out,
        interactive: false,
        yes: true,
        overwrite: args.overwrite === true,
        dryRun: args.dryRun === true,
      },
      config,
      registry,
      [...new Set(names)],
    );
    return text(out.text(), code !== EXIT.ok);
  }

  if (name === 'get_project_config') {
    return config
      ? text(JSON.stringify(config, null, 2))
      : text(
          `No bootcn.json in ${ctx.root}. Run "npx ${BRAND}@latest init" to set the project up.`,
        );
  }

  return text(`Unknown tool "${name}".`, true);
}

/** Handles one JSON-RPC message; returns the response, or null for notifications. */
export async function handleMessage(
  ctx: Context,
  version: string,
  message: JsonRpcRequest,
): Promise<object | null> {
  const id = message.id ?? null;
  const reply = (result: object) => ({ jsonrpc: '2.0', id, result });
  const fail = (code: number, text: string) => ({
    jsonrpc: '2.0',
    id,
    error: { code, message: text },
  });
  const notification = message.id === undefined;

  switch (message.method) {
    case 'initialize': {
      const requested = message.params?.protocolVersion;
      return reply({
        protocolVersion: typeof requested === 'string' ? requested : PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: BRAND, title: BRAND_TITLE, version },
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return reply({});
    case 'tools/list':
      return reply({ tools: TOOLS });
    case 'tools/call': {
      const name = message.params?.name;
      const args = (message.params?.arguments ?? {}) as Record<string, unknown>;
      if (typeof name !== 'string') return fail(-32602, 'Missing tool name.');
      try {
        return reply(await callTool(ctx, name, args));
      } catch (error) {
        const hint = error instanceof CliError && error.hint ? ` ${error.hint}` : '';
        return reply(text(`${(error as Error).message}${hint}`, true));
      }
    }
    default:
      return notification ? null : fail(-32601, `Method not found: ${message.method}`);
  }
}

export async function mcpCommand(
  ctx: Context,
  version: string,
  streams: McpStreams = { input: process.stdin, output: process.stdout },
): Promise<number> {
  const lines = createInterface({ input: streams.input, crlfDelay: Infinity });
  const send = (value: object) => streams.output.write(`${JSON.stringify(value)}\n`);
  for await (const line of lines) {
    if (line.trim() === '') continue;
    let message: JsonRpcRequest;
    try {
      message = JSON.parse(line) as JsonRpcRequest;
    } catch {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      continue;
    }
    const response = await handleMessage(ctx, version, message);
    if (response) send(response);
  }
  return EXIT.ok;
}
