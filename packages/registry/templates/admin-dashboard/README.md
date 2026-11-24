# Admin dashboard

A complete admin page built from Bootcn blocks: a responsive sidebar, a top bar
with search, a dark mode toggle and the user menu, metric cards, a revenue
chart, recent activity and a transactions table.

## Usage

```bash
npx bootcn add admin-dashboard
```

The CLI installs every block and component the page uses, then writes
`admin-dashboard.html` to your project root (or to `paths.pages` in
`bootcn.json`, which is `public/` for PHP projects with a `public/` folder).
Open it in a browser: it already links its stylesheets and scripts.

The page refers to your asset folders with placeholders such as
`{{bootcn:css}}`; the CLI replaces them with the right relative paths for your
`bootcn.json`, so the links work wherever your CSS and JavaScript live. If you
copy the page by hand, replace them yourself (for example with `assets/css`).

To use it in PHP, rename the file to `.php` and move the sidebar and top bar
into your layout's header include. Replace the sample numbers, people and
transactions with your data.

## Dark mode

The page starts in the theme the user picked last (saved in `localStorage`
under `bootcn-theme`), or else the system setting, before the first paint. The
moon/sun button in the top bar switches theme. `admin-dashboard.js` exposes
`Bootcn.adminDashboard.setTheme('dark' | 'light', remember)`.

## Accessibility

- A "Skip to content" link is the first focusable element.
- Landmarks: the sidebar (`<aside>` with a `<nav>`), the top bar (`<header>`)
  and `<main>`. The page has one `<h1>` and `<h2>`s for each section.
- The theme toggle is a button with `aria-pressed`; its name is "Dark mode".
- The chart is decorative; the same numbers are in a visually hidden table.
- Below 992px the sidebar becomes a drawer that traps focus and closes with
  Escape.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- The `app-sidebar`, `user-menu`, `page-header`, `stats-cards`,
  `activity-feed` and `transactions-table` blocks, and the components they use.
