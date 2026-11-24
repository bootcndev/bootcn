# Code block

A titled block of code with a copy button and optional line numbers.

## Usage

Escape the code on the server (`htmlspecialchars` in PHP). For line
numbers, add `bootcn-code-block--numbered` and wrap each line in
`<span class="bootcn-code-block__line">`. Keep the code's own line breaks
(or `&#10;`) and do not let a formatter indent the inside of `<pre>`. For syntax colours, put the output
of a highlighter such as Prism or Shiki inside `<code>`; the block only
provides the frame.

## JavaScript API

- `data-bootcn-code-block` on the `<figure>`, a button with
  `data-bootcn-code-block-copy`, and a live region marked
  `data-bootcn-code-block-status`.
- The copy button copies the text of the `<code>` element (line numbers are
  CSS counters, so they are never copied), shows a check for two seconds and
  announces "Copied to the clipboard."
- Event `bootcn:code-block:copy` (bubbles), `detail.text`.
- `Bootcn.codeBlock.init()` / `destroy()`.

## Accessibility

- The `<pre>` is focusable (`tabindex="0"`) so keyboard users can scroll
  long lines.
- The copy button has an accessible name ("Copy code") and the result is
  announced in a live region.
- The title is a `<figcaption>`, so the code is named by it.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
