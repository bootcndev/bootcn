---
description: 'How to contribute to Bootcn: set up the repository, follow the component conventions, run the tests and open a pull request.'
---

# Contributing

Bootcn is developed on [GitHub](https://github.com/bootcndev/bootcn).
Bug reports and ideas are welcome as
[issues](https://github.com/bootcndev/bootcn/issues).

## Working on the project

Requirements: Node.js 20+, pnpm 11, and optionally PHP 8 for the PHP
end-to-end test.

```bash
pnpm install
pnpm build
pnpm test
pnpm test:e2e
```

Each component lives in `packages/registry/components/<name>/` with its HTML,
CSS, optional JavaScript, a `preview.html`, a `README.md` and a
`manifest.json`. The conventions every component follows are in
[CONVENTIONS.md](https://github.com/bootcndev/bootcn/blob/main/packages/registry/CONVENTIONS.md).

This site lives in `apps/docs` and is built from the same registry:

```bash
pnpm --filter @bootcn/docs dev
```

## Visual regression tests

Every component and block preview has a screenshot in light, dark and right
to left mode in `tests/visual/__screenshots__`. CI compares each pull request
with them and, when something changed, uploads the old, new and difference
images as the `visual-differences` artifact.

The screenshots are made on Linux, where CI runs: fonts render differently on
macOS and Windows, so the tests skip there (set `VISUAL_ANY_OS=1` to run them
anyway, for example to check that a preview is stable).

When a change is meant to look different, run the **Update visual baselines**
workflow from the Actions tab. It makes every screenshot again and pushes them
to the `visual-baselines` branch: look at the changed images in its commit,
then merge that branch.

```bash
pnpm exec playwright test --config tests/visual/playwright.config.ts
```
