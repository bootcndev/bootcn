# Event calendar

A calendar app with month, week and day views: events in colour by calendar, overlaps side by side, all-day and multi-day events, a details popover, a form to add and edit, calendars you can hide, and full keyboard support.

## Usage

A `<section data-bootcn-event-calendar>` with the toolbar, an empty
legend and body, the details popover, the event form (a `<dialog>`), a
status line and two JSON scripts:

- `data-calendar-calendars`: `[{ id, name, color }]`. Each becomes a
  checkbox in the legend and a choice in the form.
- `data-calendar-events`: `[{ id, title, start, end, calendar, allDay,
location, description }]`, with local dates as `YYYY-MM-DD` (all day)
  or `YYYY-MM-DDTHH:MM`. Multi-day all-day events set `end` to the last
  day.

Options: `data-view` (`month`, `week`, `day`), `data-week-start` (0 =
Sunday … 6; 1, Monday, by default), `data-locale` (else the page's
`lang`), `data-max-events` per day in the month (3) and `data-today` to
fix today (for demos and tests). Names of days and months come from
`Intl` in that language.

The markup holds a plain list of the events (the agenda) for when the
script does not run; the script replaces it with the views.

**Month**: up to three events a day, then "+2 more". **Week** and
**day**: an hour grid with all-day events on top, overlapping events side
by side and a line at the current time. Click a day to open it; click an
empty hour to add an event there.

**Changes**: Save and Delete fire `bootcn:event-calendar:create`,
`update` and `delete` (`detail: { event }`); cancel them to call your
server first. `bootcn:event-calendar:select` and `navigate` tell you what
was opened. `Bootcn.eventCalendar.go(root, 'week', '2026-12-14')`,
`add(root, event)`, `setEvents(root, events)`, `events(root)`.

## Keyboard

In the month, one day is in the Tab order: arrow keys move by day and
week (mirrored right to left), Home and End go to the start and end of the
week, Page Up and Page Down change month, Enter opens the day. Anywhere in
the calendar: <kbd>t</kbd> today, <kbd>m</kbd> <kbd>w</kbd> <kbd>d</kbd>
views, <kbd>n</kbd> new event. Escape closes the popover.

## Accessibility

- The title (month, week or day) is a heading that is announced when it
  changes; Previous and Next say what they move by.
- The month is a table with weekday headers; each day button says the full
  date and how many events it has; today is `aria-current="date"`.
- Every event is a button: its visible time and title, then the day, time
  and calendar for screen readers.
  Colour is never the only cue: all-day events and calendars are named.
- The form checks the title, date and that the event ends after it
  starts; saving and deleting are announced. Texts are in
  `window.Bootcn.messages` (`eventCalendar.*`).

## Dependencies

- Bootstrap 5.3+ CSS.
- `themes/tokens/tokens.css`.
- The `button`, `input`, `select`, `checkbox` and `textarea` components.
