import { afterEach, describe, expect, it, onTestFinished } from 'vitest';

import { EXIT } from '../src/constants.js';
import {
  type FetchLike,
  RegistryClient,
  parseRegistryLocation,
  registryConfigValue,
  validateRegistryItem,
} from '../src/registry.js';
import { resolveItems } from '../src/resolver.js';
import type { RegistryItem } from '../src/registry.js';
import { builtRegistry, cleanupTempDirs } from './helpers.js';

afterEach(cleanupTempDirs);

function item(name: string, deps: string[] = []): RegistryItem {
  return {
    name,
    type: 'registry:ui',
    title: name,
    description: name,
    registryDependencies: deps,
    files: [{ path: `${name}.css`, target: `${name}.css`, type: 'registry:style', content: '' }],
  };
}

function loaderFor(items: RegistryItem[]) {
  const map = new Map(items.map((entry) => [entry.name, entry]));
  return async (name: string) => {
    const found = map.get(name);
    if (!found) throw new Error(`missing ${name}`);
    return found;
  };
}

describe('parseRegistryLocation', () => {
  it('accepts https URLs and normalizes the base', () => {
    const location = parseRegistryLocation('https://registry.example.com/v1?x=1', '/project');
    expect(location).toMatchObject({ kind: 'url' });
    expect(location.kind === 'url' && location.base.href).toBe('https://registry.example.com/v1/');
  });

  it('rejects http, file and credential URLs', () => {
    expect(() => parseRegistryLocation('http://registry.example.com', '/p')).toThrow(
      /must use https/,
    );
    expect(() => parseRegistryLocation('file:///etc', '/p')).toThrow(/must use https/);
    expect(() => parseRegistryLocation('https://u:p@example.com', '/p')).toThrow(/credentials/);
  });

  it('treats other values as local directories', () => {
    expect(parseRegistryLocation('../registry/dist', '/work/project')).toMatchObject({
      kind: 'local',
      dir: '/work/registry/dist',
    });
  });

  it('stores local registries relative only when inside the project', () => {
    const inside = parseRegistryLocation('vendor/registry', '/work/project');
    const outside = parseRegistryLocation('/opt/registry', '/work/project');
    expect(registryConfigValue(inside, '/work/project')).toBe('vendor/registry');
    expect(registryConfigValue(outside, '/work/project')).toBe('/opt/registry');
  });
});

describe('RegistryClient over https', () => {
  const index = JSON.stringify({ name: 'bootcn', version: '0.1.0', items: [] });

  function fakeFetch(routes: Record<string, () => Response>): FetchLike & { calls: string[] } {
    const calls: string[] = [];
    const impl = async (url: string) => {
      calls.push(url);
      const route = routes[url];
      return route ? route() : new Response('not found', { status: 404 });
    };
    return Object.assign(impl, { calls });
  }

  it('fetches index.json relative to the base URL', async () => {
    const fetchImpl = fakeFetch({
      'https://r.example.com/v1/index.json': () => new Response(index),
    });
    const client = new RegistryClient(
      parseRegistryLocation('https://r.example.com/v1', '/'),
      fetchImpl,
    );
    expect((await client.getIndex()).version).toBe('0.1.0');
  });

  it('follows same-host https redirects', async () => {
    const fetchImpl = fakeFetch({
      'https://r.example.com/index.json': () =>
        new Response(null, { status: 302, headers: { location: '/latest/index.json' } }),
      'https://r.example.com/latest/index.json': () => new Response(index),
    });
    const client = new RegistryClient(
      parseRegistryLocation('https://r.example.com', '/'),
      fetchImpl,
    );
    await expect(client.getIndex()).resolves.toMatchObject({ name: 'bootcn' });
    expect(fetchImpl.calls).toHaveLength(2);
  });

  it('refuses redirects to another host', async () => {
    const fetchImpl = fakeFetch({
      'https://r.example.com/index.json': () =>
        new Response(null, {
          status: 301,
          headers: { location: 'https://evil.example.net/index.json' },
        }),
    });
    const client = new RegistryClient(
      parseRegistryLocation('https://r.example.com', '/'),
      fetchImpl,
    );
    await expect(client.getIndex()).rejects.toMatchObject({
      message: expect.stringMatching(/refusing to follow/),
      exitCode: EXIT.registry,
    });
    expect(fetchImpl.calls).toEqual(['https://r.example.com/index.json']);
  });

  it('reports network failures with the registry exit code', async () => {
    const failing: FetchLike = async () => {
      throw new Error('getaddrinfo ENOTFOUND');
    };
    const client = new RegistryClient(parseRegistryLocation('https://r.example.com', '/'), failing);
    await expect(client.getItem('button')).rejects.toMatchObject({ exitCode: EXIT.registry });
  });

  it('reports unknown items as a user error', async () => {
    const client = new RegistryClient(
      parseRegistryLocation('https://r.example.com', '/'),
      fakeFetch({}),
    );
    await expect(client.getItem('ghost')).rejects.toMatchObject({
      message: expect.stringMatching(/"ghost" was not found/),
      exitCode: EXIT.user,
    });
  });
});

describe('RegistryClient on a local built registry', () => {
  it('loads and validates real items', async () => {
    const { dir, dispose } = await builtRegistry();
    onTestFinished(dispose);
    const client = new RegistryClient(parseRegistryLocation(dir, '/'));
    const dialog = await client.getItem('dialog');
    expect(dialog.files.map((file) => file.target)).toEqual([
      'dialog.html',
      'dialog.css',
      'dialog.js',
    ]);
    expect((await client.getIndex()).items.length).toBeGreaterThanOrEqual(6);
  });
});

describe('validateRegistryItem', () => {
  it('rejects items with unsafe targets', () => {
    const bad = item('alpha');
    bad.files[0]!.target = '../../etc/evil.css';
    expect(() => validateRegistryItem(bad, 'alpha')).toThrow(/invalid|unsafe/);
  });

  it('rejects items without inlined content', () => {
    const bad = item('alpha') as unknown as { files: { content?: string }[] };
    delete bad.files[0]!.content;
    expect(() => validateRegistryItem(bad, 'alpha')).toThrow(/has no content/);
  });

  it('rejects a mismatched name', () => {
    expect(() => validateRegistryItem(item('alpha'), 'beta')).toThrow(/when "beta" was requested/);
  });
});

describe('resolveItems', () => {
  it('orders dependencies first, de-duplicates and includes tokens first', async () => {
    const load = loaderFor([
      item('tokens'),
      item('button'),
      item('card', ['button']),
      item('dialog', ['button']),
    ]);
    const names = (await resolveItems(['dialog', 'card', 'dialog'], load)).map(
      (entry) => entry.name,
    );
    expect(names).toEqual(['tokens', 'button', 'dialog', 'card']);
  });

  it('resolves transitive dependencies', async () => {
    const load = loaderFor([item('tokens'), item('a', ['b']), item('b', ['c']), item('c')]);
    const names = (await resolveItems(['a'], load)).map((entry) => entry.name);
    expect(names).toEqual(['tokens', 'c', 'b', 'a']);
  });

  it('detects cycles', async () => {
    const load = loaderFor([item('tokens'), item('a', ['b']), item('b', ['a'])]);
    await expect(resolveItems(['a'], load)).rejects.toThrow(/cycle in the registry: a -> b -> a/);
  });
});
