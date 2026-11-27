# Swipe actions

List rows that slide to reveal actions, as in iOS Mail: swipe for Read, Pin, Archive or Delete, a long swipe to delete, and every action also reachable with the keyboard.

## Usage

A list with `data-bootcn-swipe`, named with `aria-label`. Each
`<li class="bootcn-swipe">` holds the row in `.bootcn-swipe__content` and
its buttons in `.bootcn-swipe__actions--leading` (revealed by swiping
towards the end, right in left-to-right pages) and/or
`.bootcn-swipe__actions--trailing`. Give each action a `data-action` name
and a colour in `--bootcn-swipe-color` (white text needs 4.5:1).

- A swipe past half of the actions opens them; a shorter one springs
  back. Opening a row closes the others; a tap elsewhere closes it.
- `data-swipe-full` on the outermost action: a long swipe (60% of the row)
  runs it straight away, as delete does in Mail.
- `data-swipe-remove` folds the row away after its action and moves focus
  to the next row.
- Every click on an action sends `bootcn:swipe:action` (`detail: { row,
action, button }`); call `event.preventDefault()` to stop the default
  (removing or closing) and do it yourself, for example after the server
  answers. `bootcn:swipe:open` and `bootcn:swipe:removed` tell you more.

`Bootcn.swipe.open(row, 'leading' | 'trailing')`, `close(row)`,
`remove(row)`, `setup(root)`, `init()` / `destroy()`.

## Keyboard

The actions are ordinary buttons after the row in the Tab order: tabbing
to one slides its side open, Escape closes it and returns to the row,
Enter or Space runs it.

## Accessibility

- Swiping is a shortcut, never the only way: each action is a labelled
  button that works from the keyboard and with screen readers.
- Removals are announced ("Removed", `swipe.removed` in
  `window.Bootcn.messages`) and focus never gets lost.
- Vertical scrolling is left alone (`touch-action: pan-y`); motion is
  off with reduced motion.
- Without the script the actions show after each row.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
