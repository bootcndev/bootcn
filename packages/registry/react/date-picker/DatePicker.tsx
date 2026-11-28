import * as React from 'react';

import '{{bootcn:css}}/button.css';
import '{{bootcn:css}}/label.css';
import '{{bootcn:css}}/calendar.css';
import '{{bootcn:css}}/date-picker.css';

export interface DatePickerProps {
  label: React.ReactNode;
  /** The date as YYYY-MM-DD ('' for none). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Earliest and latest dates, YYYY-MM-DD. */
  min?: string;
  max?: string;
  /** 0 = Sunday … 6 = Saturday (default 1, Monday). */
  weekStart?: number;
  /** Month and day names; default: the page's lang. */
  locale?: string;
  /** A hidden input with this name carries the value in forms. */
  name?: string;
  /** Name of the calendar popover for screen readers. */
  dialogLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
}

interface CalendarApi {
  init(root: Element): void;
  setValue(root: Element, value: string): void;
  focus(root: Element): void;
}

interface DropdownInstance {
  hide(): void;
  dispose(): void;
}

function format(value: string, locale: string | undefined): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const lang =
    locale ?? (typeof document === 'undefined' ? 'en' : document.documentElement.lang || 'en');
  return new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(date);
}

const ARROW = (path: string) => (
  <svg
    className="bootcn-icon bootcn-rtl-flip"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={path} />
  </svg>
);

/**
 * A button that opens a calendar and shows the chosen date. The calendar is
 * a WAI-ARIA date grid (arrow keys, Page Up/Down, Home/End) drawn by
 * calendar.js; the popover is Bootstrap's Dropdown. Both load in the browser
 * only, so it is safe with server rendering.
 */
export function DatePicker({
  label,
  value,
  defaultValue = '',
  onValueChange,
  placeholder = 'Pick a date',
  min,
  max,
  weekStart,
  locale,
  name,
  dialogLabel = 'Choose a date',
  previousLabel = 'Previous month',
  nextLabel = 'Next month',
}: DatePickerProps) {
  const id = React.useId();
  const [own, setOwn] = React.useState(defaultValue);
  const current = value ?? own;
  const root = React.useRef<HTMLDivElement>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const calendar = React.useRef<HTMLDivElement>(null);
  const api = React.useRef<CalendarApi | null>(null);
  const dropdown = React.useRef<DropdownInstance | null>(null);
  const syncing = React.useRef(false);
  const latest = React.useRef({ current, onValueChange, controlled: value !== undefined });
  latest.current = { current, onValueChange, controlled: value !== undefined };
  // Formatted after mount, so server and browser render the same text.
  const [shown, setShown] = React.useState<string | null>(null);

  React.useEffect(() => {
    setShown(format(current, locale));
  }, [current, locale]);

  React.useEffect(() => {
    const element = root.current;
    const grid = calendar.current;
    const button = trigger.current;
    if (!element || !grid || !button) return undefined;
    let alive = true;

    const onSelect = (event: Event) => {
      if (syncing.current) return;
      const picked = (event as CustomEvent<{ value: string }>).detail.value;
      if (!latest.current.controlled) setOwn(picked);
      if (picked !== latest.current.current) latest.current.onValueChange?.(picked);
      dropdown.current?.hide();
      button.focus();
    };
    // Focus the selected day (or today) when the calendar opens.
    const onShown = () => {
      if (api.current) api.current.focus(grid);
    };
    element.addEventListener('bootcn:calendar:select', onSelect);
    element.addEventListener('shown.bs.dropdown', onShown);

    Promise.all([
      // @ts-ignore: a plain script that sets window.Bootcn.calendar; it has no types
      import('{{bootcn:js}}/calendar.js'),
      // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
      import('bootstrap/js/dist/dropdown'),
    ]).then(([, { default: Dropdown }]) => {
      if (!alive) return;
      api.current = (window as unknown as { Bootcn: { calendar: CalendarApi } }).Bootcn.calendar;
      api.current.init(element);
      dropdown.current = Dropdown.getOrCreateInstance(button) as DropdownInstance;
    });
    return () => {
      alive = false;
      element.removeEventListener('bootcn:calendar:select', onSelect);
      element.removeEventListener('shown.bs.dropdown', onShown);
      dropdown.current?.dispose();
      dropdown.current = null;
    };
  }, []);

  // A value set from outside: show its month and select it.
  React.useEffect(() => {
    const grid = calendar.current;
    if (!api.current || !grid || !current) return;
    if (grid.getAttribute('data-value') === current) return;
    syncing.current = true;
    api.current.setValue(grid, current);
    syncing.current = false;
  }, [current]);

  return (
    <div ref={root} className="dropdown bootcn-date-picker">
      <span className="bootcn-label" id={`${id}-label`}>
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        className="btn bootcn-button bootcn-button--outline bootcn-date-picker__trigger"
        data-bs-toggle="dropdown"
        data-bs-auto-close="outside"
        aria-expanded="false"
        aria-haspopup="dialog"
        aria-labelledby={`${id}-label ${id}-text`}
        data-empty={shown ? undefined : ''}
      >
        <svg
          className="bootcn-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
        </svg>
        <span id={`${id}-text`}>{shown ?? placeholder}</span>
      </button>
      <div
        className="dropdown-menu bootcn-date-picker__popover"
        role="dialog"
        aria-label={dialogLabel}
      >
        <div
          ref={calendar}
          className="bootcn-calendar"
          data-bootcn-calendar=""
          data-value={current || undefined}
          data-min={min}
          data-max={max}
          data-week-start={weekStart}
          data-locale={locale}
        >
          <div className="bootcn-calendar__header">
            <button
              type="button"
              className="bootcn-calendar__nav"
              data-bootcn-calendar-prev=""
              aria-label={previousLabel}
            >
              {ARROW('m15 18-6-6 6-6')}
            </button>
            {/* calendar.js writes the month here. */}
            <h2 className="bootcn-calendar__title" id={`${id}-title`} aria-live="polite" />
            <button
              type="button"
              className="bootcn-calendar__nav"
              data-bootcn-calendar-next=""
              aria-label={nextLabel}
            >
              {ARROW('m9 18 6-6-6-6')}
            </button>
          </div>
          {/* calendar.js draws the weekdays and days. */}
          <table className="bootcn-calendar__grid" role="grid" aria-labelledby={`${id}-title`}>
            <thead>
              <tr />
            </thead>
            <tbody />
          </table>
        </div>
      </div>
      {name ? <input type="hidden" name={name} value={current} /> : null}
    </div>
  );
}
