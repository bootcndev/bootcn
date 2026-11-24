(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.colorPicker) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-color-picker]';
  const HEX = /^#[0-9a-f]{6}$/i;
  let listening = false;

  // Writes one color to every part: swatches, system picker, hex field, value.
  function setColor(root, color, from) {
    const value = color.toLowerCase();
    root.querySelectorAll('.bootcn-color-swatch input').forEach((radio) => {
      radio.checked = radio.value.toLowerCase() === value;
    });
    const native = root.querySelector('.bootcn-color-picker__native');
    const hex = root.querySelector('.bootcn-color-picker__hex');
    const hidden = root.querySelector('[data-bootcn-color-picker-value]');
    if (native && from !== native) native.value = value;
    if (hex && from !== hex) {
      hex.value = value;
      hex.removeAttribute('aria-invalid');
    }
    if (hidden) hidden.value = value;
    root.dispatchEvent(
      new CustomEvent('bootcn:color-picker:change', { bubbles: true, detail: { value: value } }),
    );
  }

  function onInput(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    const target = event.target;
    if (
      target.matches('.bootcn-color-swatch input') ||
      target.matches('.bootcn-color-picker__native')
    ) {
      setColor(root, target.value, target);
    } else if (target.matches('.bootcn-color-picker__hex')) {
      const value = target.value.trim();
      const valid = HEX.test(value);
      target.setAttribute('aria-invalid', String(!valid));
      if (valid) setColor(root, value, target);
    }
  }

  function init() {
    if (listening) return;
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('input', onInput);
    document.removeEventListener('change', onInput);
    listening = false;
  }

  ns.colorPicker = { init: init, destroy: destroy, setColor: setColor };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
