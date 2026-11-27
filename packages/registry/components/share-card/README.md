# Share card

A share card: a preview of the link, a field with Copy, links to share on X, LinkedIn, Facebook, WhatsApp, Reddit and by email, and the system share sheet on phones.

## Usage

Set what to share on the card: `data-url`, `data-title` and `data-text`
(without them it shares the current page and its title). The share links
are filled in from these: plain links that open the service in a new tab,
with no script, button widget or tracker from any of them. Remove the ones
you do not want, or add more to `Bootcn.share.targets`.

- **Copy** puts the link on the clipboard and says "Copied"; the field
  selects the whole link when focused, for a manual copy.
- **More options** shows only where the browser has a share sheet
  (`navigator.share`, on phones and some desktops).
- Every share fires `bootcn:share` (`detail: { target, url }`), for your
  analytics.

The card fits a popover, a dialog or the end of an article.
`--bootcn-share-image` sets the preview picture
(`url(...)`).

## Accessibility

- A section named by its heading; the share links are a named list, each
  link names its service and says it opens a new tab.
- The link field is labelled and read only; "Link copied to the clipboard"
  is announced. Logos are decorative.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `input` and `button`.
