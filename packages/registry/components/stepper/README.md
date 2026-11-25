# Stepper

Steps for multi-step forms and progress: numbered markers that turn into checks, horizontal or vertical, with validation before each step and an optional closing panel.

## Usage

`data-bootcn-stepper` on the container, with:

- `data-bootcn-stepper-item` on each step of the `<ol>` (marker, title,
  description, and an empty `data-bootcn-stepper-state` for screen readers),
- `data-bootcn-stepper-panel` on each step's content (all but the first
  `hidden`), with `data-bootcn-stepper-heading` on its title,
- `data-bootcn-stepper-prev` and `data-bootcn-stepper-next` buttons; the
  next button reads `data-next-label` or `data-finish-label` on the last step,
- optionally `data-bootcn-stepper-complete`: a panel shown after the last
  step instead of the steps (for example the `success-state` component).

`data-step="1"` starts on another step (0-based). Without panels the list
just shows progress, as in the vertical example.
`bootcn-stepper--vertical` puts the steps in a column. On phones the
horizontal stepper shows only the current step's title.

## Validation

Continue checks the current step's fields (`required`, `type="email"`, …):
invalid ones get `aria-invalid="true"`, their `.invalid-feedback` shows and
the first one is focused. Enter in a field moves on.

## JavaScript API

- `Bootcn.stepper.next(root)`, `prev(root)`, `go(root, index)`,
  `finish(root, { skipEvent })`, `current(root)`.
- `bootcn:stepper:change` (`detail: { from, to }`) and
  `bootcn:stepper:finish` (`detail: { form }`); both can be cancelled with
  `preventDefault()`, for example to send the form and show the closing
  panel with `finish(root, { skipEvent: true })` when the server answers.
- Messages `stepper.next`, `stepper.finish`, `stepper.position`
  (`Step {n} of {total}`), `stepper.complete` and `stepper.current`.

## Accessibility

- The steps are an ordered list; the current one has `aria-current="step"`
  and every step says whether it is completed or current.
- Moving to a step focuses its heading and announces "Step 2 of 3: Plan".
- Each panel is a section named by its heading.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css` and `button`, `input`.
