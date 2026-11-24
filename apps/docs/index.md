---
layout: page
sidebar: false
title: Bootcn
titleTemplate: Copy-paste components for Bootstrap
---

<main class="bootcn-home">

<div class="bootcn-home__hero">
  <a class="bootcn-home__pill" href="./templates/admin-dashboard">New: blocks and an admin dashboard template →</a>
  <h1>Beautiful Bootstrap interfaces, in plain HTML</h1>
  <p class="bootcn-home__lead">
    Accessible components, blocks and page templates with a clean, Tailwind-like
    look, written in Bootstrap and vanilla JavaScript. Copy them into your
    project or let the CLI do it. The code is yours to change.
  </p>
  <div class="bootcn-home__actions">
    <a class="bootcn-home__button bootcn-home__button--primary" href="./guide/introduction">Get started</a>
    <a class="bootcn-home__button" href="./components/">Browse components</a>
  </div>
  <code class="bootcn-home__install">npx bootcn init</code>
</div>

<div class="bootcn-home__showcase">
  <ComponentPreview
    name="admin-dashboard"
    title="Admin dashboard template"
    src="previews/templates/admin-dashboard/admin-dashboard.html"
    fixed
    bare
  />
  <p class="bootcn-home__caption">
    The <a href="./templates/admin-dashboard">admin dashboard template</a>, built from Bootcn blocks.
    It follows the site's light or dark theme.
  </p>
</div>

<div class="bootcn-home__features">
  <section>
    <h2>Your code, not a dependency</h2>
    <p>The CLI copies source files into your project. Edit them freely; there is no package to update at runtime.</p>
  </section>
  <section>
    <h2>Bootstrap underneath</h2>
    <p>Bootstrap 5.3 classes, plugins and variables, with a neutral palette, crisp borders and soft shadows on top.</p>
  </section>
  <section>
    <h2>Plain HTML and PHP</h2>
    <p>Made for server-rendered sites. Include the markup from PHP or paste it into HTML; no bundler required.</p>
  </section>
  <section>
    <h2>Accessible and tested</h2>
    <p>Keyboard and screen-reader behaviour, contrast in light and dark mode and responsive layout are tested in three browsers.</p>
  </section>
</div>

</main>
