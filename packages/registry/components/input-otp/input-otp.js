(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.inputOtp) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-otp]';
  let listening = false;

  function render(root) {
    const input = root.querySelector('.bootcn-otp__input');
    const slots = Array.from(root.querySelectorAll('.bootcn-otp__slot'));
    if (!input || slots.length === 0) return;
    const max = Number(input.maxLength) > 0 ? input.maxLength : slots.length;
    const numeric = (input.getAttribute('inputmode') || '') === 'numeric';
    let value = numeric ? input.value.replace(/\D/g, '') : input.value.replace(/\s/g, '');
    value = value.slice(0, max);
    if (input.value !== value) input.value = value;
    slots.forEach((slot, index) => {
      slot.textContent = value[index] || '';
      slot.classList.toggle('is-active', index === Math.min(value.length, slots.length - 1));
    });
    if (value.length === max && root.getAttribute('data-bootcn-otp-last') !== value) {
      root.setAttribute('data-bootcn-otp-last', value);
      root.dispatchEvent(
        new CustomEvent('bootcn:otp:complete', { bubbles: true, detail: { value: value } }),
      );
    } else if (value.length < max) {
      root.removeAttribute('data-bootcn-otp-last');
    }
  }

  function onInput(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root) render(root);
  }

  // Clicking a slot puts the caret at the end, so typing fills the next slot.
  // A text selection (select all, then paste or type) is left alone, so it
  // replaces the code.
  function onPlaceCaret(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.closest(ROOT)) return;
    const end = input.value.length;
    if (input.selectionStart === input.selectionEnd && input.selectionStart !== end) {
      input.setSelectionRange(end, end);
    }
  }

  function init(root = document) {
    root.querySelectorAll(ROOT).forEach((element) => {
      element.classList.add('is-enhanced');
      render(element);
    });
    if (!listening) {
      document.addEventListener('input', onInput);
      document.addEventListener('click', onPlaceCaret, true);
      document.addEventListener('focus', onPlaceCaret, true);
      listening = true;
    }
  }

  function destroy(root = document) {
    root.querySelectorAll(ROOT).forEach((element) => element.classList.remove('is-enhanced'));
    if (root === document && listening) {
      document.removeEventListener('input', onInput);
      document.removeEventListener('click', onPlaceCaret, true);
      document.removeEventListener('focus', onPlaceCaret, true);
      listening = false;
    }
  }

  ns.inputOtp = { init: init, destroy: destroy, render: render };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
