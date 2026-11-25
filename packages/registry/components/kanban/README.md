# Kanban

A kanban board: columns with counts and optional limits, cards with tags, due dates, comments and people, drag and drop with the mouse or touch, keyboard moves that are announced, and adding cards in place.

## Usage

Each column is a section with `data-bootcn-kanban-column="id"`, a heading,
a count (`data-bootcn-kanban-count`) and a list (`data-bootcn-kanban-list`)
of cards (`data-bootcn-kanban-card="id"`, focusable with `tabindex="0"`).
`data-limit="3"` on a column shows "2 / 3" and marks it when there are more
cards than the limit (a work-in-progress limit).

## Moving cards

- **Mouse and pen**: drag a card; a placeholder shows where it will land,
  and the board scrolls sideways near its edges.
- **Touch**: drag by the grip in the card's corner, so the page still
  scrolls when you swipe a card.
- **Keyboard**: Tab to a card, **Space** (or Enter) picks it up, the
  **arrow keys** move it within and between columns, **Space** drops it,
  **Escape** puts it back. Without a card picked up, the arrow keys move
  the focus between cards. Each step is announced ("In progress,
  position 2 of 3").

Every move fires `bootcn:kanban:move` (`detail: { card, from, to, index }`)
for your server to save. **Add a card** opens a field at the bottom of the
column (Enter adds, Shift+Enter is a new line, Escape closes) and fires
`bootcn:kanban:add`.

`Bootcn.kanban.add(root, columnId, title)`, `move(root, cardId, columnId,
index)`, `sync(root)` after changing cards yourself, `init()` /
`destroy()`. Messages `kanban.*` are translatable.

## Accessibility

- Columns are sections named by their headings; cards are list items, and
  each card describes the keyboard moves to screen readers.
- Moves, drops, cancels and new cards are announced in an assertive live
  region; the focus stays on the moved card.
- Tags carry text as well as colour.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `avatar`, `button` and `textarea`.
