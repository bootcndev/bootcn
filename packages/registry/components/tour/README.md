# Tour

A product tour: highlights one element at a time with a card next to it, "1 of 4", Back, Next and Skip; keyboard friendly.

## Usage

Mark the elements to explain, in order:

```html
<button
  data-bootcn-tour-step="1"
  data-bootcn-tour-title="Search everything"
  data-bootcn-tour-text="Find projects, people and files."
>
  Search
</button>
```

Add the tour markup once (the `.bootcn-tour` element) and a button with
`data-bootcn-tour-start="#bootcn-tour"`, or start it from code, for example
on someone's first visit:

```js
Bootcn.tour.start(document.querySelector('#bootcn-tour'));
// or with steps from code:
Bootcn.tour.start(tour, [{ target: '#search', title: 'Search', text: '…' }]);
```

Hidden elements are skipped. With several tours on a page,
`data-bootcn-tour-for="tour-id"` ties a step to one of them.

## JavaScript API

`start(root, steps?)`, `next(root)`, `prev(root)`, `end(root)`,
`init()` / `destroy()`. Events `bootcn:tour:start`, `bootcn:tour:step`
(`detail: { index, target }`) and `bootcn:tour:end`
(`detail: { completed }`); use `completed` to stop showing the tour.
Messages `tour.count` (`{n} of {total}`), `tour.next` and `tour.done`.

## Accessibility

- The card is a modal dialog named by its title and described by its text;
  the focus moves to it, stays in it, and returns to where it was at the
  end.
- Escape ends the tour; the arrow keys move between steps while the card
  has focus.
- The highlighted element is scrolled into view; movement is instant under
  reduced motion.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css` and `button`.
