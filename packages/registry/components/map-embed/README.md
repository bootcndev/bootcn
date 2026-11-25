# Map embed

An OpenStreetMap map that loads only when asked, with a caption and a link to the full map; no library and no third-party request before the click.

## Usage

Use it for an address on a contact or event page. Keep the address as text
in the caption or next to the map: the map is a help, not the only way to
find the place. OpenStreetMap's tiles have a
[usage policy](https://operations.osmfoundation.org/policies/tiles/); for
heavy traffic use a tile provider and a map library instead.

## JavaScript API

- `data-bootcn-map` on the `<figure>` with `data-lat`, `data-lon`,
  `data-zoom` (default 15) and `data-title` (the iframe's name). A button
  with `data-bootcn-map-load` loads the map.
- Until then nothing is requested from OpenStreetMap; the placeholder says
  where the map comes from. Add `data-autoload` to load it with the page.
- Event `bootcn:map:load` (bubbles). `Bootcn.mapEmbed.load(root)`;
  `init()` / `destroy()`.

## Accessibility

- The address and the "Open in OpenStreetMap" link are text, so the place
  is clear without the map.
- The loaded map is an iframe named by `data-title`, and focus moves to it
  after "Show map".
- No third-party request happens before the person asks for the map.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component.
