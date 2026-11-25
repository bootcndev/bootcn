# Marquee

A strip of logos or quotes that scrolls on its own, pauses on hover, focus or its button, and stands still under reduced motion.

## Usage

Use it for logos, short quotes or announcements, never for content people
must read in full. Keep links out of the copied group (or give them
`tabindex="-1"`), so keyboard users meet each link once.

## JavaScript API

- `data-bootcn-marquee` on the region, a `.bootcn-marquee__viewport` with
  the items twice: the second `.bootcn-marquee__group` is a copy with
  `aria-hidden="true"` that makes the loop seamless. The pause button has
  `data-bootcn-marquee-pause`.
- The button toggles `aria-pressed` and the `is-paused` class; events
  `bootcn:marquee:pause` and `bootcn:marquee:play`.
- Speed: `--bootcn-marquee-duration` (30s); gap: `--bootcn-marquee-gap`;
  direction: `bootcn-marquee--reverse`.
- `Bootcn.marquee.init()` / `destroy()`.

## Accessibility

- Moving content can be stopped (WCAG 2.2.2): it pauses on hover and on
  keyboard focus, and the Pause button stops it for good.
- The copy that makes the loop is hidden from screen readers, so each item is
  read once.
- With `prefers-reduced-motion` it stands still and the items wrap.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
