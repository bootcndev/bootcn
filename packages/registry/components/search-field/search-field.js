(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.searchField) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-search-field]';
  let listening = false;

  function sync(root) {
    const input = root.querySelector('input');
    const clear = root.querySelector('.bootcn-search-field__clear');
    if (input && clear) clear.hidden = input.value === '';
  }

  function clear(root) {
    const input = root.querySelector('input');
    if (!input) return;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
    root.dispatchEvent(new CustomEvent('bootcn:search-field:clear', { bubbles: true }));
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('.bootcn-search-field__clear');
    const root = button && button.closest(ROOT);
    if (root) clear(root);
  }

  function onInput(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root) sync(root);
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || event.target.value === '') return;
    event.preventDefault();
    clear(root);
  }

  function init(root = document) {
    root.querySelectorAll(ROOT).forEach(sync);
    if (listening) return;
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('keydown', onKeydown);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('input', onInput);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  ns.searchField = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
