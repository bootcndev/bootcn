# Changelog

Two things are versioned: the **registry** (components, blocks, templates;
each published version stays available under `/v/<version>/`) and the **CLI**
(`bootcn` on npm). Item versions are in each item's page and manifest.

## Registry

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
