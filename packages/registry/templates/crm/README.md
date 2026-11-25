# CRM

A CRM in three pages built from Bootcn components: a deals pipeline
(`crm.html`) on a kanban board with the value of each stage, a contacts
table (`crm-contacts.html`) with a filter bar and an add-contact dialog,
and a contact page (`crm-contact.html`) with details, open deals and an
activity timeline you can add notes to. Every page has the notification
center in its header.

## Usage

```bash
npx bootcn add crm
```

The CLI installs every component the pages use and writes the three pages
to your project root (or `paths.pages`). Then render the deals, contacts
and activity from your database, and save changes through the events:

- `bootcn:kanban:move` when a deal changes stage (the column totals and
  the open pipeline update by themselves);
- `bootcn:filters:change` if you filter on the server instead of the page;
- `bootcn:modal:submit` from the add-contact dialog (validated first);
- `bootcn:notifications:read` when notifications are read.

## JavaScript

`crm.js` keeps the dark mode button in sync (`Bootcn.crm.setTheme`), adds
up the pipeline (`Bootcn.crmPage.totals()`), puts new notes at the top of
the timeline and new contacts at the top of the table.

## Accessibility

- Every page has a "Skip to content" link, a header with a named main nav,
  `<main>` with one `<h1>`.
- Deals move with the mouse, touch (by the grip) or the keyboard, and each
  move is announced; the contacts table has a caption, column headers and a
  row header per contact; filters and the result count are announced.
- See the components for the details of each part.
