# Changelog

Two things are versioned: the **registry** (components, blocks, templates;
each published version stays available under `/v/<version>/`) and the **CLI**
(`bootcn` on npm). Item versions are in each item's page and manifest.

## Registry

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

### 0.3.0

- The default registry is now `https://bootcn.dev`. Projects whose
  `bootcn.json` points to `https://tsirosgeorge.github.io/bootcn` keep working:
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
