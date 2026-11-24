(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.slider) return; // already loaded: idempotent

  const SELECTOR = '[data-bootcn-slider]';
  let listening = false;

  // Fills the track up to the value and mirrors it in the <output>.
  function update(input) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const percent = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 0;
    input.style.setProperty('--bootcn-slider-fill', percent + '%');
    if (!input.id) return;
    const output = document.querySelector('output[for~="' + input.id + '"]');
    if (output) {
      output.textContent =
        (input.getAttribute('data-bootcn-slider-prefix') || '') +
        input.value +
        (input.getAttribute('data-bootcn-slider-suffix') || '');
    }
  }

  function onInput(event) {
    if (event.target instanceof HTMLInputElement && event.target.matches(SELECTOR)) {
      update(event.target);
    }
  }

  function init(root = document) {
    root.querySelectorAll(SELECTOR).forEach(update);
    if (!listening) {
      document.addEventListener('input', onInput);
      listening = true;
    }
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('input', onInput);
    listening = false;
  }

  ns.slider = { init: init, destroy: destroy, update: update };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
    });
  } else {
    init();
  }
})();
