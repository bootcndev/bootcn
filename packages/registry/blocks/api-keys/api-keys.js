(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.apiKeys) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-api-keys]';
  const pending = new WeakMap(); // root -> row waiting for "Revoke key"
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function q(root, name) {
    return root.querySelector('[data-bootcn-api-keys-' + name + ']');
  }

  function modal(el) {
    return window.bootstrap && window.bootstrap.Modal && el
      ? window.bootstrap.Modal.getOrCreateInstance(el)
      : null;
  }

  function announce(root, text) {
    const live = q(root, 'live');
    if (live) live.textContent = text;
  }

  // For the demo only: real keys come from your server (see README).
  function demoKey(scope) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let key = '';
    bytes.forEach(function (b) {
      key += chars[b % chars.length];
    });
    return (scope === 'read' ? 'key_live_ro_' : 'key_live_') + key;
  }

  function masked(key) {
    // The prefix ("key_live_", "key_live_ro_") stays readable; the rest is hidden.
    const cut = key.lastIndexOf('_', 11);
    const prefix = cut > 0 ? key.slice(0, cut + 1) : key.slice(0, 4);
    return prefix + '••••••••' + key.slice(-4);
  }

  function cell(tag, content) {
    const el = document.createElement(tag);
    if (content instanceof Node) el.appendChild(content);
    else el.textContent = content;
    return el;
  }

  function addRow(root, data) {
    const list = q(root, 'list');
    if (!list) return null;
    const row = document.createElement('tr');
    row.setAttribute('data-bootcn-api-key', data.id);
    row.className = 'is-new';
    const name = cell('th', data.name);
    name.scope = 'row';
    name.className = 'bootcn-api-keys__name';
    const code = document.createElement('code');
    code.className = 'bootcn-api-keys__key';
    code.textContent = masked(data.key);
    const badge = document.createElement('span');
    badge.className =
      'badge bootcn-badge ' +
      ({ full: 'bootcn-badge--default', read: 'bootcn-badge--secondary' }[data.scope] ||
        'bootcn-badge--outline');
    badge.textContent = data.scopeLabel;
    const created = document.createElement('time');
    created.dateTime = new Date().toISOString();
    created.textContent = t('apiKeys.justNow', 'Just now');
    const actions = cell('td', '');
    actions.className = 'text-end';
    const revoke = document.createElement('button');
    revoke.type = 'button';
    revoke.className = 'btn bootcn-button bootcn-button--ghost bootcn-button--sm';
    revoke.setAttribute('data-bootcn-api-keys-revoke', '');
    revoke.setAttribute('aria-label', t('apiKeys.revoke', 'Revoke') + ' ' + data.name);
    revoke.textContent = t('apiKeys.revoke', 'Revoke');
    actions.appendChild(revoke);
    row.append(
      name,
      cell('td', code),
      cell('td', badge),
      cell('td', created),
      cell('td', t('apiKeys.never', 'Never')),
      actions,
    );
    list.insertBefore(row, list.firstElementChild);
    syncEmpty(root);
    return row;
  }

  function syncEmpty(root) {
    const empty = q(root, 'empty');
    if (empty) empty.hidden = root.querySelectorAll('[data-bootcn-api-key]').length > 0;
  }

  function reveal(root, key) {
    const form = q(root, 'form');
    const panel = q(root, 'reveal');
    const secret = q(root, 'secret');
    const title = q(root, 'step-title');
    if (form) form.hidden = true;
    if (panel) panel.hidden = false;
    if (title) title.textContent = t('apiKeys.saveTitle', 'Save your key');
    if (secret) {
      secret.value = key;
      secret.focus();
      secret.select();
    }
  }

  function resetCreate(root) {
    const form = q(root, 'form');
    const panel = q(root, 'reveal');
    const secret = q(root, 'secret');
    const title = q(root, 'step-title');
    if (form) {
      form.reset();
      form.hidden = false;
      form.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
      const submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = false;
    }
    if (panel) panel.hidden = true;
    // The full key never stays in the page after the dialog closes.
    if (secret) secret.value = '';
    if (title) title.textContent = t('apiKeys.createTitle', 'Create an API key');
    const label = q(root, 'copy-label');
    if (label) label.textContent = t('apiKeys.copy', 'Copy');
  }

  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-bootcn-api-keys-form]')) return;
    event.preventDefault();
    const root = form.closest(ROOT);
    const nameField = form.elements.namedItem('name');
    if (!nameField.value.trim()) {
      nameField.setAttribute('aria-invalid', 'true');
      nameField.focus();
      return;
    }
    nameField.removeAttribute('aria-invalid');
    const scopeField = form.elements.namedItem('scope');
    const submit = form.querySelector('[type="submit"]');
    if (submit) submit.disabled = true;
    let finished = false;
    const detail = {
      name: nameField.value.trim(),
      scope: scopeField.value,
      // Your server answers with the new key (and its id): call done().
      done: function (key, id) {
        if (finished) return;
        finished = true;
        addRow(root, {
          id: id || 'key-' + Date.now(),
          name: detail.name,
          key: key,
          scope: detail.scope,
          scopeLabel: scopeField.options[scopeField.selectedIndex].text,
        });
        reveal(root, key);
        announce(root, t('apiKeys.created', 'Key created. Copy it now.'));
      },
      fail: function (message) {
        if (submit) submit.disabled = false;
        announce(root, message || t('apiKeys.failed', 'The key could not be created.'));
      },
    };
    const proceed = root.dispatchEvent(
      new CustomEvent('bootcn:api-keys:create', {
        bubbles: true,
        cancelable: true,
        detail: detail,
      }),
    );
    if (proceed) detail.done(demoKey(detail.scope));
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('button');
    if (!button) return;
    const root = button.closest(ROOT);
    if (!root) return;
    if (button.hasAttribute('data-bootcn-api-keys-copy')) {
      const secret = q(root, 'secret');
      const label = q(root, 'copy-label');
      const done = function () {
        if (label) label.textContent = t('apiKeys.copied', 'Copied');
        announce(root, t('apiKeys.copiedLong', 'Key copied to the clipboard.'));
      };
      if (navigator.clipboard && secret)
        navigator.clipboard.writeText(secret.value).then(done, function () {
          secret.select();
        });
    } else if (button.hasAttribute('data-bootcn-api-keys-revoke')) {
      const row = button.closest('[data-bootcn-api-key]');
      pending.set(root, row);
      const name = q(root, 'revoke-name');
      if (name) name.textContent = row.querySelector('th').textContent.trim();
      const dialog = root.querySelector('#bootcn-api-keys-revoke') || q(root, 'revoke-dialog');
      const m = modal(dialog);
      if (m) m.show(button);
    } else if (button.hasAttribute('data-bootcn-api-keys-confirm-revoke')) {
      const row = pending.get(root);
      if (!row) return;
      const name = row.querySelector('th').textContent.trim();
      root.dispatchEvent(
        new CustomEvent('bootcn:api-keys:revoke', {
          bubbles: true,
          detail: { id: row.getAttribute('data-bootcn-api-key'), name: name },
        }),
      );
      row.remove();
      pending.delete(root);
      syncEmpty(root);
      const m = modal(button.closest('.modal'));
      if (m) m.hide();
      announce(root, t('apiKeys.revoked', 'Key revoked:') + ' ' + name);
    }
  }

  function onHidden(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    if (event.target.querySelector('[data-bootcn-api-keys-form]')) resetCreate(root);
    // After revoking, the focus goes to the Create button (the row is gone).
    if (event.target.id === 'bootcn-api-keys-revoke' && !pending.get(root)) {
      const create = root.querySelector('[data-bs-target="#bootcn-api-keys-create"]');
      if (create) create.focus();
    }
    pending.delete(root);
  }

  function onShown(event) {
    const first = event.target.querySelector && event.target.querySelector('[autofocus]');
    if (first && event.target.closest(ROOT)) first.focus();
  }

  function init() {
    if (!listening) {
      document.addEventListener('submit', onSubmit);
      document.addEventListener('click', onClick);
      document.addEventListener('hidden.bs.modal', onHidden);
      document.addEventListener('shown.bs.modal', onShown);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(syncEmpty);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('click', onClick);
    document.removeEventListener('hidden.bs.modal', onHidden);
    document.removeEventListener('shown.bs.modal', onShown);
    listening = false;
  }

  ns.apiKeys = { init: init, destroy: destroy, add: addRow, masked: masked };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
