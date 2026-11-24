(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.dateRangePicker) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-date-range-picker]';
  let listening = false;

  function parts(root) {
    return {
      trigger: root.querySelector('[data-bs-toggle="dropdown"]'),
      text: root.querySelector('[data-bootcn-date-range-picker-text]'),
      calendar: root.querySelector('[data-bootcn-calendar]'),
    };
  }

  function toDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }

  function sync(root) {
    const { trigger, text, calendar } = parts(root);
    if (!trigger || !text || !calendar) return;
    if (!text.hasAttribute('data-placeholder'))
      text.setAttribute('data-placeholder', text.textContent);
    const start = toDate(calendar.getAttribute('data-start'));
    const end = toDate(calendar.getAttribute('data-end'));
    const owner = root.closest('[lang]');
    const format = new Intl.DateTimeFormat((owner && owner.getAttribute('lang')) || 'en', {
      dateStyle: 'medium',
    });
    let label = null;
    if (start && end && typeof format.formatRange === 'function')
      label = format.formatRange(start, end);
    else if (start && end) label = format.format(start) + ' – ' + format.format(end);
    else if (start) label = format.format(start) + ' – …';
    text.textContent = label || text.getAttribute('data-placeholder');
    trigger.toggleAttribute('data-empty', !label);
  }

  function onSelect(event) {
    const root = event.target.closest(ROOT);
    if (!root) return;
    sync(root);
    if (!event.detail || !event.detail.complete) return;
    const { trigger } = parts(root);
    if (window.bootstrap && trigger) window.bootstrap.Dropdown.getOrCreateInstance(trigger).hide();
    if (trigger) trigger.focus();
  }

  function onShown(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root && ns.calendar) ns.calendar.focus(parts(root).calendar);
  }

  function init(root = document) {
    if (!window.bootstrap || !window.bootstrap.Dropdown) {
      console.error(
        '[bootcn] date-range-picker: Bootstrap JavaScript is required. Load the Bootstrap bundle before bootcn date-range-picker.js.',
      );
      return;
    }
    root.querySelectorAll(ROOT).forEach(sync);
    if (listening) return;
    document.addEventListener('bootcn:calendar:select', onSelect);
    document.addEventListener('shown.bs.dropdown', onShown);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('bootcn:calendar:select', onSelect);
    document.removeEventListener('shown.bs.dropdown', onShown);
    listening = false;
  }

  ns.dateRangePicker = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
