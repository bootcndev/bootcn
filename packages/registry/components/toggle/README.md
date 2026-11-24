# Toggle

A two-state button, such as Bold in a text editor, built on a native checkbox.

## Usage

A toggle is a native checkbox (Bootstrap's `.btn-check`, which hides it
accessibly) followed by its `<label class="bootcn-toggle">`. Read its state from
the checkbox (`checked`), or submit it with a form. Variants: `--outline`;
sizes: `--sm`, `--lg`.

No JavaScript is needed.

## Accessibility

- It is a real checkbox: Space toggles it and screen readers announce
  "checked" / "not checked".
- An icon-only toggle needs visually hidden text in its label ("Bold").
- The focus ring shows on the label when the checkbox has keyboard focus.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
