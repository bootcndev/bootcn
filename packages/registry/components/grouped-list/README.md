# Grouped list

Settings-style rows in rounded groups, iOS style: an icon tile, a label, a value or a switch, and a chevron for rows that open a page.

## Usage

Use it for settings and profile pages, especially on phones. Rows that open
a page are links with a chevron; rows that change something in place hold a
Switch (or a value). Pick icon colours with enough contrast for the white
icon (3:1).

## Accessibility

- Each group is a section named by its heading, and the rows are a list;
  link rows read their label and value ("Wi-Fi Office 5G").
- Switch rows use a real `<label>` for the native switch.
- Icon tiles are decorative; hairlines and the chevron are visual only.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `switch` component.
