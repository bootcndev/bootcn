import * as React from 'react';

import '{{bootcn:css}}/button.css';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Bootcn's button: the same classes as the HTML version, as a React component. */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', className, type = 'button', ...props },
  ref,
) {
  const classes = [
    'btn',
    'bootcn-button',
    `bootcn-button--${variant}`,
    size !== 'md' ? `bootcn-button--${size}` : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <button ref={ref} type={type} className={classes} {...props} />;
});
