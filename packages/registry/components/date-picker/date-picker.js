(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.datePicker) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-date-picker]';
  let listening = false;

  function parts(root) {
    return {
      trigger: root.querySelector('[data-bs-toggle="dropdown"]'),
      text: root.querySelector('[data-bootcn-date-picker-text]'),
      calendar: root.querySelector('[data-bootcn-calendar]'),
    };
  }

  function format(root, value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    if (!match) return null;
    const owner = root.closest('[lang]');
    const locale = (owner && owner.getAttribute('lang')) || 'en';
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date);
  }

  function sync(root) {
    const { trigger, text, calendar } = parts(root);
    if (!trigger || !text || !calendar) return;
    const label = format(root, calendar.getAttribute('data-value'));
    if (!text.hasAttribute('data-placeholder'))
      text.setAttribute('data-placeholder', text.textContent);
    text.textContent = label || text.getAttribute('data-placeholder');
    trigger.toggleAttribute('data-empty', !label);
  }

  function onSelect(event) {
    const root = event.target.closest(ROOT);
    if (!root) return;
    sync(root);
    const { trigger } = parts(root);
    if (window.bootstrap && trigger) window.bootstrap.Dropdown.getOrCreateInstance(trigger).hide();
    if (trigger) trigger.focus();
  }

  // Move focus into the calendar (the selected day, or today) when it opens.
  function onShown(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || !ns.calendar) return;
    ns.calendar.focus(parts(root).calendar);
  }

  function init(root = document) {
    if (!window.bootstrap || !window.bootstrap.Dropdown) {
      console.error(
        '[bootcn] date-picker: Bootstrap JavaScript is required. Load the Bootstrap bundle before bootcn date-picker.js.',
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

  ns.datePicker = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
