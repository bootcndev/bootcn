(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.dateRangeInput) return; // already loaded: idempotent

  // Messages: override them for your language with window.Bootcn.messages,
  // e.g. { 'copy.done': 'Αντιγράφηκε.' } (see the Translations guide).
  // Plural keys end in .one, .other… as chosen by Intl.PluralRules.
  function t(key, fallback, vars) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    let text = typeof custom === 'string' ? custom : fallback;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(String(vars[name]));
    });
    return text;
  }

  function tn(key, count, one, other, vars) {
    let category = count === 1 ? 'one' : 'other';
    try {
      category = new Intl.PluralRules(document.documentElement.lang || undefined).select(count);
    } catch {
      // Unknown language tag: keep the English rule.
    }
    const messages = (window.Bootcn && window.Bootcn.messages) || {};
    const own = messages[key + '.' + category];
    const fallback = typeof own === 'string' ? own : count === 1 ? one : other;
    return t(key + '.' + category, fallback, Object.assign({ count: count }, vars));
  }

  const ROOT = '[data-bootcn-date-range-input]';
  let listening = false;

  function values(root) {
    const inputs = root.querySelectorAll('[data-bootcn-date-input-native]');
    return { start: inputs[0] ? inputs[0].value : '', end: inputs[1] ? inputs[1].value : '' };
  }

  function nights(start, end) {
    const ms = new Date(end + 'T12:00:00') - new Date(start + 'T12:00:00');
    return Math.round(ms / 86400000);
  }

  // Checks the order of the two dates and reports the length of the range.
  function check(root, emit) {
    const v = values(root);
    const invalid = Boolean(v.start && v.end && v.end < v.start);
    root.classList.toggle('is-invalid', invalid);
    root.querySelectorAll('[role="spinbutton"]').forEach(function (segment) {
      if (invalid) segment.setAttribute('aria-invalid', 'true');
      else if (!segment.closest('.bootcn-date-input__control.is-invalid')) {
        segment.removeAttribute('aria-invalid');
      }
    });
    const error = root.querySelector('.bootcn-date-range-input__error');
    if (error) {
      error.hidden = !invalid;
      error.textContent = invalid
        ? root.getAttribute('data-error') || t('date-range-input.order', 'Check the dates.')
        : '';
    }
    const status = root.querySelector('[data-bootcn-date-range-input-status]');
    if (status && v.start && v.end && !invalid) {
      const n = nights(v.start, v.end);
      status.textContent = tn(
        'date-range-input.count',
        n,
        '1 day selected.',
        '{count} days selected.',
      );
    }
    if (emit) {
      root.dispatchEvent(
        new CustomEvent('bootcn:date-range-input:change', {
          bubbles: true,
          detail: { start: v.start, end: v.end, valid: !invalid },
        }),
      );
    }
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root) check(root, true);
  }

  function init() {
    if (!listening) {
      document.addEventListener('bootcn:date-input:change', onChange);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(function (root) {
      check(root, false);
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('bootcn:date-input:change', onChange);
    listening = false;
  }

  ns.dateRangeInput = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
