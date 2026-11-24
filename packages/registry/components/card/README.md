# Card

A content container built on Bootstrap's `.card`, with header, content and
footer regions.

## Usage

```html
<article class="card bootcn-card">
  <header class="bootcn-card__header">
    <h2 class="bootcn-card__title">Project settings</h2>
    <p class="bootcn-card__description">Update your project name and visibility.</p>
  </header>
  <div class="bootcn-card__content">
    <p class="mb-0">Changes are saved automatically.</p>
  </div>
  <footer class="bootcn-card__footer">
    <button type="button" class="btn bootcn-button bootcn-button--outline bootcn-button--sm">
      Cancel
    </button>
    <button type="button" class="btn bootcn-button bootcn-button--default bootcn-button--sm">
      Save
    </button>
  </footer>
</article>
```

## Regions

- `bootcn-card__header` — optional; contains the title and description.
- `bootcn-card__title` — the card heading.
- `bootcn-card__description` — supporting text under the title.
- `bootcn-card__content` — the main body.
- `bootcn-card__footer` — optional; usually holds actions.

## Heading level

The example uses `<h2>`. Choose the heading level that matches the surrounding
page structure; do not skip levels.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The Button component (`button`) for the footer actions in the example. Any
  buttons can be used instead.

No JavaScript.

## Accessibility

- Use a real heading element for `bootcn-card__title`, not a styled `<div>`.
- Keep the description associated with the title by grouping them in the header.
- Footer actions keep their own accessible names (see the Button component).
