# Location pin

Map markers: a pulsing "you are here" dot with an accuracy ring, and a pin that drops into place, in brand or custom colours.

## Usage

Place markers over a map image or inside your own map library (as custom
HTML markers). Set the accuracy circle's size with
`--bootcn-location-accuracy` and the colours with `--bootcn-location-color`
and `--bootcn-location-pin-color` (keep 3:1 against the map).

## Accessibility

- Each marker is an image with a name that says what it is ("Your location,
  accurate to about 30 metres", "Acme Studio").
- The pulse and the drop stop under reduced motion; the white outline keeps
  markers visible on any map colour.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
