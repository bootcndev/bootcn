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
