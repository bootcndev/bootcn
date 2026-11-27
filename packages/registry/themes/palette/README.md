# Colour palette

A colour palette of 22 colours in 11 shades each (50 to 950) as CSS variables, for your own components, charts and illustrations.

## Usage

`npx bootcn add palette`, then load `palette.css` (anywhere after
Bootstrap). Each colour has shades from 50 (lightest) to 950 (darkest):

```css
.badge-new {
  background-color: var(--bootcn-violet-100);
  color: var(--bootcn-violet-800);
}
```

Colours: slate, gray, zinc, neutral, stone, red, orange, amber, yellow,
lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple,
fuchsia, pink and rose.

The palette does not change Bootcn's own colours, which come from the
design tokens (`tokens.css`) and the theme builder.

## Accessibility

For text, pair shades far apart: 700 to 950 on 50 to 100 backgrounds (and
the other way round in dark mode) keep at least 4.5:1. Mid shades (400 to 600) suit large text, icons and fills, not body text.

## Dependencies

- Nothing; it only defines CSS variables.
