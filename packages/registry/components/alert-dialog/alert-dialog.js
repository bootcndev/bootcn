(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.alertDialog) return; // already loaded: idempotent

  const SELECTOR = '.bootcn-alert-dialog';
  let listening = false;

  // Bootstrap sets role="dialog" when a modal opens; an alert dialog keeps
  // role="alertdialog", and focus starts on the safe action (Cancel).
  function onShown(event) {
    const dialog = event.target;
    if (!(dialog instanceof Element) || !dialog.matches(SELECTOR)) return;
    dialog.setAttribute('role', 'alertdialog');
    const cancel = dialog.querySelector('[data-bootcn-alert-dialog-cancel]');
    if (cancel) cancel.focus();
  }

  function init() {
    if (!window.bootstrap || !window.bootstrap.Modal) {
      console.error(
        '[bootcn] alert-dialog: Bootstrap JavaScript is required. Load the Bootstrap bundle before bootcn alert-dialog.js.',
      );
      return;
    }
    if (listening) return;
    document.addEventListener('shown.bs.modal', onShown);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('shown.bs.modal', onShown);
    listening = false;
  }

  ns.alertDialog = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
