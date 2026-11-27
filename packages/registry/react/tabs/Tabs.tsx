import * as React from 'react';

import '{{bootcn:css}}/tabs.css';

export interface TabItem {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  /** Names the tab list for screen readers, such as "Account settings". */
  label: string;
  items: TabItem[];
  /** Controlled: the selected tab. */
  value?: string;
  /** Uncontrolled: the first selected tab. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

/**
 * Tabs on the WAI-ARIA pattern: one tab in the Tab order, arrow keys move and
 * select (mirrored right to left), Home and End jump.
 */
export function Tabs({ label, items, value, defaultValue, onValueChange, className }: TabsProps) {
  const [inner, setInner] = React.useState(defaultValue ?? items[0]?.value);
  const selected = value ?? inner;
  const base = React.useId();
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});

  const select = (next: string) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((item) => !item.disabled);
    const index = enabled.findIndex((item) => item.value === selected);
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
    let next: TabItem | undefined;
    if (step) next = enabled[(index + step + enabled.length) % enabled.length];
    else if (event.key === 'Home') next = enabled[0];
    else if (event.key === 'End') next = enabled[enabled.length - 1];
    if (!next) return;
    event.preventDefault();
    select(next.value);
    refs.current[next.value]?.focus();
  };

  return (
    <div className={['bootcn-tabs', className].filter(Boolean).join(' ')}>
      <div
        className="nav bootcn-tabs__list"
        role="tablist"
        aria-label={label}
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const active = item.value === selected;
          return (
            <button
              key={item.value}
              ref={(node) => {
                refs.current[item.value] = node;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${item.value}`}
              aria-controls={`${base}-panel-${item.value}`}
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              disabled={item.disabled}
              className={`nav-link${active ? ' active' : ''}`}
              onClick={() => select(item.value)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="tab-content">
        {items.map((item) => {
          const active = item.value === selected;
          return (
            <div
              key={item.value}
              role="tabpanel"
              id={`${base}-panel-${item.value}`}
              aria-labelledby={`${base}-tab-${item.value}`}
              tabIndex={0}
              hidden={!active}
              className={`tab-pane bootcn-tabs__panel${active ? ' show active' : ''}`}
            >
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
