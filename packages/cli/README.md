# bootcn

Install copy-paste Bootstrap 5.3 components (HTML, CSS and vanilla JavaScript)
into your own project. The installed files are yours: no runtime package, no
framework, no Node.js needed in production.

Requires Node.js 20 or newer, only while you run the CLI. Bootstrap 5.3 is
loaded by your pages (the CLI prints the CDN tags if it is missing).

```bash
npx bootcn init               # bootcn.json, directories, design tokens
npx bootcn add button dialog  # copies the files, asks before overwriting
npx bootcn list               # registry items, installed ones marked
npx bootcn info dialog        # files, dependencies, accessibility notes
npx bootcn diff               # your copies vs the registry, read-only
npx bootcn mcp                # MCP server for AI assistants (stdio)
npx bootcn add login-card     # blocks: sections built from components
npx bootcn add admin-dashboard # templates: a complete page with working links
```

In a Laravel project, `init` sets `"framework": "laravel"`: components and
templates become Blade views under `resources/views`, CSS and JavaScript go
to `public/vendor/bootcn`, and templates link them with `asset()`. See
<https://bootcn.dev/guide/laravel>.

Components come from the hosted registry at
<https://bootcn.dev>. Pin a version with
`--registry https://bootcn.dev/v/0.3.0` (stored in
`bootcn.json`), or point `--registry` at your own registry directory or URL.

Exit codes: `0` success, `1` user or configuration error, `2` registry or
network error, `3` partial install.

Documentation, the component list and the source:
<https://github.com/bootcndev/bootcn>.

Global flags: `--cwd <path>`, `--registry <https-url-or-path>`, `--yes`,
`--overwrite`, `--dry-run`, `--verbose`, `--version`, `--help`.

Safety guarantees:

- Writes stay inside the project root; `..`, absolute paths and symlinks that
  escape the project are rejected.
- Existing files are never overwritten without an explicit choice
  (`--yes` skips them; `--overwrite` replaces them).
- Remote registries must use `https://`; redirects to other hosts are refused.
- Downloaded code is written to disk, never executed.

Runtime dependencies: `commander` (argument parsing), `@clack/prompts`
(interactive prompts), `ajv` + `ajv-formats` (JSON Schema validation of the
config and registry items), `diff` (unified diffs for changed files).

MIT © George Tsiros.
