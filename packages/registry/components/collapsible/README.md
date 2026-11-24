# Collapsible

A panel that shows a summary and expands to reveal more, built on Bootstrap Collapse.

## Usage

The trigger is a button with `data-bs-toggle="collapse"` pointing at the
`.collapse` element. Bootstrap animates the height and keeps
`aria-expanded` in sync. For a list of such panels, use the Accordion
component.

## Accessibility

- The trigger is a real button with `aria-expanded` and `aria-controls`.
- An icon-only trigger needs visually hidden text ("Show all invoices").

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `button` component.
