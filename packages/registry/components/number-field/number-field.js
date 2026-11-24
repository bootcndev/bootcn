(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.numberField) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-number-field]';
  let listening = false;

  function sync(root) {
    const input = root.querySelector('input[type="number"]');
    if (!input) return;
    const value = input.valueAsNumber;
    const min = input.min === '' ? -Infinity : Number(input.min);
    const max = input.max === '' ? Infinity : Number(input.max);
    root.querySelectorAll('[data-bootcn-step]').forEach((button) => {
      const up = button.getAttribute('data-bootcn-step') === 'up';
      button.disabled = !Number.isNaN(value) && (up ? value >= max : value <= min);
    });
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('[data-bootcn-step]');
    const root = button && button.closest(ROOT);
    if (!root) return;
    const input = root.querySelector('input[type="number"]');
    if (!input) return;
    if (input.value === '') input.value = input.min || '0';
    else if (button.getAttribute('data-bootcn-step') === 'up') input.stepUp();
    else input.stepDown();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function onInput(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root) sync(root);
  }

  function init(root = document) {
    root.querySelectorAll(ROOT).forEach(sync);
    if (listening) return;
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('input', onInput);
    listening = false;
  }

  ns.numberField = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
