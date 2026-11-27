import * as React from 'react';

import '{{bootcn:css}}/input.css';
import '{{bootcn:css}}/textarea.css';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: React.ReactNode;
  /** A hint under the field. */
  help?: React.ReactNode;
  /** An error under the field; it also marks the field invalid. */
  error?: React.ReactNode;
}

/** A labelled textarea with an optional hint and error, wired with aria-describedby. */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    help,
    error,
    id,
    className,
    'aria-describedby': describedByProp,
    'aria-invalid': invalidProp,
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
      <textarea
        ref={ref}
        id={fieldId}
        className={['form-control bootcn-textarea', className].filter(Boolean).join(' ')}
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : invalidProp}
      />
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
