# Bootcn

Copy-paste UI components for Bootstrap 5.3+ and vanilla JavaScript.

Bootcn brings the copy-paste component workflow to Bootstrap developers who
build with plain HTML and native PHP. Components are installed as editable
HTML, CSS and JavaScript source files that you own. No React, Vue, jQuery,
bundler or Node.js is required at runtime.

> **Status:** early (0.x). 51 components, 16 blocks (authentication,
> dashboard, navigation, marketing), an admin dashboard template and design
> tokens, with a Tailwind-like look built on Bootstrap. The CLI is on
> [npm](https://www.npmjs.com/package/bootcn); documentation, live previews and
> the registry are at <https://tsirosgeorge.github.io/bootcn/>.

## Quick start

In your project (Node.js 20+ is needed only while running the CLI):

```bash
npx bootcn init
```

```bash
npx bootcn add button dialog
```

`init` detects a PHP or plain HTML project, checks for Bootstrap, asks where
files should go, writes `bootcn.json` and installs the design tokens. `add`
shows the files it will create, asks before overwriting anything, and prints
the `<link>` and `<script>` tags to add to your layout.

## Core principles

- **Source ownership:** installed files live in your project and are yours to edit.
- **Bootstrap-native:** built on Bootstrap 5.3+, its plugins, utilities and CSS variables.
- **No framework lock-in:** components run with browser-native JavaScript.
- **No runtime Node.js:** Node.js is only used for development tooling.

## What is available

| Item              | Type  | Files         | Requires                  | Depends on                           |
| ----------------- | ----- | ------------- | ------------------------- | ------------------------------------ |
| `tokens`          | theme | CSS           | Bootstrap CSS             | —                                    |
| `accordion`       | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | —                                    |
| `alert-dialog`    | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `dialog`, `button`                   |
| `alert`           | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | —                                    |
| `aspect-ratio`    | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `avatar`          | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `badge`           | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `breadcrumb`      | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `button-group`    | ui    | HTML, CSS     | Bootstrap CSS             | `button`                             |
| `button`          | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `card`            | ui    | HTML, CSS     | Bootstrap CSS             | `button`                             |
| `carousel`        | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | —                                    |
| `checkbox`        | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `collapsible`     | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | `button`                             |
| `combobox`        | ui    | HTML, CSS, JS | Bootstrap CSS             | `label`                              |
| `command`         | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `kbd`, `button`                      |
| `context-menu`    | ui    | HTML, CSS, JS | Bootstrap CSS             | `dropdown`                           |
| `dialog`          | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `button`                             |
| `drawer`          | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | `button`, `input`                    |
| `dropdown`        | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | `button`                             |
| `empty`           | ui    | HTML, CSS     | Bootstrap CSS             | `button`                             |
| `field`           | ui    | HTML, CSS     | Bootstrap CSS             | `input`, `select`, `switch`, `label` |
| `hover-card`      | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `avatar`                             |
| `input-group`     | ui    | HTML, CSS     | Bootstrap CSS             | `button`, `label`                    |
| `input-otp`       | ui    | HTML, CSS, JS | Bootstrap CSS             | `label`                              |
| `input`           | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `item`            | ui    | HTML, CSS     | Bootstrap CSS             | `button`, `avatar`                   |
| `kbd`             | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `label`           | ui    | HTML, CSS     | Bootstrap CSS             | `input`                              |
| `menubar`         | ui    | HTML, CSS, JS | Bootstrap CSS             | `dropdown`                           |
| `navigation-menu` | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | —                                    |
| `pagination`      | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `popover`         | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `button`                             |
| `progress`        | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `radio-group`     | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `resizable`       | ui    | HTML, CSS, JS | Bootstrap CSS             | —                                    |
| `scroll-area`     | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `select`          | ui    | HTML, CSS     | Bootstrap CSS             | `input`                              |
| `separator`       | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `sheet`           | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | `button`, `input`                    |
| `skeleton`        | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `slider`          | ui    | HTML, CSS, JS | Bootstrap CSS             | `label`                              |
| `spinner`         | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `switch`          | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `table`           | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `tabs`            | ui    | HTML, CSS     | Bootstrap CSS + JS bundle | —                                    |
| `textarea`        | ui    | HTML, CSS     | Bootstrap CSS             | `input`                              |
| `toast`           | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `button`                             |
| `toggle-group`    | ui    | HTML, CSS     | Bootstrap CSS             | `toggle`                             |
| `toggle`          | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |
| `tooltip`         | ui    | HTML, CSS, JS | Bootstrap CSS + JS bundle | `button`                             |
| `typography`      | ui    | HTML, CSS     | Bootstrap CSS             | —                                    |

Each component lives in `packages/registry/components/<name>/` with a
`README.md` (usage, accessibility, API) and a `preview.html` you can open
directly in a browser.

### Blocks and templates

Blocks are larger sections built from components; templates are complete
pages. `bootcn add` installs the components a block or template uses.

| Item                   | Type     | Files                | Requires                  | Depends on                                                                                      |
| ---------------------- | -------- | -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------- |
| `activity-feed`        | block    | HTML, CSS            | Bootstrap CSS             | `card`, `avatar`                                                                                |
| `app-navbar`           | block    | HTML, CSS            | Bootstrap CSS + JS bundle | `user-menu`, `input`                                                                            |
| `app-sidebar`          | block    | HTML, CSS            | Bootstrap CSS + JS bundle | `button`, `badge`, `avatar`                                                                     |
| `call-to-action`       | block    | HTML, CSS            | Bootstrap CSS             | `button`                                                                                        |
| `feature-grid`         | block    | HTML, CSS            | Bootstrap CSS             | —                                                                                               |
| `forgot-password-card` | block    | HTML, CSS            | Bootstrap CSS             | `card`, `input`, `button`                                                                       |
| `hero-section`         | block    | HTML, CSS            | Bootstrap CSS             | `button`, `badge`                                                                               |
| `login-card`           | block    | HTML, CSS            | Bootstrap CSS             | `card`, `input`, `checkbox`, `button`                                                           |
| `login-split`          | block    | HTML, CSS            | Bootstrap CSS             | `input`, `checkbox`, `button`                                                                   |
| `page-header`          | block    | HTML, CSS            | Bootstrap CSS             | `button`                                                                                        |
| `pricing-table`        | block    | HTML, CSS            | Bootstrap CSS             | `button`, `badge`                                                                               |
| `signup-card`          | block    | HTML, CSS            | Bootstrap CSS             | `card`, `input`, `checkbox`, `button`                                                           |
| `stats-cards`          | block    | HTML, CSS            | Bootstrap CSS             | —                                                                                               |
| `testimonials`         | block    | HTML, CSS            | Bootstrap CSS             | `avatar`                                                                                        |
| `transactions-table`   | block    | HTML, CSS            | Bootstrap CSS             | `card`, `badge`, `button`, `input`                                                              |
| `user-menu`            | block    | HTML, CSS            | Bootstrap CSS + JS bundle | `dropdown`, `avatar`                                                                            |
| `admin-dashboard`      | template | page (HTML), CSS, JS | Bootstrap CSS + JS bundle | `app-sidebar`, `user-menu`, `page-header`, `stats-cards`, `activity-feed`, `transactions-table` |

A template is installed as a page (`registry:page`) at the project root, or
under `paths.pages` in `bootcn.json` (`public/` for PHP projects with a
`public/` folder). Its links use placeholders such as `{{bootcn:css}}`, which
the CLI replaces with the path from the page to your asset folders. Templates
need `bootcn` 0.2.0 or newer.

## Development

Requirements: Node.js >= 20, pnpm 11, and PHP 8+ (optional; only for the
native PHP end-to-end test).

```bash
pnpm install
pnpm build          # builds the registry (packages/registry/dist), the CLI and the docs
pnpm test           # unit tests (registry tooling + CLI)
pnpm test:e2e       # builds, then runs Playwright component and install tests
pnpm test:docs      # builds the Pages site (_site) and tests the docs in a browser
pnpm --filter @bootcn/docs dev   # docs site with live reload
```

First run of the browser tests needs Playwright's Chromium:

```bash
pnpm exec playwright install chromium
```

### Run your local build of the CLI

Run the built file with Node. It installs from the hosted registry by default;
pass `--registry packages/registry/dist` to use your local registry build.

```bash
node packages/cli/dist/index.js init --cwd ../my-site
node packages/cli/dist/index.js add button dialog --cwd ../my-site
node packages/cli/dist/index.js list --cwd ../my-site
node packages/cli/dist/index.js info dialog --cwd ../my-site
```

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
  "$schema": "https://tsirosgeorge.github.io/bootcn/schema/config.schema.json",
  "registry": "https://tsirosgeorge.github.io/bootcn",
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
directory, `init` proposes `public/assets/...` for CSS and JavaScript.

### Hosted registry

The registry is published to GitHub Pages by
[`deploy-registry.yml`](.github/workflows/deploy-registry.yml) whenever
`packages/registry` changes on `main`:

| URL                                                   | Contents                        |
| ----------------------------------------------------- | ------------------------------- |
| `https://tsirosgeorge.github.io/bootcn/`              | Latest registry (`main`)        |
| `https://tsirosgeorge.github.io/bootcn/v/<version>`   | A frozen version, never changes |
| `https://tsirosgeorge.github.io/bootcn/versions.json` | `{ latest, versions }`          |

To pin a project to a version, set `"registry"` in `bootcn.json` to its
`/v/<version>` URL. To publish a version, bump `version` in
`packages/registry/registry.json` and push a `registry-v<version>` tag; every
deploy rebuilds each tagged version from its own sources (`pnpm site:build`).
After deploying, the workflow installs `button` and `dialog` from the live site
with the CLI's default URL.

## Repository layout

```text
apps/
  docs/                Documentation site (VitePress), generated from the registry
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

- The registry is on a GitHub Pages URL until a custom domain is set up.
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
- `bootcn` 0.1.x cannot read registry 0.3.0's index (it does not know the
  `registry:page` file type); use `npx bootcn@latest`, or pin the registry to
  `/v/0.2.0`. From this version on, the index accepts new file types.

## License

MIT © George Tsiros. See [LICENSE](LICENSE).
