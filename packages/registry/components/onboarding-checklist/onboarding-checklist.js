(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.checklist) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-checklist]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function items(root) {
    return Array.from(root.querySelectorAll('[data-bootcn-checklist-item]'));
  }

  function storageKey(root) {
    return root.getAttribute('data-storage-key');
  }

  // With data-storage-key, progress and dismissal are remembered in this
  // browser. Keep the real state on your server when it matters.
  function load(root) {
    const key = storageKey(root);
    if (!key) return null;
    try {
      return JSON.parse(localStorage.getItem(key) || 'null');
    } catch {
      return null;
    }
  }

  function save(root) {
    const key = storageKey(root);
    if (!key) return;
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          done: items(root)
            .filter((item) => item.classList.contains('is-done'))
            .map((item) => item.getAttribute('data-bootcn-checklist-item')),
          dismissed: root.hidden,
        }),
      );
    } catch {
      /* storage blocked: progress lasts for this page only */
    }
  }

  function render(root, announce) {
    const list = items(root);
    const done = list.filter((item) => item.classList.contains('is-done')).length;
    const total = list.length;
    const count = root.querySelector('[data-bootcn-checklist-count]');
    if (count) {
      count.textContent = t('checklist.count', '{done} of {total} done')
        .replace('{done}', String(done))
        .replace('{total}', String(total));
    }
    const bar = root.querySelector('[data-bootcn-checklist-progress]');
    if (bar) {
      const percent = total ? Math.round((done / total) * 100) : 0;
      bar.value = percent;
      bar.textContent = percent + '%';
    }
    list.forEach(function (item) {
      const toggle = item.querySelector('[data-bootcn-checklist-toggle]');
      if (toggle) toggle.setAttribute('aria-pressed', String(item.classList.contains('is-done')));
    });
    const complete = total > 0 && done === total;
    root.classList.toggle('is-complete', complete);
    const message = root.querySelector('[data-bootcn-checklist-complete]');
    if (message) message.hidden = !complete;
    const live = root.querySelector('[data-bootcn-checklist-live]');
    if (announce && live) {
      live.textContent = complete
        ? t('checklist.allDone', 'All done!')
        : count
          ? count.textContent
          : '';
    }
    return complete;
  }

  function set(root, id, value) {
    const item = root.querySelector('[data-bootcn-checklist-item="' + CSS.escape(id) + '"]');
    if (!item) return;
    const before = item.classList.contains('is-done');
    if (before === value) return;
    item.classList.toggle('is-done', value);
    const wasComplete = root.classList.contains('is-complete');
    const complete = render(root, true);
    save(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:checklist:change', {
        bubbles: true,
        detail: { id: id, done: value },
      }),
    );
    if (complete && !wasComplete) {
      root.dispatchEvent(new CustomEvent('bootcn:checklist:complete', { bubbles: true }));
    }
  }

  function setExpanded(root, expanded) {
    const toggle = root.querySelector('[data-bootcn-checklist-collapse]');
    const body = root.querySelector('[data-bootcn-checklist-body]');
    if (toggle) toggle.setAttribute('aria-expanded', String(expanded));
    if (body) body.hidden = !expanded;
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('button, a');
    if (!button) return;
    const root = button.closest(ROOT);
    if (!root) return;
    const item = button.closest('[data-bootcn-checklist-item]');
    if (button.hasAttribute('data-bootcn-checklist-toggle') && item) {
      set(
        root,
        item.getAttribute('data-bootcn-checklist-item'),
        !item.classList.contains('is-done'),
      );
    } else if (button.hasAttribute('data-bootcn-checklist-collapse')) {
      setExpanded(root, button.getAttribute('aria-expanded') !== 'true');
    } else if (button.hasAttribute('data-bootcn-checklist-dismiss')) {
      root.hidden = true;
      save(root);
      root.dispatchEvent(new CustomEvent('bootcn:checklist:dismiss', { bubbles: true }));
    } else if (button.hasAttribute('data-bootcn-checklist-done-on-click') && item) {
      // For actions that finish the task by themselves (a link to a page).
      set(root, item.getAttribute('data-bootcn-checklist-item'), true);
    }
  }

  function setup(root) {
    const stored = load(root);
    if (stored) {
      items(root).forEach(function (item) {
        item.classList.toggle(
          'is-done',
          (stored.done || []).indexOf(item.getAttribute('data-bootcn-checklist-item')) >= 0,
        );
      });
      if (stored.dismissed) root.hidden = true;
    }
    render(root, false);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.checklist = {
    init: init,
    destroy: destroy,
    setup: setup,
    complete: function (root, id) {
      set(root, id, true);
    },
    undo: function (root, id) {
      set(root, id, false);
    },
    reset: function (root) {
      items(root).forEach((item) => item.classList.remove('is-done'));
      root.hidden = false;
      render(root, false);
      save(root);
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
