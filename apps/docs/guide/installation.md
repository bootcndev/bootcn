---
description: Install Bootcn components in any Bootstrap 5.3 site with the CLI (npm, a standalone executable or Composer), or copy the files by hand.
---

# Installation

## Requirements

- A project that loads **[Bootstrap 5.3](https://getbootstrap.com/docs/5.3/getting-started/introduction/)** (CSS, and the JS bundle for
  interactive components such as Dialog or Tooltip).
- To run the CLI: **Node.js 20 or newer**, or one of the standalone
  versions below, which need no Node.js at all.

### Without Node.js

From CLI 0.6.0 the same CLI also comes as a single executable for Linux,
macOS and Windows (x64 and arm64), so PHP and Laravel projects do not need
Node.js:

- **Composer** (PHP and Laravel projects):

  ```bash
  composer require --dev bootcndev/bootcn
  vendor/bin/bootcn init
  ```

  The first run downloads the executable of the same version, checks it
  against the release's checksums and keeps it in the package.

- **macOS and Linux**, installed to `~/.local/bin`:

  ```bash
  curl -fsSL https://bootcn.dev/install.sh | sh
  ```

  The script checks the download's SHA-256 before installing it;
  `BOOTCN_VERSION` picks a version and `BOOTCN_INSTALL` another folder.
  [Read it first](https://bootcn.dev/install.sh) if you like.

- **Windows**: download `bootcn-windows-x64.exe` from the
  [releases](https://github.com/bootcndev/bootcn/releases) and run it from a
  terminal.

Then use `bootcn` (or `vendor/bin/bootcn`) wherever this guide says
`npx bootcn`.

If your pages do not load Bootstrap yet, add it from the CDN:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/css/bootstrap.min.css"
  integrity="sha384-yEPZ7jP9S0QKiUQ0m3jjsO4ProIW7wvR9gXkI7JOGa2XVsw53Yke2bsdkBbjmmiX"
  crossorigin="anonymous"
/>
<script
  src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/js/bootstrap.bundle.min.js"
  integrity="sha384-WyOxWvTyr1QaMPfiPJSv76iReVthorl5uWlFtZPyK0IEB0hGzo9y5Bp9mYanr8Bu"
  crossorigin="anonymous"
></script>
```

## 1. Initialize

In the root of your project:

```bash
npx bootcn init
```

`init` detects whether this is a PHP or plain HTML project, checks whether
Bootstrap is loaded, asks where components, CSS and JavaScript should go, then
writes [`bootcn.json`](./configuration) and installs the
[design tokens](./theming).

## 2. Add components

```bash
npx bootcn add button dialog
```

`add` resolves dependencies (Dialog needs Button), shows the files it will
write, and asks before replacing a file you have changed. When it finishes it
prints the tags to add to your layout, for example:

```html
<!-- In <head>, after the Bootstrap CSS (tokens first) -->
<link rel="stylesheet" href="assets/css/tokens.css" />
<link rel="stylesheet" href="assets/css/button.css" />
<link rel="stylesheet" href="assets/css/dialog.css" />

<!-- Before </body>, after the Bootstrap JS bundle -->
<script src="assets/js/dialog.js"></script>
```

## 3. Use the markup

The HTML of each component is written to `components/ui/`. In PHP you can
include it:

```php
<?php include __DIR__ . '/components/ui/dialog.html'; ?>
```

In plain HTML, copy the markup into your page. Each component page shows the
markup and its options.

## Without the CLI

Every component page lists its files and their default locations under
**Manual installation**, with the full source to copy.
