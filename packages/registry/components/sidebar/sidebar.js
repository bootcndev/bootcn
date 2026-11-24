(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.sidebar) return; // already loaded: idempotent

  const LAYOUT = '[data-bootcn-sidenav-layout]';
  const TOGGLE = '[data-bootcn-sidenav-toggle]';
  const STORAGE_KEY = 'bootcn-sidenav-collapsed';
  const desktop = window.matchMedia('(min-width: 992px)');
  let listening = false;

  function remembered() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  function remember(collapsed) {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // Storage unavailable: the state lasts for this page only.
    }
  }

  function sidebarOf(toggle) {
    return document.getElementById(toggle.getAttribute('aria-controls'));
  }

  function sync(layout) {
    const toggle = layout.querySelector(TOGGLE);
    if (!toggle) return;
    if (desktop.matches) {
      toggle.setAttribute('aria-expanded', String(!layout.classList.contains('is-collapsed')));
    } else {
      const sidebar = sidebarOf(toggle);
      toggle.setAttribute('aria-expanded', String(!!sidebar && sidebar.classList.contains('show')));
    }
  }

  function toggle(layout) {
    const button = layout.querySelector(TOGGLE);
    if (desktop.matches) {
      const collapsed = !layout.classList.contains('is-collapsed');
      layout.classList.toggle('is-collapsed', collapsed);
      remember(collapsed);
      sync(layout);
      layout.dispatchEvent(
        new CustomEvent('bootcn:sidebar:toggle', {
          bubbles: true,
          detail: { collapsed: collapsed },
        }),
      );
    } else if (button && window.bootstrap && window.bootstrap.Offcanvas) {
      window.bootstrap.Offcanvas.getOrCreateInstance(sidebarOf(button)).toggle();
    }
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest(TOGGLE);
    if (!button) return;
    const layout = button.closest(LAYOUT);
    if (layout) toggle(layout);
  }

  function onKeydown(event) {
    if (!(event.ctrlKey || event.metaKey) || event.altKey || event.key.toLowerCase() !== 'b')
      return;
    const layout = document.querySelector(LAYOUT);
    if (!layout) return;
    event.preventDefault();
    toggle(layout);
  }

  function onOffcanvas(event) {
    const layout = event.target.closest && event.target.closest(LAYOUT);
    if (layout) sync(layout);
  }

  function onBreakpoint() {
    document.querySelectorAll(LAYOUT).forEach(sync);
  }

  function init(root = document) {
    root.querySelectorAll(LAYOUT).forEach((layout) => {
      layout.classList.toggle('is-collapsed', remembered());
      sync(layout);
    });
    if (listening) return;
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('shown.bs.offcanvas', onOffcanvas);
    document.addEventListener('hidden.bs.offcanvas', onOffcanvas);
    desktop.addEventListener('change', onBreakpoint);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('shown.bs.offcanvas', onOffcanvas);
    document.removeEventListener('hidden.bs.offcanvas', onOffcanvas);
    desktop.removeEventListener('change', onBreakpoint);
    listening = false;
  }

  ns.sidebar = { init: init, destroy: destroy, toggle: toggle };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
