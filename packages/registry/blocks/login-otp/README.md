# Verify with a code

A second-step card that asks for the six-digit code sent by SMS or email, with resend.

## Usage

Show it after the password step. The code field is the Input OTP component:
the phone's SMS suggestion and paste fill all six digits, and its
`bootcn:otp:complete` event can submit the form automatically. Rate-limit
"Send a new code" on the server.

## Accessibility

- One labelled input holds the code (`autocomplete="one-time-code"`); the boxes
  are visual only.
- The description says where the code went, without revealing the full
  number.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `input-otp` component.
- The `button` component.
- The `label` component.
