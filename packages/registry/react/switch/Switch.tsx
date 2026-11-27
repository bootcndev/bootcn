import * as React from 'react';

import '{{bootcn:css}}/switch.css';

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

/** A switch (a checkbox that reads as on/off) with its label. */
export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, id, className, ...props },
  ref,
) {
  const auto = React.useId();
  const inputId = id ?? auto;
  return (
    <div className={['form-check form-switch bootcn-switch', className].filter(Boolean).join(' ')}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        role="switch"
        className="form-check-input bootcn-switch__input"
        {...props}
      />
      <label className="form-check-label bootcn-switch__label" htmlFor={inputId}>
        {label}
      </label>
    </div>
  );
});
