# Social actions

Like and follow buttons that keep their counts, compact numbers (12.4K subscribers) and a "Followed by" line with avatars.

## Usage

Send each change to your server from the `bootcn:like` and `bootcn:follow`
events (or a form around the button), and render the starting state and
counts on the server. The buttons update at once and should be put back if
the request fails.

## JavaScript API

- Like: a `<button aria-pressed data-bootcn-like data-count="1240">` with a
  visually hidden "Like" and a `[data-bootcn-count]` element. Clicking
  toggles it and the count; event `bootcn:like` (`detail: { pressed, count }`).
- Follow: a `<button aria-pressed data-bootcn-follow>` holding
  `.bootcn-follow__off` ("Follow") and `.bootcn-follow__on` ("Following");
  event `bootcn:follow` (`detail.pressed`). Use it for Subscribe too.
- Counts: `<data value="12400" data-bootcn-compact>` shows "12.4K" from
  10,000 up (with `Intl.NumberFormat`, in the page language) and keeps the
  full number for screen readers.
- `Bootcn.social.compact(n)`; `init()` / `destroy()`.

## Accessibility

- Like and Follow are toggle buttons (`aria-pressed`): screen readers say
  "Like 1,241, toggle button, pressed" and "Follow, toggle button".
- Compact counts keep the full number in their accessible name.
- The liked state shows a filled heart and a colour, and the pop animation
  stops under reduced motion.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `avatar` component.
- The `button` component.
