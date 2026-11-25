(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.dateInput) return; // already loaded: idempotent

  // Messages: override them for your language with window.Bootcn.messages,
  // e.g. { 'copy.done': 'Copié.' } (see the Translations guide).
  // Plural keys end in .one, .other… as chosen by Intl.PluralRules.
  function t(key, fallback, vars) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    let text = typeof custom === 'string' ? custom : fallback;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(String(vars[name]));
    });
    return text;
  }

  const ROOT = '[data-bootcn-date-input]';
  const SEGMENT = '[data-segment]';
  const NAMES = {
    year: 'year',
    month: 'month',
    day: 'day',
    hour: 'hour',
    minute: 'minute',
    dayPeriod: 'AM/PM',
  };
  const PLACEHOLDERS = { year: 'yyyy', month: 'mm', day: 'dd', hour: '––', minute: '––' };
  const PAGE = { year: 5, month: 2, day: 7, hour: 2, minute: 15 };
  const state = new WeakMap(); // root -> { kind, hour12, locale, values, typed, step }

  function pad(n, size) {
    return String(n).padStart(size, '0');
  }

  function daysIn(month, year) {
    return new Date(year || 2000, month || 1, 0).getDate();
  }

  function kindOf(type) {
    if (type === 'time') return 'time';
    if (type === 'date') return 'date';
    return 'datetime';
  }

  function parse(kind, value) {
    const v = { year: null, month: null, day: null, hour: null, minute: null };
    if (!value) return v;
    const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    const time = /(?:^|T)(\d{2}):(\d{2})/.exec(value);
    if (date && kind !== 'time') {
      v.year = Number(date[1]);
      v.month = Number(date[2]);
      v.day = Number(date[3]);
    }
    if (time && kind !== 'date') {
      v.hour = Number(time[1]);
      v.minute = Number(time[2]);
    }
    return v;
  }

  function fields(kind) {
    if (kind === 'date') return ['year', 'month', 'day'];
    if (kind === 'time') return ['hour', 'minute'];
    return ['year', 'month', 'day', 'hour', 'minute'];
  }

  // The ISO value when every segment has a value, else ''.
  function serialize(s) {
    const v = s.values;
    if (fields(s.kind).some((f) => v[f] === null)) return '';
    const date = pad(v.year, 4) + '-' + pad(v.month, 2) + '-' + pad(v.day, 2);
    const time = pad(v.hour, 2) + ':' + pad(v.minute, 2);
    if (s.kind === 'date') return date;
    if (s.kind === 'time') return time;
    return date + 'T' + time;
  }

  function range(s, type) {
    const v = s.values;
    switch (type) {
      case 'year':
        return [1, 9999];
      case 'month':
        return [1, 12];
      case 'day':
        return [1, daysIn(v.month, v.year)];
      case 'hour':
        return s.hour12 ? [1, 12] : [0, 23];
      case 'minute':
        return [0, 59];
      default:
        return [0, 1];
    }
  }

  // Value shown in a segment (12-hour clocks show 1-12).
  function shown(s, type) {
    const v = s.values;
    if (type === 'dayPeriod') return v.hour === null ? null : v.hour >= 12 ? 1 : 0;
    if (type === 'hour' && s.hour12 && v.hour !== null) return v.hour % 12 || 12;
    return v[type];
  }

  function periodNames(locale) {
    const format = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true });
    const name = (h) =>
      (format.formatToParts(new Date(2026, 0, 1, h)).find((p) => p.type === 'dayPeriod') || {})
        .value || (h < 12 ? 'AM' : 'PM');
    return [name(9), name(21)];
  }

  function monthName(locale, month) {
    return new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, month - 1, 1));
  }

  function render(root) {
    const s = state.get(root);
    const native = root.querySelector('[data-bootcn-date-input-native]');
    root.querySelectorAll(SEGMENT).forEach((el) => {
      const type = el.getAttribute('data-segment');
      const value = shown(s, type);
      const [min, max] = range(s, type);
      el.setAttribute('aria-valuemin', String(min));
      el.setAttribute('aria-valuemax', String(max));
      if (value === null) {
        el.textContent =
          type === 'dayPeriod'
            ? s.periods[0]
            : t('date-input.placeholder.' + type, PLACEHOLDERS[type]);
        el.classList.add('is-placeholder');
        el.removeAttribute('aria-valuenow');
        el.setAttribute('aria-valuetext', t('date-input.empty', 'Empty'));
        return;
      }
      el.classList.remove('is-placeholder');
      el.setAttribute('aria-valuenow', String(value));
      if (type === 'dayPeriod') {
        el.textContent = s.periods[value];
        el.setAttribute('aria-valuetext', s.periods[value]);
      } else {
        el.textContent = pad(value, type === 'year' ? 4 : 2);
        el.setAttribute(
          'aria-valuetext',
          type === 'month' ? value + ' – ' + monthName(s.locale, value) : String(value),
        );
      }
    });
    const value = serialize(s);
    const before = native.value;
    native.value = value;
    // min/max from the original input, compared as ISO strings.
    const invalid =
      value !== '' &&
      ((s.min && value < s.min.slice(0, value.length)) ||
        (s.max && value > s.max.slice(0, value.length)));
    const control = root.querySelector('.bootcn-date-input__control');
    control.classList.toggle('is-invalid', Boolean(invalid));
    root.querySelectorAll(SEGMENT).forEach((el) => {
      if (invalid) el.setAttribute('aria-invalid', 'true');
      else el.removeAttribute('aria-invalid');
    });
    const error = root.querySelector('.bootcn-date-input__error');
    if (error) {
      error.hidden = !invalid;
      error.textContent = invalid
        ? root.getAttribute('data-error') || t('date-input.range', 'Choose a value in range.')
        : '';
    }
    if (value !== before) {
      native.dispatchEvent(new Event('change', { bubbles: true }));
      root.dispatchEvent(
        new CustomEvent('bootcn:date-input:change', { bubbles: true, detail: { value: value } }),
      );
    }
  }

  // Keeps the day valid when the month or year changes.
  function constrain(s) {
    const v = s.values;
    if (v.day !== null && v.month !== null) v.day = Math.min(v.day, daysIn(v.month, v.year));
  }

  function setShown(s, type, value) {
    const v = s.values;
    if (type === 'dayPeriod') {
      if (v.hour === null) v.hour = value ? 12 : 0;
      else if (value === 1 && v.hour < 12) v.hour += 12;
      else if (value === 0 && v.hour >= 12) v.hour -= 12;
    } else if (type === 'hour' && s.hour12) {
      const pm = v.hour !== null && v.hour >= 12;
      v.hour = (value % 12) + (pm ? 12 : 0);
    } else {
      v[type] = value;
    }
    constrain(s);
  }

  function now(s, type) {
    const d = new Date();
    const values = {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
      hour: s.hour12 ? d.getHours() % 12 || 12 : d.getHours(),
      minute: 0,
      dayPeriod: d.getHours() >= 12 ? 1 : 0,
    };
    return values[type];
  }

  function step(s, type, delta) {
    const [min, max] = range(s, type);
    const current = shown(s, type);
    if (current === null) {
      setShown(s, type, now(s, type));
      return;
    }
    const span = max - min + 1;
    const next = ((((current - min + delta) % span) + span) % span) + min; // wraps
    setShown(s, type, next);
  }

  function segments(root) {
    return Array.from(root.querySelectorAll(SEGMENT));
  }

  // Next or previous segment; inside a date range, it continues into the
  // other date.
  function focusSibling(el, delta) {
    const range = el.closest('[data-bootcn-date-range-input]');
    const list = Array.from((range || el.closest(ROOT)).querySelectorAll(SEGMENT));
    const next = list[list.indexOf(el) + delta];
    if (next) next.focus();
  }

  function logicalKey(event, element) {
    if (getComputedStyle(element).direction !== 'rtl') return event.key;
    if (event.key === 'ArrowLeft') return 'ArrowRight';
    if (event.key === 'ArrowRight') return 'ArrowLeft';
    return event.key;
  }

  function onKeydown(event) {
    const el = event.target.closest && event.target.closest(ROOT + ' ' + SEGMENT);
    if (!el || event.altKey || event.ctrlKey || event.metaKey) return;
    const root = el.closest(ROOT);
    const s = state.get(root);
    const type = el.getAttribute('data-segment');
    const key = logicalKey(event, el);
    const minuteStep = type === 'minute' ? s.step : 1;
    let handled = true;
    if (key === 'ArrowUp') step(s, type, minuteStep);
    else if (key === 'ArrowDown') step(s, type, -minuteStep);
    else if (key === 'PageUp') step(s, type, PAGE[type] || 1);
    else if (key === 'PageDown') step(s, type, -(PAGE[type] || 1));
    else if (key === 'Home') setShown(s, type, range(s, type)[0]);
    else if (key === 'End') setShown(s, type, range(s, type)[1]);
    else if (key === 'ArrowRight') focusSibling(el, 1);
    else if (key === 'ArrowLeft') focusSibling(el, -1);
    else if (key === 'Backspace' || key === 'Delete') {
      if (s.typed) {
        s.typed = s.typed.slice(0, -1);
        if (s.typed) setShown(s, type, Number(s.typed));
        else clearSegment(s, type);
      } else {
        clearSegment(s, type);
      }
    } else if (type === 'dayPeriod' && /^[ap]$/i.test(event.key)) {
      const first = s.periods[1].toLowerCase().startsWith(event.key.toLowerCase()) ? 1 : 0;
      setShown(s, type, first);
      focusSibling(el, 1);
    } else if (/^\d$/.test(event.key) && type !== 'dayPeriod') {
      typeDigit(s, el, type, event.key);
    } else {
      handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    render(root);
  }

  function clearSegment(s, type) {
    if (type === 'dayPeriod') return;
    s.values[type] = null;
  }

  // Typing: digits accumulate until the segment cannot take another one,
  // then focus moves on ("2" waits for a second digit in a day; "4" is done).
  function typeDigit(s, el, type, digit) {
    const [min, max] = range(s, type);
    let buffer = s.typed + digit;
    if (Number(buffer) > max) buffer = digit;
    const value = Number(buffer);
    const done = buffer.length >= String(max).length || value * 10 > max;
    s.typed = done ? '' : buffer;
    if (value >= min || !done) {
      if (value >= min) setShown(s, type, value);
    }
    if (done) focusSibling(el, 1);
  }

  function onFocusIn(event) {
    const el = event.target.closest && event.target.closest(ROOT + ' ' + SEGMENT);
    if (!el) return;
    const s = state.get(el.closest(ROOT));
    if (s) s.typed = '';
  }

  function onClick(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || !state.has(root)) return;
    if (event.target.closest('label') || event.target.closest('.bootcn-date-input__control')) {
      if (!event.target.closest(SEGMENT)) {
        const first = segments(root).find((el) => el.classList.contains('is-placeholder'));
        (first || segments(root)[0]).focus();
      }
    }
  }

  // Replaces the native input with segments; the input stays as a hidden
  // form value. Phones keep the native picker.
  function setup(root) {
    if (state.has(root)) return;
    const native = root.querySelector('[data-bootcn-date-input-native]');
    if (!native || native.type === 'hidden') return;
    if (!root.hasAttribute('data-touch') && window.matchMedia('(pointer: coarse)').matches) return;
    const kind = kindOf(native.type);
    const locale =
      root.getAttribute('data-locale') || document.documentElement.lang || navigator.language;
    const options = {};
    if (kind !== 'time')
      Object.assign(options, { year: 'numeric', month: '2-digit', day: '2-digit' });
    if (kind !== 'date') Object.assign(options, { hour: '2-digit', minute: '2-digit' });
    const format = new Intl.DateTimeFormat(locale, options);
    const resolved = format.resolvedOptions();
    const hour12 =
      kind !== 'date' && (resolved.hour12 === true || /h1[12]/.test(resolved.hourCycle || ''));
    const stepSeconds = Number(native.getAttribute('step')) || 60;
    const s = {
      kind: kind,
      locale: locale,
      hour12: hour12,
      periods: periodNames(locale),
      values: parse(kind, native.value),
      typed: '',
      step: Math.max(1, Math.round(stepSeconds / 60)),
      min: native.getAttribute('min') || '',
      max: native.getAttribute('max') || '',
    };
    state.set(root, s);

    const label = root.querySelector('label[for="' + native.id + '"]');
    const labelId = (label && (label.id || native.id + '-label')) || '';
    const control = document.createElement('div');
    control.className = 'bootcn-date-input__control';
    control.setAttribute('role', 'group');
    if (label) {
      label.id = labelId;
      label.removeAttribute('for');
      control.setAttribute('aria-labelledby', labelId);
    }
    const describedBy = native.getAttribute('aria-describedby');
    const errorId = native.id + '-error';
    control.setAttribute('aria-describedby', ((describedBy || '') + ' ' + errorId).trim());

    format.formatToParts(new Date(2026, 10, 24, 9, 30)).forEach((part) => {
      if (part.type === 'literal') {
        const literal = document.createElement('span');
        literal.className = 'bootcn-date-input__literal';
        literal.setAttribute('aria-hidden', 'true');
        literal.textContent = part.value;
        control.appendChild(literal);
        return;
      }
      if (!(part.type in NAMES)) return;
      const segment = document.createElement('span');
      segment.className = 'bootcn-date-input__segment';
      segment.setAttribute('role', 'spinbutton');
      segment.setAttribute('tabindex', '0');
      segment.setAttribute('aria-label', t('date-input.' + part.type, NAMES[part.type]));
      segment.setAttribute('data-segment', part.type);
      control.appendChild(segment);
    });

    const error = document.createElement('p');
    error.className = 'bootcn-date-input__error';
    error.id = errorId;
    error.hidden = true;
    error.setAttribute('aria-live', 'polite');

    native.type = 'hidden';
    native.removeAttribute('aria-describedby');
    native.insertAdjacentElement('afterend', control);
    const help = root.querySelector('.bootcn-field__help');
    (help || control).insertAdjacentElement(help ? 'beforebegin' : 'afterend', error);
    if (help) help.insertAdjacentElement('beforebegin', error);
    render(root);
  }

  let listening = false;

  function init() {
    if (!listening) {
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('focusin', onFocusIn);
      document.addEventListener('click', onClick);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('click', onClick);
    listening = false;
  }

  function setValue(root, value) {
    const s = state.get(root);
    if (!s) return;
    s.values = parse(s.kind, value);
    render(root);
  }

  ns.dateInput = { init: init, destroy: destroy, setup: setup, setValue: setValue };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
