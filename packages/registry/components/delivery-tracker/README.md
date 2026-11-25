# Delivery tracker

Live order tracking like a delivery or ride app: the courier moves on the map towards your address, with arrival time, order progress and the courier's details in a sheet.

## Usage

Set the shop, the address and (optionally) the planned route on the
element, then send the courier's position as it changes:

```html
<section
  class="bootcn-delivery"
  data-bootcn-delivery
  data-origin="40.7741,-73.9546"
  data-destination="40.7807,-73.95464"
  data-route="[[40.7741,-73.9546],[40.77815,-73.95318],[40.7807,-73.95464]]"
  data-status="preparing"
></section>
```

```js
Bootcn.deliveryTracker.update(root, { lat: 40.776, lng: -73.9539, eta: 6 });
Bootcn.deliveryTracker.update(root, { status: 'delivered' });
```

The marker glides between positions and turns the way it moves. While
nobody pans the map, it keeps the courier and the address in view (and the
shop, until the courier leaves it).

### Live from a server

The positions come from your back end (the courier's app sends them there).
With [Server-Sent Events](https://developer.mozilla.org/docs/Web/API/Server-sent_events)
the tracker listens by itself:

```html
<section class="bootcn-delivery" data-bootcn-delivery data-source="/orders/4821/live"></section>
```

Each message is the JSON `update()` takes; the connection closes on
`"status": "delivered"`. For WebSockets or polling, call `update()` from your
own code.

## update() fields

| Field        | Meaning                                                                                                                                 |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `lat`, `lng` | The courier's position                                                                                                                  |
| `heading`    | Direction in degrees (0 = north); worked out from the movement if missing                                                               |
| `status`     | One of the `data-step` names in the progress list (`placed`, `preparing`, `on-the-way`, `delivered`)                                    |
| `eta`        | Minutes to arrival, or `arrival`: a date/time. Without either, it is estimated from the distance left at `data-speed` km/h (default 18) |

## Options

- `data-route`: the planned route as `[[lat, lng], …]`. The part ahead is
  drawn bold, the part behind faded, and the distance left follows it.
  `setRoute(root, list)` changes it (for example after a reroute).
- `data-tiles`: another tile server (`{z}/{x}/{y}`); `""` for none. The
  standard OpenStreetMap tiles are for light use only (see their
  [tile usage policy](https://operations.osmfoundation.org/policies/tiles/)).
- `data-nearby` (metres, default 200): when to say "Your courier is nearby".
- `data-zoom`, `data-fit-zoom` (16), `data-max-zoom` (17).
- `--bootcn-delivery-height`, `--bootcn-delivery-color` (route and home pin)
  and `--bootcn-delivery-done` (progress).

## JavaScript API

- `update(root, data)`, `connect(root, url)`, `disconnect(root)`,
  `fit(root)` (follow again), `setRoute(root, list)`, `remaining(root)`
  (metres).
- Events: `bootcn:delivery:update`, `bootcn:delivery:status`
  (`detail: { status }`), `bootcn:delivery:nearby`.
- `setup(root)` for trackers added later; `init()` / `destroy()`. Messages
  `delivery.in` (`{n} min`), `delivery.now`, `delivery.arrival` and
  `delivery.nearby` are translatable.

## Accessibility

- The map is an image with a name; everything it shows is also in the
  sheet as text: the state, the time, the distance left.
- The progress is an ordered list with `aria-current="step"` on the current
  step.
- Status changes and "Your courier is nearby" are announced; positions are
  not, so a screen reader is not flooded.
- The map controls are named buttons. Under reduced motion the marker jumps
  instead of gliding and the progress bar stops.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `avatar`, `button` and `location-pin`.
