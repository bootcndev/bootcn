# Bootcn component conventions

These conventions keep every component predictable, installable on its own, and
safe to drop into a plain HTML or native PHP project. They apply to everything
under `packages/registry`.

## 1. File naming

A component lives in `packages/registry/components/<name>/`:

```text
<name>/
├── <name>.html      usage markup (the snippet a developer copies)
├── <name>.css       component styles
├── <name>.js        only when the component has behavior
├── preview.html     standalone page, Bootstrap loaded from a CDN
├── README.md        usage, dependencies, accessibility notes, API
└── manifest.json    registry item manifest
```

- `name` is kebab-case: `[a-z0-9]+(-[a-z0-9]+)*` (e.g. `button`, `data-table`).
- File names match the component name exactly.
- No component ships a JavaScript file without behavior, and no component ships
  an empty CSS file "just because".
- Allowed source extensions are `.html`, `.css`, `.js`, `.md`, `.json`, `.php`.

## 2. Class prefix and naming

- Every custom class is namespaced with `bootcn-`.
- Base class: `.bootcn-<component>` (e.g. `.bootcn-button`).
- Variant: `.bootcn-<component>--<variant>` (e.g. `.bootcn-button--outline`).
- Part/element: `.bootcn-<component>__<part>` (e.g. `.bootcn-card__title`).
- State: `.is-<state>` or an ARIA/data attribute; prefer ARIA where it exists.
- Extend Bootstrap, never replace it: keep `.btn`, `.card`, `.form-control`,
  `.badge`, `.modal` on the element and add `bootcn-*` classes alongside.

## 3. Data attributes

- Custom behavior hooks use `data-bootcn-*`.
- Name them after the component: `data-bootcn-dialog-confirm`,
  `data-bootcn-dialog-initialized`.
- Attributes are declarative inputs; they never carry executable code.
- Do not use `data-bootcn-*` for styling-only concerns; use classes.

## 4. CSS and design tokens

- Never restyle Bootstrap classes globally (`.btn`, `.card`, `.form-control`,
  etc.). Customize through `bootcn-*` classes.
- No broad element selectors (`button {}`, `input {}`) in component CSS.
- Every visual value (color, radius, border, shadow, spacing, timing) comes from
  a `--bootcn-*` token or a Bootstrap `--bs-*` variable.
- Prefer Bootstrap `--bs-*` variables over hard-coded colors so components
  follow the host theme.
- A component stylesheet must be installable on its own, depending only on
  `themes/tokens/tokens.css`.
- Support CSS custom-property overrides; document any extra variable a component
  introduces.
- Dark mode is explicit under `[data-bs-theme="dark"]`, not inferred.
- Respect `prefers-reduced-motion`.
- No global `body`/`html` styling and no global font-family from a component.

Token source of truth: `packages/registry/themes/tokens/tokens.css`.

## 5. JavaScript component pattern

Every behavioral component follows this shape:

```js
(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.dialog) return; // already loaded: idempotent

  const INIT_ATTR = 'data-bootcn-dialog-initialized';

  function init(root = document) {
    // find uninitialized elements under root, attach behavior, mark them
  }

  function destroy(root = document) {
    // remove listeners, clear the marker
  }

  ns.dialog = { init, destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
```

Rules:

- The only global is `window.Bootcn`.
- Plain ES2020, browser-native APIs, no build step; works via `<script src>`.
- Initialization is idempotent and safe to run twice.
- Prefer event delegation from `document` over per-element listeners.
- Remove listeners and clear markers in `destroy`.
- Reuse Bootstrap's own plugins (Modal, Dropdown, Tooltip, Collapse) instead of
  reimplementing them.
- If an optional dependency is missing, log one clear console error naming it.
- Custom events are `bootcn:<component>:<event>` and bubble.

## 6. Dark mode

- Theme switching uses Bootstrap's `[data-bs-theme="dark"]`.
- Components must work in both light and dark mode without extra classes.
- Override tokens in the tokens file's dark block, not inside component files,
  unless a component genuinely needs its own dark value.
- `preview.html` shows each example once. A small inline script in `<head>`
  sets the page theme from `?theme=dark|light`, else from the docs page that
  embeds it, else light. Do not add a separate dark copy of the examples;
  the preview tests run axe with the whole page in both themes.

## 7. Reduced motion

- Wrap non-essential transitions/animations so they collapse under
  `prefers-reduced-motion: reduce`.
- The shared token `--bootcn-transition-duration` already becomes `0ms` in that
  mode; rely on it where possible.

## 8. Accessibility checklist

A component is not done until all of these hold:

- Valid semantic HTML.
- Accessible name for every control; correct label/description relationships
  (`aria-labelledby`, `aria-describedby`).
- Correct states and roles (`aria-invalid`, `aria-expanded`, `aria-busy`, ...).
- Fully keyboard operable with a visible focus ring from tokens.
- Dialog behavior: focus moves in, is trapped, returns to the trigger on close;
  Escape closes.
- Zero axe violations on `preview.html`.
- Responsive at 320px, 768px and 1280px.
- Respects `prefers-reduced-motion`.
- Documented dependencies and accessibility notes in the component `README.md`.

## 9. Manifest and install targets

Every item directory has a `manifest.json` validated against
`schema/registry-item.schema.json`. Each file entry has:

- `path`: the source file, relative to the item directory.
- `target`: the install path, **relative to the directory configured for the
  file type** in the user's `bootcn.json`:

| File `type`          | Installs under                       | Allowed extensions |
| -------------------- | ------------------------------------ | ------------------ |
| `registry:component` | `paths.components`                   | `.html`, `.php`    |
| `registry:style`     | `paths.css`                          | `.css`             |
| `registry:script`    | `paths.js`                           | `.js`              |
| `registry:lib`       | `paths.lib`                          | `.js`              |
| `registry:page`      | `paths.pages`, else the project root | `.html`, `.php`    |

So `{ "path": "button.css", "target": "button.css", "type": "registry:style" }`
installs to `assets/css/button.css` with the default config. A target keeps the
source extension. Two items may not install the same target.

`registryDependencies` lists other items to install first. The `tokens` theme is
always installed and does not need to be listed. Platform requirements
(Bootstrap CSS, Bootstrap JS bundle) go in `compatibility.platform`; npm-style
packages go in `dependencies` and are only displayed, never installed.

Run `pnpm registry:validate` after any change; CI runs it too.

## 10. Blocks and templates

- **Blocks** (`blocks/<name>/`, `registry:block`) are sections built from
  components: an HTML snippet, a CSS file, a README and a `preview.html`, like a
  component. List the components they use in `registryDependencies`. Prefix
  their classes with the block name (`bootcn-login-card__…`), so blocks stay
  independent of each other. Blocks that hold a search form name it
  (`aria-label`), so two of them on one page are distinct landmarks.
- **Templates** (`templates/<name>/`, `registry:template`) are complete pages.
  The page is a `registry:page` file and refers to the user's folders only
  through `{{bootcn:css}}`, `{{bootcn:js}}`, `{{bootcn:components}}` and
  `{{bootcn:lib}}`; the CLI replaces them with relative paths on install.
  Validation rejects unknown placeholders and placeholders in other file types.
  Templates have no `preview.html`: the docs site installs the template with the
  CLI and previews the result, and the docs tests check it (axe in both themes,
  overflow at 320/768/1280px).
- A template's dark mode must work before first paint (inline script in
  `<head>`) and follow the system setting unless the user picked a theme.
