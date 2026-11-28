import * as React from 'react';

import '{{bootcn:css}}/tooltip.css';

export interface TooltipProps {
  /** The hint (text only). */
  content: string;
  /** One element that shows the hint on hover and focus: a button or a link. */
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface TooltipInstance {
  hide(): void;
  setContent(content: Record<string, string>): void;
  dispose(): void;
}

/**
 * A short hint on Bootstrap's Tooltip, shown on hover and focus of its child
 * and dismissed with Escape (WCAG 1.4.13). The child keeps its own name:
 * the hint is its description. Bootstrap's JavaScript loads in the browser
 * only, so it is safe with server rendering.
 */
export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const wrapper = React.useRef<HTMLSpanElement>(null);
  const instance = React.useRef<TooltipInstance | null>(null);
  const contentRef = React.useRef(content);
  contentRef.current = content;

  React.useEffect(() => {
    const element = wrapper.current?.firstElementChild;
    if (!element) return undefined;
    let alive = true;
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') instance.current?.hide();
    };
    document.addEventListener('keydown', onKeydown);
    // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
    import('bootstrap/js/dist/tooltip').then(({ default: Plugin }) => {
      if (!alive) return;
      instance.current = new Plugin(element, {
        title: contentRef.current,
        placement,
        customClass: 'bootcn-tooltip',
      }) as TooltipInstance;
    });
    return () => {
      alive = false;
      document.removeEventListener('keydown', onKeydown);
      instance.current?.dispose();
      instance.current = null;
    };
  }, [placement]);

  React.useEffect(() => {
    instance.current?.setContent({ '.tooltip-inner': content });
  }, [content]);

  return (
    <span ref={wrapper} style={{ display: 'contents' }}>
      {children}
    </span>
  );
}
