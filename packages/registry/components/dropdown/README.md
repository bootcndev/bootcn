# Dropdown

A menu of actions built on Bootstrap's **Dropdown** plugin (positioned by
Popper, which is included in the Bootstrap bundle). Bootstrap handles opening,
closing on Escape or outside click, focus return and arrow-key navigation;
Bootcn adds the styling. There is no `dropdown.js`.

## Usage

```html
<div class="dropdown bootcn-dropdown">
  <button
    class="btn bootcn-button bootcn-button--outline dropdown-toggle"
    type="button"
    id="account-menu"
    data-bs-toggle="dropdown"
    aria-expanded="false"
  >
    My account
  </button>
  <ul class="dropdown-menu bootcn-dropdown__menu" aria-labelledby="account-menu">
    <li>
      <span class="dropdown-header bootcn-dropdown__label">Signed in as olivia@example.com</span>
    </li>
    <li><a class="dropdown-item bootcn-dropdown__item" href="/profile">Profile</a></li>
    <li><hr class="dropdown-divider bootcn-dropdown__divider" /></li>
    <li>
      <button
        class="dropdown-item bootcn-dropdown__item bootcn-dropdown__item--destructive"
        type="button"
      >
        Sign out
      </button>
    </li>
  </ul>
</div>
```

Use links for navigation and buttons for actions. Disabled actions use the
`disabled` attribute on a `<button>`.

## Parts

- `bootcn-dropdown__label` — non-interactive section label.
- `bootcn-dropdown__shortcut` — right-aligned keyboard hint (decorative; mark
  it `aria-hidden="true"` and implement the shortcut yourself).
- `bootcn-dropdown__item--destructive` — danger-colored item.

## Dependencies

- Bootstrap 5.3+ CSS and **JavaScript bundle** (Dropdown + Popper).
- `themes/tokens/tokens.css`, `button` (trigger styling).

## Accessibility

- The trigger has `aria-expanded`, updated by Bootstrap; the menu is labelled by
  the trigger.
- Arrow keys move through items, Escape closes the menu and returns focus to the
  trigger.
- Bootstrap's dropdown is a disclosure list of links and buttons, not an ARIA
  `menu`; this matches how most screen-reader users expect site navigation to
  behave.
