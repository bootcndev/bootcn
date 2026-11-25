# Variant picker

Product options: colour swatches and size buttons built on native radio buttons, with the choice shown by the group name and sold-out options crossed out.

## Usage

Each option group is a fieldset of radio buttons:

- Colours: `.bootcn-variant__swatch` labels with `--bootcn-swatch` set to
  the colour, and the colour's name as hidden text.
- Sizes or any other choice: `.bootcn-variant__option` labels.
- Sold out: `disabled` on the input, plus "(sold out)" as hidden text.

The legend's `data-bootcn-variant-value` shows the current choice
("Color: Navy"). Changes fire `bootcn:variant:change` with every group's
value (`{ color: 'Navy', size: 'M' }`), for example to update the price or
the picture. Inside a form the choices submit as usual.

## Accessibility

- Native radio groups: arrow keys move between options, the legend names
  the group and says the current choice.
- Colours are named in text, not only shown; the chosen swatch has a
  ring and the focused one an outline.
- Sold-out options are disabled and say so.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
