import * as React from 'react';

import '{{bootcn:css}}/label.css';
import '{{bootcn:css}}/combobox.css';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface ComboboxProps {
  label: React.ReactNode;
  options: ComboboxOption[];
  /** The chosen option's value ('' for none). */
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  /** Shown when nothing matches. */
  emptyText?: string;
  /** A hidden input with this name carries the value in forms. */
  name?: string;
  id?: string;
  disabled?: boolean;
  /** Announced counts: (count) => text. */
  countText?: (count: number) => string;
}

// Case- and accent-insensitive matching ("e" finds "é").
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const CHECK = (
  <svg
    className="bootcn-icon bootcn-combobox__check"
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
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/**
 * A searchable select (WAI-ARIA combobox with a listbox): type to filter,
 * arrow keys to move, Enter to choose, Escape to close. Matching ignores
 * case and accents; the number of results is announced.
 */
export function Combobox({
  label,
  options,
  value,
  defaultValue = '',
  onValueChange,
  placeholder,
  emptyText = 'No results.',
  name,
  id,
  disabled,
  countText = (count) => (count === 1 ? '1 result.' : `${count} results.`),
}: ComboboxProps) {
  const autoId = React.useId();
  const base = id ?? autoId;
  const [own, setOwn] = React.useState(defaultValue);
  const selected = value ?? own;
  const selectedLabel = options.find((option) => option.value === selected)?.label ?? '';
  const [text, setText] = React.useState(selectedLabel);
  const [query, setQuery] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState('');
  const listbox = React.useRef<HTMLUListElement>(null);

  // Show the chosen label when the value changes from outside.
  React.useEffect(() => {
    if (!open) setText(selectedLabel);
  }, [selectedLabel, open]);

  const visible = React.useMemo(() => {
    const folded = fold(query.trim());
    return options.filter((option) => folded === '' || fold(option.label).includes(folded));
  }, [options, query]);
  const enabled = visible.filter((option) => !option.disabled);
  const optionId = (option: ComboboxOption) => `${base}-option-${option.value}`;

  React.useEffect(() => {
    if (!active || !listbox.current) return;
    const element = listbox.current.querySelector(`[data-value="${CSS.escape(active)}"]`);
    element?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function show(nextQuery = query, last = false) {
    const folded = fold(nextQuery.trim());
    const list = options.filter(
      (option) => !option.disabled && (folded === '' || fold(option.label).includes(folded)),
    );
    setOpen(true);
    setStatus(list.length === 0 ? emptyText : countText(list.length));
    setActive((current) =>
      current && list.some((option) => option.value === current)
        ? current
        : ((last ? list[list.length - 1] : list[0])?.value ?? null),
    );
  }

  function close() {
    setOpen(false);
    setActive(null);
    setQuery('');
    setText(selectedLabel);
  }

  function choose(option: ComboboxOption) {
    if (option.disabled) return;
    if (value === undefined) setOwn(option.value);
    onValueChange?.(option.value);
    setText(option.label);
    setOpen(false);
    setActive(null);
    setQuery('');
  }

  function move(step: number) {
    if (enabled.length === 0) return;
    const index = enabled.findIndex((option) => option.value === active);
    setActive(enabled[(index + step + enabled.length) % enabled.length]!.value);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) show();
        else if (!event.altKey) move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) close();
        else if (!open) show(query, true);
        else move(-1);
        break;
      case 'Home':
      case 'End':
        if (!open || enabled.length === 0) return;
        event.preventDefault();
        setActive((event.key === 'Home' ? enabled[0] : enabled[enabled.length - 1])!.value);
        break;
      case 'Enter': {
        const option = enabled.find((item) => item.value === active);
        if (open && option) {
          event.preventDefault();
          choose(option);
        }
        break;
      }
      case 'Escape':
        if (open) {
          event.preventDefault();
          close();
        } else if (text) {
          setText('');
        }
        break;
      default:
        break;
    }
  }

  const expanded = open && visible.length > 0;
  const activeOption = enabled.find((option) => option.value === active);

  return (
    <div
      className="bootcn-combobox"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <label className="bootcn-label" id={`${base}-label`} htmlFor={`${base}-input`}>
        {label}
      </label>
      <div className="bootcn-combobox__control">
        <input
          className="bootcn-combobox__input"
          id={`${base}-input`}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={`${base}-listbox`}
          aria-activedescendant={expanded && activeOption ? optionId(activeOption) : undefined}
          autoComplete="off"
          placeholder={placeholder}
          disabled={disabled}
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setQuery(event.target.value);
            setActive(null);
            show(event.target.value);
          }}
          onClick={() => show()}
          onKeyDown={onKeyDown}
        />
        <button
          type="button"
          className="bootcn-combobox__toggle"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onMouseDown={(event) => {
            event.preventDefault();
            if (open) close();
            else show();
            (event.currentTarget.previousElementSibling as HTMLInputElement | null)?.focus();
          }}
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
            <path d="m7 15 5 5 5-5" />
            <path d="m7 9 5-5 5 5" />
          </svg>
        </button>
      </div>
      <ul
        ref={listbox}
        className="bootcn-combobox__listbox"
        id={`${base}-listbox`}
        role="listbox"
        aria-labelledby={`${base}-label`}
        hidden={!expanded}
        // Keep focus in the input when choosing with the pointer.
        onMouseDown={(event) => event.preventDefault()}
      >
        {visible.map((option) => (
          <li
            key={option.value}
            className={`bootcn-combobox__option${option.value === active ? ' is-active' : ''}`}
            id={optionId(option)}
            role="option"
            data-value={option.value}
            aria-selected={option.value === selected}
            aria-disabled={option.disabled || undefined}
            onClick={() => choose(option)}
          >
            <span>{option.label}</span>
            {CHECK}
          </li>
        ))}
      </ul>
      <p className="bootcn-combobox__empty" hidden={!(open && visible.length === 0)}>
        {emptyText}
      </p>
      <p className="visually-hidden" role="status" aria-live="polite">
        {status}
      </p>
      {name ? <input type="hidden" name={name} value={selected} /> : null}
    </div>
  );
}
