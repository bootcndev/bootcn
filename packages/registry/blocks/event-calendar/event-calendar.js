(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.eventCalendar) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-event-calendar]';
  const HOUR_PX = 48; // height of one hour in the week and day views
  const states = new WeakMap();
  let listening = false;
  let uid = 0;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  }

  // ------------------------------------------------------------ dates

  // Dates are local; "YYYY-MM-DD" and "YYYY-MM-DDTHH:MM" strings in and out.
  function parse(value) {
    const [d, time] = String(value).split('T');
    const [y, m, day] = d.split('-').map(Number);
    const [h, min] = (time || '00:00').split(':').map(Number);
    return new Date(y, m - 1, day, h || 0, min || 0);
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function iso(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function addDays(date, n) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + n,
      date.getHours(),
      date.getMinutes(),
    );
  }

  function sameDay(a, b) {
    return iso(a) === iso(b);
  }

  function locale(root) {
    return (
      root.getAttribute('data-locale') ||
      (root.closest('[lang]') || document.documentElement).lang ||
      undefined
    );
  }

  function weekStart(root) {
    const raw = root.getAttribute('data-week-start');
    const n = raw === null || raw === '' ? NaN : Number(raw);
    return Number.isInteger(n) && n >= 0 && n <= 6 ? n : 1;
  }

  function startOfWeek(root, date) {
    const d = startOfDay(date);
    return addDays(d, -((d.getDay() - weekStart(root) + 7) % 7));
  }

  function fmt(root, options) {
    return new Intl.DateTimeFormat(locale(root), options);
  }

  // ------------------------------------------------------------ state

  function get(root) {
    let s = states.get(root);
    if (s) return s;
    const read = (sel) => {
      const el = root.querySelector(sel);
      if (!el) return [];
      try {
        return JSON.parse(el.textContent);
      } catch {
        return [];
      }
    };
    const today = root.getAttribute('data-today')
      ? parse(root.getAttribute('data-today'))
      : startOfDay(new Date());
    s = {
      events: read('script[data-calendar-events]'),
      calendars: read('script[data-calendar-calendars]'),
      hidden: new Set(),
      today,
      date: today,
      view: root.getAttribute('data-view') || 'month',
      focus: today,
      editing: null,
      popover: null,
    };
    states.set(root, s);
    return s;
  }

  function calendar(root, id) {
    return get(root).calendars.find((c) => c.id === id) || { id, name: id, color: '#71717a' };
  }

  function visibleEvents(root) {
    const s = get(root);
    return s.events.filter((e) => !s.hidden.has(e.calendar));
  }

  // Events that touch a day, all-day ones first, then by start.
  function eventsOn(root, day) {
    const from = startOfDay(day);
    const to = addDays(from, 1);
    return visibleEvents(root)
      .filter((e) => {
        const start = parse(e.start);
        const end = e.end ? parse(e.end) : start;
        const endExclusive = e.allDay ? addDays(startOfDay(end), 1) : end;
        return start < to && (endExclusive > from || +start === +from);
      })
      .sort((a, b) => (b.allDay ? 1 : 0) - (a.allDay ? 1 : 0) || parse(a.start) - parse(b.start));
  }

  function timeRange(root, e) {
    if (e.allDay) return t('eventCalendar.allDay', 'All day');
    const f = fmt(root, { hour: 'numeric', minute: '2-digit' });
    return f.format(parse(e.start)) + ' – ' + f.format(parse(e.end || e.start));
  }

  function details(root, e) {
    const day = fmt(root, { weekday: 'long', day: 'numeric', month: 'long' }).format(
      parse(e.start),
    );
    return day + ', ' + timeRange(root, e) + ', ' + calendar(root, e.calendar).name;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function chip(root, e, compact) {
    const b = el('button', 'bootcn-event-calendar__event' + (e.allDay ? ' is-all-day' : ''));
    b.type = 'button';
    b.dataset.eventId = e.id;
    b.style.setProperty('--bootcn-event-color', calendar(root, e.calendar).color);
    if (!e.allDay && compact) {
      b.append(
        el(
          'span',
          'bootcn-event-calendar__event-time',
          fmt(root, { hour: 'numeric', minute: '2-digit' }).format(parse(e.start)),
        ),
      );
    }
    b.append(el('span', 'bootcn-event-calendar__event-title', e.title));
    // The visible text first, then the rest for screen readers.
    b.append(el('span', 'visually-hidden', ', ' + details(root, e)));
    return b;
  }

  // ------------------------------------------------------------ render

  function render(root) {
    const s = get(root);
    closePopover(root, false);
    const body = root.querySelector('[data-calendar-body]');
    const title = root.querySelector('[data-calendar-title]');
    root
      .querySelectorAll('[data-calendar-view]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.calendarView === s.view)));
    let heading;
    if (s.view === 'month') {
      heading = fmt(root, { month: 'long', year: 'numeric' }).format(s.date);
      body.replaceChildren(month(root));
    } else if (s.view === 'week') {
      const first = startOfWeek(root, s.date);
      const last = addDays(first, 6);
      heading = fmt(root, { month: 'short', day: 'numeric' }).formatRange
        ? fmt(root, { month: 'short', day: 'numeric', year: 'numeric' }).formatRange(first, last)
        : fmt(root, { dateStyle: 'medium' }).format(first);
      body.replaceChildren(
        timeGrid(
          root,
          [...Array(7)].map((_, i) => addDays(first, i)),
        ),
      );
    } else {
      heading = fmt(root, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(s.date);
      body.replaceChildren(timeGrid(root, [s.date]));
    }
    title.textContent = heading;
    const prev = root.querySelector('[data-calendar-nav="prev"]');
    const next = root.querySelector('[data-calendar-nav="next"]');
    const unit = { month: 'Month', week: 'Week', day: 'Day' }[s.view];
    if (prev)
      prev.setAttribute(
        'aria-label',
        t('eventCalendar.prev' + unit, 'Previous ' + unit.toLowerCase()),
      );
    if (next)
      next.setAttribute('aria-label', t('eventCalendar.next' + unit, 'Next ' + unit.toLowerCase()));
    if (s.view !== 'month') scrollToMorning(root);
  }

  function month(root) {
    const s = get(root);
    const first = new Date(s.date.getFullYear(), s.date.getMonth(), 1);
    const start = startOfWeek(root, first);
    const table = el('table', 'bootcn-event-calendar__month');
    table.setAttribute('aria-labelledby', root.querySelector('[data-calendar-title]').id);
    const head = el('thead');
    const hr = el('tr');
    const short = fmt(root, { weekday: 'short' });
    const long = fmt(root, { weekday: 'long' });
    for (let i = 0; i < 7; i += 1) {
      const d = addDays(start, i);
      const th = el('th', '', short.format(d));
      th.scope = 'col';
      th.setAttribute('abbr', long.format(d));
      hr.append(th);
    }
    head.append(hr);
    const tbody = el('tbody');
    const full = fmt(root, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const max = Number(root.getAttribute('data-max-events')) || 3;
    let day = start;
    for (let w = 0; w < 6; w += 1) {
      const tr = el('tr');
      for (let i = 0; i < 7; i += 1) {
        const td = el('td', 'bootcn-event-calendar__day');
        if (day.getMonth() !== s.date.getMonth()) td.classList.add('is-outside');
        if (sameDay(day, s.today)) td.classList.add('is-today');
        const events = eventsOn(root, day);
        const num = el('button', 'bootcn-event-calendar__date', String(day.getDate()));
        num.type = 'button';
        num.dataset.date = iso(day);
        num.tabIndex = sameDay(day, s.focus) ? 0 : -1;
        const count = events.length
          ? ', ' +
            fill(
              events.length === 1
                ? t('eventCalendar.one', '1 event')
                : t('eventCalendar.many', '{count} events'),
              { count: events.length },
            )
          : '';
        num.setAttribute('aria-label', full.format(day) + count);
        if (sameDay(day, s.today)) num.setAttribute('aria-current', 'date');
        td.append(num);
        const list = el('div', 'bootcn-event-calendar__chips');
        events.slice(0, max).forEach((e) => list.append(chip(root, e, true)));
        if (events.length > max) {
          const more = el(
            'button',
            'bootcn-event-calendar__more',
            fill(t('eventCalendar.more', '+{count} more'), { count: events.length - max }),
          );
          more.type = 'button';
          more.dataset.date = iso(day);
          more.dataset.calendarMore = '';
          list.append(more);
        }
        const dots = el('span', 'bootcn-event-calendar__dots');
        dots.setAttribute('aria-hidden', 'true');
        events.slice(0, 4).forEach((e) => {
          const dot = el('span');
          dot.style.setProperty('--bootcn-event-color', calendar(root, e.calendar).color);
          dots.append(dot);
        });
        td.append(list, dots);
        tr.append(td);
        day = addDays(day, 1);
      }
      tbody.append(tr);
      if (day.getMonth() !== s.date.getMonth() && w >= 4) break;
    }
    table.append(head, tbody);
    return table;
  }

  // Overlapping timed events sit side by side.
  function layout(events) {
    const placed = [];
    events.forEach((e) => {
      const start = parse(e.start);
      const end = parse(e.end || e.start);
      const group = placed.filter((p) => p.start < end && p.end > start);
      const used = new Set(group.map((p) => p.col));
      let col = 0;
      while (used.has(col)) col += 1;
      placed.push({ e, start, end, col });
    });
    placed.forEach((p) => {
      const overlapping = placed.filter((q) => q.start < p.end && q.end > p.start);
      p.cols = Math.max(...overlapping.map((q) => q.col)) + 1;
    });
    return placed;
  }

  function timeGrid(root, days) {
    const s = get(root);
    const wrap = el('div', 'bootcn-event-calendar__time' + (days.length === 1 ? ' is-day' : ''));
    wrap.style.setProperty('--bootcn-event-days', String(days.length));
    // Header row: the days, then the all-day events.
    const head = el('div', 'bootcn-event-calendar__time-head');
    head.append(el('span', 'bootcn-event-calendar__gutter'));
    const allDay = el('div', 'bootcn-event-calendar__all-day');
    allDay.append(
      el(
        'span',
        'bootcn-event-calendar__gutter bootcn-event-calendar__gutter-label',
        t('eventCalendar.allDay', 'All day'),
      ),
    );
    const dayName = fmt(root, { weekday: 'short' });
    days.forEach((d) => {
      const h = el(
        'button',
        'bootcn-event-calendar__col-head' + (sameDay(d, s.today) ? ' is-today' : ''),
      );
      h.type = 'button';
      h.dataset.date = iso(d);
      h.dataset.calendarOpenDay = '';
      if (sameDay(d, s.today)) h.setAttribute('aria-current', 'date');
      h.append(
        el('span', 'bootcn-event-calendar__col-day', dayName.format(d)),
        el('span', 'bootcn-event-calendar__col-num', String(d.getDate())),
        el('span', 'visually-hidden', ', ' + fmt(root, { dateStyle: 'full' }).format(d)),
      );
      head.append(h);
      const cell = el('div', 'bootcn-event-calendar__all-day-cell');
      eventsOn(root, d)
        .filter((e) => e.allDay)
        .forEach((e) => cell.append(chip(root, e, false)));
      allDay.append(cell);
    });
    const scroll = el('div', 'bootcn-event-calendar__scroll');
    scroll.dataset.calendarScroll = '';
    const grid = el('div', 'bootcn-event-calendar__hours');
    const hourFmt = fmt(root, { hour: 'numeric' });
    const gutter = el('div', 'bootcn-event-calendar__gutter bootcn-event-calendar__hour-labels');
    gutter.setAttribute('aria-hidden', 'true');
    for (let h = 1; h < 24; h += 1) {
      const lab = el('span', '', hourFmt.format(new Date(2000, 0, 1, h)));
      lab.style.top = h * HOUR_PX + 'px';
      gutter.append(lab);
    }
    grid.append(gutter);
    days.forEach((d) => {
      const col = el(
        'div',
        'bootcn-event-calendar__col' + (sameDay(d, s.today) ? ' is-today' : ''),
      );
      col.dataset.date = iso(d);
      const list = el('div', 'bootcn-event-calendar__col-events');
      const timed = eventsOn(root, d).filter((e) => !e.allDay);
      layout(timed).forEach(({ e, start, end, col: c, cols }) => {
        const dayStart = startOfDay(d);
        const from = Math.max(0, (start - dayStart) / 3600000);
        const to = Math.min(24, (end - dayStart) / 3600000);
        const b = chip(root, e, true);
        b.classList.add('is-timed');
        if (to - from < 0.75) b.classList.add('is-short');
        b.style.top = from * HOUR_PX + 'px';
        b.style.height = Math.max(20, (to - from) * HOUR_PX - 2) + 'px';
        b.style.insetInlineStart = (c / cols) * 100 + '%';
        b.style.width = 100 / cols + '%';
        list.append(b);
      });
      col.append(list);
      if (sameDay(d, s.today)) {
        const now = el('span', 'bootcn-event-calendar__now');
        now.setAttribute('aria-hidden', 'true');
        const ref = root.hasAttribute('data-today')
          ? new Date(s.today.getFullYear(), s.today.getMonth(), s.today.getDate(), 10, 15)
          : new Date();
        now.style.top = ((ref - startOfDay(ref)) / 3600000) * HOUR_PX + 'px';
        col.append(now);
      }
      grid.append(col);
    });
    scroll.append(grid);
    wrap.append(head, allDay, scroll);
    return wrap;
  }

  function scrollToMorning(root) {
    const scroll = root.querySelector('[data-calendar-scroll]');
    if (scroll) scroll.scrollTop = 7.5 * HOUR_PX;
  }

  // ------------------------------------------------------- navigation

  function go(root, view, date) {
    const s = get(root);
    if (view) s.view = view;
    if (date) {
      s.date = startOfDay(date);
      s.focus = s.date;
    }
    root.setAttribute('data-view', s.view);
    render(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:event-calendar:navigate', {
        bubbles: true,
        detail: { view: s.view, date: iso(s.date) },
      }),
    );
  }

  function step(root, dir) {
    const s = get(root);
    const d = s.date;
    if (s.view === 'month') go(root, null, new Date(d.getFullYear(), d.getMonth() + dir, 1));
    else go(root, null, addDays(d, dir * (s.view === 'week' ? 7 : 1)));
  }

  function focusDate(root, date) {
    const s = get(root);
    s.focus = startOfDay(date);
    if (
      s.focus.getMonth() !== s.date.getMonth() ||
      s.focus.getFullYear() !== s.date.getFullYear()
    ) {
      s.date = new Date(s.focus.getFullYear(), s.focus.getMonth(), 1);
      render(root);
    } else {
      root
        .querySelectorAll('.bootcn-event-calendar__date')
        .forEach((b) => (b.tabIndex = b.dataset.date === iso(s.focus) ? 0 : -1));
    }
    const b = root.querySelector('.bootcn-event-calendar__date[data-date="' + iso(s.focus) + '"]');
    if (b) b.focus();
  }

  // ------------------------------------------------------------ popover

  function openPopover(root, button) {
    const s = get(root);
    const e = s.events.find((x) => x.id === button.dataset.eventId);
    if (!e) return;
    closePopover(root, false);
    const pop = root.querySelector('[data-calendar-popover]');
    pop.querySelector('[data-popover-title]').textContent = e.title;
    pop.querySelector('[data-popover-when]').textContent =
      fmt(root, { weekday: 'long', day: 'numeric', month: 'long' }).format(parse(e.start)) +
      ' · ' +
      timeRange(root, e);
    const cal = calendar(root, e.calendar);
    const calEl = pop.querySelector('[data-popover-calendar]');
    calEl.textContent = cal.name;
    calEl.style.setProperty('--bootcn-event-color', cal.color);
    const where = pop.querySelector('[data-popover-location]');
    where.textContent = e.location || '';
    where.hidden = !e.location;
    const notes = pop.querySelector('[data-popover-notes]');
    notes.textContent = e.description || '';
    notes.hidden = !e.description;
    pop.dataset.eventId = e.id;
    pop.hidden = false;
    const r = button.getBoundingClientRect();
    const box = root.getBoundingClientRect();
    const w = pop.offsetWidth;
    const h = pop.offsetHeight;
    let left = r.right - box.left + 8;
    if (left + w > box.width - 8) left = r.left - box.left - w - 8;
    left = Math.max(8, Math.min(left, box.width - w - 8));
    let top = Math.max(8, Math.min(r.top - box.top, box.height - h - 8));
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    s.popover = button;
    pop.querySelector('[data-popover-title]').focus();
    root.dispatchEvent(
      new CustomEvent('bootcn:event-calendar:select', { bubbles: true, detail: { event: e } }),
    );
  }

  function closePopover(root, focus) {
    const s = get(root);
    const pop = root.querySelector('[data-calendar-popover]');
    if (!pop || pop.hidden) return;
    pop.hidden = true;
    const opener = s.popover;
    s.popover = null;
    if (focus && opener && document.contains(opener)) opener.focus();
  }

  // -------------------------------------------------------------- form

  function openForm(root, e, date) {
    const s = get(root);
    const dialog = root.querySelector('[data-calendar-dialog]');
    const form = dialog.querySelector('form');
    form.reset();
    form.querySelectorAll('[data-calendar-error]').forEach((x) => (x.hidden = true));
    form.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    s.editing = e ? e.id : null;
    dialog.querySelector('[data-calendar-dialog-title]').textContent = e
      ? t('eventCalendar.edit', 'Edit event')
      : t('eventCalendar.new', 'New event');
    dialog.querySelector('[data-calendar-delete]').hidden = !e;
    const start = e
      ? parse(e.start)
      : new Date(
          (date || s.date).getFullYear(),
          (date || s.date).getMonth(),
          (date || s.date).getDate(),
          9,
          0,
        );
    const end = e ? parse(e.end || e.start) : new Date(start.getTime() + 3600000);
    form.elements.title.value = e ? e.title : '';
    form.elements.date.value = iso(start);
    form.elements.start.value = pad(start.getHours()) + ':' + pad(start.getMinutes());
    form.elements.end.value = pad(end.getHours()) + ':' + pad(end.getMinutes());
    form.elements.allDay.checked = Boolean(e && e.allDay);
    form.elements.calendar.value = e ? e.calendar : (s.calendars[0] || {}).id || '';
    form.elements.location.value = e ? e.location || '' : '';
    form.elements.description.value = e ? e.description || '' : '';
    toggleTimes(form);
    closePopover(root, false);
    dialog.showModal();
    form.elements.title.focus();
  }

  function toggleTimes(form) {
    const all = form.elements.allDay.checked;
    form.querySelectorAll('[data-calendar-times] input').forEach((i) => (i.disabled = all));
  }

  function error(form, name, show) {
    const err = form.querySelector('[data-calendar-error="' + name + '"]');
    if (err) err.hidden = !show;
    const field = form.elements[name];
    if (show) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return show;
  }

  function save(root, form) {
    const s = get(root);
    const f = form.elements;
    const bad = [];
    if (error(form, 'title', !f.title.value.trim())) bad.push(f.title);
    if (error(form, 'date', !f.date.value)) bad.push(f.date);
    const timesBad =
      !f.allDay.checked && f.start.value && f.end.value && f.end.value <= f.start.value;
    if (error(form, 'end', Boolean(timesBad))) bad.push(f.end);
    if (bad.length) return bad[0].focus();
    const event = {
      id: s.editing || 'event-' + Date.now() + '-' + ++uid,
      title: f.title.value.trim(),
      calendar: f.calendar.value,
      allDay: f.allDay.checked,
      start: f.allDay.checked ? f.date.value : f.date.value + 'T' + f.start.value,
      end: f.allDay.checked ? f.date.value : f.date.value + 'T' + f.end.value,
      location: f.location.value.trim(),
      description: f.description.value.trim(),
    };
    const name = s.editing ? 'update' : 'create';
    if (
      !root.dispatchEvent(
        new CustomEvent('bootcn:event-calendar:' + name, {
          bubbles: true,
          cancelable: true,
          detail: { event },
        }),
      )
    )
      return;
    if (s.editing) {
      const i = s.events.findIndex((x) => x.id === s.editing);
      s.events[i] = { ...s.events[i], ...event };
    } else s.events.push(event);
    form.closest('dialog').close();
    go(root, null, parse(event.start));
    announce(
      root,
      fill(
        s.editing
          ? t('eventCalendar.saved', 'Saved: {title}')
          : t('eventCalendar.added', 'Added: {title}'),
        { title: event.title },
      ),
    );
    focusEvent(root, event.id);
  }

  function remove(root, id) {
    const s = get(root);
    const e = s.events.find((x) => x.id === id);
    if (!e) return;
    if (
      !root.dispatchEvent(
        new CustomEvent('bootcn:event-calendar:delete', {
          bubbles: true,
          cancelable: true,
          detail: { event: e },
        }),
      )
    )
      return;
    s.events = s.events.filter((x) => x.id !== id);
    const dialog = root.querySelector('[data-calendar-dialog]');
    if (dialog.open) dialog.close();
    render(root);
    announce(root, fill(t('eventCalendar.deleted', 'Deleted: {title}'), { title: e.title }));
    const back = root.querySelector(
      '.bootcn-event-calendar__date[tabindex="0"], .bootcn-event-calendar__col-head',
    );
    if (back) back.focus();
  }

  function focusEvent(root, id) {
    const b = root.querySelector('[data-event-id="' + CSS.escape(id) + '"]');
    if (b) b.focus();
  }

  function announce(root, text) {
    const status = root.querySelector('[data-calendar-status]');
    if (!status) return;
    status.textContent = '';
    setTimeout(() => (status.textContent = text), 50);
  }

  // ------------------------------------------------------------ events

  function onClick(event) {
    const root = event.target.closest(ROOT);
    const s = root && get(root);
    document.querySelectorAll(ROOT).forEach((r) => {
      const pop = r.querySelector('[data-calendar-popover]');
      if (
        pop &&
        !pop.hidden &&
        !pop.contains(event.target) &&
        !event.target.closest('[data-event-id]')
      )
        closePopover(r, false);
    });
    if (!root) return;
    const nav = event.target.closest('[data-calendar-nav]');
    if (nav)
      return nav.dataset.calendarNav === 'today'
        ? go(root, null, s.today)
        : step(root, nav.dataset.calendarNav === 'next' ? 1 : -1);
    const view = event.target.closest('[data-calendar-view]');
    if (view) return go(root, view.dataset.calendarView);
    const ev = event.target.closest('[data-event-id]');
    if (ev && !event.target.closest('[data-calendar-popover]')) return openPopover(root, ev);
    if (event.target.closest('[data-calendar-new]'))
      return openForm(root, null, s.view === 'month' ? s.focus : s.date);
    if (event.target.closest('[data-popover-close]')) return closePopover(root, true);
    if (event.target.closest('[data-popover-edit]')) {
      const e = s.events.find(
        (x) => x.id === root.querySelector('[data-calendar-popover]').dataset.eventId,
      );
      return openForm(root, e);
    }
    if (event.target.closest('[data-popover-delete]'))
      return remove(root, root.querySelector('[data-calendar-popover]').dataset.eventId);
    if (event.target.closest('[data-calendar-delete]')) return remove(root, s.editing);
    if (event.target.closest('[data-calendar-cancel]'))
      return event.target.closest('dialog').close();
    if (event.target.matches('[data-calendar-dialog]')) return event.target.close();
    const date = event.target.closest(
      '.bootcn-event-calendar__date, [data-calendar-more], [data-calendar-open-day]',
    );
    if (date) return go(root, 'day', parse(date.dataset.date));
    // An empty slot in the week or day view: a new event at that hour.
    const col = event.target.closest('.bootcn-event-calendar__col');
    if (col && !event.target.closest('[data-event-id]')) {
      const rect = col.getBoundingClientRect();
      const hour = Math.max(0, Math.min(23, Math.floor((event.clientY - rect.top) / HOUR_PX)));
      openForm(root, null, parse(col.dataset.date));
      const form = root.querySelector('[data-calendar-dialog] form');
      form.elements.start.value = pad(hour) + ':00';
      form.elements.end.value = pad(Math.min(23, hour + 1)) + ':' + (hour === 23 ? '59' : '00');
    }
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    if (event.target.matches('[data-calendar-toggle]')) {
      const s = get(root);
      if (event.target.checked) s.hidden.delete(event.target.value);
      else s.hidden.add(event.target.value);
      render(root);
    }
    if (event.target.name === 'allDay') toggleTimes(event.target.form);
  }

  function onSubmit(event) {
    const form = event.target.closest && event.target.closest('[data-calendar-form]');
    if (!form) return;
    event.preventDefault();
    save(form.closest(ROOT), form);
  }

  function onKeydown(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    const s = get(root);
    const pop = root.querySelector('[data-calendar-popover]');
    if (event.key === 'Escape' && pop && !pop.hidden) {
      event.preventDefault();
      return closePopover(root, true);
    }
    const date = event.target.closest('.bootcn-event-calendar__date');
    if (date) {
      const d = parse(date.dataset.date);
      const rtl = getComputedStyle(root).direction === 'rtl' ? -1 : 1;
      const moves = {
        ArrowLeft: -rtl,
        ArrowRight: rtl,
        ArrowUp: -7,
        ArrowDown: 7,
        Home: -((d.getDay() - weekStart(root) + 7) % 7),
        End: 6 - ((d.getDay() - weekStart(root) + 7) % 7),
      };
      if (event.key in moves) {
        event.preventDefault();
        return focusDate(root, addDays(d, moves[event.key]));
      }
      if (event.key === 'PageUp' || event.key === 'PageDown') {
        event.preventDefault();
        return focusDate(
          root,
          new Date(
            d.getFullYear(),
            d.getMonth() + (event.key === 'PageUp' ? -1 : 1),
            Math.min(d.getDate(), 28),
          ),
        );
      }
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target.closest('input, textarea, select, dialog')) return;
    const keys = {
      t: () => go(root, null, s.today),
      m: () => go(root, 'month'),
      w: () => go(root, 'week'),
      d: () => go(root, 'day'),
      n: () => openForm(root, null, s.view === 'month' ? s.focus : s.date),
    };
    if (keys[event.key]) {
      event.preventDefault();
      keys[event.key]();
    }
  }

  // -------------------------------------------------------------- api

  function setup(root) {
    const s = get(root);
    const legend = root.querySelector('[data-calendar-legend]');
    if (legend && !legend.children.length) {
      s.calendars.forEach((c) => {
        const id = 'bootcn-event-calendar-cal-' + ++uid;
        const wrap = el('div', 'form-check bootcn-event-calendar__legend-item');
        wrap.style.setProperty('--bootcn-event-color', c.color);
        const input = el('input', 'form-check-input');
        input.type = 'checkbox';
        input.id = id;
        input.value = c.id;
        input.checked = true;
        input.dataset.calendarToggle = '';
        const lab = el('label', 'form-check-label', c.name);
        lab.htmlFor = id;
        wrap.append(input, lab);
        legend.append(wrap);
      });
    }
    const select = root.querySelector('[data-calendar-form] [name="calendar"]');
    if (select && !select.options.length) {
      s.calendars.forEach((c) => select.append(new Option(c.name, c.id)));
    }
    root.classList.add('is-ready');
    render(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('change', onChange);
      document.addEventListener('submit', onSubmit);
      document.addEventListener('keydown', onKeydown);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    document.removeEventListener('click', onClick);
    document.removeEventListener('change', onChange);
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  ns.eventCalendar = {
    init,
    destroy,
    setup,
    go: (root, view, date) => go(root, view, date ? parse(date) : null),
    add(root, event) {
      get(root).events.push(event);
      render(root);
    },
    events: (root) => get(root).events.slice(),
    setEvents(root, events) {
      get(root).events = events.slice();
      render(root);
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
