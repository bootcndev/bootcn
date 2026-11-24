(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.dateRangeInput) return; // already loaded: idempotent

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
      error.textContent = invalid ? root.getAttribute('data-error') || 'Check the dates.' : '';
    }
    const status = root.querySelector('[data-bootcn-date-range-input-status]');
    if (status && v.start && v.end && !invalid) {
      const n = nights(v.start, v.end);
      status.textContent = n === 1 ? '1 day selected.' : n + ' days selected.';
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

  // Typing past the start date's last segment moves on to the end date.
  function onKeydown(event) {
    if (!/^\d$/.test(event.key)) return;
    const segment = event.target.closest && event.target.closest(ROOT + ' [role="spinbutton"]');
    if (!segment) return;
    const part = segment.closest('[data-bootcn-date-input]');
    const segments = part.querySelectorAll('[role="spinbutton"]');
    if (segment !== segments[segments.length - 1]) return;
    const root = part.closest(ROOT);
    const parts = root.querySelectorAll('[data-bootcn-date-input]');
    if (part !== parts[0]) return;
    // Let the date input take the digit first, then move when it is complete.
    setTimeout(function () {
      if (document.activeElement === segment && !segment.classList.contains('is-placeholder')) {
        const value = segment.textContent.trim();
        if (value.length >= 4) {
          const first = parts[1] && parts[1].querySelector('[role="spinbutton"]');
          if (first) first.focus();
        }
      }
    }, 0);
  }

  function init() {
    if (!listening) {
      document.addEventListener('bootcn:date-input:change', onChange);
      document.addEventListener('keydown', onKeydown);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(function (root) {
      check(root, false);
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('bootcn:date-input:change', onChange);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  ns.dateRangeInput = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
