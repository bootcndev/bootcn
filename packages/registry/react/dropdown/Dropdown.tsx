import * as React from 'react';

import '{{bootcn:css}}/button.css';
import '{{bootcn:css}}/dropdown.css';

export type DropdownItem =
  | {
      type?: 'item';
      label: React.ReactNode;
      /** A link: the item is an <a>. */
      href?: string;
      onSelect?: () => void;
      /** Shown at the end, for example ⌘P (hidden from screen readers). */
      shortcut?: string;
      disabled?: boolean;
      destructive?: boolean;
    }
  | { type: 'label'; label: React.ReactNode }
  | { type: 'separator' };

export interface DropdownProps {
  /** The trigger button's content. */
  label: React.ReactNode;
  items: DropdownItem[];
  variant?: 'default' | 'secondary' | 'outline' | 'ghost';
  /** Open the menu at the end of the trigger (right in left-to-right pages). */
  align?: 'start' | 'end';
  className?: string;
}

interface DropdownInstance {
  hide(): void;
  dispose(): void;
}

/**
 * A menu of actions on Bootstrap's Dropdown: arrow keys move between items,
 * Escape closes it and focus returns to the trigger. Bootstrap's JavaScript
 * loads in the browser only, so it is safe with server rendering.
 */
export function Dropdown({
  label,
  items,
  variant = 'outline',
  align = 'start',
  className,
}: DropdownProps) {
  const trigger = React.useRef<HTMLButtonElement>(null);
  const instance = React.useRef<DropdownInstance | null>(null);
  const id = React.useId();

  React.useEffect(() => {
    const element = trigger.current;
    if (!element) return undefined;
    let alive = true;
    // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
    import('bootstrap/js/dist/dropdown').then(({ default: Plugin }) => {
      if (alive) instance.current = Plugin.getOrCreateInstance(element) as DropdownInstance;
    });
    return () => {
      alive = false;
      instance.current?.dispose();
      instance.current = null;
    };
  }, []);

  return (
    <div className={['dropdown', 'bootcn-dropdown', className].filter(Boolean).join(' ')}>
      <button
        ref={trigger}
        id={`${id}-trigger`}
        className={`btn bootcn-button bootcn-button--${variant} dropdown-toggle`}
        type="button"
        data-bs-toggle="dropdown"
        aria-expanded="false"
      >
        {label}
      </button>
      <ul
        className={`dropdown-menu bootcn-dropdown__menu${align === 'end' ? ' dropdown-menu-end' : ''}`}
        aria-labelledby={`${id}-trigger`}
      >
        {items.map((item, index) => {
          if (item.type === 'separator') {
            return (
              <li key={index}>
                <hr className="dropdown-divider bootcn-dropdown__divider" />
              </li>
            );
          }
          if (item.type === 'label') {
            return (
              <li key={index}>
                <span className="dropdown-header bootcn-dropdown__label">{item.label}</span>
              </li>
            );
          }
          const classes = `dropdown-item bootcn-dropdown__item${
            item.destructive ? ' bootcn-dropdown__item--destructive' : ''
          }`;
          const shortcut = item.shortcut ? (
            <span className="bootcn-dropdown__shortcut" aria-hidden="true">
              {item.shortcut}
            </span>
          ) : null;
          return (
            <li key={index}>
              {item.href && !item.disabled ? (
                <a className={classes} href={item.href} onClick={() => item.onSelect?.()}>
                  {item.label}
                  {shortcut}
                </a>
              ) : (
                <button
                  className={classes}
                  type="button"
                  disabled={item.disabled}
                  onClick={() => {
                    instance.current?.hide();
                    trigger.current?.focus();
                    item.onSelect?.();
                  }}
                >
                  {item.label}
                  {shortcut}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
