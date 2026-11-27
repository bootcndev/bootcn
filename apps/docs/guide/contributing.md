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
