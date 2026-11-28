---
description: 'Release notes for the Bootcn registry and CLI: new components, blocks and templates, fixes and changes in every version.'
---

# Changelog

Two things are versioned: the **registry** (components, blocks, templates;
each published version stays available under `/v/<version>/`) and the **CLI**
(`bootcn` on npm). Item versions are in each item's page and manifest.

## Registry

### 0.45.0

Seven more React and Vue components, 20 in all.

- Dropdown, Tooltip, Popover and Sheet on Bootstrap's plugins, loaded in the
  browser only.
- Combobox and Data table written for React and Vue state: filtering that
  ignores accents, keyboard selection, sorting, pages and row selection.
- Date picker on the calendar script, with the date as `YYYY-MM-DD` in
  `value` / `v-model`.

### 0.44.0

More React and Vue components.

- Input, Textarea and Select (label, hint and error wired to the field),
  Checkbox and Switch (`checked` in React, `v-model` in Vue), Tabs (arrow
  keys, Home and End, without Bootstrap's JavaScript), Card, Alert, Badge
  and Avatar (initials when the picture is missing or broken).
- Item pages show the React and Vue code under "React and Vue".
- Both example apps are type-checked (TypeScript and vue-tsc) and tested in
  CI after the CLI installs the components.
- Table 1.0.1: in a scrolling `.table-responsive`, the visually hidden text
  in cells no longer widens the page on phones.

### 0.43.0

React and Vue.

- The first React (`.tsx`) and Vue (`.vue`) components: Button, Dialog and
  Toaster. They use the same markup, CSS and JavaScript as the HTML
  versions, load their JavaScript in the browser only (server rendering
  works) and fit each framework: props and `onOpenChange` in React,
  `v-model:open` and slots in Vue. Install them with CLI 0.8.
- Guides for [React](/guide/react) and [Vue](/guide/vue).

### 0.42.0

Effects, motion and colour.

- Border beam: a light that travels around a card's border.
- Glow card: a soft light that follows the pointer and lights the border.
- Gradient text: still or moving gradient words that keep 4.5:1.
- Aurora background: slowly drifting coloured light behind a hero.
- Number ticker: numbers that count up as they scroll into view; screen
  readers get the final value once.
- Scroll reveal: parts that fade and slide in as they appear, one after
  another in lists, and never hidden without the script.
- Tab bar 1.1.0: a floating glass variant.
- Recent purchase: a corner notice for real orders from your shop, one at
  a time, with a way to switch it off.
- Colour palette: 22 colours in 11 shades as CSS variables
  (`npx bootcn add palette`).
- Spotlight search 1.0.1: the list no longer redraws when a slower source
  returns the same results.
- Every effect stands still under reduced motion.
- Tree 1.0.1: file sizes ("2 kB") keep their order on right-to-left
  pages. Found by the new visual regression tests: a screenshot of every
  preview in light, dark and right to left, compared in CI.

### 0.41.0

The event calendar.

- Event calendar block: month, week and day views with events coloured by
  calendar, all-day and multi-day events, overlapping events side by side,
  a line at the current time, a details popover, a form to add, edit and
  delete events with checks, and calendars you can hide. Arrow keys move
  between days; t, m, w, d and n for today, the views and a new event.
- Narrow spaces show dots under each day instead of titles.
- Site: no mentions of other UI libraries.
- AI assistants: an agent skill (bootcn.dev/skills/bootcn/SKILL.md),
  llms-full.txt, every guide and item page as Markdown (add `.md` to its
  address) and a robots.txt that welcomes AI crawlers by name.

### 0.40.0

Chat and an email inbox.

- Chat block: conversations with presence and unread counts, threads
  with day separators, read receipts, files and reactions, "is typing",
  and a composer that grows, sends on Enter and attaches files. Messages
  arrive with `Bootcn.chat.receive()` and are read out as they come.
- Email inbox block: folders and labels, a list with stars, unread,
  selection and search, and a reader with reply; Gmail-style keys (j, k,
  e, #, s, x, c, /), bulk actions with Undo and a compose dialog.
- Both fit their space: three panes, two, or one at a time on phones.
- Landing: "New in Bootcn" shows the chat, the inbox, feedback and the
  flow builder.

### 0.39.0

Search and feedback.

- Spotlight search: a Ctrl/⌘ K search for your whole app. Pages, people,
  projects, files and actions in groups, from the page, a JSON URL or your
  own function; recent picks, suggestions, matches that ignore case and
  accents, and full keyboard support in a native dialog.
- Reviews block: the average with a bar per star that filters the list,
  sorting, helpful votes, replies from your team, and a "Write a review"
  dialog that updates the numbers.
- Feedback: a floating Feedback button with a five-face rating, a comment
  and an optional email, and an inline "Was this page helpful?" with a
  follow-up question. Sends to your URL as JSON or to your own code.

### 0.38.0

The SaaS template and a blog.

- SaaS template in five pages: pricing with a plan comparison and FAQ, a
  blog and an article page, an app dashboard with a trial banner, the
  "Get started" checklist, usage and recent activity, and a billing page
  with a "Change plan" dialog, payment methods and invoices.
- Blog list block: a featured post across the row, post cards with
  covers, topics, reading time and authors, and topic filters that say how
  many posts they show.
- Blog article block: readable long-form text, a sticky "On this page" that
  follows your reading, a reading progress bar, Copy link and share
  buttons, tags, the author's bio and related posts.

### 0.37.0

iOS-style UI and a flow builder.

- Flow builder: a visual builder for automations such as email sequences.
  Steps joined by lines, yes/no branches, + buttons with a menu of steps,
  warnings on unfinished steps, pan and zoom, arrow keys across the
  drawing, and the flow as JSON for saving.
- Segmented control: mutually exclusive options in one rounded track, on
  native radio buttons.
- Action sheet: choices that slide up from the bottom, with a Cancel
  button.
- Grouped list: settings rows in rounded groups, with icon tiles, values,
  switches and chevrons.
- Tab bar: bottom navigation for phones, with badges, a filled icon for
  the current page and room for the home indicator.
- Swipe actions: rows that slide to reveal Read, Pin, Archive or Delete,
  a long swipe to delete, and every action reachable with the keyboard.
- Large title: a navigation bar whose large title shrinks into the bar as
  the page scrolls.

### 0.36.0

Everyday UI.

- Tree: expand and collapse, full keyboard, single or multiple selection,
  checkboxes with a partial state, children loaded on demand.
- Share card: link preview, Copy, share links for X, LinkedIn, Facebook,
  WhatsApp, Reddit and email, and the system share sheet on phones.
- Signature pad: draw with mouse, pen or finger, undo and clear, or type
  the name; saved as PNG in the form, exportable as SVG.
- Context menu 1.1.0: submenus, checkable and radio items, keyboard
  shortcuts named with aria-keyshortcuts.
- Site: components, blocks and templates from the last two releases carry a
  "New" badge in the sidebar, the lists and on their page; every other page
  says which release added it.
- Site: every page has its own search description and every item page a
  title such as "Tree component for Bootstrap 5", with breadcrumbs for
  search engines. Live previews and the 404 page are no longer indexed.

### 0.35.0

The CRM pack.

- Social actions: a like/dislike pair, one at a time.
- Timeline: activity and progress, horizontal steps, relative times.
- Payment card: a card picture that follows its form and turns over for
  the security code, with checks.
- Payment methods block: saved cards, default, edit, remove, add.
- Notification center: bell with the unread count, a panel by day, All and
  Unread, mark read, live notifications.
- Filter bar: search and filter chips (values, ranges, dates) with a live
  count, or server-side filtering.
- CRM template: deals pipeline with stage totals, contacts with filters
  and an add-contact dialog, and a contact page with an activity timeline.

### 0.34.0

The Commerce pack.

- Rating: star display that fills to any value, and a rating input of
  radio buttons.
- Variant picker: colour swatches and size buttons, sold-out options
  crossed out.
- Product card: picture, badges, wishlist, rating, colours, price with the
  old price and saving, add to cart.
- Cart: a side drawer with quantities, a free-shipping bar and the subtotal,
  fed by add-to-cart buttons and product forms, kept between pages.
- Product listing block: filters (a drawer on phones), sorting, live count
  and empty state.
- Product detail block: gallery, options, quantity, add to cart, details.
- Checkout block: contact, address, shipping method and card details with
  formatting and checks, order summary with a discount code, confirmation.
- E-commerce template: catalogue, product page and checkout sharing one cart.

### 0.33.0

The App UI pack.

- Experience timeline: work history as on LinkedIn, with roles grouped by
  company and durations worked out from the dates.
- API keys block: masked keys, a create dialog that shows the new key once
  with Copy, and revoking with confirmation; your server supplies the keys.
- Invoice block: line items, VAT and totals worked out in any currency,
  status, and a clean print/PDF version.
- Dropzone: drag-and-drop uploads with checks, thumbnails, progress and
  errors, to a URL or through your own code.
- File manager: breadcrumbs, search, list or grid view, sorting, selection
  with bulk actions, per-file menus and uploads that join the list.
- Kanban: columns with counts and limits, drag and drop (mouse, pen and
  touch by the grip), keyboard moves that are announced, and adding cards.

### 0.32.0

- Video player: custom controls over the native `<video>`: a big play
  button, seek bar with buffering, back and forward 10 seconds, volume,
  speed, captions drawn above the controls, picture in picture and full
  screen. YouTube-style keys (K, J, L, M, C, F, arrows, 0–9), controls that
  fade out while playing, and the browser's own player without JavaScript.

### 0.31.0

- Modal: sizes, top placement, a bottom sheet on phones, blurred or
  transparent backdrop, scrolling content with shadows, form validation
  with a `bootcn:modal:submit` event and busy state, and an
  unsaved-changes guard ("Discard your unsaved changes?").
- Stepper: horizontal or vertical steps whose markers turn into checks,
  validation before each step, focus and announcements on every move, and
  an optional closing panel.
- Success state: a "You're all set" screen whose check draws itself, with
  optional confetti.
- Onboarding checklist: a "Get started" card with tasks, a progress bar,
  collapse and dismiss, remembered in the browser if you want.
- Tour: a product tour that highlights one element at a time, with "1 of
  4", Back, Next, Skip and full keyboard support.
- Onboarding flow block: a three-step workspace setup that ends on the
  success state.

### 0.30.0

- Delivery tracker: live order tracking like a delivery or ride app. The
  courier glides along the map towards the address and turns the way it
  moves; the road ahead is drawn bold and the road behind faded. A sheet
  shows the arrival time (from the server, or estimated from the distance
  left), the order progress, the courier and call/message buttons.
  Positions come from `update()` or Server-Sent Events (`data-source`).

### 0.29.0

- Route tracker: follows the device's position and draws the route on an
  OpenStreetMap map as it goes, with distance, time and average speed;
  zoom, fit, drag to pan, segments when tracking pauses, filtering of
  inaccurate positions and GeoJSON export. No tile is requested before
  tracking starts, and the tile server is configurable.

### 0.28.0

- Social actions: a like button with a count and a pop animation, follow and
  subscribe toggles (`aria-pressed`), compact counts (12.4K, with the exact
  number for screen readers) and a "followed by" line.
- Location pin: a "you are here" dot with an accuracy halo and a pulse,
  map pins with an icon, a colour or a short label; plain CSS.
- Audio player: play and pause, seek, previous and next, volume and mute,
  and a playlist, over a native `<audio>` element.

### 0.27.0

- Toaster: `Bootcn.toast()` with success, error, warning, info and loading
  types, descriptions, an action, `toast.promise()`, positions, stacking
  that expands on hover, swipe to dismiss and a timer that pauses on hover
  and focus.
- Button with icons (leading, trailing, icon-only sizes, loading spinner,
  count badge) and Confetti (`Bootcn.confetti()`, skipped under reduced
  motion).

### 0.26.0

- Choropleth map: regions from any GeoJSON coloured by a chosen metric,
  with tooltips, zoom and pan, keyboard navigation, a legend and the data as
  a table. Sample: Romania's counties from geoBoundaries (CC BY 4.0).
- Examples use neutral sample names and addresses.

### 0.25.0

- Map embed: an OpenStreetMap map that loads only on request.
- Analytics: Sparkline (trend with a text summary), Funnel (an ordered list
  with counts and conversion) and Heatmap (a table coloured in five steps,
  every number readable).
- Blocks: Location card and Traffic overview.

### 0.24.0

- Password strength (meter, live rule checklist, show/hide, blocks weak
  passwords in forms), Loader (typing dots, pulse, bars, "Thinking…"),
  Marquee (pauses on hover, focus or its button) and Animated button
  (shimmer, glowing border, ripple, press and nudge).
- Block: Logo marquee.

### 0.23.0

- Translations: messages written by component scripts (announcements,
  date segment names, a few button names) read `window.Bootcn.messages`,
  with plurals from `Intl.PluralRules`. Guide: [Translations](./guide/i18n).
- Site header 1.1.0: optionally hides while scrolling down
  (`data-bootcn-site-header-autohide`).
- Guide: [Animations](./guide/animations).
- Site: structured data (Organization, WebSite, SoftwareSourceCode) and
  robots.txt.

### 0.22.0

- Date range input: a start and an end date typed in one segmented field,
  with an order check and the length announced.

### 0.21.0

- Range slider (two thumbs, a minimum and a maximum), User (avatar, name
  and a second line), Snippet (commands with a copy button) and Image
  (fades in, shows its description if it fails, optional zoom).

### 0.20.0

- Blocks: Stacked bar chart, Login with email link, Sidebar rail (icons
  with tooltips), Floating sidebar and Booking (calendar, time slots and a
  summary).
- Docs: an AI section with the AI chat and its pieces in one place.

### 0.19.0

- Date input: segmented date, time and date-time fields (day, month, year,
  hour, minute and AM/PM as spinbuttons, ordered for the locale), built on a
  native input that stays for phones and pages without JavaScript.
- App sidebar 1.1.2: the links keep their inset on desktop.

### 0.18.0

- Soft style (`npx bootcn add soft`): tinted fields instead of outlines,
  cards on soft shadows and larger corners. The theme builder has a Style
  choice (Default or Soft) and copies the style with your colors.

### 0.17.0

- Templates: Landing page (header, hero, logos, features, testimonials,
  pricing, FAQ, call to action, footer) and Settings page (profile and
  password forms with validation, notifications, billing, account deletion).
- Blocks: Site header, Logo cloud, FAQ section and Site footer.

### 0.16.0

- Right to left: every component, block and template uses logical CSS
  properties; directional icons carry `bootcn-rtl-flip` (mirrored by
  `tokens.css` 2.2.0); toolbar, menubar, calendar and resizable swap ← and →;
  sliders fill from the right. Guide: [Right to left](./guide/rtl).
- Docs: an RTL button on every preview.

### 0.15.0

- Form: validation with the browser's rules, messages under each field, an
  error summary that takes focus and live checks after the first attempt.
- Autocomplete (free text with suggestions, from the page or a URL),
  Checkbox group ("Select all", minimum), Close button, Color slider (hue,
  saturation, lightness, opacity) and Color area (2D picker with hue and hex).

### 0.14.0

- AI chat: Conversation (messages, reasoning, sources, copy and feedback
  actions, typing indicator, scroll to latest), Prompt input (growing
  textarea, attachments, model choice, suggestions, send and stop) and Code
  block (copy, line numbers).
- Block: AI chat, which connects the prompt input to the conversation.

### Site

- The repository moved to <https://github.com/bootcndev/bootcn>, and the
  GitHub Pages mirror to <https://bootcndev.github.io/bootcn>. Projects whose
  `bootcn.json` still points to the old `tsirosgeorge.github.io` address
  should change it to `https://bootcn.dev`.

- The docs and the registry moved to <https://bootcn.dev>, with a logo and
  icons. The GitHub Pages address stays as a mirror.

### 0.13.0

- Date range picker, Tag group, Toolbar, Listbox and Color picker.
- Calendar 1.1.0: range mode (`data-mode="range"`).
- Docs: "Copy prompt" on every item page.

### 0.12.0

- Number field, Search field, Date and time fields, Meter, Progress circle,
  Link and Scroll shadow.

### 0.11.0

- Blocks: Login with SSO, Verify with a code, Login with image, Sign-up split
  screen, Sidebar with groups, Inset sidebar.
- Template: Analytics dashboard.
- Docs: a live blocks gallery with one tab per category.

### 0.10.0

- Chart component: area, bar (vertical or horizontal), line, donut, radar and
  radial charts as accessible SVG, with a data table for every chart.
- Seven chart blocks and chart color tokens (tokens 2.1.0).

### 0.9.0

- Calendar, Date picker, Data table and Sidebar components.
- Input OTP 1.0.1: selecting the code and typing now replaces it.

### 0.8.0

- Navigation menu, Carousel, Input OTP and Resizable components.

### 0.7.0

- Combobox, Command, Context menu and Menubar components.

### 0.6.0

- 23 components: Alert, Alert dialog, Aspect ratio, Breadcrumb, Button group,
  Collapsible, Drawer, Empty, Field, Hover card, Input group, Item, Kbd, Label,
  Pagination, Progress, Scroll area, Sheet, Slider, Table, Toggle, Toggle
  group and Typography.

### 0.5.0

- Marketing blocks: Hero section, Feature grid, Pricing table, Testimonials
  and Call to action.

### 0.4.0

- A Tailwind-like look on Bootstrap: tokens 2.0.0 redefine Bootstrap's own
  variables with a zinc palette; every component was restyled.

### 0.3.0

- Eleven blocks (authentication, dashboard, navigation) and the Admin
  dashboard template.

### 0.2.0

- The first public registry: 20 components and the design tokens.

## CLI

### 0.8.1

- `add` in React and Vue projects lists the npm packages a component
  imports, such as `bootstrap` and `@popperjs/core` for the Dropdown.
- The MCP server tells assistants which items have React and Vue
  components.

### 0.8.0

- React and Vue projects: `init` recognises them from `package.json` and
  puts everything under `src/`; `add` copies each item's `.tsx` or `.vue`
  component with its CSS and JavaScript, skips the HTML snippet, and says
  when an item has no component for your framework yet.

### 0.7.0

- `init` asks a few questions: which Bootstrap version to set up for
  (5.3, or 6 as a preview while Bootstrap 6 is in alpha), which style
  (Default or Soft) and whether the default folders suit you. Answer them
  in scripts with `--bootstrap` and `--style`.
- `init` finds Bootstrap's version in `node_modules`, `vendor`,
  `package.json`, `composer.json` or a CDN link, and warns about versions
  older than 5.3.
- Choosing Soft installs `soft.css` with the design tokens.
- `bootcn.json` accepts `"bootstrap": "6.0"`; `add` reminds you that items
  are tested with 5.3 in such projects.
- `init` ends with the next steps and the agent skill for AI assistants.

### 0.6.1

- The macOS executables are signed. Those of 0.6.0 were built on Linux
  without a signature, and macOS on Apple silicon refused to run them; the
  npm package and the Linux and Windows executables were not affected.

### 0.6.0

- Standalone executables for Linux, macOS and Windows (x64 and arm64) on
  every release: the same CLI with no Node.js needed.
- `curl -fsSL https://bootcn.dev/install.sh | sh` installs it on macOS and
  Linux after checking its SHA-256.
- Composer package `bootcndev/bootcn`: `composer require --dev
bootcndev/bootcn`, then `vendor/bin/bootcn`, for PHP and Laravel projects.
  See [Installation](./guide/installation#without-node-js).

### 0.5.0

- `bootcn mcp`: a Model Context Protocol server on stdio with `list_items`,
  `search_items`, `get_item`, `add_items` and `get_project_config`, for
  Claude, Cursor, VS Code and other assistants. Guide:
  [AI assistants (MCP)](./guide/mcp).

### 0.4.0

- Laravel: `init` recognizes a Laravel project and sets `"framework":
"laravel"`. Components and templates are written as Blade views under
  `resources/views` (Blade syntax in the markup is escaped), CSS and
  JavaScript under `public/vendor/bootcn`, and templates link them with
  `asset()`. `add` prints Blade usage (`<x-ui.dialog />`) and a route for
  templates. Guide: [Laravel](./guide/laravel).

### 0.3.0

- The default registry is now `https://bootcn.dev`. Projects whose
  `bootcn.json` points to `https://bootcndev.github.io/bootcn` keep working:
  that address stays as a mirror.

### 0.2.0

::: v-pre

- Installs templates: the `registry:page` file type, `paths.pages`, and
  `{{bootcn:css}}`-style placeholders replaced with paths relative to the page.

:::

### 0.1.1

- First release through the npm trusted-publishing workflow, with provenance.

### 0.1.0

- `init`, `add`, `list`, `info` and `diff`.
