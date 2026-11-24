# Alert

A callout for important information, with an icon, title and description, in default and destructive styles.

## Usage

Use an alert for information the user should notice on the page. Add
`role="alert"` only when you insert the alert into the page in response to
something the user did (so screen readers announce it at once); static alerts
need no role. The dismissible version uses Bootstrap's alert plugin
(`alert-dismissible fade show` and `data-bs-dismiss="alert"`).

## Accessibility

- The title and description are plain text, read in order.
- The destructive alert is marked by its words as well as its color.
- The close button has an accessible name ("Dismiss").

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`.
