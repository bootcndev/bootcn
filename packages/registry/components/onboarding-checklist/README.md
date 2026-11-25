# Onboarding checklist

A "Get started" card: tasks that tick off with a progress bar, collapse and dismiss, and a message when everything is done; progress can be remembered.

## Usage

Each task is a `data-bootcn-checklist-item="id"` with a round toggle
(`data-bootcn-checklist-toggle`), a title, a description and an action
link. Mark tasks done from your app as people complete them:

```js
Bootcn.checklist.complete(root, 'invite');
```

An action with `data-bootcn-checklist-done-on-click` marks its task done
when clicked. The count, the progress bar and the "all done" message
(`data-bootcn-checklist-complete`) follow. The header has collapse and
dismiss buttons.

With `data-storage-key="onboarding"` the progress and dismissal are kept
in this browser (localStorage). Keep the real state on your server and
render `is-done` on finished items when it matters across devices.

## JavaScript API

`complete(root, id)`, `undo(root, id)`, `reset(root)`, `setup(root)`,
`init()` / `destroy()`. Events `bootcn:checklist:change`
(`detail: { id, done }`), `bootcn:checklist:complete` and
`bootcn:checklist:dismiss`. Messages `checklist.count`
(`{done} of {total} done`) and `checklist.allDone`.

## Accessibility

- The card is a section named "Get started"; tasks are a list.
- Each toggle is a button named after its task with `aria-pressed`.
- The progress is a native `<progress>` with a label; changes are
  announced ("3 of 5 done", "All done!").

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css` and `button`, `progress`.
