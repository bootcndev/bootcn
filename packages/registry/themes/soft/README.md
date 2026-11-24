# Soft style

A rounder, filled look for every Bootcn component: tinted fields instead of
outlines, cards that float on a soft shadow, and larger corners.

## Usage

```bash
npx bootcn add soft
```

Load `soft.css` after `tokens.css` and the component stylesheets:

```html
<link rel="stylesheet" href="assets/css/tokens.css" />
<!-- component stylesheets -->
<link rel="stylesheet" href="assets/css/soft.css" />
```

Try it with any color and radius in the theme builder ("Style: Soft"), which
also copies the style together with your colors.

## Accessibility

- Colors are the theme's own, so text keeps 4.5:1 and the focus ring 3:1 in
  light and dark mode.
- A field shows its outline again on focus, and invalid fields keep their red
  outline as well as their error text.
- In dark mode, cards keep their border, because shadows do not show on a
  dark background.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
