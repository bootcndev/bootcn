# Carousel

A slideshow of cards with previous and next buttons, built on Bootstrap Carousel, without autoplay.

## Usage

Put any content in each `.carousel-item`. The carousel does not move on its
own (no `data-bs-ride`): moving content is hard to read and to use. If you add
autoplay, add a visible pause button too (WCAG 2.2.2). Buttons sit outside
the slides; keep a margin around the carousel for them.

## Accessibility

- A labelled `<section>` with `aria-roledescription="carousel"`; each slide is
  a group named "n of 5", so screen readers say where they are.
- The slides region is a polite live region: the new slide is announced
  after Previous or Next.
- Buttons have names ("Previous slide", "Next slide").

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
