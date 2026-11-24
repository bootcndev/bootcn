# Landing page

A product landing page built from Bootcn blocks: the sticky Site header (with
a dark mode button), Hero, Logo cloud, Feature grid, Testimonials, Pricing
table, FAQ, Call to action and Site footer.

## Usage

```bash
npx bootcn add landing-page
```

The CLI installs every block and component the page uses and writes
`landing-page.html` to your project root (or `paths.pages`), with its links
already pointing at your CSS and JavaScript folders. Replace the copy, the
logos and the prices; the header links point at the sections' ids
(`#features`, `#customers`, `#pricing`, `#faq`).

## Dark mode

The page starts in the saved theme or the system setting before the first
paint, and the moon/sun button switches it (`Bootcn.landingPage.setTheme`).

## Accessibility

- A "Skip to content" link, then landmarks: the header with the main
  navigation, `<main>` with one `<h1>` (the hero), and the footer with its
  own navigation.
- Every section is named by its heading; in-page links land below the
  sticky header (`scroll-padding-top`) and scroll smoothly only without
  reduced motion.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- The `site-header`, `hero-section`, `logo-cloud`, `feature-grid`,
  `testimonials`, `pricing-table`, `faq-section`, `call-to-action` and
  `site-footer` blocks and the `button` component (with what they use).
