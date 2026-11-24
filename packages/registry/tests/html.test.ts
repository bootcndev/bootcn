import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HtmlValidate, type Report } from 'html-validate';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
/** Kinds whose items have a snippet (<name>.html) and a preview.html. */
const KINDS = ['components', 'blocks'];

const htmlvalidate = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    'no-inline-style': 'off',
    'doctype-style': 'off',
    'void-style': 'off',
    // A filterable list (combobox, command) needs a custom listbox: <select>
    // cannot filter. Every other native-element preference still applies.
    'prefer-native-element': ['error', { exclude: ['listbox'] }],
  },
});

function wrapSnippet(snippet: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Component snippet</title></head><body>${snippet}</body></html>`;
}

function describeReport(report: Report): string {
  return report.results
    .flatMap((result) =>
      result.messages.map(
        (message) =>
          `${result.filePath ?? ''}:${message.line}:${message.column} ${message.ruleId}: ${message.message}`,
      ),
    )
    .join('\n');
}

async function itemDirs(): Promise<{ name: string; dir: string }[]> {
  const found: { name: string; dir: string }[] = [];
  for (const kind of KINDS) {
    const kindDir = resolve(here, '..', kind);
    const entries = await readdir(kindDir, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.isDirectory()) found.push({ name: entry.name, dir: resolve(kindDir, entry.name) });
    }
  }
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

describe('component and block HTML', () => {
  it('previews and snippets are valid HTML', async () => {
    const items = await itemDirs();
    expect(items.length).toBeGreaterThan(20);
    for (const { name, dir } of items) {
      const preview = await readFile(resolve(dir, 'preview.html'), 'utf8');
      const previewReport = await htmlvalidate.validateString(preview, `${name}/preview.html`);
      expect(previewReport.valid, describeReport(previewReport)).toBe(true);

      const snippet = await readFile(resolve(dir, `${name}.html`), 'utf8');
      const snippetReport = await htmlvalidate.validateString(
        wrapSnippet(snippet),
        `${name}/${name}.html`,
      );
      expect(snippetReport.valid, describeReport(snippetReport)).toBe(true);
    }
  });
});

describe('template pages', () => {
  it('are valid HTML once placeholders are replaced', async () => {
    const templatesDir = resolve(here, '../templates');
    const entries = await readdir(templatesDir, { withFileTypes: true }).catch(() => []);
    const names = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const manifest = JSON.parse(
        await readFile(resolve(templatesDir, name, 'manifest.json'), 'utf8'),
      ) as { files: { path: string; type: string }[] };
      for (const file of manifest.files.filter((entry) => entry.type === 'registry:page')) {
        const page = (await readFile(resolve(templatesDir, name, file.path), 'utf8')).replace(
          /\{\{bootcn:(\w+)\}\}/g,
          'assets/$1',
        );
        const report = await htmlvalidate.validateString(page, `${name}/${file.path}`);
        expect(report.valid, describeReport(report)).toBe(true);
      }
    }
  });
});
