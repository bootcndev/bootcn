import * as React from 'react';

import '{{bootcn:css}}/toaster.css';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface ToastOptions {
  type?: ToastType;
  description?: string;
  duration?: number;
  position?: string;
  action?: { label: string; onClick: () => void };
  dismissible?: boolean;
}

interface ToastApi {
  (message: string, options?: ToastOptions): string;
  success(message: string, options?: ToastOptions): string;
  error(message: string, options?: ToastOptions): string;
  warning(message: string, options?: ToastOptions): string;
  info(message: string, options?: ToastOptions): string;
  loading(message: string, options?: ToastOptions): string;
  update(id: string, options: ToastOptions & { message?: string }): void;
  dismiss(id?: string): void;
  promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((value: T) => string);
      error: string | ((error: unknown) => string);
    },
  ): Promise<T>;
}

let api: Promise<ToastApi | null> | null = null;

/** Loads the toaster script once, in the browser only. */
function load(): Promise<ToastApi | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  // @ts-ignore: a plain script that sets window.Bootcn.toast; it has no types
  api ??= import('{{bootcn:js}}/toaster.js').then(
    () => (window as unknown as { Bootcn: { toast: ToastApi } }).Bootcn.toast,
  );
  return api;
}

type Method = 'success' | 'error' | 'warning' | 'info' | 'loading';
const method =
  (name: Method) =>
  (message: string, options?: ToastOptions): Promise<string | undefined> =>
    load().then((toast) => toast?.[name](message, options));

/**
 * Shows a toast: toast('Saved'), toast.success('Profile saved'),
 * toast.promise(save(), { loading, success, error }). Each call returns a
 * Promise of the toast's id, for update() and dismiss().
 */
export const toast = Object.assign(
  (message: string, options?: ToastOptions): Promise<string | undefined> =>
    load().then((t) => t?.(message, options)),
  {
    success: method('success'),
    error: method('error'),
    warning: method('warning'),
    info: method('info'),
    loading: method('loading'),
    update: (id: string, options: ToastOptions & { message?: string }) =>
      load().then((t) => t?.update(id, options)),
    dismiss: (id?: string) => load().then((t) => t?.dismiss(id)),
    promise: <T,>(promise: Promise<T>, messages: Parameters<ToastApi['promise']>[1]): Promise<T> =>
      load().then((t) => (t ? t.promise(promise, messages as never) : promise)),
  },
);

/** Put <Toaster /> once near the root: it loads the toaster in the browser. */
export function Toaster(): null {
  React.useEffect(() => {
    void load();
  }, []);
  return null;
}
