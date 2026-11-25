# Action sheet

A menu of actions that slides up from the bottom, iOS style: a title, grouped actions, a destructive action and a separate Cancel.

## Usage

Use an action sheet for a short list of actions about one thing (a photo,
a message), mostly on phones. It is Bootstrap's bottom Offcanvas: open it
with `data-bs-toggle="offcanvas"`, and each action closes it with
`data-bs-dismiss="offcanvas"`. On wide screens a Dropdown menu is usually
better.

## Accessibility

- Bootstrap's Offcanvas makes it a modal dialog named by its title, traps
  focus, closes on Escape and returns focus to the trigger.
- Actions are buttons with text; the destructive one is red and says what it
  does ("Delete photo"), not colour alone.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
- The `button` component.
