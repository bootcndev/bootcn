import * as React from 'react';

import '{{bootcn:css}}/avatar.css';

export interface AvatarProps {
  /** The person's name: the image's alt text, or the fallback's label. */
  name: string;
  src?: string;
  /** Shown when there is no image or it fails to load; initials by default. */
  fallback?: string;
  size?: 'sm' | 'md' | 'lg';
  square?: boolean;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** A picture of a person, or their initials when there is none. */
export function Avatar({ name, src, fallback, size = 'md', square, className }: AvatarProps) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  const classes = [
    'bootcn-avatar',
    size !== 'md' ? `bootcn-avatar--${size}` : null,
    square ? 'bootcn-avatar--square' : null,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  if (src && !failed) {
    return (
      <span className={classes}>
        <img
          className="bootcn-avatar__image"
          src={src}
          alt={name}
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span className={classes} role="img" aria-label={name}>
      <span className="bootcn-avatar__fallback" aria-hidden="true">
        {fallback ?? initials(name)}
      </span>
    </span>
  );
}
