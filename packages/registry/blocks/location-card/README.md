# Location card

Where to find you: the address, opening hours, phone and email, a directions link and a map that loads on request.

## Usage

Replace the address, hours, phone, email and the coordinates (`data-lat`,
`data-lon` on the map and in the directions link). The map stays empty
until someone asks for it.

## Accessibility

- The address is an `<address>`, the hours a description list, phone and
  email real links; everything is usable without the map.
- The map's loading button and iframe are named; see the Map embed
  component.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `map-embed` component.
- The `card` component.
- The `button` component.
