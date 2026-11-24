(function () {
  'use strict';

  // Keeps the booking summary in sync with the calendar and the chosen time.
  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.booking) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-booking]';
  let listening = false;

  function update(root) {
    const date = root.querySelector('[data-bootcn-calendar-input]');
    const time = root.querySelector('input[name="time"]:checked');
    const summary = root.querySelector('[data-bootcn-booking-summary]');
    if (!summary) return;
    if (!date || !date.value || !time) {
      summary.textContent = 'Choose a day and a time.';
      return;
    }
    const day = new Date(date.value + 'T12:00:00');
    const locale = document.documentElement.lang || undefined;
    const text = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(day);
    summary.textContent = text + ' at ' + time.value;
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root) update(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('change', onChange);
      document.addEventListener('bootcn:calendar:select', onChange);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(update);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('change', onChange);
    document.removeEventListener('bootcn:calendar:select', onChange);
    listening = false;
  }

  ns.booking = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
