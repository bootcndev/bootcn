# Blog list

A blog index: a featured post across the row, a grid of post cards with covers, topics, reading time and authors, topic filters with a live count, and a link to older posts.

## Usage

A `<section data-bootcn-blog>` with a header, topic filters and a
`.bootcn-blog__grid` of posts. Each post is an `<li class="bootcn-blog__post"
data-category="…">` holding an `<article class="bootcn-blog__card">`: a
cover, the topic and reading time, the title link, an excerpt and the
author with a `<time datetime>`.

- The first card with `.bootcn-blog__card--featured` spans the row, with
  the picture beside the text from 768px.
- Covers are gradients from `--bootcn-blog-cover`; put an `<img alt="">`
  inside `.bootcn-blog__cover` for a photo.
- The title link stretches over the whole card, so the card is one click
  target and one Tab stop.
- Filters are toggle buttons (`aria-pressed`) with `data-blog-filter`
  matching `data-category`; `all` shows everything. The script hides the
  others, shows `.bootcn-blog__empty` when none match, announces the count
  and sends `bootcn:blog:filter` (`detail: { topic, shown }`). With many
  posts, make the filters links to `?topic=…` and filter on the server
  instead. `Bootcn.blog.filter(root, topic)`.

## Accessibility

- Posts are a list of articles, each named by its title heading.
- The filters are a named group of toggle buttons; the number of posts
  shown is announced ("3 posts", `blog.posts` and `blog.post` in
  `window.Bootcn.messages`).
- Covers are decorative; dates are machine-readable.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button`, `badge` and `avatar` components.
