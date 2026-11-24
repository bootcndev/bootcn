# Snippet

A short command or value with a copy button: one line, or several lines with a prompt sign each.

## Usage

Use a snippet for install commands, API keys shown once, or short values to
copy. For longer code with a title and line numbers, use Code block.
Remove the prompt with `.bootcn-snippet__line::before { content: none; }`.

## JavaScript API

- `data-bootcn-snippet` on the wrapper, one `.bootcn-snippet__line` per
  line inside `<pre><code>`, a button with `data-bootcn-snippet-copy` and a
  status region `data-bootcn-snippet-status`.
- Copying joins the lines with line breaks; the `$` prompt is CSS, so it is
  never copied.
- Event `bootcn:snippet:copy` (bubbles), `detail.text`.
- `Bootcn.snippet.init()` / `destroy()`.

## Accessibility

- The copy button is named ("Copy command") and the result is announced in
  a live region.
- Long commands scroll sideways inside the snippet instead of widening the
  page.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
