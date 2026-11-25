# Timeline

A timeline for activity and progress: icons with a status (done, current, upcoming, error), titles, times shown as "2 hours ago" and notes; vertical, or horizontal steps that stack on phones.

## Usage

An `<ol class="bootcn-timeline">` named with `aria-label`; each item has a
marker (an icon), a title, a meta line and optionally a note
(`.bootcn-timeline__text`). `data-status` on the item: `done`, `current`,
`upcoming` or `error`. `bootcn-timeline--horizontal` lays the items out as
steps in a row (a column on phones); mark the current one with
`aria-current="step"` and say each step's state in hidden text.

## Relative times

`<time datetime="2026-11-25T14:20" data-bootcn-relative>` shows "2 hours
ago" (Intl.RelativeTimeFormat, in the page's `lang`), refreshed every
minute, with the full date in the tooltip. Write a readable date in the
HTML as the fallback.

`Bootcn.timeline.update(root)` after adding items, `relative(date)`,
`init()` / `destroy()`.

## Accessibility

- An ordered list with a name; icons are decorative and the text says what
  happened.
- Times are real `<time>` elements; colours always come with words.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
