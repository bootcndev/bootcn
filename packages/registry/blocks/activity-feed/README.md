# Activity feed

A card listing recent team activity with avatars, links and relative times.

## Usage

Render one `<li>` per event, newest first. Put the absolute timestamp in
`datetime` and a human-friendly time ("12 minutes ago") as the text.

## Accessibility

- The list is an `<ol>`, so screen readers announce the number of events.
- Avatars are decorative (`aria-hidden`), because the person's name is in the
  sentence next to them.
- `<time datetime>` keeps the exact moment machine-readable.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `avatar` component.
