/**
 * Markdown for the generated item pages (components, blocks, templates),
 * built from the registry: the same data and files the CLI installs.
 */
import {
  DEFAULT_PATHS,
  GITHUB_URL,
  KINDS,
  type Kind,
  type RegistryItem,
  itemsOf,
  readItem,
  readReadme,
  templatePreviewPath,
  addedOf,
  isNew,
  readIndex,
} from './registry';

const LANG: Record<string, string> = { '.html': 'html', '.css': 'css', '.js': 'js', '.php': 'php' };

/** A fence longer than any backtick run inside the content. */
function fence(content: string, info: string): string {
  const longest = Math.max(2, ...(content.match(/`+/g) ?? []).map((run) => run.length));
  const ticks = '`'.repeat(longest + 1);
  return `${ticks}${info}\n${content.replace(/\n$/, '')}\n${ticks}`;
}

function extOf(path: string): string {
  const dot = path.lastIndexOf('.');
  return dot === -1 ? '' : path.slice(dot);
}

/** README from its first `##` section (the page shows title and description). */
function readmeBody(readme: string): string {
  const lines = readme.replace(/\r\n/g, '\n').split('\n');
  const firstSection = lines.findIndex((line) => line.startsWith('## '));
  return firstSection === -1 ? '' : lines.slice(firstSection).join('\n').trim();
}

function requirements(item: RegistryItem): string {
  return (item.compatibility?.platform ?? ['Bootstrap CSS']).join(' + ');
}

/** Link to another documented item, wherever it lives. */
function itemLink(name: string, from: Kind): string {
  const target = (Object.keys(KINDS) as Kind[]).find((kind) =>
    itemsOf(kind).some((item) => item.name === name),
  );
  if (!target) return `\`${name}\``;
  const href = target === from ? `./${name}` : `../${target}/${name}`;
  return `[\`${name}\`](${href})`;
}

function defaultLocation(file: { type: string; target: string }): string {
  if (file.type === 'registry:page') return `${file.target} (project root)`;
  return `${DEFAULT_PATHS[file.type] ?? '?'}/${file.target}`;
}

function page(item: RegistryItem, kind: Kind): string {
  const deps = item.registryDependencies ?? [];
  const added = addedOf(item.name, item.type);
  const sourceUrl = `${GITHUB_URL}/tree/main/packages/registry/${KINDS[kind].dir}/${item.name}`;
  const depLinks = deps.length ? deps.map((dep) => itemLink(dep, kind)).join(', ') : 'none';
  const fileRows = item.files
    .map((file) => `| \`${file.path}\` | \`${defaultLocation(file)}\` |`)
    .join('\n');
  const sources = item.files
    .map((file) => fence(file.content, `${LANG[extOf(file.path)] ?? 'text'} [${file.path}]`))
    .join('\n\n');
  const isTemplate = kind === 'templates';
  const main =
    item.files.find(
      (file) => file.type === 'registry:page' || file.type === 'registry:component',
    ) ?? item.files[0]!;
  const previewProps = isTemplate
    ? `src="${templatePreviewPath(item.name)}" fixed`
    : `kind="${kind}"`;
  const what = kind === 'components' ? 'components' : 'blocks and components';
  const run = (prefix: string) => `${prefix} bootcn add ${item.name}`;

  const manual = isTemplate
    ? `1. Install the ${what} this template uses: ${depLinks}.
2. Copy the files from [Source](#source). The page refers to your folders with
   placeholders such as \`{{bootcn:css}}\`; replace each with the path from the
   page to that folder (for example \`assets/css\`).

| File | Default location |
| ---- | ---------------- |
${fileRows}`
    : `1. Load [Bootstrap 5.3](https://getbootstrap.com/docs/5.3/getting-started/introduction/) (${requirements(item)}) and the [design tokens](../guide/theming).
2. Install the ${what} it uses: ${depLinks}.
3. Copy the files from [Source](#source) into your project. With the default
   \`bootcn.json\` they go here:

| File | Default location |
| ---- | ---------------- |
${fileRows}`;

  return `# ${item.title}

<p class="bootcn-lead">${item.description}</p>

<ComponentMeta version="${item.version ?? ''}" added="${added ?? ''}" ${isNew(added, readIndex().version) ? 'is-new ' : ''}bootstrap="${item.compatibility?.bootstrap ?? '5.3'}" requires="${requirements(item)}" source="${sourceUrl}" name="${item.name}" title="${item.title}" kind="${kind}" />

<ComponentPreview name="${item.name}" title="${item.title}" ${previewProps}>
<template #code>

${fence(main.content, `${LANG[extOf(main.path)] ?? 'text'} [${main.path}]`)}

</template>
</ComponentPreview>

## Installation

<DocsTabs :labels="['CLI', 'Manual']" label="Installation method">
<template #tab-0>

::: code-group

\`\`\`bash [npm]
${run('npx')}
\`\`\`

\`\`\`bash [pnpm]
${run('pnpm dlx')}
\`\`\`

\`\`\`bash [yarn]
${run('yarn dlx')}
\`\`\`

\`\`\`bash [bun]
${run('bunx --bun')}
\`\`\`

:::

The CLI also installs the design tokens and these ${what}: ${depLinks}.
${isTemplate ? 'It writes the page with its links already pointing at your asset folders.' : 'It prints the `<link>` and `<script>` tags to add to your layout.'}

</template>
<template #tab-1>

<!-- v-pre: the text may show placeholders such as {{bootcn:css}} literally. -->
::: v-pre

${manual}

:::

</template>
</DocsTabs>

::: v-pre

${readmeBody(readReadme(item.name, item.type))}

:::

## Source

The exact files the CLI installs (${item.name}@${item.version ?? 'unversioned'}).
[View on GitHub](${sourceUrl}) · [Report an issue](${GITHUB_URL}/issues/new?title=${encodeURIComponent(`[${item.name}] `)})

::: code-group

${sources}

:::
`;
}

/** Dynamic-route paths for one kind (used by <kind>/[name].paths.ts). */
export function itemPaths(
  kind: Kind,
): { params: { name: string; title: string }; content: string }[] {
  return itemsOf(kind).map((entry) => ({
    params: { name: entry.name, title: entry.title },
    content: page(readItem(entry.name), kind),
  }));
}
