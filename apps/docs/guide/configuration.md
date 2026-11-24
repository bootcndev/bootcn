# Configuration

`bootcn init` writes `bootcn.json` in the project root:

```json
{
  "$schema": "https://tsirosgeorge.github.io/bootcn/schema/config.schema.json",
  "registry": "https://tsirosgeorge.github.io/bootcn",
  "style": "default",
  "bootstrap": "5.3",
  "paths": {
    "components": "components/ui",
    "css": "assets/css",
    "js": "assets/js",
    "lib": "assets/js/lib"
  }
}
```

| Key         | Meaning                                                          |
| ----------- | ---------------------------------------------------------------- |
| `registry`  | Where components come from: an `https://` URL or a local folder  |
| `bootstrap` | The Bootstrap minor version your project uses                    |
| `paths`     | Where each kind of file is written, relative to the project root |

For PHP projects with a `public/` directory, `init` proposes
`public/assets/...` for CSS and JavaScript, and `"pages": "public"` for
[templates](../templates/). Without `paths.pages`, template pages go to the
project root.

## Pinning a registry version

The default registry always serves the latest components. To keep a project
on a fixed set, point `registry` at a published version:

```json
{
  "registry": "https://tsirosgeorge.github.io/bootcn/v/0.2.0"
}
```

The list of versions is in
[versions.json](https://tsirosgeorge.github.io/bootcn/versions.json).

## Your own registry

A registry is a folder of static JSON files, so you can host your own (for
example with your company's components) and set `registry` to its URL or to a
local path. Build one with the same tooling this project uses: see the
[repository](https://github.com/tsirosgeorge/bootcn).
