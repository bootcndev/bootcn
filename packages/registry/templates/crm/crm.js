/*
 * CRM: the dark mode toggle. The theme is set before the first
 * paint by the inline script in <head>; this keeps the toggle in sync, saves
 * the choice, and follows the system setting until the user picks one.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'bootcn-theme';
  var TOGGLE = '[data-bootcn-theme-toggle]';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var observer = null;
  var initialized = false;

  function current() {
    return root.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
  }

  function saved() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function syncToggles() {
    var pressed = String(current() === 'dark');
    document.querySelectorAll(TOGGLE).forEach(function (button) {
      button.setAttribute('aria-pressed', pressed);
    });
  }

  function setTheme(theme, remember) {
    root.setAttribute('data-bs-theme', theme);
    if (remember) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Storage unavailable (private mode): the choice lasts for this page only.
      }
    }
  }

  function onClick(event) {
    var button = event.target.closest(TOGGLE);
    if (!button) return;
    setTheme(current() === 'dark' ? 'light' : 'dark', true);
  }

  function onSystemChange(event) {
    if (saved() === null) setTheme(event.matches ? 'dark' : 'light', false);
  }

  function init() {
    if (initialized) return;
    initialized = true;
    document.addEventListener('click', onClick);
    media.addEventListener('change', onSystemChange);
    // Keep aria-pressed right whoever changes the theme.
    observer = new MutationObserver(syncToggles);
    observer.observe(root, { attributes: true, attributeFilter: ['data-bs-theme'] });
    syncToggles();
  }

  function destroy() {
    if (!initialized) return;
    initialized = false;
    document.removeEventListener('click', onClick);
    media.removeEventListener('change', onSystemChange);
    if (observer) observer.disconnect();
    observer = null;
  }

  window.Bootcn = window.Bootcn || {};
  window.Bootcn.crm = { init: init, destroy: destroy, setTheme: setTheme };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/*
 * CRM: pipeline totals, notes on the contact page and the add-contact form.
 */
(function () {
  'use strict';

  function money(value) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return '$' + Math.round(value);
    }
  }

  // Each pipeline column shows the value of its deals; the stats follow.
  function pipelineTotals() {
    const board = document.querySelector('[data-crm-pipeline]');
    if (!board) return;
    let open = 0;
    let won = 0;
    board.querySelectorAll('[data-bootcn-kanban-column]').forEach(function (column) {
      let sum = 0;
      column.querySelectorAll('[data-value]').forEach(function (card) {
        sum += Number(card.getAttribute('data-value')) || 0;
      });
      const total = column.querySelector('[data-crm-column-total]');
      if (total) total.textContent = money(sum);
      if (column.getAttribute('data-bootcn-kanban-column') === 'won') won += sum;
      else open += sum;
    });
    const set = function (name, text) {
      const el = document.querySelector('[data-crm-stat="' + name + '"]');
      if (el) el.textContent = text;
    };
    set('open', money(open));
    set('won', money(won));
  }

  // Contact page: a note joins the top of the activity timeline.
  function onSubmit(event) {
    const form = event.target;
    if (form.matches && form.matches('[data-crm-note-form]')) {
      event.preventDefault();
      const field = form.querySelector('textarea');
      const text = field.value.trim();
      if (!text) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
        return;
      }
      field.removeAttribute('aria-invalid');
      const list = document.querySelector('[data-crm-activity]');
      const template = list && list.querySelector('[data-crm-note-template]');
      if (!list || !template) return;
      const item = template.content.firstElementChild.cloneNode(true);
      item.querySelector('.bootcn-timeline__text').textContent = text;
      const time = item.querySelector('time');
      time.dateTime = new Date().toISOString();
      list.insertBefore(item, list.querySelector('.bootcn-timeline__item'));
      if (window.Bootcn && window.Bootcn.timeline) window.Bootcn.timeline.update(item);
      form.reset();
      const live = document.querySelector('[data-crm-live]');
      if (live) live.textContent = 'Note added';
      field.focus();
    }
  }

  // Contacts page: the new contact joins the top of the table.
  function onModalSubmit(event) {
    const form = event.detail && event.detail.form;
    if (!form || !form.matches('[data-crm-contact-form]')) return;
    const data = event.detail.data;
    const body = document.querySelector('[data-crm-contacts]');
    const template = document.querySelector('[data-crm-row-template]');
    if (!body || !template) return;
    const row = template.content.firstElementChild.cloneNode(true);
    const name = String(data.get('name') || '');
    const initials = name
      .split(/\s+/)
      .map((w) => w.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
    row.setAttribute('data-status', String(data.get('status')));
    row.setAttribute('data-owner', String(data.get('owner')));
    row.setAttribute('data-created', new Date().toISOString().slice(0, 10));
    row.querySelector('[data-crm-initials]').textContent = initials;
    row.querySelector('[data-crm-name]').textContent = name;
    row.querySelector('[data-crm-email]').textContent = String(data.get('email') || '');
    row.querySelector('[data-crm-company]').textContent = String(data.get('company') || '');
    row.querySelector('[data-crm-status]').textContent = String(data.get('status'));
    row.querySelector('[data-crm-owner]').textContent = String(data.get('owner'));
    body.prepend(row);
    if (window.Bootcn && window.Bootcn.filterBar) {
      const bar = document.querySelector('[data-bootcn-filters]');
      if (bar) window.Bootcn.filterBar.apply(bar);
    }
    const live = document.querySelector('[data-crm-live]');
    if (live) live.textContent = 'Contact added: ' + name;
  }

  function init() {
    pipelineTotals();
    document.addEventListener('bootcn:kanban:move', pipelineTotals);
    document.addEventListener('bootcn:kanban:add', pipelineTotals);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('bootcn:modal:submit', onModalSubmit);
  }

  window.Bootcn = window.Bootcn || {};
  window.Bootcn.crmPage = { totals: pipelineTotals };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
