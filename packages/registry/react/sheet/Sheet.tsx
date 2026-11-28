import * as React from 'react';

import '{{bootcn:css}}/sheet.css';

export interface SheetProps {
  /** Shown or not: Sheet follows this prop. */
  open: boolean;
  /** Called with false when the person closes it (Escape, the × or the backdrop). */
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  /** Buttons at the bottom. */
  footer?: React.ReactNode;
  /** The edge it slides in from; end is the right in left-to-right pages. */
  side?: 'start' | 'end' | 'top' | 'bottom';
  closeLabel?: string;
}

interface OffcanvasInstance {
  show(): void;
  hide(): void;
  dispose(): void;
}

/**
 * A panel that slides in from an edge, on Bootstrap's Offcanvas: focus moves
 * in and back, Escape and the backdrop close it. Bootstrap's JavaScript loads
 * in the browser only, so it is safe with server rendering.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'end',
  closeLabel = 'Close',
}: SheetProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const panel = React.useRef<OffcanvasInstance | null>(null);
  const openRef = React.useRef(open);
  const onChange = React.useRef(onOpenChange);
  onChange.current = onOpenChange;
  openRef.current = open;
  const id = React.useId();

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let alive = true;
    let opener: HTMLElement | null = null;
    const onShow = () => {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    };
    const onHidden = () => {
      if (opener?.isConnected) opener.focus();
      opener = null;
      if (openRef.current) onChange.current(false);
    };
    element.addEventListener('show.bs.offcanvas', onShow);
    element.addEventListener('hidden.bs.offcanvas', onHidden);
    // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
    import('bootstrap/js/dist/offcanvas').then(({ default: Offcanvas }) => {
      if (!alive) return;
      panel.current = Offcanvas.getOrCreateInstance(element) as OffcanvasInstance;
      if (openRef.current) panel.current.show();
    });
    return () => {
      alive = false;
      element.removeEventListener('show.bs.offcanvas', onShow);
      element.removeEventListener('hidden.bs.offcanvas', onHidden);
      panel.current?.dispose();
      panel.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!panel.current) return;
    if (open) panel.current.show();
    else panel.current.hide();
  }, [open]);

  return (
    <div
      ref={ref}
      className={`offcanvas offcanvas-${side} bootcn-sheet`}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
    >
      <div className="offcanvas-header bootcn-sheet__header">
        <div>
          <h2 className="offcanvas-title bootcn-sheet__title" id={`${id}-title`}>
            {title}
          </h2>
          {description ? (
            <p className="bootcn-sheet__description" id={`${id}-description`}>
              {description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label={closeLabel}
        />
      </div>
      <div className="offcanvas-body bootcn-sheet__body">{children}</div>
      {footer ? <div className="bootcn-sheet__footer">{footer}</div> : null}
    </div>
  );
}
