# SaaS

A SaaS in five pages: pricing with a plan comparison and FAQ, a blog and an article page on the marketing side, and an app dashboard with a trial banner, onboarding and usage, plus a billing page with plan changes, payment methods and invoices.

## Pages

- `saas.html`: pricing with the monthly/yearly switch, a plan comparison
  table, FAQ and a call to action.
- `saas-blog.html`: the blog index (`blog-list`), with topic filters.
- `saas-article.html`: a post (`blog-article`) with "On this page",
  sharing and related posts.
- `saas-app.html`: the signed-in dashboard: a trial banner, the "Get
  started" checklist, plan usage and recent activity.
- `saas-billing.html`: the current plan with a "Change plan" dialog, usage
  this month, payment methods and invoices.

The marketing pages share the site header and footer; the app pages share
the sidebar (a drawer on phones) and the top bar. Every page has the dark
mode toggle.

## Make it yours

- Replace "Acme", the copy and the plans; prices live in the pricing block
  and the "Change plan" dialog.
- "Change plan" updates the page and sends `bootcn:saas:plan`
  (`detail: { plan }`): call your server there. Payment methods send
  their own events (see the `payment-methods` block).
- Render the blog from your CMS: one `blog-list` card per post, and the
  article body inside `.bootcn-typography`.

## Accessibility

- A skip link on every page, one `<h1>`, named landmarks and the current
  page marked in the navigation (`aria-current="page"`).
- The comparison table has row and column headers; ticks and dashes are
  read as "Included" and "Not included".
- Usage uses native `<meter>` elements with labels; plan changes are
  announced.
