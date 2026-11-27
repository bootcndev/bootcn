# Recent purchase

A small notice in a corner when someone buys from your shop ("Lena in Berlin bought Linen shirt, 2 minutes ago"), fed with real orders from your server, one at a time and easy to switch off.

## Usage

Put the `<div data-bootcn-purchase>` once in the page (it holds a
`<template>` for each notice) and give it real purchases:

- `data-feed-url="/api/recent-purchases"`: a JSON array of the latest
  purchases, newest first, polled every `data-interval` seconds (30).
- Or from your code: `Bootcn.purchases.show(root, { id, name, place,
product, href, image, time })`, for example from Server-Sent Events.

Each notice shows for `data-duration` milliseconds (6000), then the next
after `data-gap` (1500). Repeated `id`s are skipped. Hovering or focusing a
notice keeps it on screen. The × hides the notices for the rest of the
visit (`sessionStorage`). Events: `bootcn:purchase:show`, `off`.

**Show only real purchases.** Invented "someone just bought" messages
mislead customers and are against consumer-protection rules in many
countries. Ask buyers before you show their first name and city, or show
the city only.

## Accessibility

- The notices are read politely by screen readers (an `aria-live` region)
  and never take focus.
- The close button is named "Hide purchase notifications"; text from your
  data is set as text, never HTML. Texts are in `window.Bootcn.messages`
  (`purchase.*`).
- Under `prefers-reduced-motion: reduce` notices appear without sliding.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
