# Feedback

Collect feedback where it happens: a floating Feedback button with a five-face rating, a comment and an optional email, and an inline "Was this page helpful?" with a follow-up question.

## Usage

**Widget**: `<div class="bootcn-feedback bootcn-feedback--floating"
data-bootcn-feedback>` with a toggle button and a panel (`role="dialog"`)
holding the form and a thank-you message. Without `--floating` it opens
below the button wherever you put it.

- Five faces (Terrible to Great) are radio buttons; the choice is
  required, the comment and email are optional ("You can contact me"
  shows the email field).
- On send it fires `bootcn:feedback:submit` (`detail: { rating, label,
comment, email, page }`). Set `data-feedback-url` to POST it as JSON, or
  cancel the event and send it yourself. Then the panel thanks the person.

**Inline**: `<div data-bootcn-feedback-inline>` asks "Was this page
helpful?". Yes or No opens one follow-up question (different for each);
Send or Skip fires `bootcn:feedback:submit` (`detail: { helpful, comment,
page }`) and shows a thank-you line. Put one at the end of help articles.

`Bootcn.feedback.open(root)`, `close(root)`, `init()` / `destroy()`.

## Keyboard

Tab to the button and Enter opens the panel with focus on the faces; arrow
keys pick a face; Escape closes and returns to the button.

## Accessibility

- The faces are a radio group named "Your rating", each named in words
  ("Great"); the emoji are hidden from screen readers.
- A missing rating shows a message and focuses the faces; the thank-you
  message takes focus so it is read.
- Yes/No are toggle buttons (`aria-pressed`); the follow-up question is a
  labelled field. Texts are in `window.Bootcn.messages` (`feedback.*`).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button`, `input`, `textarea` and `checkbox` components.
