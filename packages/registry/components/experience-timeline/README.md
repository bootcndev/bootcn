# Experience timeline

Work history as on LinkedIn: company logos, roles with dates and durations ("2 yrs 3 mos"), several roles at one company joined by a line, locations, descriptions and skills.

## Usage

Each company is a list item with a logo and a body. One role: the title,
then the company line, dates and place. Several roles at the same company:
the company name with the total time, and the roles in an inner
`.bootcn-experience__roles` list, joined by a line.

- Logos: a short text on a colour (`--bootcn-experience-logo`, use a dark
  colour so the white letters stay readable) or an `<img>` inside
  `.bootcn-experience__logo`.
- Dates are `<time datetime="2024-01">` elements; a current role ends with
  "Present".

## Durations

`<span data-bootcn-duration data-start="2024-01" data-end="2025-06">` is
filled in as "1 yr 6 mos". Both the first and the last month count, as on
LinkedIn; without `data-end` the role runs until today. Write the text in
the HTML too, so it shows without JavaScript.

`Bootcn.experience.init(root)` after adding entries;
`Bootcn.experience.duration('2024-01', '2025-06')` returns the text.
Messages `experience.year`, `experience.years`, `experience.month` and
`experience.months` are translatable.

## Accessibility

- A section named by its heading, with an ordered list of companies and,
  inside, an ordered list of roles; titles are headings, so screen reader
  users can jump between them.
- Logos are decorative (the company name is in the text), and dates are
  real `<time>` elements.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
