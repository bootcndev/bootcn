# Notification center

A notification center: a bell with the unread count that opens a panel of notifications grouped by day, with All and Unread, unread markers, mark one or all as read, relative times and an empty state.

## Usage

Put it in your header. Each notification is a list item
(`data-bootcn-notification="id"`, class `is-unread` when new) with an
avatar, a link (what happened, where to go), a `<time data-bootcn-relative>`
(the `timeline` component turns it into "3 hours ago") and a "Mark as read"
button. Group them under headings ("Today", "Earlier").

- The bell shows the unread count and says it ("Notifications, 3 unread").
- **All / Unread** filter the list; **Mark all as read** clears the count;
  opening a notification's link reads it too; "You're all caught up" shows
  when nothing is left to show.
- The panel closes on Escape (the focus goes back to the bell), on a click
  outside and when the focus leaves it.

## Live updates

Call `Bootcn.notifications.add(root, { text, href, avatar, time })` when
your server pushes one (WebSocket, Server-Sent Events, polling): it goes on
top as unread and is announced. Reading fires `bootcn:notifications:read`
(`detail: { ids }`) for your server.

`open(root)`, `close(root)`, `readAll(root)`, `init()` / `destroy()`.
Messages `notifications.*` are translatable.

## Accessibility

- The bell is a disclosure button (`aria-expanded`, `aria-controls`); the
  panel is a section named "Notifications" that takes the focus when it
  opens.
- Unread notifications say so in hidden text; the filters are toggle
  buttons in a named group; new notifications and "marked as read" are
  announced politely.

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`, `avatar`, `button` and `timeline` (relative times).
