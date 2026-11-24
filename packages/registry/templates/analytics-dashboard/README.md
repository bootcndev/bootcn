# Analytics dashboard

An analytics page built from Bootcn components and blocks: the collapsible
Sidebar, a breadcrumb, a report date picker, metric cards, area, donut, bar and
radial charts, and a payments table you can sort, filter, page and select.

## Usage

```bash
npx bootcn add analytics-dashboard
```

The CLI installs every component and block the page uses and writes
`analytics-dashboard.html` to your project root (or `paths.pages`), with its
links already pointing at your CSS and JavaScript folders. Replace the sample
numbers in the chart configurations, the stats and the table rows with your
data, rendered on the server.

## Dark mode

Like the admin dashboard, the page starts in the saved theme or the system
setting before the first paint, and the moon/sun button switches it
(`Bootcn.analyticsDashboard.setTheme`). The sidebar's collapsed state is
remembered separately.

## Accessibility

- A "Skip to content" link, then landmarks: the sidebar (`<aside>` and
  `<nav>`), the header with the breadcrumb, and `<main>` with one `<h1>`.
- Every chart has a "Show data" table; the date picker, data table and sidebar
  keep their own keyboard support.
- Ctrl/⌘ B collapses the sidebar; below 992px it is a drawer.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- The `sidebar`, `breadcrumb`, `date-picker`, `data-table` and `button`
  components, and the `stats-cards`, `chart-area`, `chart-pie`, `chart-bar`
  and `chart-radial` blocks (with the components they use).
