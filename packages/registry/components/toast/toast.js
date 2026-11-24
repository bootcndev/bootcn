(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.toast) return; // already loaded: idempotent

  const SHOW_SELECTOR = '[data-bootcn-toast-target]';
  const CREATE_SELECTOR = '[data-bootcn-toast-create]';
  const CONTAINER_SELECTOR = '[data-bootcn-toast-container]';
  const VARIANTS = ['default', 'success', 'destructive'];
  let listening = false;

  function ensureBootstrap() {
    if (window.bootstrap && window.bootstrap.Toast) return true;
    console.error(
      '[bootcn] toast: Bootstrap JavaScript is required. Load the Bootstrap bundle (window.bootstrap.Toast) before bootcn toast.js.',
    );
    return false;
  }

  function resolve(target) {
    if (target instanceof Element) return target;
    if (typeof target === 'string') return document.querySelector(target);
    return null;
  }

  /** Shows an existing toast element (or selector). Returns the element. */
  function show(target) {
    const element = resolve(target);
    if (!element) {
      console.error('[bootcn] toast: no toast found for', target);
      return null;
    }
    if (!ensureBootstrap()) return null;
    window.bootstrap.Toast.getOrCreateInstance(element).show();
    return element;
  }

  function container() {
    let region = document.querySelector(CONTAINER_SELECTOR);
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-container position-fixed bottom-0 end-0 p-3 bootcn-toast-container';
      region.setAttribute('data-bootcn-toast-container', '');
      document.body.appendChild(region);
    }
    return region;
  }

  /**
   * Creates, shows and (when hidden) removes a toast.
   * options: { title, message, variant: 'default'|'success'|'destructive',
   *            autohide: true, delay: 5000 }
   * Text is inserted with textContent, never as HTML.
   */
  function create(options) {
    const settings = Object.assign({ variant: 'default', autohide: true, delay: 5000 }, options);
    if (!ensureBootstrap()) return null;
    const variant = VARIANTS.indexOf(settings.variant) === -1 ? 'default' : settings.variant;
    const urgent = variant === 'destructive';

    const toast = document.createElement('div');
    toast.className = 'toast bootcn-toast bootcn-toast--' + variant;
    toast.setAttribute('role', urgent ? 'alert' : 'status');
    toast.setAttribute('aria-live', urgent ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');

    const body = document.createElement('div');
    body.className = 'bootcn-toast__body';
    const text = document.createElement('div');
    text.className = 'bootcn-toast__text';
    if (settings.title) {
      const title = document.createElement('p');
      title.className = 'bootcn-toast__title';
      title.textContent = String(settings.title);
      text.appendChild(title);
    }
    if (settings.message) {
      const message = document.createElement('p');
      message.className = 'bootcn-toast__description';
      message.textContent = String(settings.message);
      text.appendChild(message);
    }
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn-close bootcn-toast__close';
    close.setAttribute('data-bs-dismiss', 'toast');
    close.setAttribute('aria-label', 'Close notification');
    body.appendChild(text);
    body.appendChild(close);
    toast.appendChild(body);

    container().appendChild(toast);
    toast.addEventListener('hidden.bs.toast', function () {
      const instance = window.bootstrap.Toast.getInstance(toast);
      if (instance) instance.dispose();
      toast.remove();
    });
    window.bootstrap.Toast.getOrCreateInstance(toast, {
      autohide: Boolean(settings.autohide),
      delay: Number(settings.delay) || 5000,
    }).show();
    return toast;
  }

  function handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const showTrigger = target.closest(SHOW_SELECTOR);
    if (showTrigger) {
      show(showTrigger.getAttribute('data-bootcn-toast-target'));
      return;
    }

    const createTrigger = target.closest(CREATE_SELECTOR);
    if (createTrigger) {
      create({
        title: createTrigger.getAttribute('data-bootcn-toast-title'),
        message: createTrigger.getAttribute('data-bootcn-toast-message'),
        variant: createTrigger.getAttribute('data-bootcn-toast-variant') || 'default',
      });
    }
  }

  // Delegated listener on document: works for triggers added later too.
  // `root` is accepted for API consistency; init/destroy act on the document.
  function init(root = document) {
    if (!root || listening) return;
    if (!ensureBootstrap()) return;
    document.addEventListener('click', handleClick);
    listening = true;
  }

  function destroy(root = document) {
    if (!root || !listening) return;
    document.removeEventListener('click', handleClick);
    listening = false;
  }

  ns.toast = { init: init, destroy: destroy, show: show, create: create };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }
})();
