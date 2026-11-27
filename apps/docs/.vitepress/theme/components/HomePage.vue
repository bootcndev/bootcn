<script setup lang="ts">
/**
 * The Bootcn landing page: hero with the install command, a live showcase of
 * the templates, a few live components, how it works, features and a call to
 * action. Counts come from the built registry (home.data.ts).
 */
import { ref } from 'vue';
import { withBase } from 'vitepress';

import { data } from '../../../home.data';

const BOOTSTRAP = 'https://getbootstrap.com/';
const GITHUB = 'https://github.com/bootcndev/bootcn';
const command = 'npx bootcn@latest init';
const copied = ref(false);

async function copy(): Promise<void> {
  try {
    await navigator.clipboard.writeText(command);
    copied.value = true;
    setTimeout(() => (copied.value = false), 2000);
  } catch {
    copied.value = false;
  }
}

const showcase = [
  { label: 'Admin dashboard', name: 'admin-dashboard' },
  { label: 'Analytics', name: 'analytics-dashboard' },
  { label: 'Landing page', name: 'landing-page' },
  { label: 'Settings', name: 'settings-page' },
  { label: 'SaaS', name: 'saas' },
];

// Newest first: live previews in two staggered columns (each card as tall
// as its component), then links to the rest of the recent work.
const latest = [
  [
    {
      name: 'aurora',
      kind: 'components',
      title: 'Aurora background',
      text: 'Soft, slowly drifting light behind a hero, in your colours, with no JavaScript.',
    },
    {
      name: 'event-calendar',
      kind: 'blocks',
      title: 'Event calendar',
      text: 'Month, week and day views, colour-coded calendars, overlaps side by side, add and edit.',
    },
  ],
  [
    {
      name: 'glow-card',
      kind: 'components',
      title: 'Glow card',
      text: 'A light that follows the pointer and lights up the border.',
    },
    {
      name: 'number-ticker',
      kind: 'components',
      title: 'Number ticker',
      text: 'Numbers that count up as they scroll into view, read once by screen readers.',
    },
  ],
];

const alsoNew = [
  { text: 'React components (13)', href: '/guide/react' },
  { text: 'Vue components (13)', href: '/guide/vue' },
  { text: 'Border beam', href: '/components/border-beam' },
  { text: 'Gradient text', href: '/components/gradient-text' },
  { text: 'Scroll reveal', href: '/components/scroll-reveal' },
  { text: 'Recent purchase', href: '/components/recent-purchase' },
  { text: 'Floating tab bar', href: '/components/tab-bar' },
  { text: 'Colour palette', href: '/themes/#colour-palette' },
  { text: 'Chat', href: '/blocks/chat' },
  { text: 'Email inbox', href: '/blocks/email-inbox' },
];

const live = [
  { name: 'calendar', title: 'Calendar', text: 'Keyboard grid, ranges, localized.' },
  { name: 'color-area', title: 'Color area', text: '2D picker with hue and hex.' },
  { name: 'autocomplete', title: 'Autocomplete', text: 'Suggestions from the page or a URL.' },
];

const steps = [
  {
    title: 'Set up',
    text: 'The CLI checks that the page loads Bootstrap and asks where files go.',
    code: 'npx bootcn@latest init',
  },
  {
    title: 'Add what you need',
    text: 'Components, blocks or whole pages, with everything they depend on.',
    code: 'npx bootcn add dialog data-table',
  },
  {
    title: 'Own the code',
    text: 'Plain HTML, CSS and JavaScript in your project, or Blade views in Laravel. Include it and edit it.',
    code: "<?php include 'components/ui/dialog.html'; ?>",
  },
];

const features = [
  {
    title: 'Your code, not a dependency',
    text: 'Source files land in your project. Change anything; nothing updates behind your back.',
  },
  {
    title: 'Plain HTML, PHP and Laravel',
    text: 'Made for server-rendered sites. In Laravel the CLI writes Blade views; no React, no bundler, no Node.js at runtime.',
  },
  {
    title: 'Accessible and tested',
    text: 'WAI-ARIA patterns, 4.5:1 contrast in both themes, axe and keyboard tests in three browsers.',
  },
  {
    title: 'Dark mode and right to left',
    text: "Bootstrap's color modes and RTL stylesheet, with logical properties and mirrored icons.",
  },
  {
    title: 'Themes in a minute',
    text: 'Pick a style, a base, a primary color and a radius; copy the CSS.',
  },
  {
    title: 'Ready for AI assistants',
    text: 'An MCP server for Claude, Cursor and VS Code, llms.txt and a "Copy prompt" button on every page.',
  },
];
</script>

<template>
  <main class="bootcn-landing">
    <section class="bootcn-landing__hero" aria-labelledby="bootcn-landing-title">
      <img
        class="bootcn-landing__logo bootcn-landing__logo--light"
        :src="withBase('/logo-light.png')"
        alt=""
        width="64"
        height="64"
      />
      <img
        class="bootcn-landing__logo bootcn-landing__logo--dark"
        :src="withBase('/logo-dark.png')"
        alt=""
        width="64"
        height="64"
      />
      <a class="bootcn-landing__pill" :href="withBase('/changelog')">
        <span class="bootcn-landing__pill-tag">New</span>
        13 React and Vue components: forms, tabs, dialogs and more
        <span aria-hidden="true">→</span>
      </a>
      <h1 id="bootcn-landing-title" class="bootcn-landing__title">
        Build better with <span class="bootcn-landing__accent">Bootstrap.</span>
      </h1>
      <p class="bootcn-landing__lead">
        Accessible components, blocks and page templates for
        <a :href="BOOTSTRAP" target="_blank" rel="noreferrer">Bootstrap</a> 5.3, in plain HTML, CSS
        and vanilla JavaScript, with a clean modern look. Copy them into your project or let the CLI
        do it. The code is yours.
      </p>
      <div class="bootcn-landing__actions">
        <a
          class="bootcn-landing__button bootcn-landing__button--primary"
          :href="withBase('/guide/introduction')"
        >
          Get started
        </a>
        <a class="bootcn-landing__button" :href="withBase('/components/')">Browse components</a>
      </div>
      <div class="bootcn-landing__install">
        <code>{{ command }}</code>
        <button type="button" class="bootcn-landing__copy" @click="copy">
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
        <span class="visually-hidden" role="status">{{ copied ? 'Command copied' : '' }}</span>
      </div>
      <ul class="bootcn-landing__stats" aria-label="What is in the registry">
        <li>
          <strong>{{ data.components }}</strong> components
        </li>
        <li>
          <strong>{{ data.blocks }}</strong> blocks
        </li>
        <li>
          <strong>{{ data.templates }}</strong> templates
        </li>
        <li><strong>3</strong> browsers tested</li>
      </ul>
    </section>

    <section
      class="bootcn-landing__showcase bootcn-home__showcase"
      aria-labelledby="bootcn-landing-showcase"
    >
      <h2 id="bootcn-landing-showcase" class="visually-hidden">Templates</h2>
      <DocsTabs :labels="showcase.map((item) => item.label)" label="Templates">
        <template v-for="(item, index) in showcase" :key="item.name" #[`tab-${index}`]>
          <ComponentPreview
            :name="item.name"
            :title="`${item.label} template`"
            kind="templates"
            :src="`previews/templates/${item.name}/${item.name}.html`"
            fixed
            bare
          />
          <p class="bootcn-landing__caption">
            The
            <a :href="withBase(`/templates/${item.name}`)"
              >{{ item.label.toLowerCase() }} template</a
            >, installed with one command. It follows the site's light or dark theme.
          </p>
        </template>
      </DocsTabs>
    </section>

    <section class="bootcn-landing__section" aria-labelledby="bootcn-landing-new">
      <div class="bootcn-landing__heading">
        <h2 id="bootcn-landing-new">New in Bootcn</h2>
        <p>
          Light, motion and colour for your pages, with no library and calm under reduced motion,
          next to calendars, messaging and mail for your app.
        </p>
      </div>
      <div class="bootcn-landing__new">
        <ul v-for="(column, index) in latest" :key="index" class="bootcn-landing__new-column">
          <li v-for="item in column" :key="item.name" class="bootcn-landing__card">
            <div class="bootcn-landing__card-text">
              <h3>
                <a :href="withBase(`/${item.kind}/${item.name}`)">{{ item.title }}</a><span
                  class="bootcn-landing__badge"
                  >New</span
                >
              </h3>
              <p>{{ item.text }}</p>
            </div>
            <ComponentPreview :name="item.name" :title="item.title" :kind="item.kind" bare />
          </li>
        </ul>
      </div>
      <ul class="bootcn-landing__also" aria-label="Also new">
        <li v-for="link in alsoNew" :key="link.href">
          <a :href="withBase(link.href)">{{ link.text }}</a>
        </li>
      </ul>
    </section>

    <section class="bootcn-landing__section" aria-labelledby="bootcn-landing-live">
      <div class="bootcn-landing__heading">
        <h2 id="bootcn-landing-live">Live, not screenshots</h2>
        <p>
          Every preview on this site is the real component. Try the keyboard: arrow keys, Escape,
          Tab.
        </p>
      </div>
      <ul class="bootcn-landing__live">
        <li v-for="item in live" :key="item.name" class="bootcn-landing__card">
          <ComponentPreview :name="item.name" :title="item.title" bare />
          <div class="bootcn-landing__card-text">
            <h3>
              <a :href="withBase(`/components/${item.name}`)">{{ item.title }}</a>
            </h3>
            <p>{{ item.text }}</p>
          </div>
        </li>
      </ul>
    </section>

    <section class="bootcn-landing__section" aria-labelledby="bootcn-landing-how">
      <div class="bootcn-landing__heading">
        <h2 id="bootcn-landing-how">From zero to a page in three commands</h2>
        <p>No build step and no framework. If your page loads Bootstrap, it can load Bootcn.</p>
      </div>
      <ol class="bootcn-landing__steps">
        <li v-for="(step, index) in steps" :key="step.title" class="bootcn-landing__step">
          <span class="bootcn-landing__step-number" aria-hidden="true">{{ index + 1 }}</span>
          <h3>{{ step.title }}</h3>
          <p>{{ step.text }}</p>
          <code>{{ step.code }}</code>
        </li>
      </ol>
    </section>

    <section class="bootcn-landing__section" aria-labelledby="bootcn-landing-why">
      <div class="bootcn-landing__heading">
        <h2 id="bootcn-landing-why">Why Bootcn</h2>
        <p>
          The copy-paste workflow people love, for the millions of sites built with
          <a :href="BOOTSTRAP" target="_blank" rel="noreferrer">Bootstrap</a>.
        </p>
      </div>
      <ul class="bootcn-landing__features">
        <li v-for="feature in features" :key="feature.title">
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.text }}</p>
        </li>
      </ul>
    </section>

    <section class="bootcn-landing__cta" aria-labelledby="bootcn-landing-cta">
      <h2 id="bootcn-landing-cta">Start with one component, or a whole page</h2>
      <p>Free and open source under the MIT License. Registry {{ data.version }}.</p>
      <div class="bootcn-landing__actions">
        <a
          class="bootcn-landing__button bootcn-landing__button--primary"
          :href="withBase('/guide/installation')"
        >
          Install Bootcn
        </a>
        <a class="bootcn-landing__button" :href="GITHUB" target="_blank" rel="noreferrer">
          Star on GitHub
        </a>
      </div>
    </section>
  </main>
</template>
