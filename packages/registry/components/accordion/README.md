# Accordion

Collapsible sections built on Bootstrap's **Collapse** plugin and `.accordion`
markup, restyled as a flush list. Styling is done by setting Bootstrap's
`--bs-accordion-*` variables on `.bootcn-accordion` only, so other accordions
on the page are not affected. There is no `accordion.js`.

## Usage

```html
<div class="accordion bootcn-accordion" id="faq">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button
        class="accordion-button"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#faq-one"
        aria-expanded="true"
        aria-controls="faq-one"
      >
        Is it accessible?
      </button>
    </h2>
    <div id="faq-one" class="accordion-collapse collapse show" data-bs-parent="#faq">
      <div class="accordion-body">Yes.</div>
    </div>
  </div>
</div>
```

- Remove `data-bs-parent` to allow several sections open at once.
- Change the heading level (`h2`, `h3`, …) to fit your page outline.

## Dependencies

- Bootstrap 5.3+ CSS and **JavaScript bundle** (Collapse plugin).
- `themes/tokens/tokens.css`.

## Accessibility

- Each header is a `<button>` with `aria-expanded` and `aria-controls`, inside a
  heading so screen-reader users can jump between sections.
- Bootstrap disables the collapse animation under `prefers-reduced-motion`.
