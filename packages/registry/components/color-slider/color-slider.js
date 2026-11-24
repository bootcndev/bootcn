(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.colorSlider) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-color-slider]';
  const UNITS = { h: '°', s: '%', l: '%', a: '%' };
  const NAMES = { h: 'degrees', s: 'percent', l: 'percent', a: 'percent' };
  let listening = false;

  function read(root) {
    const style = root.style;
    const value = {
      h: parseFloat(style.getPropertyValue('--bootcn-color-h')) || 0,
      s: parseFloat(style.getPropertyValue('--bootcn-color-s')) || 0,
      l: parseFloat(style.getPropertyValue('--bootcn-color-l')) || 0,
      a: parseFloat(style.getPropertyValue('--bootcn-color-a')),
    };
    if (Number.isNaN(value.a)) value.a = 1;
    return value;
  }

  function cssColor(c) {
    return 'hsl(' + c.h + ' ' + c.s + '% ' + c.l + '% / ' + c.a + ')';
  }

  // Writes the channels to the CSS variables, outputs, inputs and the
  // hidden value; emits the change event.
  function render(root, c, emit) {
    root.style.setProperty('--bootcn-color-h', String(c.h));
    root.style.setProperty('--bootcn-color-s', c.s + '%');
    root.style.setProperty('--bootcn-color-l', c.l + '%');
    root.style.setProperty('--bootcn-color-a', String(c.a));
    root.querySelectorAll('input[data-channel]').forEach(function (input) {
      const channel = input.getAttribute('data-channel');
      const shown = channel === 'a' ? Math.round(c.a * 100) : c[channel];
      input.value = String(shown);
      input.setAttribute('aria-valuetext', shown + ' ' + NAMES[channel]);
      const output = root.querySelector('output[for="' + input.id + '"]');
      if (output) output.textContent = shown + UNITS[channel];
    });
    const hidden = root.querySelector('[data-bootcn-color-slider-value]');
    if (hidden) hidden.value = cssColor(c);
    if (emit) {
      root.dispatchEvent(
        new CustomEvent('bootcn:color-slider:change', {
          bubbles: true,
          detail: { value: cssColor(c), h: c.h, s: c.s, l: c.l, a: c.a },
        }),
      );
    }
  }

  function onInput(event) {
    const input = event.target;
    if (!input.matches || !input.matches(ROOT + ' input[data-channel]')) return;
    const root = input.closest(ROOT);
    const c = read(root);
    const channel = input.getAttribute('data-channel');
    const number = Number(input.value);
    c[channel] = channel === 'a' ? number / 100 : number;
    render(root, c, true);
  }

  function setColor(root, c) {
    render(root, Object.assign(read(root), c), true);
  }

  function init() {
    if (!listening) {
      document.addEventListener('input', onInput);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(function (root) {
      render(root, read(root), false);
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('input', onInput);
    listening = false;
  }

  ns.colorSlider = { init: init, destroy: destroy, setColor: setColor };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
