import {
  DEFAULT_PATHS,
  GITHUB_URL,
  componentItems,
  readItem,
  readReadme,
  type RegistryItem,
} from '../.vitepress/registry';

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

/** README without its H1 and the intro paragraph (the page shows the description). */
function readmeBody(readme: string): string {
  const lines = readme.replace(/\r\n/g, '\n').split('\n');
  const firstSection = lines.findIndex((line) => line.startsWith('## '));
  return firstSection === -1 ? '' : lines.slice(firstSection).join('\n').trim();
}

function requirements(item: RegistryItem): string {
  const platform = item.compatibility?.platform ?? ['Bootstrap CSS'];
  return platform.join(' + ');
}

function page(item: RegistryItem, type: string): string {
  const deps = item.registryDependencies ?? [];
  const sourceUrl = `${GITHUB_URL}/tree/main/packages/registry/components/${item.name}`;
  const depLinks = deps.length ? deps.map((dep) => `[\`${dep}\`](./${dep})`).join(', ') : 'none';

  const fileRows = item.files
    .map((file) => `| \`${file.path}\` | \`${DEFAULT_PATHS[file.type] ?? '?'}/${file.target}\` |`)
    .join('\n');

  const sources = item.files
    .map((file) => fence(file.content, `${LANG[extOf(file.path)] ?? 'text'} [${file.path}]`))
    .join('\n\n');

  const accessibility = item.accessibility?.notes
    ? `\n::: tip Accessibility\n${item.accessibility.notes}\n:::\n`
    : '';

  return `# ${item.title}

${item.description}

<ComponentMeta version="${item.version ?? ''}" bootstrap="${item.compatibility?.bootstrap ?? '5.3'}" requires="${requirements(item)}" source="${sourceUrl}" />

<ComponentPreview name="${item.name}" title="${item.title}" />
${accessibility}
## Installation

::: code-group

\`\`\`bash [npx]
npx bootcn add ${item.name}
\`\`\`

\`\`\`bash [pnpm]
pnpm dlx bootcn add ${item.name}
\`\`\`

:::

The CLI also installs the design tokens and these components: ${depLinks}.
It prints the \`<link>\` and \`<script>\` tags to add to your layout.

### Manual installation

1. Load Bootstrap 5.3 (${requirements(item)}) and the [design tokens](../guide/theming).
2. Install the dependencies listed above, if any.
3. Copy the files from [Source](#source) into your project. With the default
   \`bootcn.json\` they go here:

| File | Default location |
| ---- | ---------------- |
${fileRows}

${readmeBody(readReadme(item.name, type))}

## Source

The exact files the CLI installs (${item.name}@${item.version ?? 'unversioned'}).
[View on GitHub](${sourceUrl}) · [Report an issue](${GITHUB_URL}/issues/new?title=${encodeURIComponent(`[${item.name}] `)})

::: code-group

${sources}

:::
`;
}

export default {
  watch: [
    '../../../packages/registry/dist/**/*.json',
    '../../../packages/registry/components/*/README.md',
  ],
  paths() {
    return componentItems().map((entry) => ({
      params: { name: entry.name, title: entry.title },
      content: page(readItem(entry.name), entry.type),
    }));
  },
};
