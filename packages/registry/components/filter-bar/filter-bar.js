(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.filterBar) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-filters]';
  const FILTER = '[data-bootcn-filter]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function q(el, name) {
    return el.querySelector('[data-bootcn-filters-' + name + ']');
  }

  function filters(root) {
    return Array.from(root.querySelectorAll(FILTER));
  }

  function nameOf(filter) {
    return filter.getAttribute('data-bootcn-filter');
  }

  function labelOf(filter) {
    return filter.getAttribute('data-label') || nameOf(filter);
  }

  // ---------------------------------------------------------------- values

  function value(filter) {
    const type = filter.getAttribute('data-type') || 'multi';
    if (type === 'range') {
      const min = filter.querySelector('[data-bootcn-filter-min]').value;
      const max = filter.querySelector('[data-bootcn-filter-max]').value;
      return min === '' && max === ''
        ? null
        : { min: min === '' ? null : Number(min), max: max === '' ? null : Number(max) };
    }
    if (type === 'single') {
      const checked = filter.querySelector('input:checked');
      return checked && checked.value ? checked.value : null;
    }
    const values = Array.from(filter.querySelectorAll('input:checked')).map((i) => i.value);
    return values.length ? values : null;
  }

  function values(root) {
    const out = {};
    filters(root).forEach(function (filter) {
      const v = value(filter);
      if (v !== null) out[nameOf(filter)] = v;
    });
    const search = q(root, 'search');
    if (search && search.value.trim()) out.search = search.value.trim();
    return out;
  }

  function money(filter, n) {
    const currency = filter.getAttribute('data-currency');
    if (!currency) return String(n);
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n);
    } catch {
      return String(n);
    }
  }

  // "Status", or "Status: Lead, Customer", or "Status: Lead +2".
  function summary(filter, v) {
    if (v === null) return labelOf(filter);
    const type = filter.getAttribute('data-type') || 'multi';
    let text;
    if (type === 'range') {
      if (v.min !== null && v.max !== null)
        text = money(filter, v.min) + '–' + money(filter, v.max);
      else if (v.min !== null)
        text = t('filters.atLeast', '{n}+').replace('{n}', money(filter, v.min));
      else text = t('filters.atMost', 'up to {n}').replace('{n}', money(filter, v.max));
    } else {
      const labels = Array.from(filter.querySelectorAll('input:checked')).map(function (input) {
        const label = filter.querySelector('label[for="' + input.id + '"]');
        return label ? label.textContent.trim() : input.value;
      });
      text = labels.length > 2 ? labels[0] + ' +' + (labels.length - 1) : labels.join(', ');
    }
    return labelOf(filter) + ': ' + text;
  }

  // ------------------------------------------------------------- matching

  function matches(item, all) {
    return Object.keys(all).every(function (key) {
      const v = all[key];
      if (key === 'search') {
        const hay = (item.getAttribute('data-search') || item.textContent).toLowerCase();
        return hay.indexOf(v.toLowerCase()) >= 0;
      }
      const raw = item.getAttribute('data-' + key);
      if (raw === null) return true;
      if (Array.isArray(v)) {
        const own = raw.split(',').map((s) => s.trim());
        return v.some((x) => own.indexOf(x) >= 0);
      }
      if (typeof v === 'object') {
        const n = Number(raw);
        return (v.min === null || n >= v.min) && (v.max === null || n <= v.max);
      }
      // Single choice: a number of days back ("7" = the last 7 days) or a value.
      if (/^\d+$/.test(v) && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
        return Date.now() - new Date(raw).getTime() <= Number(v) * 86400000;
      }
      return raw === v;
    });
  }

  function apply(root, announce) {
    const all = values(root);
    filters(root).forEach(function (filter) {
      const v = value(filter);
      const label = filter.querySelector('[data-bootcn-filter-label]');
      if (label) label.textContent = summary(filter, v);
      filter.classList.toggle('is-active', v !== null);
      const clear = filter.querySelector('[data-bootcn-filter-clear]');
      if (clear) {
        clear.hidden = v === null;
        clear.setAttribute(
          'aria-label',
          t('filters.clearOne', 'Clear {name} filter').replace('{name}', labelOf(filter)),
        );
      }
    });
    const any = Object.keys(all).length > 0;
    const clearAll = q(root, 'clear-all');
    if (clearAll) clearAll.hidden = !any;
    const target = document.querySelector(root.getAttribute('data-target') || '');
    let shown = null;
    let total = null;
    if (target) {
      const items = Array.from(target.querySelectorAll('[data-bootcn-filter-item]'));
      total = items.length;
      shown = 0;
      items.forEach(function (item) {
        item.hidden = !matches(item, all);
        if (!item.hidden) shown++;
      });
      const count = q(root, 'count');
      const text = t('filters.count', '{shown} of {total}')
        .replace('{shown}', String(shown))
        .replace('{total}', String(total));
      if (count)
        count.textContent =
          text + (root.getAttribute('data-noun') ? ' ' + root.getAttribute('data-noun') : '');
      const empty = document.querySelector(root.getAttribute('data-empty') || '');
      if (empty) empty.hidden = shown > 0;
      const live = q(root, 'live');
      if (announce && live && count) live.textContent = count.textContent;
    }
    root.dispatchEvent(
      new CustomEvent('bootcn:filters:change', {
        bubbles: true,
        detail: { values: all, shown: shown, total: total },
      }),
    );
  }

  function clear(filter) {
    filter.querySelectorAll('input').forEach(function (input) {
      if (input.type === 'checkbox' || input.type === 'radio')
        input.checked = input.value === '' && input.type === 'radio';
      else input.value = '';
    });
  }

  // --------------------------------------------------------------- popovers

  function open(filter) {
    const root = filter.closest(ROOT);
    filters(root).forEach((other) => other !== filter && close(other, false));
    const panel = filter.querySelector('[data-bootcn-filter-panel]');
    const toggle = filter.querySelector('[data-bootcn-filter-toggle]');
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    // Near the edge of the screen, the panel lines up with the chip's other side.
    panel.classList.remove('is-flipped');
    const box = panel.getBoundingClientRect();
    if (box.right > document.documentElement.clientWidth - 8 || box.left < 8) {
      panel.classList.add('is-flipped');
    }
    const first = panel.querySelector('input:checked, input');
    if (first) first.focus();
  }

  function close(filter, returnFocus) {
    const panel = filter.querySelector('[data-bootcn-filter-panel]');
    const toggle = filter.querySelector('[data-bootcn-filter-toggle]');
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle.focus();
  }

  function onClick(event) {
    const target = event.target;
    const filter = target.closest && target.closest(FILTER);
    // Outside a filter: close any open panel.
    document.querySelectorAll(FILTER).forEach(function (other) {
      if (other !== filter) close(other, false);
    });
    const button = target.closest && target.closest('button');
    if (!button) return;
    const root = button.closest(ROOT);
    if (!root) return;
    if (button.hasAttribute('data-bootcn-filter-toggle')) {
      if (filter.querySelector('[data-bootcn-filter-panel]').hidden) open(filter);
      else close(filter, false);
    } else if (button.hasAttribute('data-bootcn-filter-clear')) {
      clear(filter);
      close(filter, false);
      apply(root, true);
      filter.querySelector('[data-bootcn-filter-toggle]').focus();
    } else if (button.hasAttribute('data-bootcn-filter-done')) {
      close(filter, true);
    } else if (button.hasAttribute('data-bootcn-filters-clear-all')) {
      filters(root).forEach(clear);
      const search = q(root, 'search');
      if (search) search.value = '';
      apply(root, true);
      const first = root.querySelector('[data-bootcn-filter-toggle], [data-bootcn-filters-search]');
      if (first) first.focus();
    }
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root) apply(root, true);
  }

  function onInput(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root && event.target.matches('[data-bootcn-filters-search], input[type="number"]'))
      apply(root, true);
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    const filter = event.target.closest && event.target.closest(FILTER);
    if (filter && !filter.querySelector('[data-bootcn-filter-panel]').hidden) {
      event.preventDefault();
      close(filter, true);
    }
  }

  function onFocusOut(event) {
    const filter = event.target.closest && event.target.closest(FILTER);
    if (filter && event.relatedTarget && !filter.contains(event.relatedTarget))
      close(filter, false);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('change', onChange);
      document.addEventListener('input', onInput);
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('focusout', onFocusOut);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach((root) => apply(root, false));
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('change', onChange);
    document.removeEventListener('input', onInput);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('focusout', onFocusOut);
    listening = false;
  }

  ns.filterBar = { init: init, destroy: destroy, apply: apply, values: values };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
