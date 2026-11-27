# Signature pad

A signature field: draw with a mouse, pen (with pressure) or finger, undo and clear, or type a name shown in a handwriting style; the signature goes into the form as a PNG and can be exported as SVG.

## Usage

Put it in your form. The hidden `name="signature"` field holds the
signature as a PNG data URL (dark ink on a transparent background, in light
and dark mode), ready to store or place on a document or PDF. Empty means
not signed.

- **Draw**: lines are smoothed; pens draw thinner or thicker with pressure.
  Undo removes the last stroke, Clear everything. The drawing is kept
  through resizes.
- **Type**: the name is shown, and saved, in a handwriting style. It is how
  keyboard and screen reader users sign, and a quick way for anyone.
- `data-required`: submitting the form while empty shows "Sign above to
  continue" and stops the submit.

`Bootcn.signature.toDataURL(root)` (PNG) or `toDataURL(root, 'svg')`
(drawn signatures), `isEmpty(root)`, `clear(root)`, `setup(root)`,
`init()` / `destroy()`. `bootcn:signature:change`
(`detail: { empty, method, dataUrl }`). `--bootcn-signature-ink` and
`--bootcn-signature-height` style it.

A drawn or typed image is a simple electronic signature; contracts that need
a qualified electronic signature need a signing service as well.

## Accessibility

- Draw and Type are tabs (arrow keys switch); the drawing area is an image
  named "Signature drawing area" that points to Type for keyboard users.
- The typed name is a labelled field; undo, clear and drawn are announced;
  the "sign to continue" error is an alert and returns the focus to the
  tabs.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `input` and `button`.
