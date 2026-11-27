import * as React from 'react';

import '{{bootcn:css}}/alert.css';

export interface AlertProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  variant?: 'default' | 'destructive';
  /** An icon before the text; it is hidden from screen readers. */
  icon?: React.ReactNode;
}

/**
 * A message in the flow of the page. Add role="alert" only for something
 * that just happened and needs attention, so screen readers announce it.
 */
export function Alert({
  title,
  variant = 'default',
  icon,
  className,
  children,
  ...props
}: AlertProps) {
  return (
    <div
      className={[
        'alert',
        'bootcn-alert',
        variant === 'destructive' ? 'bootcn-alert--destructive' : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <div className="bootcn-alert__body">
        <p className="bootcn-alert__title">{title}</p>
        {children ? <div className="bootcn-alert__description">{children}</div> : null}
      </div>
    </div>
  );
}
