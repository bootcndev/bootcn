---
description: 'Use Bootcn with AI assistants: an agent skill, an MCP server for Claude, Cursor and VS Code, llms.txt, Markdown pages and a Copy prompt button on every page.'
---

# AI assistants (MCP)

## Agent skill

A [skill](https://bootcn.dev/skills/bootcn/SKILL.md) teaches an AI
assistant how to work with Bootcn: find the right item, install it with the
CLI, include it in a page and edit it without breaking its accessibility.
Add it to Claude Code for one project:

```bash
mkdir -p .claude/skills/bootcn && curl -fsSL https://bootcn.dev/skills/bootcn/SKILL.md -o .claude/skills/bootcn/SKILL.md
```

or for all your projects, in `~/.claude/skills/bootcn/`. Other assistants
that read skills or rules files can use the same file.

## For AI search and chat

Everything on this site is open to AI assistants and their crawlers:

- [llms.txt](https://bootcn.dev/llms.txt): every page and item, one line
  each; [llms-full.txt](https://bootcn.dev/llms-full.txt): the guide and
  every item's documentation in one file.
- Every guide, component, block and template page as Markdown: add `.md`
  to its address, for example
  [components/dialog.md](https://bootcn.dev/components/dialog.md).
- Every item's source with all its files as JSON:
  [r/dialog.json](https://bootcn.dev/r/dialog.json).

## MCP server

The CLI includes a [Model Context Protocol](https://modelcontextprotocol.io/)
server, so AI coding assistants can search the Bootcn registry, read a
component's source and install it into your project, the same way
`bootcn add` does.

```bash
npx bootcn@latest mcp
```

It talks over stdio; you do not run it yourself. Add it to your assistant
with one of the configurations below, from the root of a project that has a
`bootcn.json` (run `npx bootcn@latest init` first).

### Claude Code

```bash
claude mcp add bootcn -- npx -y bootcn@latest mcp
```

### Cursor

```json
// .cursor/mcp.json
{
  "mcpServers": {
    "bootcn": { "command": "npx", "args": ["-y", "bootcn@latest", "mcp"] }
  }
}
```

### VS Code

```json
// .vscode/mcp.json
{
  "servers": {
    "bootcn": { "type": "stdio", "command": "npx", "args": ["-y", "bootcn@latest", "mcp"] }
  }
}
```

### Claude Desktop and other clients

Any client that starts stdio servers works with the command `npx` and the
arguments `-y bootcn@latest mcp`. Add `--cwd /path/to/project` when the
client does not start servers in your project folder.

### Tools

| Tool                 | What it does                                                                              |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `list_items`         | Lists components, blocks, templates and themes, optionally of one type.                   |
| `search_items`       | Finds items by words in their name, title, description or categories.                     |
| `get_item`           | Returns an item's description, dependencies, install paths and the source of every file.  |
| `add_items`          | Installs items and their dependencies; existing files are kept unless `overwrite` is set. |
| `get_project_config` | Returns `bootcn.json`, or says the project is not set up yet.                             |

Then ask, for example: "Add a login page with Bootcn" or "Use the Bootcn
date range input for the booking form". The assistant reads the component
before writing markup with it, and `add_items` prints the `<link>` and
`<script>` tags to add to your layout.

Each page of this site also has a **Copy prompt** button, and
[llms.txt](https://bootcn.dev/llms.txt) lists every page and item for
assistants without MCP.
