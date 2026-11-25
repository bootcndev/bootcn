# File manager

A file browser: breadcrumbs, search, list or grid view, sorting, selection with bulk actions, a menu per file and drag-and-drop uploads that appear in the list.

## Usage

Each file or folder is a row (`data-bootcn-files-item`) with `data-name`,
`data-type` (`folder`, `image`, `pdf`, `sheet`, `video` or `file`),
`data-size` (bytes) and `data-modified` (a date), used for sorting; render
them from your storage. Links open the file or the folder.

- **View**: list or grid (`data-view="grid"` to start in the grid). Both
  are the same rows, laid out differently.
- **Sort** by name, size or date from the column headers; folders stay
  first.
- **Search** filters by name as you type.
- **Select** with the checkboxes (or "Select all"): a bar shows the count
  with Download and Delete.
- **Upload** opens the `dropzone`; files that finish uploading are added
  to the list.

## Events

Nothing is deleted or downloaded on its own server: listen and act.

- `bootcn:files:action` (`detail: { action, names, rows }`) for
  `download`, `rename` and `delete`, from a row's menu or the selection bar.
  Call `event.preventDefault()` to keep the rows (for example until your
  server confirms); otherwise deleted rows are removed.
- `bootcn:files:select` (`detail: { names }`).

`Bootcn.fileManager.add(root, { name, type, size, modified, href })`,
`setView(root, 'grid')`, `sort(root, key, direction)`, `selected(root)`,
`init()` / `destroy()`. Messages `files.*` are translatable.

## Accessibility

- The list is an ARIA table (rows, cells, column headers), so it stays a
  table to screen readers in both views; sortable headers are buttons and
  carry `aria-sort`.
- Every checkbox and menu button is named after its file ("Select Q3
  report.pdf", "Actions for Q3 report.pdf").
- The view buttons use `aria-pressed`; Upload uses `aria-expanded`;
  search results, selection changes and deletions are announced.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle (the row menus).
- `themes/tokens/tokens.css`, `dropzone`, `breadcrumb`, `input`, `checkbox`, `dropdown` and `button`.
