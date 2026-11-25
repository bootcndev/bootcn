(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.productListing) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-listing]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function q(root, name) {
    return root.querySelector('[data-bootcn-listing-' + name + ']');
  }

  function items(root) {
    return Array.from(root.querySelectorAll('[data-bootcn-listing-item]'));
  }

  function product(item) {
    return item.querySelector('[data-bootcn-product]') || item;
  }

  // Reads the filter form: checked categories and colours, price range, rating.
  function criteria(root) {
    const form = q(root, 'filters');
    const data = form ? new FormData(form) : new FormData();
    const number = function (name) {
      const value = data.get(name);
      return value === null || value === '' ? null : Number(value);
    };
    return {
      categories: data.getAll('category[]'),
      colors: data.getAll('color[]'),
      min: number('min'),
      max: number('max'),
      rating: number('rating') || 0,
    };
  }

  function matches(item, c) {
    const p = product(item);
    const price = Number(p.getAttribute('data-price'));
    const rating = Number(p.getAttribute('data-rating'));
    const colors = (p.getAttribute('data-colors') || '').split(',');
    if (c.categories.length && c.categories.indexOf(p.getAttribute('data-category')) < 0)
      return false;
    if (c.colors.length && !c.colors.some((color) => colors.indexOf(color) >= 0)) return false;
    if (c.min !== null && price < c.min) return false;
    if (c.max !== null && price > c.max) return false;
    if (rating < c.rating) return false;
    return true;
  }

  function apply(root, announce) {
    const c = criteria(root);
    let shown = 0;
    items(root).forEach(function (item) {
      item.hidden = !matches(item, c);
      if (!item.hidden) shown++;
    });
    const text = (
      shown === 1 ? t('listing.one', '1 product') : t('listing.many', '{n} products')
    ).replace('{n}', String(shown));
    const count = q(root, 'count');
    if (count) count.textContent = text;
    const empty = q(root, 'empty');
    if (empty) empty.hidden = shown > 0;
    const active =
      c.categories.length + c.colors.length + (c.min !== null) + (c.max !== null) + (c.rating > 0);
    const badge = q(root, 'active');
    if (badge) {
      badge.textContent = active ? String(active) : '';
      badge.hidden = !active;
    }
    const live = q(root, 'live');
    if (announce && live) live.textContent = text;
    root.dispatchEvent(
      new CustomEvent('bootcn:listing:filter', {
        bubbles: true,
        detail: Object.assign({ shown: shown }, c),
      }),
    );
  }

  function sort(root, by) {
    const grid = q(root, 'grid');
    if (!grid) return;
    const list = items(root);
    // "featured" is the original order.
    list.forEach(function (item, i) {
      if (!item.hasAttribute('data-order')) item.setAttribute('data-order', String(i));
    });
    const value = function (item) {
      const p = product(item);
      if (by === 'price-asc' || by === 'price-desc') return Number(p.getAttribute('data-price'));
      if (by === 'rating') return -Number(p.getAttribute('data-rating'));
      return Number(item.getAttribute('data-order'));
    };
    const factor = by === 'price-desc' ? -1 : 1;
    list.sort((a, b) => (value(a) - value(b)) * factor).forEach((item) => grid.appendChild(item));
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    if (event.target.matches('[data-bootcn-listing-sort]')) sort(root, event.target.value);
    else if (event.target.closest('[data-bootcn-listing-filters]')) apply(root, true);
  }

  function onInput(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (
      root &&
      event.target.type === 'number' &&
      event.target.closest('[data-bootcn-listing-filters]')
    ) {
      apply(root, true);
    }
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('[data-bootcn-listing-clear]');
    if (!button) return;
    const root = button.closest(ROOT);
    const form = q(root, 'filters');
    if (form) form.reset();
    apply(root, true);
    const first = form && form.querySelector('input');
    if (first && button.closest('[data-bootcn-listing-empty]')) first.focus();
  }

  // "Show results" in the phone drawer: the results are already up to date.
  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-bootcn-listing-filters'))
      return;
    event.preventDefault();
    apply(form.closest(ROOT), true);
  }

  function init() {
    if (!listening) {
      document.addEventListener('submit', onSubmit);
      document.addEventListener('change', onChange);
      document.addEventListener('input', onInput);
      document.addEventListener('click', onClick);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(function (root) {
      apply(root, false);
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('change', onChange);
    document.removeEventListener('input', onInput);
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.productListing = { init: init, destroy: destroy, apply: apply, sort: sort };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
