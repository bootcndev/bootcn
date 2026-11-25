# Route tracker

Tracks the device's position and draws the route on an OpenStreetMap map as it goes, with distance, time and average speed; pan, zoom, fit and export as GeoJSON.

## Usage

Press **Start**: the browser asks for location access, and every new
position extends the line. **Stop** pauses; the next Start continues the
same route as a new segment. **Clear** removes it.

Location needs a secure page (HTTPS or `localhost`). Browsers stop sending
positions when the page is in the background or the screen is locked, so
this suits walks and runs with the page open, not all-day tracking.

## Map tiles

The map uses OpenStreetMap's standard tiles, which are fine for light use
under the [tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
and need the attribution shown in the corner. For an app with real traffic,
use your own tile server or a provider and set its URL template:

```html
<section
  class="bootcn-route"
  data-bootcn-route
  data-tiles="https://tiles.example.com/{z}/{x}/{y}.png"
></section>
```

`data-tiles=""` draws the route on a plain street-grid background with no
tile requests at all. No tile is requested before there is a position to show.

## Options

| Attribute           | Default | Meaning                                                      |
| ------------------- | ------- | ------------------------------------------------------------ |
| `data-zoom`         | `16`    | Zoom for the first position                                  |
| `data-min-zoom`     | `3`     | Lowest zoom                                                  |
| `data-max-zoom`     | `19`    | Highest zoom                                                 |
| `data-max-accuracy` | `50`    | Positions less accurate than this (metres) move the dot only |
| `data-min-distance` | `5`     | Moves shorter than this (metres) are not added to the line   |
| `data-tiles`        | OSM     | Tile URL template with `{z}`, `{x}`, `{y}` (and `{s}`)       |

The line colour is `--bootcn-route-color`; the map height is
`--bootcn-route-height`.

## JavaScript API

- `Bootcn.routeTracker.start(root)`, `stop(root)`, `clear(root)`, `fit(root)`.
- `add(root, { lat, lng, accuracy, time })` adds a position yourself, for a
  saved route or positions from another source.
- `points(root)`, `stats(root)` (`{ distance, duration, speed }` in metres,
  milliseconds and km/h) and `toGeoJSON(root)` (a `MultiLineString` feature,
  one line per segment, with the times).
- Events: `bootcn:route:start`, `bootcn:route:point` (`detail: { point, stats }`),
  `bootcn:route:stop`, `bootcn:route:clear`, `bootcn:route:error`
  (`detail: { code }`, the GeolocationPositionError code).
- `setup(root)` for trackers added later; `init()` / `destroy()` (which also
  stops tracking). Messages `route.start`, `route.stop`, `route.started`,
  `route.stopped`, `route.cleared`, `route.denied`, `route.unavailable` and
  `route.unsupported` are translatable.

## Accessibility

- The map is an image named "Map of your route"; the numbers that matter
  are in the stats list next to it, as text.
- Every map control is a named button (zoom in, zoom out, show the whole
  route, center on my position), so the map can be used without dragging.
- Starting, stopping (with the distance and time) and errors such as
  blocked location access are announced in a status message.
- Nothing is tracked until someone presses Start. The pulse stops under
  reduced motion.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `button` and `location-pin` (the position dot).
