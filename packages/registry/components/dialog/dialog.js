(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.dialog) return;

  const TRIGGER_SELECTOR = '[data-bootcn-dialog-confirm]';
  const CONFIRM_BUTTON_SELECTOR = '[data-bootcn-dialog-confirm-button]';

  let attached = false;
  const triggersByModal = new WeakMap();

  function ensureBootstrap() {
    if (window.bootstrap && window.bootstrap.Modal) return true;
    console.error(
      '[bootcn] dialog: Bootstrap JavaScript is required. Load the Bootstrap bundle (window.bootstrap.Modal) before bootcn dialog.js.',
    );
    return false;
  }

  function handleShown(event) {
    const modal = event.target;
    const trigger = event.relatedTarget;
    if (
      modal instanceof Element &&
      trigger instanceof Element &&
      trigger.matches(TRIGGER_SELECTOR)
    ) {
      triggersByModal.set(modal, trigger);
    }
  }

  function handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest(CONFIRM_BUTTON_SELECTOR);
    if (!(button instanceof Element)) return;

    const modal = button.closest('.modal');
    if (!(modal instanceof Element)) return;

    const trigger = triggersByModal.get(modal);
    if (!(trigger instanceof Element)) return;

    trigger.dispatchEvent(
      new CustomEvent('bootcn:dialog:confirm', {
        bubbles: true,
        detail: { trigger: trigger, button: button },
      }),
    );
  }

  function handleHidden(event) {
    const modal = event.target;
    if (!(modal instanceof Element)) return;

    const trigger = triggersByModal.get(modal);
    if (!(trigger instanceof Element)) return;

    triggersByModal.delete(modal);

    const active = document.activeElement;
    if (trigger.isConnected && active !== trigger && !modal.contains(active)) {
      trigger.focus();
    }
  }

  function init(root = document) {
    if (!root) return;
    if (!ensureBootstrap()) return;
    if (attached) return;

    document.addEventListener('shown.bs.modal', handleShown);
    document.addEventListener('click', handleClick);
    document.addEventListener('hidden.bs.modal', handleHidden);
    attached = true;
  }

  function destroy(root = document) {
    if (!root) return;
    if (!attached) return;

    document.removeEventListener('shown.bs.modal', handleShown);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('hidden.bs.modal', handleHidden);
    attached = false;
  }

  ns.dialog = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init(document);
    });
  } else {
    init(document);
  }
})();
