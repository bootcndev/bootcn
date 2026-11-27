(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.spotlight) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-spotlight]';
  const ICONS = {
    page: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" />',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6M8 13h8M8 17h5" />',
    folder:
      '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
    settings:
      '<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />',
    plus: '<path d="M12 5v14M5 12h14" />',
    'user-plus': '<circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0M19 8v6M16 11h6" />',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />',
    clock: '<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />',
  };
  const states = new WeakMap();
  let listening = false;
  let uid = 0;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  }

  // Lower case without accents, so "cafe" finds "Café".
  function fold(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
  }

  function escape(text) {
    return String(text).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
  }

  // 3: the title starts with it, 2: a word in it does, 1: it is anywhere,
  // 0.5: only the subtitle or keywords match; -1: no match.
  function score(item, query) {
    if (!query) return 1;
    const title = fold(item.title);
    if (title.startsWith(query)) return 3;
    if (new RegExp('(^|[\\s\\-_./])' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(title))
      return 2;
    if (title.includes(query)) return 1;
    if (fold(item.subtitle + ' ' + item.keywords).includes(query)) return 0.5;
    return -1;
  }

  function highlight(title, query) {
    if (!query) return escape(title);
    const at = fold(title).indexOf(query);
    if (at < 0) return escape(title);
    return (
      escape(title.slice(0, at)) +
      '<mark>' +
      escape(title.slice(at, at + query.length)) +
      '</mark>' +
      escape(title.slice(at + query.length))
    );
  }

  // ------------------------------------------------------------- sources

  function state(root) {
    let s = states.get(root);
    if (s) return s;
    s = {
      items: [],
      sources: [],
      results: [],
      active: -1,
      query: '',
      request: 0,
      timer: 0,
      opener: null,
    };
    const data = root.querySelector('script[data-spotlight-items]');
    if (data) {
      try {
        s.items = JSON.parse(data.textContent);
      } catch {
        s.items = [];
      }
    }
    // Links already on the page, for example the main navigation.
    const from = root.getAttribute('data-spotlight-links');
    if (from) {
      document.querySelectorAll(from).forEach((link) => {
        const title = link.textContent.trim();
        if (title && link.href)
          s.items.push({
            group: root.getAttribute('data-spotlight-links-group') || t('spotlight.pages', 'Pages'),
            title,
            href: link.href,
            icon: 'link',
          });
      });
    }
    states.set(root, s);
    return s;
  }

  // Add a source: a function (query, signal) => items or a Promise of items.
  function register(root, source) {
    state(root).sources.push(source);
  }

  function remote(root, query, signal) {
    const url = root.getAttribute('data-spotlight-url');
    if (!url || !query) return Promise.resolve([]);
    return fetch(url.replace('{query}', encodeURIComponent(query)), {
      signal,
      headers: { Accept: 'application/json' },
    }).then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  function recentKey(root) {
    const key = root.getAttribute('data-recent');
    return key ? 'bootcn-spotlight:' + key : null;
  }

  function recent(root) {
    const key = recentKey(root);
    if (!key) return [];
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  function remember(root, item) {
    const key = recentKey(root);
    if (!key) return;
    const list = [
      item,
      ...recent(root).filter((other) => other.title !== item.title || other.href !== item.href),
    ].slice(0, 5);
    try {
      localStorage.setItem(
        key,
        JSON.stringify(
          list.map(({ title, subtitle, href, value, icon, avatar }) => ({
            title,
            subtitle,
            href,
            value,
            icon,
            avatar,
          })),
        ),
      );
    } catch {
      // private mode: no history
    }
  }

  // ------------------------------------------------------------- results

  function limit(root) {
    return Number(root.getAttribute('data-limit')) || 5;
  }

  function group(items, query, max) {
    const groups = new Map();
    items
      .map((item, index) => ({ item, index, score: score(item, query) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .forEach(({ item }) => {
        const name = item.group || t('spotlight.results', 'Results');
        if (!groups.has(name)) groups.set(name, []);
        const list = groups.get(name);
        if (list.length < max) list.push(item);
      });
    return groups;
  }

  function glyph(item) {
    if (item.image)
      return (
        '<span class="bootcn-spotlight__glyph bootcn-spotlight__glyph--avatar"><img src="' +
        escape(item.image) +
        '" alt="" /></span>'
      );
    if (item.avatar)
      return (
        '<span class="bootcn-spotlight__glyph bootcn-spotlight__glyph--avatar" aria-hidden="true">' +
        escape(item.avatar) +
        '</span>'
      );
    const paths = ICONS[item.icon] || ICONS.page;
    return (
      '<span class="bootcn-spotlight__glyph" aria-hidden="true"><svg class="bootcn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      paths +
      '</svg></span>'
    );
  }

  function render(root, groups, query) {
    const s = state(root);
    const list = root.querySelector('[role="listbox"]');
    const input = root.querySelector('[role="combobox"]');
    // Same results as on screen: leave the list alone, so nothing moves under
    // the pointer when a slower source answers.
    const signature =
      query +
      '|' +
      [...groups]
        .map(
          ([name, items]) =>
            name + ':' + items.map((i) => i.title + '>' + (i.href || i.value || '')).join(','),
        )
        .join(';');
    if (signature === s.signature) return;
    s.signature = signature;
    s.results = [];
    let html = '';
    groups.forEach((items, name) => {
      if (!items.length) return;
      const gid = 'bootcn-spotlight-g' + ++uid;
      html +=
        '<div class="bootcn-spotlight__group" role="group" aria-labelledby="' +
        gid +
        '"><p class="bootcn-spotlight__group-title" id="' +
        gid +
        '" role="presentation">' +
        escape(name) +
        '</p>';
      items.forEach((item) => {
        const id = 'bootcn-spotlight-o' + ++uid;
        s.results.push({ id, item });
        html +=
          '<div class="bootcn-spotlight__option" role="option" id="' +
          id +
          '" aria-selected="false">' +
          glyph(item) +
          '<span class="bootcn-spotlight__text"><span class="bootcn-spotlight__title">' +
          highlight(item.title, query) +
          '</span>' +
          (item.subtitle
            ? '<span class="bootcn-spotlight__subtitle">' + escape(item.subtitle) + '</span>'
            : '') +
          '</span>' +
          (item.shortcut
            ? '<kbd class="bootcn-spotlight__hint" aria-hidden="true">' +
              escape(item.shortcut) +
              '</kbd>'
            : '') +
          '</div>';
      });
      html += '</div>';
    });
    list.innerHTML = html;
    const empty = root.querySelector('[data-spotlight-empty]');
    if (empty) {
      empty.hidden = s.results.length > 0 || !query;
      const q = empty.querySelector('[data-spotlight-query]');
      if (q) q.textContent = input.value.trim();
    }
    setActive(root, s.results.length ? 0 : -1);
    const status = root.querySelector('[data-spotlight-status]');
    if (status) {
      clearTimeout(s.statusTimer);
      const n = s.results.length;
      s.statusTimer = setTimeout(() => {
        status.textContent = query
          ? fill(
              n === 1 ? t('spotlight.one', '1 result') : t('spotlight.many', '{count} results'),
              { count: n },
            )
          : '';
      }, 400);
    }
  }

  function setActive(root, index) {
    const s = state(root);
    const input = root.querySelector('[role="combobox"]');
    root
      .querySelectorAll('[role="option"][aria-selected="true"]')
      .forEach((o) => o.setAttribute('aria-selected', 'false'));
    s.active = index;
    if (index < 0) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    const option = document.getElementById(s.results[index].id);
    option.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }

  function search(root) {
    const s = state(root);
    const input = root.querySelector('[role="combobox"]');
    const query = fold(input.value.trim());
    s.query = query;
    const request = ++s.request;
    if (s.controller) s.controller.abort();
    s.controller = 'AbortController' in window ? new AbortController() : null;
    const signal = s.controller ? s.controller.signal : undefined;

    if (!query) {
      // Empty: recent picks, then suggestions.
      const groups = new Map();
      const r = recent(root);
      if (r.length)
        groups.set(
          t('spotlight.recent', 'Recent'),
          r.map((item) => ({ ...item, icon: item.icon || 'clock' })),
        );
      const suggested = s.items.filter((item) => item.suggested);
      if (suggested.length) groups.set(t('spotlight.suggested', 'Suggestions'), suggested);
      root.classList.remove('is-loading');
      return render(root, groups, '');
    }

    const local = s.items.slice();
    render(root, group(local, query, limit(root)), query);
    const pending = [
      remote(root, query, signal),
      ...s.sources.map((source) => Promise.resolve(source(input.value.trim(), signal))),
    ];
    if (!root.hasAttribute('data-spotlight-url') && !s.sources.length) return;
    root.classList.add('is-loading');
    clearTimeout(s.timer);
    s.timer = setTimeout(() => {
      Promise.allSettled(pending).then((outcomes) => {
        if (request !== s.request) return; // a newer search replaced this one
        root.classList.remove('is-loading');
        const extra = outcomes.flatMap((o) =>
          o.status === 'fulfilled' && Array.isArray(o.value) ? o.value : [],
        );
        render(root, group(local.concat(extra), query, limit(root)), query);
      });
    }, 150);
  }

  // ---------------------------------------------------------- open/close

  function open(root, opener) {
    if (!root || root.open) return;
    const s = state(root);
    s.opener = opener || document.activeElement;
    const input = root.querySelector('[role="combobox"]');
    input.value = '';
    if (typeof root.showModal === 'function') root.showModal();
    else root.setAttribute('open', '');
    search(root);
    input.focus();
    root.dispatchEvent(new CustomEvent('bootcn:spotlight:open', { bubbles: true }));
  }

  function close(root) {
    if (!root || !root.open) return;
    if (typeof root.close === 'function') root.close();
    else root.removeAttribute('open');
  }

  function choose(root, index, event) {
    const s = state(root);
    const result = s.results[index];
    if (!result) return;
    const { item } = result;
    const detail = {
      item,
      value: item.value || item.href || item.title,
      query: root.querySelector('[role="combobox"]').value.trim(),
    };
    if (
      !root.dispatchEvent(
        new CustomEvent('bootcn:spotlight:select', { bubbles: true, cancelable: true, detail }),
      )
    )
      return;
    remember(root, item);
    close(root);
    if (item.href) {
      if (event && (event.metaKey || event.ctrlKey)) window.open(item.href, '_blank', 'noopener');
      else window.location.assign(item.href);
    }
  }

  // -------------------------------------------------------------- events

  function onInput(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root && event.target.matches('[role="combobox"]')) search(root);
  }

  function onKeydown(event) {
    // Ctrl/⌘ + the shortcut toggles; "/" opens when you are not typing.
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey) {
      document.querySelectorAll(ROOT + '[data-shortcut]').forEach((root) => {
        if (event.key.toLowerCase() !== root.getAttribute('data-shortcut').toLowerCase()) return;
        event.preventDefault();
        if (root.open) close(root);
        else open(root);
      });
    }
    if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
      const typing =
        event.target.closest &&
        event.target.closest('input, textarea, select, [contenteditable="true"]');
      const root = document.querySelector(ROOT + '[data-shortcut]');
      if (!typing && root && !root.open) {
        event.preventDefault();
        open(root);
      }
    }
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || !event.target.matches('[role="combobox"]')) return;
    const s = state(root);
    const n = s.results.length;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!n) return;
      setActive(root, (s.active + (event.key === 'ArrowDown' ? 1 : -1) + n) % n);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (s.active >= 0) choose(root, s.active, event);
    }
  }

  function onClick(event) {
    const opener = event.target.closest('[data-bootcn-spotlight-open]');
    if (opener) {
      open(document.querySelector(opener.getAttribute('data-bootcn-spotlight-open')), opener);
      return;
    }
    const root = event.target.closest(ROOT);
    if (!root) return;
    if (event.target.closest('[data-bootcn-spotlight-close]')) return close(root);
    // A click on the backdrop lands on the dialog itself.
    if (event.target === root) return close(root);
    const option = event.target.closest('[role="option"]');
    if (option) {
      const index = state(root).results.findIndex((r) => r.id === option.id);
      choose(root, index, event);
    }
  }

  function onMove(event) {
    const option = event.target.closest && event.target.closest(ROOT + ' [role="option"]');
    if (!option) return;
    const root = option.closest(ROOT);
    const index = state(root).results.findIndex((r) => r.id === option.id);
    if (index !== state(root).active) setActive(root, index);
  }

  function onClose(event) {
    const root = event.target;
    if (!root.matches || !root.matches(ROOT)) return;
    const s = state(root);
    if (s.opener && document.contains(s.opener)) s.opener.focus();
    root.dispatchEvent(new CustomEvent('bootcn:spotlight:close', { bubbles: true }));
  }

  function init() {
    if (listening) return;
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onClick);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('close', onClose, true);
    listening = true;
  }

  function destroy() {
    document.removeEventListener('input', onInput);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClick);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('close', onClose, true);
    listening = false;
  }

  ns.spotlight = { init, destroy, open, close, register, search };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
