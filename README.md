# Bootcn

Copy-paste UI components for Bootstrap 5.3+ and vanilla JavaScript.

Bootcn brings the copy-paste component workflow to Bootstrap developers who
build with plain HTML and native PHP. Components are installed as editable
HTML, CSS and JavaScript source files that you own. No React, Vue, jQuery,
bundler or Node.js is required at runtime.

> **Status:** 20 components plus design tokens, usable for local development. The CLI is not
> published to npm and the registry is not hosted yet, so `npx bootcn` does not
> work yet. Use the local commands below.

## Core principles

- **Source ownership:** installed files live in your project and are yours to edit.
- **Bootstrap-native:** built on Bootstrap 5.3+, its plugins, utilities and CSS variables.
- **No framework lock-in:** components run with browser-native JavaScript.
- **No runtime Node.js:** Node.js is only used for development tooling.

## What is available

| Item          | Type  | Files         | Requires                  | Depends on |
| ------------- | ----- | ------------- | ------------------------- | ---------- |
| `tokens`      | theme | CSS           | Bootstrap CSS             | —          |
| `accordion`   | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | —          |
| `avatar`      | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `badge`       | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `button`      | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `card`        | ui    | HTML, CSS     | Bootstrap CSS             | `button`   |
| `checkbox`    | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `dialog`      | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `button`   |
| `dropdown`    | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | `button`   |
| `input`       | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `popover`     | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `button`   |
| `radio-group` | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `select`      | ui    | HTML, CSS     | Bootstrap CSS             | `input`    |
| `separator`   | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `skeleton`    | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `spinner`     | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `switch`      | ui    | HTML, CSS     | Bootstrap CSS             | —          |
| `tabs`        | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | —          |
| `textarea`    | ui    | HTML, CSS     | Bootstrap CSS             | `input`    |
| `toast`       | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `button`   |
| `tooltip`     | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `button`   |

Each component lives in `packages/registry/components/<name>/` with a
`README.md` (usage, accessibility, API) and a `preview.html` you can open
directly in a browser.

## Getting started (local development)

Requirements: Node.js >= 20, pnpm 11, and PHP 8+ (optional; only for the
native PHP end-to-end test).

```bash
pnpm install
pnpm build          # builds the registry (packages/registry/dist) and the CLI
pnpm test           # unit tests (registry tooling + CLI)
pnpm test:e2e       # builds, then runs Playwright component and install tests
```

First run of the browser tests needs Playwright's Chromium:

```bash
pnpm exec playwright install chromium
```

### Try the CLI on your own project

Until the CLI is published, run the built file with Node and point it at the
local registry build:

```bash
node packages/cli/dist/index.js init --cwd ../my-site --registry packages/registry/dist
node packages/cli/dist/index.js add button dialog --cwd ../my-site
node packages/cli/dist/index.js list --cwd ../my-site
node packages/cli/dist/index.js info dialog --cwd ../my-site
```

`init` detects a PHP or plain HTML project, checks for Bootstrap, asks where
files should go, writes `bootcn.json` and installs the design tokens. `add`
shows the files it will create, asks before overwriting anything, and prints
the `<link>` and `<script>` tags to add to your layout.

### CLI reference

| Command           | What it does                                             |
| ----------------- | -------------------------------------------------------- |
| `init`            | Create `bootcn.json`, the directories and install tokens |
| `add <names...>`  | Install items and their registry dependencies            |
| `list`            | List registry items, marking the installed ones          |
| `info <name>`     | Show an item's files, dependencies and requirements      |
| `diff [names...]` | Compare installed files with the registry (read-only)    |

| Flag                       | Meaning                                               |
| -------------------------- | ----------------------------------------------------- |
| `--cwd <path>`             | Project directory (default: current directory)        |
| `--registry <url-or-path>` | Registry `https://` URL or local directory            |
| `-y, --yes`                | Never prompt; accept defaults; **skip** changed files |
| `--overwrite`              | Replace files that differ from the registry           |
| `--dry-run`                | Show the plan, write nothing                          |
| `--verbose`                | Show stack traces on errors                           |

Exit codes: `0` success, `1` user or configuration error, `2` registry or
network error, `3` partial install.

### `bootcn.json`

```json
{
  "$schema": "https://bootcn.dev/schema/config.json",
  "registry": "https://registry.bootcn.dev",
  "style": "default",
  "bootstrap": "5.3",
  "paths": {
    "components": "components/ui",
    "css": "assets/css",
    "js": "assets/js",
    "lib": "assets/js/lib"
  }
}
```

Paths are relative to the project root. For PHP projects with a `public/`
directory, `init` proposes `public/assets/...` for CSS and JavaScript. The
`$schema` and registry URLs are placeholders until the domain exists.

## Repository layout

```text
packages/
  cli/                 Node.js + TypeScript CLI (bin: bootcn)
  registry/
    components/        Component source: html, css, js, preview, README, manifest
    themes/tokens/     Shared design tokens (registry:theme)
    schema/            JSON Schemas: registry item, bootcn.json, built index
    tooling/           Registry validation and build (development only)
    CONVENTIONS.md     Naming, CSS, JavaScript and accessibility rules
examples/
  plain-html/          Static page fixture
  native-php/          PHP fixture (header/footer includes)
  vite/                Vite fixture (bundles the installed CSS/JS)
scripts/               registry:validate and registry:build entry points
tests/
  components/          Playwright + axe tests for every preview
  e2e/                 Install-and-run tests over the examples
```

The registry is the single source of truth: `pnpm registry:build` writes
`packages/registry/dist/index.json` and `dist/r/<name>.json` (with file
contents inlined), which the CLI reads. Previews load the same source files.

## Known limitations

- The CLI is not on npm and there is no hosted registry; `npx bootcn` and the
  default `https://registry.bootcn.dev` do not work yet. Pass `--registry`.
- Only the stable registry is supported; there is no `latest`/`stable` channel
  selection or pinning of a registry version yet.
- No `doctor` or `update` commands. `diff` compares with the current registry
  only; installed versions are not recorded.
- Plain HTML projects must copy the markup from `components/ui/*.html` into
  their pages by hand (PHP can `include` it).
- CI runs the browser tests on Chromium, Firefox and WebKit; locally only
  Chromium runs unless `PW_ALL_BROWSERS=1` (after `pnpm exec playwright install`).
  Edge is covered through Chromium only.
- Dark mode and contrast are checked by axe on every preview (whole page in
  dark mode), not by visual regression tests.
- No searchable multi-select, date picker, data table or command palette yet.

## License

MIT © George Tsiros. See [LICENSE](LICENSE).
