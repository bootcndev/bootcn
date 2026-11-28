import * as React from 'react';

import '{{bootcn:css}}/popover.css';

export interface PopoverProps {
  /** The popover's text. */
  content: string;
  title?: string;
  /** One button that opens the popover. */
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  /** click (default) toggles it; focus closes it when focus moves away. */
  trigger?: 'click' | 'focus';
}

interface PopoverInstance {
  hide(): void;
  setContent(content: Record<string, string>): void;
  dispose(): void;
}

/**
 * A small overlay on Bootstrap's Popover, opened by its child button and
 * closed with Escape. Bootstrap's JavaScript loads in the browser only, so
 * it is safe with server rendering.
 */
export function Popover({
  content,
  title,
  children,
  placement = 'top',
  trigger = 'click',
}: PopoverProps) {
  const wrapper = React.useRef<HTMLSpanElement>(null);
  const instance = React.useRef<PopoverInstance | null>(null);
  const text = React.useRef({ content, title });
  text.current = { content, title };

  React.useEffect(() => {
    const element = wrapper.current?.firstElementChild;
    if (!(element instanceof HTMLElement)) return undefined;
    let alive = true;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !element.hasAttribute('aria-describedby')) return;
      instance.current?.hide();
      element.focus();
    };
    document.addEventListener('keydown', onKeydown);
    // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
    import('bootstrap/js/dist/popover').then(({ default: Plugin }) => {
      if (!alive) return;
      instance.current = new Plugin(element, {
        content: text.current.content,
        title: text.current.title ?? '',
        placement,
        trigger,
        customClass: 'bootcn-popover',
      }) as PopoverInstance;
    });
    return () => {
      alive = false;
      document.removeEventListener('keydown', onKeydown);
      instance.current?.dispose();
      instance.current = null;
    };
  }, [placement, trigger]);

  React.useEffect(() => {
    instance.current?.setContent({ '.popover-header': title ?? '', '.popover-body': content });
  }, [content, title]);

  return (
    <span ref={wrapper} style={{ display: 'contents' }}>
      {children}
    </span>
  );
}
