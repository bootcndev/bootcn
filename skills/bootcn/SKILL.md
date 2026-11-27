---
name: bootcn
description: Build Bootstrap 5.3 interfaces with Bootcn, the copy-paste library of accessible components, blocks and page templates in plain HTML, CSS and vanilla JavaScript, with React and Vue components. Use when the user works on a Bootstrap, plain HTML, PHP, Laravel (Blade), React or Vue project and wants UI such as dialogs, data tables, forms, dashboards, charts, chat, calendars or full pages, mentions Bootcn or bootcn.dev, or has a bootcn.json in the project.
---

# Bootcn

Bootcn (https://bootcn.dev) is a registry of UI items for **Bootstrap 5.3**
in plain HTML, CSS and vanilla JavaScript. Items are copied into the
project, so the code belongs to the user: edit it freely, nothing updates
behind their back. There is no framework and no build step; a page that
loads Bootstrap can load Bootcn. React and Vue projects get `.tsx` and `.vue`
components built on the same CSS and JavaScript.

Item types:

- **Components** (`registry:ui`): buttons, dialogs, forms, data table,
  calendar, chat pieces, maps, media players…
- **Blocks** (`registry:block`): larger sections such as login forms,
  dashboards, pricing, chat, email inbox, event calendar, charts.
- **Templates** (`registry:template`): whole pages, for example admin
  dashboard, SaaS, e-commerce, CRM.

## Find the right item

Prefer an existing item over writing new UI. In order:

1. The `bootcn` MCP server, if it is connected: `search_items`,
   `get_item`, `add_items`.
2. `https://bootcn.dev/llms.txt`: every item with a one-line description
   and links. `https://bootcn.dev/llms-full.txt` has every item's
   documentation in one file.
3. Each item's page as Markdown: `https://bootcn.dev/components/<name>.md`
   (or `/blocks/` and `/templates/`), and its full source as JSON with every
   file inlined: `https://bootcn.dev/r/<name>.json`.
4. `npx bootcn@latest list` and `npx bootcn@latest info <name>` in the
   project.

## Install with the CLI

```bash
npx bootcn@latest init          # once: writes bootcn.json, folders, design tokens
npx bootcn@latest add dialog data-table
```

- `add` also installs every item the requested one depends on, and the
  design tokens (`tokens.css`) are always installed by `init`.
- Use `--dry-run` to preview, `-y` to accept defaults without prompts and
  `--overwrite` only when the user wants their edits replaced.
  `npx bootcn@latest diff` shows what changed against the registry.
- Without Node.js: `curl -fsSL https://bootcn.dev/install.sh | sh`, or in
  PHP projects `composer require --dev bootcndev/bootcn` and
  `vendor/bin/bootcn add …`.
- Files go where `bootcn.json` says (`paths.components`, `paths.css`,
  `paths.js`, `paths.lib`, `paths.pages`). In Laravel, `init` sets
  `"framework": "laravel"` and components become Blade views under
  `resources/views`.
- In React or Vue (`react`, `next`, `vue` or `nuxt` in `package.json`),
  `init` sets `"framework": "react"` or `"vue"`. `add` then installs `.tsx`
  or `.vue` components in `src/components/ui` (CSS and JavaScript in
  `src/bootcn`) and prints the import lines. Components with one so far:
  button, dialog, toaster, input, textarea, select, checkbox, switch, tabs,
  card, alert, badge, avatar. For other items it installs the CSS and
  JavaScript; write the markup from the item's page as JSX or a template.
  Guides: https://bootcn.dev/guide/react and https://bootcn.dev/guide/vue.

## Use an installed item

1. Load Bootstrap 5.3 CSS (and the Bootstrap JS bundle when the item's
   README says so), then `tokens.css`, then the item's CSS.
2. Include the item's HTML where it belongs: PHP `include`, a Blade
   `@include`, or paste it into the page. In React and Vue, import the
   installed component instead; it loads its own CSS and JavaScript.
3. Load the item's JavaScript, if it has one, before `</body>`. Scripts
   start themselves; each also exposes an API on `window.Bootcn` (for
   example `Bootcn.chat.receive()`), documented in the item's README.
4. Listen for the item's `bootcn:*` events to connect it to the server
   (most are cancelable so you can save first, then update the UI).

## Rules for editing Bootcn code

- Keep the `bootcn-` class names, the `data-bootcn-*` and `data-*` hooks
  the script reads, and every ARIA attribute: they carry the behaviour and
  the accessibility.
- Style with the design tokens (`--bootcn-*` CSS variables) and Bootstrap
  utilities; dark mode comes from `data-bs-theme="dark"` and right to left
  from `dir="rtl"`, so avoid hard-coded colours and left/right properties.
- Keep text readable at 4.5:1 contrast, give icon-only buttons a name, and
  respect `prefers-reduced-motion`.
- Put user-provided text in the DOM with `textContent`, never `innerHTML`.
- Translate texts the scripts announce with `window.Bootcn.messages`
  (see https://bootcn.dev/guide/i18n).
- Do not add a JavaScript framework to make an item work. In React and Vue,
  start the item's script in `useEffect` or `onMounted` (as the installed
  components do) so server rendering keeps working.

## More

- Guide: https://bootcn.dev/guide/introduction
- Configuration: https://bootcn.dev/guide/configuration
- AI assistants and MCP: https://bootcn.dev/guide/mcp
- Source and issues: https://github.com/bootcndev/bootcn
