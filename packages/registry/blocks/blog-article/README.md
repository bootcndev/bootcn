# Blog article

A blog post page: breadcrumb, title, lead and author, a cover, readable long-form text, a sticky "On this page" that follows your reading, share buttons, a reading progress bar, tags, an author bio and related posts.

## Usage

An `<article data-bootcn-article>` with:

- a header: breadcrumb, the `<h1>`, a lead and the byline (author, role,
  `<time datetime>`, reading time);
- a cover (`--bootcn-blog-cover`, or an `<img>` inside);
- `.bootcn-article__body.bootcn-typography` for the text, with an `id` on
  each `<h2>`;
- `.bootcn-article__aside`: "On this page" links to those ids and share
  buttons. It is sticky beside the text from 992px and comes first on
  phones;
- a footer with tags and the author's bio;

and after it a "Keep reading" section of `blog-list` cards.

The script marks the section you are reading in "On this page"
(`aria-current="true"`), fills the reading progress bar at the top of the
window (`.bootcn-article-progress`), points the share links at the page,
and copies the link with "Copy link". Set `--bootcn-article-top` to the
height of a sticky site header so headings land below it.
`Bootcn.article.setup(root)`, `init()` / `destroy()`.

## Accessibility

- One `<h1>`, sections as `<h2>`, a breadcrumb, and a named "On this page"
  navigation; the current section is `aria-current`.
- Share links say they open in a new tab; "Link copied" is announced
  (`article.copied`, `article.copyFailed`, `article.copy` in
  `window.Bootcn.messages`).
- The progress bar and cover are decorative. Text stays at a readable
  measure (about 70 characters) with 1.75 line height.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button`, `badge`, `avatar` and `typography` components and the `blog-list` block (its cards).
