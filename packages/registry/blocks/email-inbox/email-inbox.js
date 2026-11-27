(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.inbox) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-inbox]';
  const ROW = '.bootcn-inbox__row';
  const NAMES = {
    inbox: 'Inbox',
    starred: 'Starred',
    sent: 'Sent',
    drafts: 'Drafts',
    archive: 'Archive',
    trash: 'Trash',
  };
  const state = new WeakMap();
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  }

  function get(root) {
    let s = state.get(root);
    if (!s) {
      let mail = {};
      const data = root.querySelector('script[data-inbox-mail]');
      if (data) {
        try {
          mail = JSON.parse(data.textContent);
        } catch {
          mail = {};
        }
      }
      s = {
        mail,
        view: { folder: 'inbox', label: null, query: '' },
        open: null,
        undo: null,
        timer: 0,
      };
      state.set(root, s);
    }
    return s;
  }

  function emit(root, name, detail) {
    return root.dispatchEvent(
      new CustomEvent('bootcn:inbox:' + name, { bubbles: true, cancelable: true, detail }),
    );
  }

  function rows(root) {
    return [...root.querySelectorAll(ROW)];
  }

  function row(root, id) {
    return root.querySelector(ROW + '[data-inbox-id="' + CSS.escape(id) + '"]');
  }

  function visible(root) {
    return rows(root).filter((r) => !r.hidden);
  }

  // ------------------------------------------------------------- views

  function matches(r, view) {
    const folder = r.dataset.folder;
    if (view.label) {
      if (r.dataset.label !== view.label || folder === 'trash') return false;
    } else if (view.folder === 'starred') {
      if (!r.hasAttribute('data-starred') || folder === 'trash') return false;
    } else if (folder !== view.folder) return false;
    if (!view.query) return true;
    return r.querySelector('.bootcn-inbox__open').textContent.toLowerCase().includes(view.query);
  }

  function render(root) {
    const { view } = get(root);
    let shown = 0;
    rows(root).forEach((r) => {
      r.hidden = !matches(r, view);
      if (r.hidden) r.querySelector('[data-inbox-select]').checked = false;
      else shown += 1;
    });
    const empty = root.querySelector('[data-inbox-empty]');
    if (empty) empty.hidden = shown > 0;
    const unread = rows(root).filter(
      (r) => r.dataset.folder === 'inbox' && r.classList.contains('is-unread'),
    ).length;
    const count = root.querySelector('[data-inbox-count]');
    if (count) {
      count.hidden = unread === 0;
      count.firstChild.textContent = String(unread);
    }
    selection(root);
  }

  function folder(root, name, label) {
    const s = get(root);
    s.view.folder = label ? null : name;
    s.view.label = label || null;
    root.querySelectorAll('[data-inbox-folder], [data-inbox-label]').forEach((a) => {
      const on = label ? a.dataset.inboxLabel === label : a.dataset.inboxFolder === name;
      if (on) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const heading = root.querySelector('[data-inbox-heading]');
    if (heading) {
      const link = label ? root.querySelector('[data-inbox-label="' + label + '"]') : null;
      heading.textContent = link
        ? link.textContent.trim()
        : t('inbox.folder.' + name, NAMES[name] || name);
    }
    root.classList.remove('is-reading');
    render(root);
  }

  // -------------------------------------------------------------- open

  function open(root, id, focusReader) {
    const s = get(root);
    const r = row(root, id);
    const mail = s.mail[id];
    if (!r || !mail) return;
    if (!emit(root, 'open', { id })) return;
    rows(root).forEach((other) => other.classList.toggle('is-open', other === r));
    s.open = id;
    if (r.classList.contains('is-unread')) {
      r.classList.remove('is-unread');
      const sr = r.querySelector('.bootcn-inbox__from .visually-hidden');
      if (sr) sr.remove();
      emit(root, 'read', { ids: [id], read: true });
    }
    const set = (sel, text) => {
      const el = root.querySelector(sel);
      if (el) el.textContent = text;
    };
    set('[data-inbox-subject]', mail.subject);
    set('[data-inbox-name]', mail.name);
    set('[data-inbox-email]', '<' + mail.email + '>');
    set('[data-inbox-date]', mail.date);
    set(
      '[data-inbox-avatar]',
      mail.name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2),
    );
    set(
      '[data-inbox-reply-label]',
      fill(t('inbox.replyTo', 'Reply to {name}'), { name: mail.name }),
    );
    const text = root.querySelector('[data-inbox-text]');
    if (text) {
      text.replaceChildren(
        ...(mail.body || []).map((p) => {
          const para = document.createElement('p');
          para.textContent = p;
          return para;
        }),
      );
    }
    root.querySelector('[data-inbox-reader]').hidden = false;
    root.classList.add('is-reading');
    render(root);
    const body = root.querySelector('[data-inbox-reader-body]');
    if (body) body.scrollTop = 0;
    if (focusReader && body) body.focus();
  }

  // ------------------------------------------------------- move and undo

  function selected(root) {
    return visible(root)
      .filter((r) => r.querySelector('[data-inbox-select]').checked)
      .map((r) => r.dataset.inboxId);
  }

  function move(root, ids, to) {
    const s = get(root);
    if (!ids.length || !emit(root, to === 'trash' ? 'trash' : 'archive', { ids, folder: to }))
      return;
    const before = ids.map((id) => ({ id, folder: row(root, id).dataset.folder }));
    // The next message to show, if the open one goes away.
    const list = visible(root);
    let next = null;
    if (s.open && ids.includes(s.open)) {
      const i = list.findIndex((r) => r.dataset.inboxId === s.open);
      next = list
        .slice(i + 1)
        .concat(list.slice(0, i).reverse())
        .find((r) => !ids.includes(r.dataset.inboxId));
    }
    ids.forEach((id) => (row(root, id).dataset.folder = to));
    render(root);
    const n = ids.length;
    const text =
      to === 'trash'
        ? n === 1
          ? t('inbox.deletedOne', 'Moved 1 message to Trash')
          : t('inbox.deleted', 'Moved {count} messages to Trash')
        : n === 1
          ? t('inbox.archivedOne', 'Archived 1 message')
          : t('inbox.archived', 'Archived {count} messages');
    toast(root, fill(text, { count: n }), () => {
      before.forEach(({ id, folder: f }) => (row(root, id).dataset.folder = f));
      render(root);
      toast(root, t('inbox.undone', 'Undone'));
      // Focus goes back to the message, not lost with the Undo button.
      const back = row(root, before[0].id);
      if (back && !back.hidden) back.querySelector('[data-inbox-open]').focus();
    });
    if (next) open(root, next.dataset.inboxId);
    else if (s.open && ids.includes(s.open)) {
      root.classList.remove('is-reading');
      s.open = null;
    }
  }

  function markRead(root, ids, read) {
    if (!ids.length || !emit(root, 'read', { ids, read })) return;
    ids.forEach((id) => row(root, id).classList.toggle('is-unread', !read));
    render(root);
    toast(
      root,
      read ? t('inbox.markedRead', 'Marked as read') : t('inbox.markedUnread', 'Marked as unread'),
    );
  }

  function star(root, button) {
    const r = button.closest(ROW);
    const on = button.getAttribute('aria-pressed') !== 'true';
    if (!emit(root, 'star', { id: r.dataset.inboxId, starred: on })) return;
    button.setAttribute('aria-pressed', String(on));
    r.toggleAttribute('data-starred', on);
    if (get(root).view.folder === 'starred') render(root);
  }

  function toast(root, text, undo) {
    const s = get(root);
    const box = root.querySelector('[data-inbox-toast]');
    if (!box) return;
    clearTimeout(s.timer);
    s.undo = undo || null;
    box.querySelector('[data-inbox-toast-text]').textContent = text;
    box.querySelector('[data-inbox-undo]').hidden = !undo;
    box.hidden = false;
    s.timer = setTimeout(() => {
      box.hidden = true;
      s.undo = null;
    }, 6000);
  }

  // ---------------------------------------------------------- selection

  function selection(root) {
    const shown = visible(root);
    const picked = shown.filter((r) => r.querySelector('[data-inbox-select]').checked).length;
    root.querySelectorAll('[data-inbox-bulk]').forEach((b) => (b.disabled = picked === 0));
    const all = root.querySelector('[data-inbox-select-all]');
    if (all) {
      all.checked = picked > 0 && picked === shown.length;
      all.indeterminate = picked > 0 && picked < shown.length;
    }
  }

  // ------------------------------------------------------------ compose

  function compose(root) {
    const dialog = root.querySelector('[data-inbox-dialog]');
    if (!dialog || dialog.open) return;
    dialog.showModal();
    dialog.querySelector('[name="to"]').focus();
  }

  function addSent(root, to, subject, text) {
    const list = root.querySelector('[data-inbox-messages]');
    const template = root.querySelector(ROW);
    if (!list || !template) return;
    const id = 'sent-' + Date.now();
    const r = template.cloneNode(true);
    r.dataset.inboxId = id;
    r.dataset.folder = 'sent';
    r.removeAttribute('data-label');
    r.removeAttribute('data-starred');
    r.classList.remove('is-unread', 'is-open');
    const tag = r.querySelector('.bootcn-inbox__tag');
    if (tag) tag.remove();
    const sr = r.querySelector('.bootcn-inbox__from .visually-hidden');
    if (sr) sr.remove();
    r.querySelector('.bootcn-inbox__from').textContent = fill(t('inbox.to', 'To: {to}'), { to });
    r.querySelector('.bootcn-inbox__subject').textContent =
      subject || t('inbox.noSubject', '(no subject)');
    r.querySelector('.bootcn-inbox__snippet').textContent = text;
    r.querySelector('.bootcn-inbox__time').textContent = t('inbox.now', 'Now');
    const select = r.querySelector('[data-inbox-select]');
    select.checked = false;
    select.setAttribute(
      'aria-label',
      fill(t('inbox.select', 'Select: {name}, {subject}'), { name: to, subject: subject || '' }),
    );
    const starButton = r.querySelector('[data-inbox-star]');
    starButton.setAttribute('aria-pressed', 'false');
    starButton.setAttribute(
      'aria-label',
      fill(t('inbox.star', 'Star: {subject}'), { subject: subject || '' }),
    );
    const link = r.querySelector('[data-inbox-open]');
    link.dataset.inboxOpen = id;
    link.href = '#' + id;
    get(root).mail[id] = {
      name: to,
      email: to,
      subject: subject || t('inbox.noSubject', '(no subject)'),
      date: t('inbox.now', 'Now'),
      body: text.split(/\n{2,}/),
    };
    list.prepend(r);
    render(root);
  }

  // ------------------------------------------------------------- events

  function onClick(event) {
    const root = event.target.closest(ROOT);
    if (!root) return;
    const s = get(root);
    const a = event.target.closest('[data-inbox-open]');
    if (a) {
      event.preventDefault();
      return open(root, a.dataset.inboxOpen, true);
    }
    const f = event.target.closest('[data-inbox-folder], [data-inbox-label]');
    if (f) {
      event.preventDefault();
      return folder(root, f.dataset.inboxFolder || null, f.dataset.inboxLabel || null);
    }
    const starButton = event.target.closest('[data-inbox-star]');
    if (starButton) return star(root, starButton);
    const bulk = event.target.closest('[data-inbox-bulk]');
    if (bulk) {
      const ids = selected(root);
      if (bulk.dataset.inboxBulk === 'read') return markRead(root, ids, true);
      return move(root, ids, bulk.dataset.inboxBulk);
    }
    const action = event.target.closest('[data-inbox-action]');
    if (action && s.open) {
      if (action.dataset.inboxAction === 'unread') return markRead(root, [s.open], false);
      return move(root, [s.open], action.dataset.inboxAction);
    }
    if (event.target.closest('[data-inbox-back]')) {
      root.classList.remove('is-reading');
      const r = s.open && row(root, s.open);
      if (r) r.querySelector('[data-inbox-open]').focus();
      return;
    }
    if (event.target.closest('[data-inbox-undo]') && s.undo) {
      const undo = s.undo;
      s.undo = null;
      return undo();
    }
    if (event.target.closest('[data-inbox-compose]')) return compose(root);
    if (event.target.closest('[data-inbox-discard]')) {
      const dialog = event.target.closest('dialog');
      dialog.querySelector('form').reset();
      return dialog.close();
    }
    if (event.target.matches('[data-inbox-dialog]')) event.target.close();
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    if (event.target.matches('[data-inbox-select-all]')) {
      visible(root).forEach(
        (r) => (r.querySelector('[data-inbox-select]').checked = event.target.checked),
      );
    }
    if (event.target.matches('[data-inbox-select], [data-inbox-select-all]')) selection(root);
  }

  function onInput(event) {
    const search = event.target.closest && event.target.closest('[data-inbox-search]');
    if (!search) return;
    const root = search.closest(ROOT);
    get(root).view.query = search.value.trim().toLowerCase();
    render(root);
  }

  function onSubmit(event) {
    const form = event.target;
    const root = form.closest && form.closest(ROOT);
    if (!root) return;
    if (form.matches('[data-inbox-compose-form]')) {
      event.preventDefault();
      const to = form.querySelector('[name="to"]');
      const error = form.querySelector('[data-inbox-error]');
      const ok = to.value.trim() && to.checkValidity();
      error.hidden = Boolean(ok);
      if (!ok) {
        to.setAttribute('aria-invalid', 'true');
        return to.focus();
      }
      to.removeAttribute('aria-invalid');
      const detail = {
        to: to.value.trim(),
        subject: form.querySelector('[name="subject"]').value.trim(),
        text: form.querySelector('[name="message"]').value.trim(),
      };
      if (!emit(root, 'send', detail)) return;
      addSent(root, detail.to, detail.subject, detail.text);
      form.reset();
      form.closest('dialog').close();
      toast(root, t('inbox.sent', 'Message sent'));
    } else if (form.matches('[data-inbox-reply]')) {
      event.preventDefault();
      const field = form.querySelector('[data-inbox-reply-text]');
      const text = field.value.trim();
      const s = get(root);
      if (!text || !s.open) return field.focus();
      const mail = s.mail[s.open];
      const detail = { to: mail.email, subject: 'Re: ' + mail.subject, text, inReplyTo: s.open };
      if (!emit(root, 'send', detail)) return;
      addSent(root, mail.name, detail.subject, text);
      field.value = '';
      toast(root, t('inbox.replySent', 'Reply sent'));
    }
  }

  function onKeydown(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('input, textarea, select, dialog, [contenteditable="true"]')) {
      if (
        event.key === 'Escape' &&
        event.target.matches('[data-inbox-search]') &&
        event.target.value
      ) {
        event.target.value = '';
        event.target.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    const s = get(root);
    const list = visible(root);
    const i = list.findIndex((r) => r.dataset.inboxId === s.open);
    const focusRow = (r) => {
      if (!r) return;
      open(root, r.dataset.inboxId);
      r.querySelector('[data-inbox-open]').focus();
    };
    const current = s.open && row(root, s.open);
    switch (event.key) {
      case 'j':
        focusRow(list[Math.min(i + 1, list.length - 1)] || list[0]);
        break;
      case 'k':
        focusRow(list[Math.max(i - 1, 0)]);
        break;
      case 'e':
        if (s.open) move(root, [s.open], 'archive');
        break;
      case '#':
        if (s.open) move(root, [s.open], 'trash');
        break;
      case 's': {
        const r = event.target.closest(ROW) || current;
        if (r) star(root, r.querySelector('[data-inbox-star]'));
        break;
      }
      case 'x': {
        const r = event.target.closest(ROW) || current;
        if (!r) return;
        const box = r.querySelector('[data-inbox-select]');
        box.checked = !box.checked;
        selection(root);
        break;
      }
      case 'u':
        root.classList.remove('is-reading');
        if (current) current.querySelector('[data-inbox-open]').focus();
        break;
      case 'c':
        compose(root);
        break;
      case '/':
        root.querySelector('[data-inbox-search]').focus();
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  function setup(root) {
    const s = get(root);
    const first = root.querySelector(ROW + ':not([hidden])');
    if (first && s.mail[first.dataset.inboxId]) {
      first.classList.add('is-open');
      s.open = first.dataset.inboxId;
    }
    render(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('change', onChange);
      document.addEventListener('input', onInput);
      document.addEventListener('submit', onSubmit);
      document.addEventListener('keydown', onKeydown);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    document.removeEventListener('click', onClick);
    document.removeEventListener('change', onChange);
    document.removeEventListener('input', onInput);
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  ns.inbox = { init, destroy, open, move, folder, compose };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
