# bootcn

Install copy-paste Bootstrap 5.3 components (HTML, CSS and vanilla JavaScript)
into your own project. The installed files are yours: no runtime package, no
framework, no Node.js needed in production.

> Not published yet. See the repository README for running the CLI locally.

```bash
bootcn init
bootcn add button dialog
bootcn list
bootcn info dialog
```

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

MIT License.
