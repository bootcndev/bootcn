#!/usr/bin/env node
/**
 * Puts a release on the Trello boards: a card in "Roadmap & Releases →
 * Released" with the changelog section, and a post draft in "Marketing & X →
 * Drafts". Run by .github/workflows/trello.yml on registry-v* and cli-v*
 * tags; safe to run again (existing cards with the same name are kept).
 *
 *   TRELLO_KEY=… TRELLO_TOKEN=… node scripts/trello-release.mjs registry-v0.23.0 [--dry-run]
 *
 * Without TRELLO_KEY/TRELLO_TOKEN it prints a notice and exits 0.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://bootcn.dev';
const tag = process.argv[2] ?? '';
const dryRun = process.argv.includes('--dry-run');
const { TRELLO_KEY: key, TRELLO_TOKEN: token } = process.env;

const match = /^(registry|cli)-v(\d+\.\d+\.\d+)$/.exec(tag);
if (!match) {
  console.error(
    `Usage: trello-release.mjs <registry-vX.Y.Z|cli-vX.Y.Z> [--dry-run] (got "${tag}")`,
  );
  process.exit(1);
}
const [, kind, version] = match;
const label = kind === 'cli' ? 'CLI' : 'Registry';

if (!key || !token) {
  console.log('TRELLO_KEY/TRELLO_TOKEN are not set: skipping Trello.');
  process.exit(0);
}

/** The changelog section of this release, without the VitePress markers. */
function changelogSection() {
  const text = readFileSync(resolve(ROOT, 'apps/docs/changelog.md'), 'utf8');
  const part =
    kind === 'cli'
      ? text.slice(text.indexOf('## CLI'))
      : text.slice(text.indexOf('## Registry'), text.indexOf('## CLI'));
  const start = part.indexOf(`### ${version}\n`);
  if (start === -1) return '';
  const rest = part.slice(start + `### ${version}\n`.length);
  const end = rest.search(/^#{2,3} /m);
  return (end === -1 ? rest : rest.slice(0, end)).replace(/^:::.*$/gm, '').trim();
}

async function api(method, path, params = {}) {
  const query = new URLSearchParams({ key, token, ...params });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`https://api.trello.com/1${path}?${query}`, { method });
    if (response.status === 429) {
      await new Promise((done) => setTimeout(done, 2000 * (attempt + 1)));
      continue;
    }
    if (!response.ok) throw new Error(`${method} ${path}: HTTP ${response.status}`);
    return response.json();
  }
  throw new Error('Trello rate limit');
}

async function listId(boardName, listName) {
  const boards = await api('GET', '/members/me/boards', { fields: 'name', filter: 'open' });
  const board = boards.find((b) => b.name === boardName);
  if (!board) throw new Error(`No board "${boardName}"`);
  const lists = await api('GET', `/boards/${board.id}/lists`, { fields: 'name', filter: 'open' });
  const list = lists.find((l) => l.name === listName);
  if (list) return list.id;
  if (dryRun) return null;
  return (await api('POST', '/lists', { idBoard: board.id, name: listName, pos: 'bottom' })).id;
}

async function addCard(boardName, listName, name, desc, pos) {
  const id = await listId(boardName, listName);
  const existing = id ? await api('GET', `/lists/${id}/cards`, { fields: 'name' }) : [];
  if (existing.some((card) => card.name === name)) {
    console.log(`= ${boardName} / ${listName}: "${name}" is already there`);
    return;
  }
  if (dryRun) {
    console.log(`+ ${boardName} / ${listName}: "${name}" (dry run)\n${desc}\n`);
    return;
  }
  const card = await api('POST', '/cards', { idList: id, name, desc, pos });
  console.log(`+ ${boardName} / ${listName}: "${name}" ${card.shortUrl}`);
}

const section = changelogSection();
const changes = section || 'See the changelog.';
// The first bullet, joined across its wrapped lines, as plain text.
const firstPoint = (section.split(/^- /m)[1] ?? '')
  .replace(/\s+/g, ' ')
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
  .replace(/`/g, '')
  .trim();

await addCard(
  'Roadmap & Releases',
  'Released',
  `${label} ${version}`,
  `${changes}\n\n${SITE}/changelog\nhttps://github.com/bootcndev/bootcn/releases/tag/${tag}`,
  'top',
);

const install = kind === 'cli' ? 'npx bootcn@latest init' : 'npx bootcn add <item>';
await addCard(
  'Marketing & X',
  'Drafts',
  `Post: ${label} ${version}`,
  `Bootcn ${label === 'CLI' ? 'CLI ' : ''}${version} is out.\n\n${firstPoint}\n\n${install}\n\n${SITE}/changelog?ref=x\n\n(Draft: edit before posting; keep under 280 characters.)`,
  'top',
);
