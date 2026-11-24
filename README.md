# Bootcn

Copy-paste UI components for Bootstrap 5.3+ and vanilla JavaScript.

Bootcn brings the copy-paste component workflow to Bootstrap developers who
build with plain HTML and native PHP. Components are installed as editable
HTML, CSS and JavaScript source files that you own. No React, Vue, jQuery,
bundler or Node.js is required at runtime.

> Status: Milestone 1 in progress. The CLI, registry and documentation are not
> published yet. Do not treat installation commands as live.

## Core principles

- **Source ownership:** installed files live in your project and are yours to edit.
- **Bootstrap-native:** built on Bootstrap 5.3+, utilities and CSS variables.
- **No framework lock-in:** components run with browser-native JavaScript.
- **No runtime Node.js:** Node.js is only used for development tooling.

## Repository layout

```text
packages/
  cli/         Node.js + TypeScript command-line interface
  registry/    Component source, manifests, schemas and design tokens
examples/
  plain-html/  Plain HTML integration fixture
  native-php/  Native PHP integration fixture
scripts/       Registry validation and build utilities
tests/e2e/     Playwright end-to-end tests
```

## Local development

Requirements: Node.js >= 20 and pnpm.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm registry:validate
pnpm registry:build
pnpm test:e2e
```

## License

MIT.
