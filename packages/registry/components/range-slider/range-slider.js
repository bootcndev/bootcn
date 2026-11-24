(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.rangeSlider) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-range]';
  let listening = false;

  function parts(root) {
    return {
      low: root.querySelector('[data-bootcn-range-min]'),
      high: root.querySelector('[data-bootcn-range-max]'),
      output: root.querySelector('[data-bootcn-range-output]'),
      track: root.querySelector('.bootcn-range__track'),
    };
  }

  function format(root, value) {
    const pattern = root.getAttribute('data-format') || '{value}';
    return pattern.replace('{value}', String(value));
  }

  function percent(input, value) {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    return ((value - min) / (max - min)) * 100;
  }

  // Keeps low <= high (the thumb being moved stops at the other one),
  // then paints the fill, the output and the value texts.
  function update(root, moved) {
    const p = parts(root);
    if (!p.low || !p.high) return;
    let low = Number(p.low.value);
    let high = Number(p.high.value);
    if (low > high) {
      if (moved === p.high) high = low;
      else low = high;
      p.low.value = String(low);
      p.high.value = String(high);
    }
    p.track.style.setProperty('--bootcn-range-low', percent(p.low, low) + '%');
    p.track.style.setProperty('--bootcn-range-high', percent(p.high, high) + '%');
    p.low.setAttribute('aria-valuetext', format(root, low));
    p.high.setAttribute('aria-valuetext', format(root, high));
    // With both thumbs at the top end, the low thumb must stay reachable.
    p.low.classList.toggle('is-front', percent(p.low, low) > 50);
    if (p.output) p.output.textContent = format(root, low) + ' – ' + format(root, high);
    return { low: low, high: high };
  }

  function onInput(event) {
    const input = event.target;
    if (!input.matches || !input.matches(ROOT + ' .bootcn-range__input')) return;
    const root = input.closest(ROOT);
    const value = update(root, input);
    root.dispatchEvent(new CustomEvent('bootcn:range:change', { bubbles: true, detail: value }));
  }

  function setValue(root, low, high) {
    const p = parts(root);
    p.low.value = String(low);
    p.high.value = String(high);
    update(root, null);
  }

  function init() {
    if (!listening) {
      document.addEventListener('input', onInput);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(function (root) {
      update(root, null);
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('input', onInput);
    listening = false;
  }

  ns.rangeSlider = { init: init, destroy: destroy, setValue: setValue };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
