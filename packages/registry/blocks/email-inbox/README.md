# Email inbox

An email client in three panes: folders and labels, a message list with stars, unread, selection and search, and a reader with reply; Gmail-style keys, bulk actions with Undo, a compose dialog, and one pane at a time on phones.

## Usage

A `<section data-bootcn-inbox>` with three parts: the folders (`<a
data-inbox-folder>` and `data-inbox-label` links, plus Compose), the list
(`<li class="bootcn-inbox__row" data-inbox-id data-folder data-label>` rows
with a checkbox, a star and the message link) and the reader. Message
bodies for the reader come from `<script type="application/json"
data-inbox-mail>`, keyed by id (`name`, `email`, `subject`, `date`, `body`
as paragraphs); render the first one in the page too.

- **Folders** show their rows (`starred` shows the starred ones); a label
  shows its messages everywhere but Trash. Inbox shows its unread count.
- **Opening** a message marks it read and shows it in the reader; below
  40rem of width the reader replaces the list, with a back button.
- **Archive**, **Delete** and **Mark as read** work on the open message or
  on the selected ones, then offer **Undo** for a few seconds.
- **Compose** opens a dialog that checks the address; **Reply** sends from
  the reader. Sent mail lands in Sent.

Every change fires an event you can cancel to call your server first:
`bootcn:inbox:open`, `archive`, `trash`, `read`, `star` and `send`
(`detail` has the ids, or the message). `Bootcn.inbox.open(root, id)`,
`move(root, ids, folder)`, `folder(root, name)`, `compose(root)`.

## Keyboard

With focus in the inbox and not in a field: <kbd>j</kbd> / <kbd>k</kbd>
next and previous message, <kbd>e</kbd> archive, <kbd>#</kbd> delete,
<kbd>s</kbd> star, <kbd>x</kbd> select, <kbd>u</kbd> back to the list,
<kbd>c</kbd> compose, <kbd>/</kbd> search. The keys are listed under the
inbox and in `aria-keyshortcuts`.

## Accessibility

- Folders are a named navigation with the current one `aria-current`;
  the list is named by the folder heading; unread messages say "Unread".
- Checkboxes and stars name the message they act on ("Select: Lena
  Fischer, Design review moved to Thursday"); toolbar buttons are disabled
  until something is selected.
- Results ("Archived 2 messages") are announced with an Undo button; the
  reader is an `<article>` named by its subject, and the reply field by
  the sender. Text from mail is set with `textContent`. Texts are in
  `window.Bootcn.messages` (`inbox.*`).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button`, `checkbox`, `input`, `textarea` and `kbd` components.
