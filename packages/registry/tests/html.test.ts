import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { HtmlValidate, type Report } from 'html-validate';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const componentsDir = resolve(here, '../components');

const htmlvalidate = new HtmlValidate({
  extends: ['html-validate:recommended'],
  rules: {
    'no-inline-style': 'off',
    'doctype-style': 'off',
    'void-style': 'off',
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

async function componentNames(): Promise<string[]> {
  const entries = await readdir(componentsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe('component HTML', () => {
  it('previews and snippets are valid HTML', async () => {
    for (const name of await componentNames()) {
      const dir = resolve(componentsDir, name);

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
