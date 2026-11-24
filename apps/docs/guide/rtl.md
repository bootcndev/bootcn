# Right to left

Bootcn works in right-to-left languages such as Arabic, Hebrew and Persian.
Set `dir="rtl"` (and the language) on `<html>` and load Bootstrap's RTL
stylesheet instead of the regular one:

```html
<html lang="ar" dir="rtl">
  <head>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.9/dist/css/bootstrap.rtl.min.css"
    />
    <link rel="stylesheet" href="assets/css/tokens.css" />
    <!-- your Bootcn component stylesheets -->
  </head>
</html>
```

Nothing else changes: the same component files serve both directions. Every
preview on this site has an **RTL** button to try it.

## What Bootcn does for you

- **Logical CSS properties.** Components use `margin-inline-start`,
  `padding-inline`, `border-inline-end`, `inset-inline-start` and
  `text-align: start` instead of left and right, so spacing, borders and
  positions follow the reading direction. Sidebars move to the right, chat
  bubbles swap sides, and "Select all" separators and table padding mirror.
- **Mirrored icons.** Icons that point somewhere (chevrons in pagination,
  breadcrumbs, menus and calendars; back and forward arrows) carry the class
  `bootcn-rtl-flip`, which `tokens.css` mirrors under `[dir='rtl']`. Icons
  that do not have a direction (search, close, check) stay as they are. Add
  the class to your own directional icons.
- **Arrow keys follow the reading direction.** In the toolbar, menubar,
  calendar and resizable panels, → moves to the previous item and ← to the
  next one when the text runs right to left, as screen reader users expect.
- **Sliders fill from the right**, as native range inputs do.

Color sliders and the color area stay left to right in every language: they
show a color space, not text.

## Mixed content

Wrap embedded left-to-right content in an element with `dir="ltr"`: code
blocks, phone numbers, email addresses and product codes.

```html
<p>رقم الطلب: <span dir="ltr">INV-2026-0042</span></p>
```

Bootstrap's own components (dropdowns, offcanvas, carousel, tooltips) pick up
the direction from the RTL stylesheet.
