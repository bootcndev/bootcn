# Spotlight search

A Ctrl/⌘ K search for your whole app: pages, people, projects, files and actions in groups, from the page, a JSON URL or your own function, with recent picks, highlighted matches and full keyboard support.

## Usage

A trigger button (`data-bootcn-spotlight-open="#id"`) and a native
`<dialog data-bootcn-spotlight>` with a combobox, a listbox and a status
line. Ctrl/⌘ + `data-shortcut` (here K) opens and closes it, and "/" opens
it when you are not typing in a field.

**What it searches**, all together, grouped by each item's `group`:

- `<script type="application/json" data-spotlight-items>` inside the
  dialog: items with `title`, and optionally `group`, `subtitle`, `href`,
  `value`, `icon` (`page`, `file`, `folder`, `settings`, `plus`,
  `user-plus`, `moon`, `clock`, `link`), `avatar` (initials), `image`,
  `keywords`, `shortcut` and `suggested`.
- `data-spotlight-links="nav a"`: links already on the page, grouped as
  "Pages" (or `data-spotlight-links-group`).
- `data-spotlight-url="/search?q={query}"`: your server, answering with a
  JSON array of items. Requests are cancelled when the query changes.
- `Bootcn.spotlight.register(dialog, (query, signal) => items)`: your own
  function, returning items or a Promise of them.

With an empty query it shows recent picks (kept in `localStorage` under
`data-recent`) and the `suggested` items. Matches ignore case and accents;
titles that start with the query come first; `data-limit` (5) caps each
group.

Picking an item with `href` goes there (Ctrl/⌘ opens a new tab); every
pick sends `bootcn:spotlight:select` (`detail: { item, value, query }`),
cancel it to run an action instead. `bootcn:spotlight:open` and `close`
too. `Bootcn.spotlight.open(dialog)`, `close(dialog)`, `register()`.

## Keyboard

Ctrl/⌘ K or "/" opens, Up and Down move through every group, Enter opens,
Escape closes and returns focus to where you were.

## Accessibility

- A modal `<dialog>` (focus stays inside, the page behind is inert) named
  "Search".
- The field is a combobox controlling a listbox of grouped options; the
  active one is `aria-activedescendant`. The number of results is
  announced ("5 results", `spotlight.many` / `spotlight.one`), and texts
  are in `window.Bootcn.messages`.
- Shortcut hints are hidden from screen readers; matches are bold and
  underlined, not only coloured.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
