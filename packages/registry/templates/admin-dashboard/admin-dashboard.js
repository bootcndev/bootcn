/*
 * Admin dashboard: the dark mode toggle. The theme is set before the first
 * paint by the inline script in <head>; this keeps the toggle in sync, saves
 * the choice, and follows the system setting until the user picks one.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'bootcn-theme';
  var TOGGLE = '[data-bootcn-theme-toggle]';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var observer = null;
  var initialized = false;

  function current() {
    return root.getAttribute('data-bs-theme') === 'dark' ? 'dark' : 'light';
  }

  function saved() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function syncToggles() {
    var pressed = String(current() === 'dark');
    document.querySelectorAll(TOGGLE).forEach(function (button) {
      button.setAttribute('aria-pressed', pressed);
    });
  }

  function setTheme(theme, remember) {
    root.setAttribute('data-bs-theme', theme);
    if (remember) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Storage unavailable (private mode): the choice lasts for this page only.
      }
    }
  }

  function onClick(event) {
    var button = event.target.closest(TOGGLE);
    if (!button) return;
    setTheme(current() === 'dark' ? 'light' : 'dark', true);
  }

  function onSystemChange(event) {
    if (saved() === null) setTheme(event.matches ? 'dark' : 'light', false);
  }

  function init() {
    if (initialized) return;
    initialized = true;
    document.addEventListener('click', onClick);
    media.addEventListener('change', onSystemChange);
    // Keep aria-pressed right whoever changes the theme.
    observer = new MutationObserver(syncToggles);
    observer.observe(root, { attributes: true, attributeFilter: ['data-bs-theme'] });
    syncToggles();
  }

  function destroy() {
    if (!initialized) return;
    initialized = false;
    document.removeEventListener('click', onClick);
    media.removeEventListener('change', onSystemChange);
    if (observer) observer.disconnect();
    observer = null;
  }

  window.Bootcn = window.Bootcn || {};
  window.Bootcn.adminDashboard = { init: init, destroy: destroy, setTheme: setTheme };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
