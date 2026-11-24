# Introduction

Bootcn is a collection of UI components for **[Bootstrap 5.3](https://getbootstrap.com/)** that you copy
into your project instead of installing as a package. Each component is a
small set of files:

- an **HTML** snippet with the markup and ARIA attributes,
- a **CSS** file with `bootcn-` classes built on Bootstrap's variables,
- and, only when needed, a **vanilla JavaScript** file.

A command-line tool, `bootcn`, downloads those files from the
[registry](#the-registry) and writes them where your project keeps its assets.
After that the files are yours: change them, rename them, or delete what you
do not need.

Besides components there are [blocks](../blocks/) (sections such as a sign-in
card or a transactions table, built from components) and
[templates](../templates/) (complete pages, such as an admin dashboard).

## Who it is for

- PHP and plain HTML sites that already use Bootstrap.
- Teams who want consistent, accessible components without adopting React or
  Vue.
- Anyone who prefers readable source over a compiled UI library.

## Principles

- **Source ownership.** Installed files live in your project.
- **Bootstrap-native.** Components use Bootstrap's own plugins (modal,
  dropdown, tooltip…) and style them through `--bs-*` and `--bootcn-*`
  variables.
- **No runtime Node.js.** Node.js is only needed while you run the CLI.
- **Accessible by default.** Every component documents its keyboard and screen
  reader behaviour, and is tested with axe in light and dark mode.

## The registry

The registry is a set of static JSON files: an index of every item and one
file per component with its sources inlined. The CLI and this site read the
same registry. It is hosted at
[bootcn.dev](https://bootcn.dev/index.json),
and every published version stays available under `/v/<version>/`.

Next: [install the CLI and your first component](./installation).
