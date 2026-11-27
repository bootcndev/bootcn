# Aurora background

A background of soft, slowly drifting coloured light for hero sections, with no JavaScript and readable text on top.

## Usage

A `.bootcn-aurora` section with an `aria-hidden` `.bootcn-aurora__lights`
holding three empty spans, then your content in `.bootcn-aurora__content`.
Pick the colours with `--bootcn-aurora-1`, `-2` and `-3`.

The lights are blurred and faint so text on top stays readable; check your
own colours against your text.

## Accessibility

- The lights are decorative and hidden from screen readers; the section is
  named by its heading.
- Under `prefers-reduced-motion: reduce` the lights stand still.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button` component (for the example).
