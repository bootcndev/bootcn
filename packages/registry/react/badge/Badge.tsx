import * as React from 'react';

import '{{bootcn:css}}/badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

/** A small label for a status or a count. */
export function Badge({ variant = 'default', className, ...props }: BadgeProps) {
  return (
    <span
      className={['badge', 'bootcn-badge', `bootcn-badge--${variant}`, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
