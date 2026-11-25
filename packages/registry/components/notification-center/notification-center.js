(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.notifications) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-notifications]';
  let listening = false;
  let counter = 0;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function q(root, name) {
    return root.querySelector('[data-bootcn-notifications-' + name + ']');
  }

  function items(root) {
    return Array.from(root.querySelectorAll('[data-bootcn-notification]'));
  }

  function isUnread(item) {
    return item.classList.contains('is-unread');
  }

  function sync(root) {
    const unread = items(root).filter(isUnread).length;
    const badge = q(root, 'count');
    if (badge) {
      badge.textContent = unread > 99 ? '99+' : String(unread);
      badge.hidden = unread === 0;
    }
    const toggle = q(root, 'toggle');
    if (toggle) {
      toggle.setAttribute(
        'aria-label',
        unread
          ? t('notifications.labelUnread', 'Notifications, {n} unread').replace(
              '{n}',
              String(unread),
            )
          : t('notifications.label', 'Notifications'),
      );
    }
    const all = q(root, 'read-all');
    if (all) all.disabled = unread === 0;
    // "Unread" filter: hide read ones; empty states.
    const onlyUnread = root.getAttribute('data-filter') === 'unread';
    let shown = 0;
    items(root).forEach(function (item) {
      item.hidden = onlyUnread && !isUnread(item);
      if (!item.hidden) shown++;
    });
    root.querySelectorAll('[data-bootcn-notifications-group]').forEach(function (group) {
      group.hidden = !group.querySelector('[data-bootcn-notification]:not([hidden])');
    });
    const empty = q(root, 'empty');
    if (empty) empty.hidden = shown > 0;
    items(root).forEach(function (item) {
      const mark = item.querySelector('[data-bootcn-notifications-mark]');
      if (mark) mark.hidden = !isUnread(item);
    });
  }

  function announce(root, text) {
    const live = q(root, 'live');
    if (live) live.textContent = text;
  }

  function read(root, list) {
    const ids = [];
    list.forEach(function (item) {
      if (!isUnread(item)) return;
      item.classList.remove('is-unread');
      const state = item.querySelector('[data-bootcn-notification-state]');
      if (state) state.textContent = '';
      ids.push(item.getAttribute('data-bootcn-notification'));
    });
    if (!ids.length) return;
    sync(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:notifications:read', { bubbles: true, detail: { ids: ids } }),
    );
  }

  // ------------------------------------------------------------ open/close

  function open(root, focusPanel) {
    const panel = q(root, 'panel');
    const toggle = q(root, 'toggle');
    if (!panel || !panel.hidden) return;
    document.querySelectorAll(ROOT).forEach(function (other) {
      if (other !== root) close(other, false);
    });
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    if (focusPanel) panel.focus();
  }

  function close(root, returnFocus) {
    const panel = q(root, 'panel');
    const toggle = q(root, 'toggle');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  function onClick(event) {
    const target = event.target;
    const root = target.closest && target.closest(ROOT);
    // A click outside closes every open panel.
    document.querySelectorAll(ROOT).forEach(function (other) {
      if (other !== root) close(other, false);
    });
    if (!root) return;
    const button = target.closest('button, a');
    if (!button) return;
    if (button.hasAttribute('data-bootcn-notifications-toggle')) {
      if (q(root, 'panel').hidden) open(root, true);
      else close(root, false);
    } else if (button.hasAttribute('data-bootcn-notifications-read-all')) {
      const n = items(root).filter(isUnread).length;
      read(root, items(root));
      announce(root, t('notifications.allRead', '{n} marked as read').replace('{n}', String(n)));
      q(root, 'panel').focus();
    } else if (button.hasAttribute('data-bootcn-notifications-mark')) {
      const item = button.closest('[data-bootcn-notification]');
      const next = item.nextElementSibling;
      read(root, [item]);
      announce(root, t('notifications.read', 'Marked as read'));
      const link = item.querySelector('a') || (next && next.querySelector('a'));
      if (link) link.focus();
    } else if (button.hasAttribute('data-bootcn-notifications-filter')) {
      const value = button.getAttribute('data-bootcn-notifications-filter');
      root.setAttribute('data-filter', value);
      root.querySelectorAll('[data-bootcn-notifications-filter]').forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === button));
      });
      sync(root);
    } else if (button.matches('a') && button.closest('[data-bootcn-notification]')) {
      // Opening a notification reads it.
      read(root, [button.closest('[data-bootcn-notification]')]);
    }
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    const root = event.target.closest && event.target.closest(ROOT);
    if (root && !q(root, 'panel').hidden) {
      event.preventDefault();
      close(root, true);
    }
  }

  function onFocusOut(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root && event.relatedTarget && !root.contains(event.relatedTarget)) close(root, false);
  }

  // ------------------------------------------------------------------- api

  // add(root, { id, text, href, time, avatar }): a new unread notification
  // at the top of the first group, announced politely.
  function add(root, data) {
    const list = root.querySelector('[data-bootcn-notifications-group] ul');
    if (!list) return null;
    const item = document.createElement('li');
    item.className = 'bootcn-notification is-unread';
    item.setAttribute('data-bootcn-notification', data.id || 'n-' + Date.now() + '-' + ++counter);
    const avatar = document.createElement('span');
    avatar.className = 'bootcn-avatar bootcn-avatar--sm bootcn-notification__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    const fallback = document.createElement('span');
    fallback.className = 'bootcn-avatar__fallback';
    fallback.textContent = data.avatar || '•';
    avatar.appendChild(fallback);
    const body = document.createElement('div');
    body.className = 'bootcn-notification__body';
    const text = document.createElement(data.href ? 'a' : 'p');
    text.className = 'bootcn-notification__text';
    text.textContent = data.text;
    if (data.href) text.href = data.href;
    const state = document.createElement('span');
    state.className = 'visually-hidden';
    state.setAttribute('data-bootcn-notification-state', '');
    state.textContent = t('notifications.unread', 'Unread: ');
    text.prepend(state);
    const time = document.createElement('time');
    time.className = 'bootcn-notification__time';
    time.dateTime = (data.time ? new Date(data.time) : new Date()).toISOString();
    time.setAttribute('data-bootcn-relative', '');
    time.textContent = t('notifications.now', 'Just now');
    body.append(text, time);
    const mark = document.createElement('button');
    mark.type = 'button';
    mark.className = 'bootcn-notification__mark';
    mark.setAttribute('data-bootcn-notifications-mark', '');
    mark.setAttribute('aria-label', t('notifications.markRead', 'Mark as read'));
    mark.innerHTML = '<span class="bootcn-notification__dot" aria-hidden="true"></span>';
    item.append(avatar, body, mark);
    list.prepend(item);
    sync(root);
    if (ns.timeline) ns.timeline.update(item);
    announce(root, t('notifications.new', 'New notification:') + ' ' + data.text);
    return item;
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('focusout', onFocusOut);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(sync);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('focusout', onFocusOut);
    listening = false;
  }

  ns.notifications = {
    init: init,
    destroy: destroy,
    add: add,
    open: function (root) {
      open(root, true);
    },
    close: function (root) {
      close(root, true);
    },
    readAll: function (root) {
      read(root, items(root));
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
