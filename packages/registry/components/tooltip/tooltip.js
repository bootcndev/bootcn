(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.tooltip) return; // already loaded: idempotent

  const SELECTOR = '[data-bs-toggle="tooltip"]';
  let listening = false;

  function plugin() {
    return window.bootstrap && window.bootstrap.Tooltip;
  }

  function ensureBootstrap() {
    if (plugin()) return true;
    console.error(
      '[bootcn] tooltip: Bootstrap JavaScript is required. Load the Bootstrap bundle (window.bootstrap.Tooltip) before bootcn tooltip.js.',
    );
    return false;
  }

  function targets(root) {
    const found = [];
    if (root instanceof Element && root.matches(SELECTOR)) found.push(root);
    if (root && typeof root.querySelectorAll === 'function') {
      root.querySelectorAll(SELECTOR).forEach(function (element) {
        found.push(element);
      });
    }
    return found;
  }

  // WCAG 1.4.13: content shown on hover or focus must be dismissible without moving focus.
  function handleKeydown(event) {
    if (event.key !== 'Escape') return;
    const Plugin = plugin();
    if (!Plugin) return;
    document.querySelectorAll(SELECTOR + '[aria-describedby]').forEach(function (element) {
      const instance = Plugin.getInstance(element);
      if (instance) instance.hide();
    });
  }

  function init(root = document) {
    if (!ensureBootstrap()) return;
    const Plugin = plugin();
    targets(root).forEach(function (element) {
      Plugin.getOrCreateInstance(element);
    });
    if (!listening) {
      document.addEventListener('keydown', handleKeydown);
      listening = true;
    }
  }

  function destroy(root = document) {
    const Plugin = plugin();
    if (Plugin) {
      targets(root).forEach(function (element) {
        const instance = Plugin.getInstance(element);
        if (instance) instance.dispose();
      });
    }
    if (root === document && listening) {
      document.removeEventListener('keydown', handleKeydown);
      listening = false;
    }
  }

  ns.tooltip = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }
})();
