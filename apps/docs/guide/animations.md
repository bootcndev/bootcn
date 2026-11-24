# Animations

Bootcn keeps motion short and functional: colors, borders and focus rings
change in 150 ms, overlays fade, and nothing moves that does not need to.
Everything stops for people who ask their system for reduced motion.

## The motion tokens

`tokens.css` defines one speed and one easing curve, used by every
component:

```css
:root {
  --bootcn-transition-duration: 150ms;
  --bootcn-transition-timing: cubic-bezier(0.4, 0, 0.2, 1);
  --bootcn-transition: var(--bootcn-transition-duration) var(--bootcn-transition-timing);
}
```

Make the whole interface calmer or snappier by changing them after
`tokens.css`:

```css
:root {
  --bootcn-transition-duration: 200ms;
}
```

With `prefers-reduced-motion: reduce`, the duration becomes `0ms`, and the
few looping animations (typing dots, image shimmer, skeletons) stop.

## Overlays and disclosure

Dialogs, sheets, drawers, dropdowns, popovers, tooltips, toasts, collapsibles
and accordions use Bootstrap's own `.fade` and `.collapse` transitions, so
they follow Bootstrap's settings too. Bootstrap already turns them off under
reduced motion.

## Your own transitions

Use the tokens so your motion matches:

```css
.card-link {
  transition:
    transform var(--bootcn-transition),
    box-shadow var(--bootcn-transition);
}

.card-link:hover {
  transform: translateY(-2px);
  box-shadow: var(--bootcn-shadow-md);
}

@media (prefers-reduced-motion: reduce) {
  .card-link:hover {
    transform: none;
  }
}
```

An entrance animation, for content that appears after an action:

```css
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

.appear {
  animation: appear 200ms var(--bootcn-transition-timing);
}

@media (prefers-reduced-motion: reduce) {
  .appear {
    animation: none;
  }
}
```

## Page transitions

Browsers that support cross-document view transitions fade between pages of
the same site with two lines of CSS, and others simply skip it:

```css
@view-transition {
  navigation: auto;
}
```

## Guidelines

- Animate `opacity` and `transform`; avoid animating size or layout.
- Keep interface motion under 300 ms; never block input while it runs.
- Do not rely on motion alone to show a change: text, color or focus should
  show it too.
