# API keys

API key management: a table of keys with permissions and last use, a dialog that creates a key and shows it once with a copy button, and revoking with confirmation.

## Usage

Put it on a settings or developer page. **Create key** opens a dialog for
a name and permissions; after creating, the dialog shows the full key once,
with **Copy**, and a warning that it will not be shown again. The table
only ever shows a masked key (`key_live_••••••••3f9a`). **Revoke** asks for
confirmation first.

## Connect it to your server

Never create real keys in the browser. Listen for the events, call your API
and answer:

```js
document.addEventListener('bootcn:api-keys:create', async (event) => {
  event.preventDefault(); // no demo key
  const response = await fetch('/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: event.detail.name, scope: event.detail.scope }),
  });
  if (!response.ok) return event.detail.fail('Could not create the key.');
  const { id, key } = await response.json();
  event.detail.done(key, id);
});

document.addEventListener('bootcn:api-keys:revoke', (event) => {
  fetch(`/api/keys/${event.detail.id}`, { method: 'DELETE' });
});
```

Without a listener the block makes a demo key, so the page works as a
prototype. Store only a hash of each key on the server, and render the
masked form in the table.

## JavaScript API

`Bootcn.apiKeys.add(root, { id, name, key, scope, scopeLabel })` adds a
row; `masked(key)`; `init()` / `destroy()`. Messages `apiKeys.*` (for
example `apiKeys.saveTitle`, `apiKeys.copied`, `apiKeys.revoked`) are
translatable.

## Accessibility

- The table has a header row and a row header (the key's name); on small
  screens it scrolls inside its focusable frame, not the page.
- Each Revoke button is named after its key ("Revoke CI pipeline"); the
  confirmation is an alert dialog with Cancel and the action.
- Creating, copying and revoking are announced. The full key is selected
  when shown, and removed from the page when the dialog closes.

## Dependencies

- Bootstrap 5.3+ CSS and the JS bundle.
- `themes/tokens/tokens.css`, `button`, `badge`, `table`, `input`, `select`, `dialog`, `modal` and `alert-dialog` (load `alert-dialog.js`: it keeps the
  revoke confirmation an alert dialog with the focus on Cancel).
