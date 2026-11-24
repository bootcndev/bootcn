# Login with SSO

A sign-in card offering single sign-on and an email link first, then email and password.

## Usage

Wire "Continue with SSO" to your identity provider and "Email me a sign-in
link" to a magic-link flow; remove either if you do not offer it. The
password form is a normal POST form.

## Accessibility

- Each option is a button or field with visible text; icons are decorative.
- The separator between options is announced as "Or sign in with a password"
  (`role="separator"` with a label), not as loose text.
- The legal links are real links with descriptive text.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `card` component.
- The `input` component.
- The `button` component.
- The `separator` component.
