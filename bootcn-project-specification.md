# Bootstrap Copy-Paste UI Ecosystem

## Product Requirements, Technical Architecture & MVP Roadmap

**Working title:** Bootcn (provisional; subject to name, domain, npm,
GitHub, and trademark checks)\
**Product category:** Open-source Bootstrap component ecosystem\
**Initial framework target:** Bootstrap 5.3+\
**Component runtime:** Vanilla JavaScript\
**Primary distribution model:** Copy-paste source files installed
through a CLI\
**Document status:** Initial product and engineering specification\
**Version:** 1.0\
**Date:** 23 November 2026

------------------------------------------------------------------------

## 1. Executive Summary

The project is an open-source component ecosystem that brings the
copy-and-own developer experience to Bootstrap developers.

Developers browse components, inspect live previews and source code,
then install selected components directly into their own applications.
The installed HTML, CSS, and JavaScript belong to the developer and can
be modified without depending on a hosted component runtime.

The ecosystem will include:

-   Individual UI components.
-   Larger reusable UI blocks.
-   Complete page and application templates.
-   A command-line interface (CLI).
-   A versioned component registry.
-   Documentation with live previews and copyable source.
-   Theming and design tokens.
-   Contribution and community workflows.

The first release focuses on Bootstrap 5.3+ and framework-agnostic
Vanilla JavaScript. Components should work in plain HTML and native PHP
applications without requiring React, Vue, jQuery, Node.js, or a bundler
at runtime.

Node.js is used to develop and run the CLI and documentation tooling; it
is not a runtime requirement for applications using installed
components.

## 2. Vision and Positioning

### Vision

Make it easy for Bootstrap developers to build polished, modern
interfaces using components they can inspect, install, own, and
customize.

### Positioning statement

A copy-paste component ecosystem for Bootstrap and Vanilla JavaScript.

### Core principles

1.  **Source ownership:** Installed source files live in the user's
    project.
2.  **No framework lock-in:** Core components do not require React, Vue,
    Angular, or jQuery.
3.  **Bootstrap-native:** Use Bootstrap's grid, utilities, variables,
    and conventions where appropriate.
4.  **Modular installation:** Developers install only what they need.
5.  **Customization first:** Avoid opaque abstractions and generated
    code that is difficult to maintain.
6.  **Progressive enhancement:** Basic content and forms should remain
    useful without JavaScript whenever practical.
7.  **Accessibility:** Keyboard behavior, focus management, semantic
    HTML, and accessible names are part of component quality.
8.  **Transparent dependencies:** Every external dependency must be
    documented and justified.

### What the project is not

-   Not a replacement for Bootstrap.
-   Not a new JavaScript framework.
-   Not a hosted component runtime.
-   Not a collection of screenshots or static design examples.
-   Not a requirement to use a specific application architecture or
    bundler.

## 3. Target Users

### Primary users

-   Developers building native PHP applications.
-   Developers using plain HTML, CSS, and JavaScript.
-   Bootstrap users building admin panels and SaaS applications.
-   Freelancers and agencies maintaining existing Bootstrap projects.
-   Developers who want polished UI without adopting a frontend
    framework.

### Secondary users

-   Vue and React developers who want copyable HTML/CSS/JS.
-   Template authors and independent component contributors.
-   Teams standardizing internal Bootstrap interfaces.

### Main user problems

-   Existing Bootstrap component collections often provide complete
    themes or packaged libraries rather than a copy-paste workflow.
-   Developers want more sophisticated components than Bootstrap
    provides out of the box.
-   Developers need source code they can modify without fighting a
    library abstraction.
-   Many modern component ecosystems assume React or Tailwind.
-   Reusing components across PHP and static HTML projects is often
    unnecessarily difficult.

## 4. Product Scope

The ecosystem has five primary areas.

### 4.1 UI Components

Individual components such as buttons, inputs, dialogs, dropdowns, tabs,
notifications, and data tables.

### 4.2 Blocks

Complete, reusable sections assembled from multiple components. Examples
include authentication forms, pricing sections, dashboard panels, and
navigation layouts.

### 4.3 Templates

Complete page or application starting points, such as an admin
dashboard, SaaS starter, or marketing website.

### 4.4 Themes

Design token sets and optional CSS customizations for colors,
typography, radius, shadows, and component appearance.

### 4.5 CLI and Registry

The CLI initializes a project and installs files from a central,
versioned registry. The registry describes component files,
dependencies, metadata, and installation targets.

## 5. Technology Stack

  -----------------------------------------------------------------------
  Area                    Proposed technology     Responsibility
  ----------------------- ----------------------- -----------------------
  UI foundation           Bootstrap 5.3+          Grid, utilities, base
                                                  components, CSS
                                                  variables

  Component behavior      Vanilla JavaScript      Interactive component
                                                  behavior

  Component styles        CSS                     Component-specific
                                                  styling and tokens

  CLI                     Node.js + TypeScript    Project initialization
                                                  and file installation

  CLI arguments           Commander.js            Command parsing

  Registry                JSON manifests + static Component distribution
                          files                   

  Documentation           Vue 3 + Vite            Documentation interface
                                                  and previews

  Code highlighting       Shiki                   Source-code display

  Documentation search    Pagefind                Static site search

  Unit tests              Vitest                  JavaScript and registry
                                                  logic

  Browser tests           Playwright              Component behavior and
                                                  integration

  Accessibility tests     axe-core                Automated accessibility
                                                  checks

  Hosting                 Static hosting/CDN      Documentation and
                                                  registry delivery

  Source control          GitHub                  Repository, issues,
                                                  pull requests, releases

  Package distribution    npm                     CLI distribution
  -----------------------------------------------------------------------

### Stack constraints

-   Do not require a backend API for the initial release.
-   Do not require a database for the initial registry.
-   Do not require a frontend framework to use installed components.
-   Do not bundle Bootstrap into each component.
-   Prefer static registry files delivered through a CDN.
-   Keep documentation and registry content generated from the same
    source of truth.

## 6. High-Level Architecture

``` text
                    BOOTCN PLATFORM
                           |
          +----------------+----------------+
          |                |                |
     Documentation      CLI Client      Registry
      Vue + Vite        Node + TS       JSON + Files
          |                |                |
          +----------------+----------------+
                           |
                    Static CDN / Host
                           |
                    Developer Project
                           |
              +------------+------------+
              |            |            |
             HTML          CSS       Vanilla JS
              |            |            |
              +------------+------------+
                           |
                     Bootstrap 5.3+
```

### Main subsystems

**Documentation application** - Reads component metadata and source
examples. - Renders previews and code tabs. - Displays installation
instructions. - Provides search and category navigation.

**CLI** - Reads project configuration. - Fetches registry metadata and
files. - Resolves component dependencies. - Copies files to configured
targets. - Protects existing user files from accidental overwrites.

**Registry** - Stores component manifests and source files. - Provides
stable versioned URLs. - Describes files, dependencies, categories, and
metadata. - Is validated during CI before publication.

**Component source** - Is the canonical implementation. - Is used by
documentation previews and CLI installation. - Must not be duplicated
into a separate implementation for documentation.

## 7. Monorepo Structure

Use pnpm workspaces for the initial monorepo.

``` text
project/
├── apps/
│   └── docs/
│       ├── public/
│       ├── src/
│       │   ├── components/
│       │   ├── layouts/
│       │   ├── pages/
│       │   ├── composables/
│       │   ├── registry/
│       │   └── styles/
│       ├── index.html
│       └── vite.config.ts
│
├── packages/
│   ├── cli/
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   ├── config/
│   │   │   ├── installer/
│   │   │   ├── registry/
│   │   │   ├── resolver/
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── package.json
│   │
│   └── registry/
│       ├── registry.json
│       ├── schema/
│       ├── components/
│       ├── blocks/
│       ├── templates/
│       ├── themes/
│       └── lib/
│
├── examples/
│   ├── plain-html/
│   ├── native-php/
│   └── vite/
│
├── scripts/
│   ├── validate-registry.ts
│   ├── build-registry.ts
│   └── check-links.ts
│
├── .github/
│   └── workflows/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── LICENSE
└── README.md
```

### Package boundaries

-   `apps/docs`: website only.
-   `packages/cli`: installation tooling only.
-   `packages/registry`: component source, manifests, and schemas.
-   `examples`: real integration fixtures used for testing and
    documentation.
-   `scripts`: validation and build utilities.

The documentation website and CLI must consume the same registry data.
Do not maintain separate component inventories.

## 8. Component Architecture

### 8.1 Component file conventions

A component may contain:

``` text
button/
├── button.html
├── button.css
├── button.js
├── preview.html
└── README.md
```

Not every component needs every file. A static button should not receive
an empty JavaScript file simply to satisfy a convention.

The registry manifest is maintained separately from the files or
generated from validated component metadata.

### 8.2 HTML

-   Use semantic HTML.
-   Prefer Bootstrap classes where they are suitable.
-   Add a `bootcn-` namespace to custom classes.
-   Use documented `data-bootcn-*` attributes for custom behavior.
-   Avoid unnecessary wrapper elements.
-   Include accessible labels and relationships.

Example:

``` html
<button type="button" class="btn btn-primary bootcn-button">
  Save changes
</button>
```

### 8.3 CSS

Use component-specific classes and scoped design tokens.

``` css
:root {
  --bootcn-radius: 0.5rem;
  --bootcn-radius-sm: 0.375rem;
  --bootcn-radius-lg: 0.75rem;
  --bootcn-border: #e5e7eb;
  --bootcn-transition: 150ms ease;
}

.bootcn-button {
  border-radius: var(--bootcn-radius);
  font-weight: 500;
  transition: opacity var(--bootcn-transition);
}
```

Rules:

-   Never globally redefine Bootstrap classes such as `.btn`, `.card`,
    or `.form-control`.
-   Avoid broad selectors such as `button {}` or `input {}` for
    component styling.
-   Keep component CSS independently installable.
-   Document required CSS variables.
-   Support CSS custom-property overrides.
-   Avoid hard-coded colors where a design token is appropriate.
-   Respect `prefers-reduced-motion`.
-   Ensure dark-mode behavior is explicit and tested.

### 8.4 JavaScript

-   Use browser-native APIs.
-   Avoid jQuery.
-   Avoid framework-specific lifecycle assumptions.
-   Use event delegation where it simplifies initialization.
-   Make initialization safe to run more than once.
-   Avoid leaking globals.
-   Clean up event listeners when components are destroyed or removed.
-   Document public methods and events.
-   Handle missing optional dependencies clearly.

A component should not require a global initialization call unless the
component genuinely needs it. If initialization is needed, provide a
predictable API and an example.

### 8.5 Bootstrap integration

Bootstrap 5 already uses Vanilla JavaScript. Reuse Bootstrap's native
plugins when they satisfy the component requirements.

Do not recreate Bootstrap Modal, Tooltip, Collapse, or Dropdown without
a clear reason.

Account for optional dependencies such as Popper where relevant.
Document whether a component requires Bootstrap CSS, Bootstrap
JavaScript, Popper, or another package.

The component ecosystem should not silently load a second Bootstrap
copy.

## 9. Registry Specification

The registry is the central source of truth.

### 9.1 Registry item types

  Type                  Purpose
  --------------------- -------------------------------------
  `registry:ui`         Individual UI component
  `registry:block`      Reusable multi-component section
  `registry:template`   Complete page or application layout
  `registry:theme`      Design tokens and theme styles
  `registry:lib`        Shared helper or utility source

### 9.2 Example manifest

``` json
{
  "$schema": "https://bootcn.dev/schema/registry-item.json",
  "name": "button",
  "type": "registry:ui",
  "title": "Button",
  "description": "A customizable Bootstrap button.",
  "version": "1.0.0",
  "categories": ["buttons", "actions"],
  "dependencies": [],
  "registryDependencies": [],
  "files": [
    {
      "path": "button.html",
      "target": "components/ui/button.html",
      "type": "registry:component"
    },
    {
      "path": "button.css",
      "target": "assets/css/button.css",
      "type": "registry:style"
    }
  ]
}
```

The example URL and schema are placeholders until the final brand and
domain are selected.

### 9.3 Required manifest fields

-   `name`
-   `type`
-   `title`
-   `description`
-   `files`

Recommended optional fields:

-   `version`
-   `categories`
-   `dependencies`
-   `registryDependencies`
-   `compatibility`
-   `accessibility`
-   `author`
-   `license`
-   `examples`
-   `keywords`

### 9.4 Dependency types

Distinguish between:

-   **External dependencies:** npm packages or browser libraries that
    must be installed separately.
-   **Registry dependencies:** Other components or utilities distributed
    by this registry.
-   **Platform requirements:** Bootstrap CSS, Bootstrap JavaScript,
    Popper, or other runtime prerequisites.

Do not treat every requirement as an npm dependency. A plain PHP project
must be able to install and use components without adding a Node
runtime.

### 9.5 Registry validation

CI must validate:

-   Manifest schema.
-   Unique component names.
-   File existence.
-   Valid target paths.
-   Dependency existence.
-   Dependency cycles.
-   Supported registry item types.
-   Valid metadata and version values.
-   No unexpected executable or binary files.
-   No path traversal in source or target paths.

## 10. CLI Specification

The CLI is distributed through npm.

**Proposed package:** `bootcn`\
**Proposed command:** `bootcn`

Package and command names must be checked before publication.

### 10.1 Commands

``` bash
npx bootcn@latest init
npx bootcn@latest add button
npx bootcn@latest add dialog
npx bootcn@latest add data-table
npx bootcn@latest list
npx bootcn@latest info button
npx bootcn@latest diff button
npx bootcn@latest doctor
```

### 10.2 `init`

Responsibilities:

1.  Detect the current project.
2.  Check for an existing `bootcn.json`.
3.  Detect Bootstrap installation or ask the user to confirm it.
4.  Ask for component, CSS, and JavaScript target paths when they cannot
    be inferred safely.
5.  Create the configuration file.
6.  Create required directories.
7.  Optionally install a small foundation stylesheet.

Do not assume every project uses `src/`. Native PHP projects may use
`public/assets/`, while static sites may use `assets/`.

### 10.3 `add`

Responsibilities:

1.  Load `bootcn.json`.
2.  Fetch the requested registry item.
3.  Validate the manifest.
4.  Resolve registry dependencies.
5.  Show external and platform requirements.
6.  Validate every source and target path.
7.  Preview files to be created.
8.  Ask before overwriting existing files.
9.  Copy files into the project.
10. Report installed files and any manual setup steps.

### 10.4 Safe installation requirements

The CLI must:

-   Reject path traversal such as `../`.
-   Restrict writes to configured project paths.
-   Avoid writing outside the project root.
-   Validate registry URLs and expected hosts.
-   Use HTTPS.
-   Avoid executing downloaded component code.
-   Never overwrite user files silently.
-   Offer skip, overwrite, and diff/compare choices.
-   Use atomic writes where practical.
-   Report partial failures clearly.
-   Provide a dry-run mode before the first stable release.

### 10.5 Configuration file

Example `bootcn.json`:

``` json
{
  "$schema": "https://bootcn.dev/schema/config.json",
  "registry": "https://registry.bootcn.dev",
  "style": "default",
  "bootstrap": "5.3",
  "paths": {
    "components": "components/ui",
    "css": "assets/css",
    "js": "assets/js",
    "lib": "assets/js/lib"
  }
}
```

Paths are relative to the project root. The CLI should normalize and
validate them before writing.

### 10.6 Project compatibility

Support these initial project types:

-   Plain HTML.
-   Native PHP.
-   Vite applications.

The installed components must remain usable without Node.js. Vite
support is an optional convenience, not a requirement.

## 11. Documentation Website

The documentation website is the main discovery and onboarding
experience.

### 11.1 Main navigation

``` text
Getting Started
  Introduction
  Installation
  CLI
  Configuration

Components
  Accordion
  Alert
  Avatar
  Badge
  Button
  Card
  Checkbox
  Dialog
  Dropdown
  Input
  Multi-select
  Pagination
  Select
  Switch
  Tabs
  Toast
  Tooltip

Blocks
  Authentication
  Dashboard
  Marketing
  Navigation

Templates
  Admin Dashboard
  SaaS Starter
  Landing Page

Theming
  Colors
  Typography
  Radius
  Dark Mode

Resources
  Changelog
  Contributing
  GitHub
```

### 11.2 Component page requirements

Every component documentation page should provide:

1.  Component title.
2.  Short description.
3.  Live preview.
4.  Interactive configuration controls where useful.
5.  HTML source.
6.  CSS source.
7.  JavaScript source, when applicable.
8.  CLI installation command.
9.  Manual installation instructions.
10. Usage examples.
11. Dependency requirements.
12. Accessibility notes.
13. Relevant API and event documentation.

### 11.3 Preview architecture

Previews must use the same component source distributed by the registry.

For interactive previews, use isolated preview containers or sandboxed
frames where appropriate. Avoid allowing component CSS or JavaScript to
interfere with the documentation application.

### 11.4 Documentation quality

-   Responsive layout.
-   Light and dark themes.
-   Searchable navigation.
-   Copy-to-clipboard code blocks.
-   Clear active navigation state.
-   Accessible keyboard navigation.
-   Working examples rather than decorative screenshots.
-   Version and compatibility information.
-   Direct links to source files and GitHub issues.

## 12. Initial Component Catalogue

The first public release should prioritize quality over quantity.

### Foundation

-   Button
-   Badge
-   Card
-   Separator
-   Avatar
-   Skeleton
-   Spinner

### Forms

-   Input
-   Textarea
-   Checkbox
-   Radio group
-   Switch
-   Select
-   Multi-select
-   Date picker

### Navigation and overlays

-   Dialog
-   Dropdown
-   Popover
-   Tooltip
-   Tabs
-   Accordion
-   Toast

### Advanced

-   Data table
-   File upload
-   Command palette
-   Pagination
-   Empty state
-   Breadcrumb

A practical initial target is 20--25 polished components. The final list
should be adjusted based on testing and available development time.

### Component acceptance criteria

A component is not considered complete until it has:

-   Valid semantic HTML.
-   Responsive behavior.
-   Documented CSS.
-   Working JavaScript, if required.
-   Keyboard support.
-   Accessible names and states.
-   Dependency documentation.
-   A live documentation preview.
-   CLI installation support.
-   A working plain HTML integration example.
-   Automated tests appropriate to its complexity.

## 13. Blocks and Templates

Blocks and templates are important for adoption and future monetization.

### Initial block categories

**Authentication** - Login form. - Registration form. - Forgot
password. - Two-column authentication layout.

**Dashboard** - Sidebar navigation. - Dashboard metric cards. - Activity
feed. - Recent transactions. - Data table section.

**Marketing** - Hero section. - Feature grid. - Pricing section. -
Testimonials. - Call to action.

**Navigation** - Responsive navbar. - Sidebar. - Breadcrumb
navigation. - User account menu.

### Initial template

Build one complete admin dashboard template containing:

-   Responsive sidebar.
-   Top navigation.
-   Metric cards.
-   Charts area.
-   Recent activity.
-   Data table.
-   User menu.
-   Light and dark theme support.

Templates should be useful starting points, not rigid products that
developers cannot modify.

## 14. Design System and Theming

The ecosystem should have a coherent default visual style without
requiring developers to adopt it everywhere.

### Design token categories

-   Colors.
-   Typography.
-   Border radius.
-   Borders.
-   Shadows.
-   Spacing additions, where necessary.
-   Motion and transitions.
-   Focus rings.
-   Component-specific dimensions.

### Theming rules

-   Use CSS custom properties.
-   Keep Bootstrap defaults intact unless an explicit theme is
    installed.
-   Provide a default theme.
-   Provide a dark theme.
-   Document how to override tokens.
-   Test contrast ratios.
-   Respect system color-scheme preferences where appropriate.
-   Avoid forcing a global font family or global body styling through
    individual components.

## 15. Quality Assurance and Testing

### Automated testing

  Tool              Use
  ----------------- -----------------------------------
  Vitest            Unit tests and registry utilities
  Playwright        Browser and integration tests
  axe-core          Accessibility checks
  HTML validation   Markup correctness
  TypeScript        CLI and tooling type safety

### Integration fixtures

Maintain at least three example applications:

1.  Plain HTML.
2.  Native PHP.
3.  Vite.

Use these fixtures to verify that installed components work in realistic
environments.

### Browser coverage

Test current stable versions of:

-   Chrome.
-   Firefox.
-   Safari.
-   Edge.

### Accessibility expectations

-   Semantic HTML.
-   Keyboard navigation.
-   Visible focus indicators.
-   Correct ARIA usage.
-   Dialog focus trapping and restoration.
-   Escape-key behavior where appropriate.
-   Screen-reader labels and announcements.
-   Reduced-motion support.
-   Sufficient contrast.

Automated accessibility checks are useful but do not replace manual
keyboard and assistive-technology testing.

## 16. Security and Supply Chain

The registry and CLI distribute executable browser code. Treat the
registry as a software supply-chain surface.

Requirements:

-   HTTPS-only registry access.
-   Strict schema validation.
-   Safe path normalization.
-   No arbitrary shell execution from registry metadata.
-   No automatic execution of downloaded JavaScript.
-   Review and pin external dependencies.
-   Validate registry files in CI.
-   Use lockfiles for development dependencies.
-   Publish CLI releases through a controlled release workflow.
-   Document the source and license of every third-party asset.
-   Provide a security reporting process.

The CLI should display the files it intends to install and make clear
that installed JavaScript will run in the developer's application.

## 17. Licensing and Contributions

### Suggested licensing

-   Core component source: MIT.
-   CLI: MIT.
-   Registry schema and tooling: MIT.
-   Documentation source: MIT.
-   Premium templates or assets: separate commercial license, if
    introduced.

Confirm that all contributed code, fonts, icons, illustrations, and
other assets can legally be distributed under the selected license.

### Contribution workflow

1.  Contributor opens an issue or discussion.
2.  Contributor submits a component or improvement.
3.  CI validates manifests and file structure.
4.  Maintainers review accessibility and visual quality.
5.  Integration examples and tests are checked.
6.  Approved changes are merged.
7.  Registry and documentation are published.

Provide contribution templates, coding conventions, component
guidelines, and a code of conduct.

## 18. Versioning and Release Strategy

Keep these version concepts separate:

-   CLI version.
-   Registry release version.
-   Individual component version.
-   Documentation version.

The CLI should support a stable registry channel and a latest channel.

A developer should be able to choose which registry release to use and
should not receive unexpected component changes simply because the CLI
was updated.

Because components are copied into the user's project, updates should be
explicit. The CLI can offer a diff command to compare the installed
files with a newer registry version.

Do not promise automatic safe merging of customized component files.
Preserve developer ownership.

## 19. MVP Roadmap

Target: approximately eight weeks for one developer working
consistently. This is an estimate, not a guaranteed delivery schedule.

### Week 1 --- Foundation

-   Create the GitHub monorepo.
-   Configure pnpm workspaces.
-   Set up TypeScript.
-   Define naming and file conventions.
-   Define design tokens.
-   Define registry schema.
-   Build the first five components.

**Deliverable:** Working repository and component conventions.

### Week 2 --- Component library

-   Complete the first 20--25 components.
-   Implement interactive behavior.
-   Add responsive examples.
-   Add keyboard support.
-   Add accessibility checks.
-   Create component documentation metadata.

**Deliverable:** Initial component catalogue.

### Week 3 --- CLI

-   Build `init`.
-   Build `add`.
-   Implement registry downloads.
-   Implement dependency resolution.
-   Detect existing files.
-   Add safe overwrite handling.
-   Test plain HTML and PHP projects.

**Deliverable:** CLI installs real components into local projects.

### Week 4 --- Registry

-   Publish registry manifests.
-   Add schema validation.
-   Add version metadata.
-   Configure static CDN hosting.
-   Add CI validation.
-   Test dependency and path safety.

**Deliverable:** Versioned registry consumed by the CLI.

### Weeks 5--6 --- Documentation

-   Build documentation layout.
-   Add navigation and search.
-   Create live component previews.
-   Add HTML/CSS/JS source tabs.
-   Add installation commands.
-   Add light and dark themes.
-   Add accessibility and dependency notes.

**Deliverable:** Public documentation website.

### Week 7 --- Blocks and templates

-   Build authentication blocks.
-   Build dashboard blocks.
-   Build navigation blocks.
-   Create one complete admin template.
-   Test all examples.

**Deliverable:** First blocks and template collection.

### Week 8 --- Release preparation

-   Test CLI on clean environments.
-   Verify package metadata and licenses.
-   Write contribution guidelines.
-   Configure GitHub Actions.
-   Publish npm package.
-   Publish documentation.
-   Announce the open-source release.

**Deliverable:** Public MVP release.

## 20. MVP Release Checklist

### Repository and tooling

-   [ ] GitHub monorepo.
-   [ ] pnpm workspace.
-   [ ] TypeScript configuration.
-   [ ] CI workflows.
-   [ ] License and README.

### Components

-   [ ] 20--25 components.
-   [ ] Component CSS conventions.
-   [ ] Vanilla JavaScript conventions.
-   [ ] Accessibility review.
-   [ ] Browser testing.

### Registry

-   [ ] Registry schema.
-   [ ] Component manifests.
-   [ ] Dependency resolution.
-   [ ] Version metadata.
-   [ ] Static hosting.
-   [ ] Registry validation.

### CLI

-   [ ] `init` command.
-   [ ] `add` command.
-   [ ] `list` command.
-   [ ] `info` command.
-   [ ] Safe file writing.
-   [ ] Overwrite protection.
-   [ ] HTML and PHP compatibility.

### Documentation

-   [ ] Getting Started.
-   [ ] Installation guide.
-   [ ] Component pages.
-   [ ] Live previews.
-   [ ] Code tabs.
-   [ ] Search.
-   [ ] Dark mode.
-   [ ] Contribution guide.

### Ecosystem

-   [ ] Authentication blocks.
-   [ ] Dashboard blocks.
-   [ ] One admin template.
-   [ ] Plain HTML example.
-   [ ] Native PHP example.
-   [ ] Vite example.

## 21. Monetization Strategy

The core library should remain free and open source. Monetization should
focus on higher-value assets and services.

### Free

-   Core components.
-   CLI. 
-   Public registry.
-   Documentation.
-   Community contributions.
-   Basic blocks.

### Potential paid products

  Product                       Indicative price
  --------------------------- ------------------
  Premium block collection               €19--49
  Premium templates                      €39--99
  Commercial UI bundle                  €99--149
  Lifetime developer bundle            €149--249

These are hypotheses to validate with actual users, not established
market prices.

### Possible future revenue streams

-   Premium dashboard templates.
-   Industry-specific component packs.
-   Commercial licenses or support, if demand justifies them.
-   Team-oriented component collections.
-   Sponsored community content, with clear disclosure.

Do not add subscriptions or accounts before there is a clear user need.

## 22. Growth Strategy

### Phase 1: Developer adoption

-   Publish the core library on GitHub.
-   Publish the CLI on npm.
-   Create clear installation videos and examples.
-   Share useful components with Bootstrap communities.
-   Write technical articles comparing copy-paste workflows with
    traditional component packages.

### Phase 2: Community

-   Accept component contributions.
-   Publish community blocks.
-   Add component requests and voting.
-   Maintain clear quality and accessibility standards.

### Phase 3: Commercial ecosystem

-   Release premium blocks and templates.
-   Build a curated marketplace.
-   Introduce creator attribution and licensing.
-   Consider team workflows only when there is demonstrated demand.

### Metrics to monitor

-   npm weekly downloads.
-   GitHub stars and contributors.
-   Documentation traffic.
-   Component installation counts, if measured responsibly.
-   Most-used components.
-   CLI initialization success rate.
-   Issues and support requests.
-   Premium product conversion, once commercial products exist.

## 23. Risks and Mitigations

  -----------------------------------------------------------------------
  Risk                                Mitigation
  ----------------------------------- -----------------------------------
  Components look like ordinary       Focus on polished design and
  Bootstrap                           advanced interactions

  Too many components before quality  Release a smaller, tested catalogue
  is established                      

  CSS conflicts with host projects    Namespace custom classes and avoid
                                      global overrides

  Registry becomes difficult to       Validate all manifests and
  maintain                            dependencies in CI

  CLI overwrites user customizations  Require explicit overwrite
                                      decisions and provide diffs

  Framework compatibility becomes too Guarantee plain HTML and PHP first;
  broad                               document other environments

  Scope expands too early             Defer accounts, marketplace, and
                                      backend services

  Brand name conflicts with existing  Complete domain, package,
  projects                            repository, and trademark checks
                                      before launch
  -----------------------------------------------------------------------

## 24. Naming, Brand, and Domain

### Selected working brand

- **Product name:** Bootcn
- **Primary domain:** `bootcn.dev`
- **Tagline:** Build better with Bootstrap.
- **CLI command:** `bootcn`
- **npm package:** `bootcn` (availability must be checked before publishing)
- **Documentation:** `https://bootcn.dev/docs`
- **Registry:** `https://registry.bootcn.dev`
- **GitHub organization/repository:** `github.com/bootcn` (availability must be checked)

The name combines the Bootstrap association with the concise, developer-oriented naming style of modern UI tooling. The brand should be presented as an independent, community-oriented ecosystem—not as an official Bootstrap project.

### Brand positioning

**Short description**

Bootcn is a copy-and-paste UI ecosystem for Bootstrap. Developers can discover polished components, inspect the implementation, install source files into their own projects, and customize the code without being locked into a component runtime.

**Core message**

Copy. Customize. Own your UI.

**Brand voice**

- Direct and developer-focused.
- Practical rather than marketing-heavy.
- Clear about dependencies and compatibility.
- Open-source-first.
- Confident without implying official affiliation with Bootstrap.

### Pre-launch name validation

The name and domain are selected as the project's working brand, but selection is not the same as legal or platform clearance. Before public launch:

1. Confirm domain registration, renewal pricing, transfer rules, and ownership for `bootcn.dev`.
2. Check whether the `bootcn` npm package name and CLI command are available.
3. Check GitHub organization and repository availability.
4. Review existing projects and repositories with similar names, including any Bootcn-related projects, for confusion and naming conflicts.
5. Search WIPO and EUIPO trademark databases and obtain professional advice if the project is going to be commercialized.
6. Check social handles if they will be used.
7. Avoid using Bootstrap's official logo or implying endorsement by Bootstrap maintainers.
8. Avoid copying other projects' branding, assets, or documentation. The product may describe its workflow as inspired by the copy-and-paste model, but it must have its own visual identity and implementation.

Do not announce package installation commands as live until the npm package has actually been published.

## 25. Immediate Next Steps

The first engineering milestone should be deliberately small.

1.  Select and validate the final project name.
2.  Create the GitHub repository.
3.  Configure the monorepo.
4.  Write the registry JSON schema.
5.  Define the component file conventions.
6.  Build Button, Input, Card, Badge, and Dialog.
7.  Create a plain HTML example and a native PHP example.
8.  Build the first working `init` and `add` CLI commands.

### Definition of the first technical milestone

A developer should be able to enter:

``` bash
npx <cli-package>@latest init
npx <cli-package>@latest add button
npx <cli-package>@latest add dialog
```

The CLI should install editable HTML, CSS, and JavaScript files into a
plain PHP application, without requiring a frontend framework or Node.js
at runtime.

Once that workflow is reliable, build out the remaining components and
documentation.

------------------------------------------------------------------------

## 26. Final Product Definition

This project succeeds when a Bootstrap developer can discover a polished
component, understand its dependencies, preview its behavior, install it
with one command, and then freely own and customize the resulting source
code.

The product is not simply a Bootstrap component gallery.

It is a complete distribution and development ecosystem built around the
idea of **copy, customize, and own your UI**.
