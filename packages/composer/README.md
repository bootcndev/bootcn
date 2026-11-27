# bootcn for Composer

The [bootcn](https://bootcn.dev) CLI for PHP and Laravel projects, **without
Node.js**: install copy-paste Bootstrap 5.3 components, blocks and templates
into your project as plain HTML, CSS and JavaScript (or Blade views in
Laravel).

```bash
composer require --dev bootcndev/bootcn
vendor/bin/bootcn init
vendor/bin/bootcn add dialog data-table
```

The commands are the same as `npx bootcn`: `init`, `add`, `list`, `diff`,
`mcp` and the rest. In a Laravel project `init` finds Laravel by itself and
writes Blade views.

## How it works

The first time you run it, `vendor/bin/bootcn` downloads the standalone
bootcn executable of the same version for your system (Linux, macOS or
Windows; x64 or arm64) from the
[GitHub release](https://github.com/bootcndev/bootcn/releases), checks it
against the release's `SHA256SUMS`, keeps it in the package folder and runs
it. Later runs use that copy. Nothing else is downloaded or installed.

- `BOOTCN_BINARY=/path/to/bootcn` uses an executable you already have.
- Needs PHP 8.1 or newer with HTTPS support (the `openssl` extension), and
  network access on first use.

## Other ways to install

- With Node.js: `npx bootcn@latest init`.
- macOS and Linux, standalone: `curl -fsSL https://bootcn.dev/install.sh | sh`.

MIT licensed. Issues: https://github.com/bootcndev/bootcn/issues
