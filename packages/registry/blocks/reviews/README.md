# Reviews

Customer reviews: the average with a bar per star that filters the list, sorting, helpful votes, replies from your team, and a "Write a review" dialog with a star rating and checks that updates the numbers.

## Usage

A `<section data-bootcn-reviews>` with:

- the summary: `[data-reviews-average]`, the stars (`rating` component),
  `[data-reviews-total]` and one `[data-reviews-filter="5"…"1"]` bar per
  star with its `[data-reviews-count]`;
- a sort select (`[data-reviews-sort]`: `recent`, `helpful`, `high`,
  `low`) and the list of reviews, each `<li class="bootcn-reviews__item"
data-rating data-date data-helpful>` holding an `<article>`;
- a `<dialog data-reviews-dialog>` with the form, and a `<template
data-reviews-template>` for new reviews.

**Filtering**: a bar shows only that rating; press it again for all.
**Votes**: "Helpful?" yes/no are toggle buttons with counts, one at a time.
**Writing**: the form checks for a rating, at least 20 characters and a
name, then sends `bootcn:reviews:submit` (`detail: { rating, title, text,
name }`). Cancel it to post to your server first, then call
`Bootcn.reviews.add(root, review)`. Otherwise the review appears at the top
and the average, total and bars update.

Events: `bootcn:reviews:filter`, `bootcn:reviews:vote` and
`bootcn:reviews:submit`. `Bootcn.reviews.filter(root, 5 | null)`,
`sort(root, 'helpful')`, `add(root, review)`, `open(root)`.

## Accessibility

- The average is read as "Rated 4.6 out of 5"; each review's stars too.
- Rating bars are toggle buttons named "5 stars"; the number shown is a
  live region ("Showing 2 reviews").
- Vote buttons say "Yes, helpful" and "Not helpful" with their counts.
- The form is a modal `<dialog>`; errors sit under their fields, the
  first wrong field takes focus, and "Thanks, your review was added." is
  announced while focus moves to the new review. Texts are in
  `window.Bootcn.messages` (`reviews.*`).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button`, `avatar`, `rating`, `input`, `textarea` and `select` components.
