import * as React from 'react';

import '{{bootcn:css}}/card.css';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** The title's heading level (h2 by default). */
  titleAs?: 'h2' | 'h3' | 'h4';
  footer?: React.ReactNode;
}

/** A card with an optional header, the content and an optional footer. */
export function Card({
  title,
  description,
  titleAs: Title = 'h2',
  footer,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <article className={['card', 'bootcn-card', className].filter(Boolean).join(' ')} {...props}>
      {title || description ? (
        <header className="bootcn-card__header">
          {title ? <Title className="bootcn-card__title">{title}</Title> : null}
          {description ? <p className="bootcn-card__description">{description}</p> : null}
        </header>
      ) : null}
      <div className="bootcn-card__content">{children}</div>
      {footer ? <footer className="bootcn-card__footer">{footer}</footer> : null}
    </article>
  );
}
