(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.tree) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-tree]';
  const ITEM = '[role="treeitem"]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function group(item) {
    return item.querySelector(':scope > [role="group"]');
  }

  function isParent(item) {
    return item.hasAttribute('aria-expanded');
  }

  function isOpen(item) {
    return item.getAttribute('aria-expanded') === 'true';
  }

  function label(item) {
    const el = item.querySelector(':scope > .bootcn-tree__row .bootcn-tree__label');
    return (el ? el.textContent : '').trim();
  }

  function parentItem(item) {
    const g = item.parentElement && item.parentElement.closest('[role="group"]');
    return g ? g.closest(ITEM) : null;
  }

  // Items a person can reach: those whose parents are all open.
  function visible(root) {
    return Array.from(root.querySelectorAll(ITEM)).filter(function (item) {
      let parent = parentItem(item);
      while (parent) {
        if (!isOpen(parent)) return false;
        parent = parentItem(parent);
      }
      return true;
    });
  }

  // One item is in the Tab order at a time (roving tabindex).
  function focus(root, item) {
    root
      .querySelectorAll(ITEM)
      .forEach((other) => other.setAttribute('tabindex', other === item ? '0' : '-1'));
    item.focus();
  }

  function setOpen(root, item, open) {
    if (!isParent(item) || isOpen(item) === open) return;
    item.setAttribute('aria-expanded', String(open));
    const g = group(item);
    if (g) g.hidden = !open;
    if (open && item.hasAttribute('data-bootcn-tree-lazy')) load(root, item);
    root.dispatchEvent(
      new CustomEvent('bootcn:tree:toggle', {
        bubbles: true,
        detail: { item: item, value: item.getAttribute('data-value'), open: open },
      }),
    );
  }

  // Children that come later: bootcn:tree:load asks for them; call
  // done([{ label, value, children: true }]) with the result.
  function load(root, item) {
    item.removeAttribute('data-bootcn-tree-lazy');
    item.setAttribute('aria-busy', 'true');
    let g = group(item);
    if (!g) {
      g = document.createElement('ul');
      g.setAttribute('role', 'group');
      item.appendChild(g);
    }
    const loading = document.createElement('li');
    loading.className = 'bootcn-tree__loading';
    loading.setAttribute('role', 'none');
    loading.textContent = t('tree.loading', 'Loading…');
    g.appendChild(loading);
    const done = function (children) {
      loading.remove();
      item.removeAttribute('aria-busy');
      (children || []).forEach(function (child) {
        const li = build(root, child);
        if (root.hasAttribute('data-checkable')) {
          li.setAttribute(
            'aria-checked',
            item.getAttribute('aria-checked') === 'true' ? 'true' : 'false',
          );
        }
        g.appendChild(li);
      });
      if (!g.children.length) {
        item.removeAttribute('aria-expanded');
        g.remove();
      }
      syncChecks(root);
    };
    const proceed = root.dispatchEvent(
      new CustomEvent('bootcn:tree:load', {
        bubbles: true,
        cancelable: true,
        detail: { item: item, value: item.getAttribute('data-value'), done: done },
      }),
    );
    if (proceed) done([]);
  }

  function build(root, data) {
    const template = root.querySelector('template[data-bootcn-tree-template]');
    const li = template
      ? template.content.firstElementChild.cloneNode(true)
      : (function () {
          const el = document.createElement('li');
          el.setAttribute('role', 'treeitem');
          el.innerHTML =
            '<span class="bootcn-tree__row"><span class="bootcn-tree__toggle" aria-hidden="true"></span><span class="bootcn-tree__label"></span></span>';
          return el;
        })();
    li.setAttribute('tabindex', '-1');
    if (data.value) li.setAttribute('data-value', data.value);
    li.querySelector('.bootcn-tree__label').textContent = data.label;
    if (data.children) {
      li.setAttribute('aria-expanded', 'false');
      li.setAttribute('data-bootcn-tree-lazy', '');
    }
    return li;
  }

  // ---------------------------------------------------------------- choose

  function select(root, item) {
    if (root.hasAttribute('data-checkable')) {
      check(root, item, item.getAttribute('aria-checked') !== 'true');
      return;
    }
    const multi = root.getAttribute('aria-multiselectable') === 'true';
    root.querySelectorAll(ITEM).forEach(function (other) {
      if (other === item)
        other.setAttribute(
          'aria-selected',
          multi ? String(other.getAttribute('aria-selected') !== 'true') : 'true',
        );
      else if (!multi) other.setAttribute('aria-selected', 'false');
    });
    root.dispatchEvent(
      new CustomEvent('bootcn:tree:select', {
        bubbles: true,
        detail: { item: item, value: item.getAttribute('data-value') },
      }),
    );
  }

  // Checking a parent checks everything inside; a parent with some children
  // checked shows "mixed".
  function check(root, item, value) {
    item.setAttribute('aria-checked', String(value));
    item
      .querySelectorAll(ITEM)
      .forEach((child) => child.setAttribute('aria-checked', String(value)));
    syncChecks(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:tree:check', {
        bubbles: true,
        detail: { item: item, checked: value, values: checked(root) },
      }),
    );
  }

  function syncChecks(root) {
    if (!root.hasAttribute('data-checkable')) return;
    const parents = Array.from(root.querySelectorAll(ITEM))
      .filter((item) => group(item) && group(item).querySelector(ITEM))
      .reverse();
    parents.forEach(function (item) {
      const kids = Array.from(group(item).children).filter((el) => el.matches(ITEM));
      const states = kids.map((kid) => kid.getAttribute('aria-checked'));
      const all = states.every((s) => s === 'true');
      const none = states.every((s) => s === 'false');
      item.setAttribute('aria-checked', all ? 'true' : none ? 'false' : 'mixed');
    });
  }

  function checked(root) {
    return Array.from(root.querySelectorAll(ITEM + '[aria-checked="true"]'))
      .filter((item) => !group(item) || !group(item).querySelector(ITEM))
      .map((item) => item.getAttribute('data-value') || label(item));
  }

  // ---------------------------------------------------------------- events

  function onKeydown(event) {
    const item = event.target.closest && event.target.closest(ITEM);
    const root = item && item.closest(ROOT);
    if (!root || event.target !== item) return;
    const list = visible(root);
    const index = list.indexOf(item);
    const rtl = getComputedStyle(root).direction === 'rtl';
    const key =
      event.key === 'ArrowRight' && rtl
        ? 'ArrowLeft'
        : event.key === 'ArrowLeft' && rtl
          ? 'ArrowRight'
          : event.key;
    let handled = true;
    if (key === 'ArrowDown') {
      if (list[index + 1]) focus(root, list[index + 1]);
    } else if (key === 'ArrowUp') {
      if (list[index - 1]) focus(root, list[index - 1]);
    } else if (key === 'ArrowRight') {
      if (isParent(item) && !isOpen(item)) setOpen(root, item, true);
      else if (isOpen(item)) {
        const first = group(item) && group(item).querySelector(ITEM);
        if (first) focus(root, first);
      }
    } else if (key === 'ArrowLeft') {
      if (isOpen(item)) setOpen(root, item, false);
      else {
        const parent = parentItem(item);
        if (parent) focus(root, parent);
      }
    } else if (key === 'Home') {
      focus(root, list[0]);
    } else if (key === 'End') {
      focus(root, list[list.length - 1]);
    } else if (key === 'Enter' || key === ' ') {
      select(root, item);
    } else if (key === '*') {
      const parent = item.parentElement;
      Array.from(parent.children)
        .filter((el) => el.matches(ITEM) && isParent(el))
        .forEach((el) => setOpen(root, el, true));
    } else if (key.length === 1 && /\S/.test(key)) {
      const letter = key.toLowerCase();
      const rotated = list.slice(index + 1).concat(list.slice(0, index + 1));
      const match = rotated.find((el) => label(el).toLowerCase().startsWith(letter));
      if (match) focus(root, match);
    } else handled = false;
    if (handled) event.preventDefault();
  }

  function onClick(event) {
    const row = event.target.closest && event.target.closest('.bootcn-tree__row');
    if (!row) return;
    const item = row.closest(ITEM);
    const root = item && item.closest(ROOT);
    if (!root) return;
    focus(root, item);
    if (event.target.closest('.bootcn-tree__toggle') && isParent(item)) {
      setOpen(root, item, !isOpen(item));
      return;
    }
    // The whole row checks (in checkable trees) or selects and opens.
    select(root, item);
    if (isParent(item) && !root.hasAttribute('data-checkable')) setOpen(root, item, !isOpen(item));
  }

  function setup(root) {
    root.querySelectorAll(ITEM).forEach(function (item) {
      if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '-1');
      const g = group(item);
      if (g) g.hidden = !isOpen(item);
    });
    if (!root.querySelector(ITEM + '[tabindex="0"]')) {
      const first = root.querySelector(ITEM + '[aria-selected="true"]') || root.querySelector(ITEM);
      if (first) first.setAttribute('tabindex', '0');
    }
    syncChecks(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('click', onClick);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.tree = {
    init: init,
    destroy: destroy,
    setup: setup,
    expand: (root, item) => setOpen(root, item, true),
    collapse: (root, item) => setOpen(root, item, false),
    checked: checked,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
