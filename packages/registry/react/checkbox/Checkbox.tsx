import * as React from 'react';

import '{{bootcn:css}}/checkbox.css';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

/** A checkbox with its label. */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, id, className, ...props },
  ref,
) {
  const auto = React.useId();
  const inputId = id ?? auto;
  return (
    <div className={['form-check bootcn-checkbox', className].filter(Boolean).join(' ')}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="form-check-input bootcn-checkbox__input"
        {...props}
      />
      <label className="form-check-label bootcn-checkbox__label" htmlFor={inputId}>
        {label}
      </label>
    </div>
  );
});
