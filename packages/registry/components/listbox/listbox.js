(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.listbox) return; // already loaded: idempotent

  const ROOT = '[role="listbox"][data-bootcn-listbox]';
  let listening = false;

  const options = (box) => Array.from(box.querySelectorAll('[role="option"]'));
  const multiple = (box) => box.getAttribute('aria-multiselectable') === 'true';

  function setActive(box, option) {
    options(box).forEach((o) => o.classList.toggle('is-active', o === option));
    if (option) {
      box.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    }
  }

  function active(box) {
    return document.getElementById(box.getAttribute('aria-activedescendant')) || null;
  }

  function syncInputs(box) {
    const name = box.getAttribute('data-bootcn-listbox-name');
    if (!name) return;
    let holder = box.nextElementSibling;
    if (!holder || !holder.hasAttribute('data-bootcn-listbox-values')) {
      holder = document.createElement('div');
      holder.hidden = true;
      holder.setAttribute('data-bootcn-listbox-values', '');
      box.after(holder);
    }
    holder.textContent = '';
    options(box)
      .filter((o) => o.getAttribute('aria-selected') === 'true')
      .forEach((o) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = multiple(box) ? name + '[]' : name;
        input.value = o.getAttribute('data-value') || o.textContent.trim();
        holder.appendChild(input);
      });
  }

  function choose(box, option) {
    if (multiple(box)) {
      option.setAttribute('aria-selected', String(option.getAttribute('aria-selected') !== 'true'));
    } else {
      options(box).forEach((o) => o.setAttribute('aria-selected', String(o === option)));
    }
    syncInputs(box);
    box.dispatchEvent(
      new CustomEvent('bootcn:listbox:change', {
        bubbles: true,
        detail: {
          value: options(box)
            .filter((o) => o.getAttribute('aria-selected') === 'true')
            .map((o) => o.getAttribute('data-value')),
        },
      }),
    );
  }

  function onKeydown(event) {
    const box = event.target.closest && event.target.closest(ROOT);
    if (!box || event.target !== box) return;
    const list = options(box);
    const index = list.indexOf(active(box));
    let next = null;
    if (event.key === 'ArrowDown') next = list[Math.min(list.length - 1, index + 1)];
    else if (event.key === 'ArrowUp') next = list[Math.max(0, index - 1)];
    else if (event.key === 'Home') next = list[0];
    else if (event.key === 'End') next = list[list.length - 1];
    else if (event.key === ' ' || event.key === 'Enter') {
      if (index >= 0) {
        event.preventDefault();
        choose(box, list[index]);
      }
      return;
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      const key = event.key.toLowerCase();
      const rotated = list.slice(index + 1).concat(list.slice(0, index + 1));
      next = rotated.find((o) => o.textContent.trim().toLowerCase().startsWith(key)) || null;
    }
    if (!next) return;
    event.preventDefault();
    setActive(box, next);
  }

  function onClick(event) {
    const option = event.target.closest && event.target.closest(ROOT + ' [role="option"]');
    if (!option) return;
    const box = option.closest(ROOT);
    box.focus();
    setActive(box, option);
    choose(box, option);
  }

  // On focus, start on the (first) selected option.
  function onFocus(event) {
    const box = event.target;
    if (!(box instanceof Element) || !box.matches(ROOT) || active(box)) return;
    const list = options(box);
    setActive(box, list.find((o) => o.getAttribute('aria-selected') === 'true') || list[0]);
  }

  function init(root = document) {
    root.querySelectorAll(ROOT).forEach(syncInputs);
    if (listening) return;
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onClick);
    document.addEventListener('focusin', onFocus);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClick);
    document.removeEventListener('focusin', onFocus);
    listening = false;
  }

  ns.listbox = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
