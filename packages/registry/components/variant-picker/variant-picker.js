(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.variantPicker) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-variant]';
  let listening = false;

  // Shows the chosen option next to the group's name: "Color: Navy".
  function sync(group) {
    const checked = group.querySelector('input:checked');
    const value = group.querySelector('[data-bootcn-variant-value]');
    if (value && checked) value.textContent = checked.value;
  }

  function onChange(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.closest(ROOT)) return;
    const group = input.closest('fieldset');
    if (group) sync(group);
    const root = input.closest(ROOT);
    const choice = {};
    root.querySelectorAll('input:checked').forEach(function (el) {
      choice[el.name] = el.value;
    });
    root.dispatchEvent(new CustomEvent('bootcn:variant:change', { bubbles: true, detail: choice }));
  }

  function init() {
    if (!listening) {
      document.addEventListener('change', onChange);
      listening = true;
    }
    document.querySelectorAll(ROOT + ' fieldset').forEach(sync);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('change', onChange);
    listening = false;
  }

  ns.variantPicker = { init: init, destroy: destroy };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
