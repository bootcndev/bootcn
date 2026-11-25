# Filter bar

A filter bar for tables and lists: search, a chip per filter that opens its choices (several values, a range, one option), chips that say what is chosen and clear with ×, Clear all, and a live result count.

## Usage

Each filter is a `data-bootcn-filter="field"` with a `data-label`, a
`data-type` and a panel of choices:

- `multi`: checkboxes (`name="status[]"`); an item matches any checked
  value.
- `range`: `data-bootcn-filter-min` / `-max` number fields;
  `data-currency="USD"` formats the chip ("$10K–$50K").
- `single`: radio buttons; a number of days ("30") matches dates in the
  last 30 days.

Point the bar at the items with `data-target="#table"`: each
`[data-bootcn-filter-item]` carries the fields as `data-status`,
`data-owner`, `data-value`, `data-created` (ISO date), and the search box
looks in its text (or `data-search`). `data-empty` names the "nothing
matches" message; `data-noun` is used in the count ("3 of 8 contacts").

Chips update as people choose: "Status: Lead, Customer", "Owner: Olivia
Martin +1"; × clears one filter, **Clear all** clears everything.

## Server-side filtering

For long lists, leave out `data-target` and listen for
`bootcn:filters:change` (`detail: { values }`, for example
`{ status: ['Lead'], value: { min: 10000, max: null }, search: 'north' }`)
to fetch the results, or put the bar in a GET form.

`Bootcn.filterBar.apply(root)` after changing items, `values(root)`,
`init()` / `destroy()`. Messages `filters.*` are translatable.

## Accessibility

- The bar is a search landmark named after what it filters.
- Each chip is a disclosure button (`aria-expanded`) for its panel; the
  choices are a fieldset of native checkboxes or radios, or labelled number
  fields; Escape and Done close the panel and return the focus.
- The × buttons are named ("Clear Status filter"); the result count is
  announced as it changes.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `input`, `checkbox`, `radio-group`, `button` and `table`.
