(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.command) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-command]';
  const INIT = 'data-bootcn-command-initialized';
  const cleanups = new Map();
  let listening = false;

  function fold(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function setup(root) {
    const input = root.querySelector('.bootcn-command__input');
    const list = root.querySelector('[role="listbox"]');
    if (!input || !list) return null;
    const empty = root.querySelector('.bootcn-command__empty');
    const status = root.querySelector('[data-bootcn-command-status]');
    const items = Array.from(list.querySelectorAll('[role="option"]'));
    let active = null;

    const visible = () => items.filter((item) => !item.hidden && !item.closest('[hidden]'));

    function setActive(item) {
      if (active) {
        active.classList.remove('is-active');
        active.setAttribute('aria-selected', 'false');
      }
      active = item;
      if (item) {
        item.classList.add('is-active');
        item.setAttribute('aria-selected', 'true');
        input.setAttribute('aria-activedescendant', item.id);
        item.scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function filter() {
      const query = fold(input.value.trim());
      items.forEach((item) => {
        const text = fold(item.textContent + ' ' + (item.getAttribute('data-keywords') || ''));
        item.hidden = query !== '' && !text.includes(query);
      });
      list.querySelectorAll('[role="group"]').forEach((group) => {
        group.hidden = !group.querySelector('[role="option"]:not([hidden])');
      });
      // A separator shows only between two visible groups.
      list.querySelectorAll('.bootcn-command__separator').forEach((separator) => {
        const prev = separator.previousElementSibling;
        const next = separator.nextElementSibling;
        separator.hidden = !(prev && !prev.hidden && next && !next.hidden);
      });
      const count = visible().length;
      list.hidden = count === 0;
      if (empty) empty.hidden = count !== 0;
      input.setAttribute('aria-expanded', String(count !== 0));
      if (status)
        status.textContent =
          count === 0 ? 'No results.' : count + (count === 1 ? ' result.' : ' results.');
      setActive(visible()[0] || null);
    }

    function run(item) {
      root.dispatchEvent(
        new CustomEvent('bootcn:command:select', {
          bubbles: true,
          detail: { value: item.getAttribute('data-value'), item: item },
        }),
      );
      const href = item.getAttribute('data-href');
      const dialog = root.closest('.modal');
      if (dialog && window.bootstrap) window.bootstrap.Modal.getOrCreateInstance(dialog).hide();
      if (href) window.location.href = href;
    }

    function move(step) {
      const list = visible();
      if (list.length === 0) return;
      const index = list.indexOf(active);
      setActive(list[(index + step + list.length) % list.length]);
    }

    function onKeydown(event) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        move(event.key === 'ArrowDown' ? 1 : -1);
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const list = visible();
        setActive(event.key === 'Home' ? list[0] : list[list.length - 1]);
      } else if (event.key === 'Enter' && active) {
        event.preventDefault();
        run(active);
      }
    }

    function onPointer(event) {
      const item = event.target.closest('[role="option"]');
      if (!item) return;
      if (event.type === 'mousemove') {
        if (item !== active) setActive(item);
        return;
      }
      event.preventDefault();
      run(item);
    }

    function reset() {
      input.value = '';
      filter();
    }

    input.addEventListener('input', filter);
    input.addEventListener('keydown', onKeydown);
    list.addEventListener('mousemove', onPointer);
    list.addEventListener('click', onPointer);
    root.setAttribute(INIT, '');
    filter();

    const cleanup = function () {
      input.removeEventListener('input', filter);
      input.removeEventListener('keydown', onKeydown);
      list.removeEventListener('mousemove', onPointer);
      list.removeEventListener('click', onPointer);
      root.removeAttribute(INIT);
    };
    cleanup.reset = reset;
    cleanup.input = input;
    return cleanup;
  }

  // Dialog palettes: reset and focus the search when shown; Ctrl/⌘ + key opens.
  function onShown(event) {
    const root = event.target.querySelector && event.target.querySelector(ROOT);
    const entry = root && cleanups.get(root);
    if (!entry) return;
    entry.reset();
    entry.input.focus();
  }

  function onShortcut(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
    const key = event.key.toLowerCase();
    const dialog = document.querySelector('[data-bootcn-command-shortcut="' + key + '"]');
    if (!dialog || !window.bootstrap) return;
    event.preventDefault();
    window.bootstrap.Modal.getOrCreateInstance(dialog).toggle();
  }

  function init(root = document) {
    root.querySelectorAll(ROOT + ':not([' + INIT + '])').forEach((element) => {
      const cleanup = setup(element);
      if (cleanup) cleanups.set(element, cleanup);
    });
    if (!listening) {
      document.addEventListener('shown.bs.modal', onShown);
      document.addEventListener('keydown', onShortcut);
      listening = true;
    }
  }

  function destroy(root = document) {
    cleanups.forEach((cleanup, element) => {
      if (root === document || root.contains(element)) {
        cleanup();
        cleanups.delete(element);
      }
    });
    if (root === document && listening) {
      document.removeEventListener('shown.bs.modal', onShown);
      document.removeEventListener('keydown', onShortcut);
      listening = false;
    }
  }

  ns.command = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
