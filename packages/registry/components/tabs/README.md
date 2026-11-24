# Tabs

Segmented tabs built on Bootstrap's **Tab** plugin. Bootstrap switches panels,
updates `aria-selected` and handles arrow keys, Home and End; Bootcn adds the
styling only, so there is no `tabs.js`.

## Usage

```html
<div class="bootcn-tabs">
  <div class="nav bootcn-tabs__list" role="tablist" aria-label="Account settings">
    <button
      class="nav-link active"
      id="tab-account"
      type="button"
      role="tab"
      data-bs-toggle="tab"
      data-bs-target="#panel-account"
      aria-controls="panel-account"
      aria-selected="true"
    >
      Account
    </button>
    <button
      class="nav-link"
      id="tab-password"
      type="button"
      role="tab"
      data-bs-toggle="tab"
      data-bs-target="#panel-password"
      aria-controls="panel-password"
      aria-selected="false"
      tabindex="-1"
    >
      Password
    </button>
  </div>
  <div class="tab-content">
    <div
      class="tab-pane fade show active bootcn-tabs__panel"
      id="panel-account"
      role="tabpanel"
      aria-labelledby="tab-account"
      tabindex="0"
    >
      ...
    </div>
    <div
      class="tab-pane fade bootcn-tabs__panel"
      id="panel-password"
      role="tabpanel"
      aria-labelledby="tab-password"
      tabindex="0"
    >
      ...
    </div>
  </div>
</div>
```

Each tab needs a unique `id`, and its panel must reference it with
`aria-labelledby`. When the list is wider than its container it scrolls
horizontally.

## Customizing

| Variable                             | Default                     |
| ------------------------------------ | --------------------------- |
| `--bootcn-tabs-list-bg`              | `var(--bs-secondary-bg)`    |
| `--bootcn-tabs-list-padding`         | `0.25rem`                   |
| `--bootcn-tabs-trigger-color`        | `var(--bs-secondary-color)` |
| `--bootcn-tabs-trigger-active-bg`    | `var(--bs-body-bg)`         |
| `--bootcn-tabs-trigger-active-color` | `var(--bs-emphasis-color)`  |

## Dependencies

- Bootstrap 5.3+ CSS and **JavaScript bundle** (Tab plugin).
- `themes/tokens/tokens.css`.

Without Bootstrap's JavaScript only the first panel is visible.

## Accessibility

- `role="tablist"`, `role="tab"` and `role="tabpanel"` with
  `aria-controls`/`aria-labelledby`, and an `aria-label` on the list.
- Only the active tab is in the tab order (`tabindex="-1"` on the others);
  arrow keys move between tabs.
- Panels have `tabindex="0"` so keyboard users can reach content without
  focusable elements.
- Bootstrap's fade is disabled under `prefers-reduced-motion`.
