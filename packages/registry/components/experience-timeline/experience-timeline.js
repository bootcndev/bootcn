(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.experience) return; // already loaded: idempotent

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  // "2024-01" or "2024-01-15" to a month count since year 0.
  function months(value) {
    const match = /^(\d{4})-(\d{2})/.exec(value || '');
    return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null;
  }

  function today() {
    const now = new Date();
    return now.getFullYear() * 12 + now.getMonth();
  }

  // LinkedIn counts both the first and the last month: Jan–Mar is 3 mos.
  function duration(start, end) {
    const from = months(start);
    const to = end ? months(end) : today();
    if (from === null || to === null) return '';
    const total = Math.max(1, to - from + 1);
    const years = Math.floor(total / 12);
    const rest = total % 12;
    const parts = [];
    if (years) {
      parts.push(
        years + ' ' + (years === 1 ? t('experience.year', 'yr') : t('experience.years', 'yrs')),
      );
    }
    if (rest) {
      parts.push(
        rest + ' ' + (rest === 1 ? t('experience.month', 'mo') : t('experience.months', 'mos')),
      );
    }
    return parts.join(' ');
  }

  function init(root) {
    (root || document).querySelectorAll('[data-bootcn-duration]').forEach(function (el) {
      const text = duration(el.getAttribute('data-start'), el.getAttribute('data-end'));
      if (text) el.textContent = text;
    });
  }

  ns.experience = { init: init, duration: duration };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else init();
})();
