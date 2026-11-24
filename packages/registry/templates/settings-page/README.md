# Settings page

Account settings for a SaaS app, built from Bootcn components: a section nav,
a profile form and a password form validated with the Form component,
notification choices with a Checkbox group and switches, billing with the
current plan and an invoice table, and account deletion confirmed in an
Alert dialog.

## Usage

```bash
npx bootcn add settings-page
```

The CLI installs every component the page uses and writes `settings-page.html`
to your project root (or `paths.pages`). Fill the values from your database
on the server, give the forms an `action` (they post normally once they are
valid) and check every value on the server again.

## JavaScript

`settings-page.js` keeps the dark mode button in sync
(`Bootcn.settingsPage.setTheme`) and marks the nav link of the section you
are reading with `aria-current`.

## Accessibility

- A "Skip to content" link, a header, and `<main>` with one `<h1>`; each
  section is a card named by its heading, and the nav links jump to them.
- Forms show errors next to their fields and in a focused summary (Form);
  the notification channels keep a minimum (Checkbox group).
- Deleting the account opens an `alertdialog` that starts on "Cancel".

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- The `card`, `avatar`, `field`, `input`, `textarea`, `button`, `form`,
  `checkbox-group`, `switch`, `table`, `badge` and `alert-dialog` components.
