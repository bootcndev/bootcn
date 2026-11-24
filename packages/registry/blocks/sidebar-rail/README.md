# Sidebar rail

A narrow icon-only navigation rail with labels in tooltips, beside the page content.

## Usage

Use a rail when the app has a handful of top-level sections with clear
icons, and the content needs the width. Give every link a visually hidden
label (its accessible name); `data-label` shows the same text as a tooltip
on hover and keyboard focus.

## Accessibility

- A `<nav aria-label="Main">`; every icon link has a text name, and the
  current page is marked with `aria-current="page"`.
- The tooltip appears on keyboard focus as well as hover, so sighted
  keyboard users see the labels too.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
