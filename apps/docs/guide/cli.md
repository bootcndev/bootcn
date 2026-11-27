---
description: 'The bootcn command line: init, add, list, info and diff. Installs components, blocks and templates with their dependencies into your project.'
---

# CLI

```bash
npx bootcn <command> [options]
```

## Commands

| Command           | What it does                                               |
| ----------------- | ---------------------------------------------------------- |
| `init`            | Create `bootcn.json`, the directories, and install tokens  |
| `add <names...>`  | Install items and their dependencies                       |
| `list`            | List registry items, marking the installed ones            |
| `info <name>`     | Show an item's files, dependencies and requirements        |
| `diff [names...]` | Compare your installed files with the registry (read-only) |

## Options

| Option                     | Meaning                                               |
| -------------------------- | ----------------------------------------------------- |
| `--cwd <path>`             | Project directory (default: the current directory)    |
| `--registry <url-or-path>` | Registry `https://` URL or local directory            |
| `-y, --yes`                | Never prompt; accept defaults; **skip** changed files |
| `--overwrite`              | Replace files that differ from the registry           |
| `--dry-run`                | Show what would happen, write nothing                 |
| `--verbose`                | Show stack traces on errors                           |
| `-v, --version`            | Print the CLI version                                 |

## Setting up

`init` looks at the project first: Laravel, React, Vue, PHP or plain HTML, and where
Bootstrap comes from and which version (`node_modules`, `vendor`,
`package.json`, `composer.json` or a CDN link in your pages). Then it asks:

1. **Which Bootstrap version?** 5.3, or 6 as a preview while Bootstrap 6
   is in alpha. The one it found is the default. Older than 5.3 gets a
   warning: Bootcn needs 5.3 or newer.
2. **Which style?** Default (outlined fields, hairline borders) or Soft
   (tinted fields, soft shadows, larger corners). Soft also installs
   `soft.css`; keep it after the CSS of your components.
3. **Use these folders?** The usual ones for your kind of project; answer
   no to choose each folder.

In scripts and CI, answer with flags and skip the questions:

```bash
npx bootcn@latest init --yes --bootstrap 5.3 --style soft
```

| Option                  | Values                    |
| ----------------------- | ------------------------- |
| `--bootstrap <version>` | `5.3`, or `6.0` (preview) |
| `--style <style>`       | `default` or `soft`       |

Items are built and tested for Bootstrap 5.3. In a project set up for 6,
`add` reminds you to check each item in your pages.

## Updating a component

Installed files are yours, so the CLI never changes them silently. To see what
changed in the registry since you installed:

```bash
npx bootcn diff dialog
```

Lines starting with `-` are in your copy, `+` in the registry. To take the
registry version (this replaces your edits):

```bash
npx bootcn add dialog --overwrite
```

## Safety

- Files are only written inside the project directory. Paths with `..`,
  absolute paths and symlinks that point outside are rejected.
- Remote registries must use `https://`, and redirects to other hosts are
  refused.
- Downloaded code is written to disk, never executed.

## Exit codes

| Code | Meaning                     |
| ---- | --------------------------- |
| `0`  | Success                     |
| `1`  | User or configuration error |
| `2`  | Registry or network error   |
| `3`  | Partial install             |
