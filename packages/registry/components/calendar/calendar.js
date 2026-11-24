(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.calendar) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-calendar]';
  const INIT = 'data-bootcn-calendar-initialized';
  const state = new WeakMap(); // root -> { month: Date, focus: Date }
  let listening = false;

  // Dates are local calendar days; ISO strings are YYYY-MM-DD.
  function parse(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }

  function iso(date) {
    const pad = (n) => String(n).padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function addDays(date, days) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  function addMonths(date, months) {
    const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last));
  }

  function sameDay(a, b) {
    return !!a && !!b && iso(a) === iso(b);
  }

  function locale(root) {
    const owner = root.closest('[lang]');
    return root.getAttribute('data-locale') || (owner && owner.getAttribute('lang')) || 'en';
  }

  // 0 = Sunday … 6 = Saturday; Monday when the attribute is missing or invalid.
  function weekStart(root) {
    const raw = root.getAttribute('data-week-start');
    const value = raw === null || raw.trim() === '' ? NaN : Number(raw);
    return Number.isInteger(value) && value >= 0 && value <= 6 ? value : 1;
  }

  function bounds(root) {
    return { min: parse(root.getAttribute('data-min')), max: parse(root.getAttribute('data-max')) };
  }

  function clamp(root, date) {
    const { min, max } = bounds(root);
    if (min && date < min) return min;
    if (max && date > max) return max;
    return date;
  }

  function render(root) {
    const s = state.get(root);
    const loc = locale(root);
    const start = weekStart(root);
    const selected = parse(root.getAttribute('data-value'));
    const today = new Date();
    const { min, max } = bounds(root);
    const title = root.querySelector('.bootcn-calendar__title');
    const body = root.querySelector('tbody');
    const head = root.querySelector('thead tr');

    title.textContent = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(
      s.month,
    );

    if (head.children.length === 0) {
      const short = new Intl.DateTimeFormat(loc, { weekday: 'short' });
      const long = new Intl.DateTimeFormat(loc, { weekday: 'long' });
      for (let i = 0; i < 7; i += 1) {
        const day = new Date(2024, 0, 7 + ((start + i) % 7)); // 7 Jan 2024 is a Sunday
        const th = document.createElement('th');
        th.scope = 'col';
        th.abbr = long.format(day);
        th.textContent = short.format(day).slice(0, 2);
        head.appendChild(th);
      }
    }

    const full = new Intl.DateTimeFormat(loc, { dateStyle: 'full' });
    const first = new Date(s.month.getFullYear(), s.month.getMonth(), 1);
    let cursor = addDays(first, -((first.getDay() - start + 7) % 7));
    body.textContent = '';
    for (let week = 0; week < 6; week += 1) {
      const row = document.createElement('tr');
      for (let i = 0; i < 7; i += 1) {
        const cell = document.createElement('td');
        cell.setAttribute('role', 'gridcell');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'bootcn-calendar__day';
        button.textContent = String(cursor.getDate());
        button.setAttribute('data-date', iso(cursor));
        button.setAttribute('aria-label', full.format(cursor));
        button.tabIndex = sameDay(cursor, s.focus) ? 0 : -1;
        if (cursor.getMonth() !== s.month.getMonth()) button.classList.add('is-outside');
        if (sameDay(cursor, today)) button.setAttribute('aria-current', 'date');
        if ((min && cursor < min) || (max && cursor > max)) button.disabled = true;
        cell.setAttribute('aria-selected', String(sameDay(cursor, selected)));
        cell.appendChild(button);
        row.appendChild(cell);
        cursor = addDays(cursor, 1);
      }
      body.appendChild(row);
    }
  }

  function focusDate(root, date, moveFocus) {
    const s = state.get(root);
    const next = clamp(root, date);
    s.focus = next;
    if (next.getMonth() !== s.month.getMonth() || next.getFullYear() !== s.month.getFullYear()) {
      s.month = new Date(next.getFullYear(), next.getMonth(), 1);
    }
    render(root);
    if (moveFocus) {
      const button = root.querySelector('[data-date="' + iso(next) + '"]');
      if (button) button.focus();
    }
  }

  function select(root, date) {
    const value = iso(date);
    root.setAttribute('data-value', value);
    const input = root.querySelector('[data-bootcn-calendar-input]');
    if (input) input.value = value;
    focusDate(root, date, true);
    root.dispatchEvent(
      new CustomEvent('bootcn:calendar:select', {
        bubbles: true,
        detail: { value: value, date: date },
      }),
    );
  }

  function changeMonth(root, step) {
    const s = state.get(root);
    s.month = new Date(s.month.getFullYear(), s.month.getMonth() + step, 1);
    s.focus = clamp(root, addMonths(s.focus, step));
    render(root);
  }

  function setup(root) {
    const selected = parse(root.getAttribute('data-value'));
    const base = selected || clamp(root, new Date());
    state.set(root, { month: new Date(base.getFullYear(), base.getMonth(), 1), focus: base });
    const input = root.querySelector('[data-bootcn-calendar-input]');
    if (input && selected) input.value = iso(selected);
    root.setAttribute(INIT, '');
    render(root);
  }

  function onClick(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || !state.has(root)) return;
    const day = event.target.closest('.bootcn-calendar__day');
    if (day && !day.disabled) {
      select(root, parse(day.getAttribute('data-date')));
    } else if (event.target.closest('[data-bootcn-calendar-prev]')) {
      changeMonth(root, -1);
    } else if (event.target.closest('[data-bootcn-calendar-next]')) {
      changeMonth(root, 1);
    }
  }

  function onKeydown(event) {
    const day = event.target.closest && event.target.closest('.bootcn-calendar__day');
    const root = day && day.closest(ROOT);
    if (!root || !state.has(root)) return;
    const current = parse(day.getAttribute('data-date'));
    const start = weekStart(root);
    let next;
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(current, -1);
        break;
      case 'ArrowRight':
        next = addDays(current, 1);
        break;
      case 'ArrowUp':
        next = addDays(current, -7);
        break;
      case 'ArrowDown':
        next = addDays(current, 7);
        break;
      case 'Home':
        next = addDays(current, -((current.getDay() - start + 7) % 7));
        break;
      case 'End':
        next = addDays(current, 6 - ((current.getDay() - start + 7) % 7));
        break;
      case 'PageUp':
        next = addMonths(current, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(current, event.shiftKey ? 12 : 1);
        break;
      default:
        return;
    }
    // Handled here, so containers (such as a Bootstrap dropdown) do not react.
    event.preventDefault();
    event.stopPropagation();
    focusDate(root, next, true);
  }

  function init(root = document) {
    root.querySelectorAll(ROOT + ':not([' + INIT + '])').forEach(setup);
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', onKeydown, true);
      listening = true;
    }
  }

  function destroy(root = document) {
    root.querySelectorAll(ROOT + '[' + INIT + ']').forEach((element) => {
      element.removeAttribute(INIT);
      state.delete(element);
    });
    if (root === document && listening) {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeydown, true);
      listening = false;
    }
  }

  // Shows the month of `value` (YYYY-MM-DD) and selects it, or today.
  function setValue(root, value) {
    if (!state.has(root)) setup(root);
    const date = parse(value);
    if (date) select(root, date);
  }

  function focus(root) {
    const s = state.get(root);
    if (s) focusDate(root, s.focus, true);
  }

  ns.calendar = { init: init, destroy: destroy, setValue: setValue, focus: focus };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
