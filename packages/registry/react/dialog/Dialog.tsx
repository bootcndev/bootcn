import * as React from 'react';

import '{{bootcn:css}}/dialog.css';

export interface DialogProps {
  /** Shown or not: Dialog follows this prop. */
  open: boolean;
  /** Called with false when the person closes it (Escape, the × or the backdrop). */
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The dialog's body, under the description. */
  children?: React.ReactNode;
  /** Buttons at the bottom. */
  footer?: React.ReactNode;
  size?: 'sm' | 'lg' | 'xl';
  /** Label of the close button. */
  closeLabel?: string;
}

interface ModalInstance {
  show(): void;
  hide(): void;
  dispose(): void;
}

/**
 * A modal dialog on Bootstrap's Modal: focus moves in and back, Escape and
 * the backdrop close it. Bootstrap's JavaScript loads in the browser only,
 * so it is safe with server rendering (Next.js and others).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size,
  closeLabel = 'Close dialog',
}: DialogProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const modal = React.useRef<ModalInstance | null>(null);
  const openRef = React.useRef(open);
  const onChange = React.useRef(onOpenChange);
  onChange.current = onOpenChange;
  openRef.current = open;
  const id = React.useId();

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    let alive = true;
    // Focus goes back to what opened the dialog (Bootstrap only does that for
    // data-bs-toggle buttons).
    let opener: HTMLElement | null = null;
    const onShow = () => {
      opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    };
    const onHidden = () => {
      if (opener?.isConnected) opener.focus();
      opener = null;
      if (openRef.current) onChange.current(false);
    };
    element.addEventListener('show.bs.modal', onShow);
    element.addEventListener('hidden.bs.modal', onHidden);
    // @ts-ignore: bootstrap has no types unless @types/bootstrap is installed
    import('bootstrap/js/dist/modal').then(({ default: Modal }) => {
      if (!alive) return;
      modal.current = Modal.getOrCreateInstance(element) as ModalInstance;
      if (openRef.current) modal.current.show();
    });
    return () => {
      alive = false;
      element.removeEventListener('show.bs.modal', onShow);
      element.removeEventListener('hidden.bs.modal', onHidden);
      modal.current?.dispose();
      modal.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!modal.current) return;
    if (open) modal.current.show();
    else modal.current.hide();
  }, [open]);

  return (
    <div
      ref={ref}
      className="modal fade bootcn-dialog"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
    >
      <div className={`modal-dialog modal-dialog-centered${size ? ` modal-${size}` : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title bootcn-dialog__title" id={`${id}-title`}>
              {title}
            </h2>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label={closeLabel}
            />
          </div>
          {description || children ? (
            <div className="modal-body">
              {description ? (
                <p className="bootcn-dialog__description" id={`${id}-description`}>
                  {description}
                </p>
              ) : null}
              {children}
            </div>
          ) : null}
          {footer ? <div className="modal-footer bootcn-dialog__footer">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
