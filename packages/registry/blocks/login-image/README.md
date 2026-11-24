# Login with image

A wide sign-in card with the form on one side and an image on the other, which hides on phones.

## Usage

Swap the illustration for a photo of your product or brand. The image is
decorative (`alt=""`) and hidden below 768px, where the form takes the whole
card.

## Accessibility

- The image is decorative, so it is skipped by screen readers.
- The form keeps visible labels and `autocomplete` for password managers.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `input` component.
- The `button` component.
