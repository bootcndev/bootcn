import * as React from 'react';

import '{{bootcn:css}}/input.css';
import '{{bootcn:css}}/select.css';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: React.ReactNode;
  /** A hint under the field. */
  help?: React.ReactNode;
  /** An error under the field; it also marks the field invalid. */
  error?: React.ReactNode;
  /** Options as data; or pass <option> children. */
  options?: { value: string; label: string; disabled?: boolean }[];
  /** A first, empty option, such as "Choose a country". */
  placeholder?: string;
}

/** A labelled select with an optional hint and error, wired with aria-describedby. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    help,
    error,
    id,
    className,
    'aria-describedby': describedByProp,
    'aria-invalid': invalidProp,
    options,
    placeholder,
    children,
    ...props
  },
  ref,
) {
  const auto = React.useId();
  const fieldId = id ?? auto;
  const helpId = help ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [describedByProp, helpId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="bootcn-field">
      <label htmlFor={fieldId} className="form-label bootcn-field__label">
        {label}
      </label>
      <select
        ref={ref}
        id={fieldId}
        className={['form-select bootcn-select', className].filter(Boolean).join(' ')}
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : invalidProp}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
      {help ? (
        <p className="bootcn-field__help" id={helpId}>
          {help}
        </p>
      ) : null}
      {error ? (
        <div className="invalid-feedback d-block" id={errorId}>
          {error}
        </div>
      ) : null}
    </div>
  );
});
