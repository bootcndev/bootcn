# Hero section

A centered landing-page hero: announcement link, headline, lead text, two calls to action and a note, over a subtle dot pattern.

## Usage

Use it as the first section of a landing page's `<main>`. Replace the
announcement, headline, lead and links with your own; remove the announcement
link if you have nothing new to point to.

The dot pattern is a CSS background (`::before`), so it costs no image
request. Set `--bootcn-border-color` on the section to change its color.

## Accessibility

- The headline is the page's `<h1>`; keep one per page.
- The pattern is decorative and sits behind the content, which keeps its own
  4.5:1 contrast.
- Calls to action are links with descriptive text, not "Click here".

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
- The `badge` component.
