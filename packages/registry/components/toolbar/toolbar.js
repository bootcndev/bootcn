(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.toolbar) return; // already loaded: idempotent

  const ROOT = '[role="toolbar"][data-bootcn-toolbar]';
  let listening = false;

  function controls(toolbar) {
    return Array.from(toolbar.querySelectorAll('button, input, select, a[href]')).filter(
      (el) => !el.disabled,
    );
  }

  // Roving tabindex: the toolbar is one tab stop; arrows move inside it.
  function focusControl(toolbar, control) {
    controls(toolbar).forEach((el) => el.setAttribute('tabindex', el === control ? '0' : '-1'));
    control.focus();
  }

  function onKeydown(event) {
    const toolbar = event.target.closest && event.target.closest(ROOT);
    if (!toolbar) return;
    const list = controls(toolbar);
    const index = list.indexOf(event.target);
    if (index < 0) return;
    let next = null;
    if (event.key === 'ArrowRight') next = list[(index + 1) % list.length];
    else if (event.key === 'ArrowLeft') next = list[(index - 1 + list.length) % list.length];
    else if (event.key === 'Home') next = list[0];
    else if (event.key === 'End') next = list[list.length - 1];
    if (!next) return;
    event.preventDefault();
    focusControl(toolbar, next);
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest(ROOT + ' button');
    if (!button) return;
    const toolbar = button.closest(ROOT);
    focusControl(toolbar, button);
    if (!button.hasAttribute('aria-pressed')) return;
    const group = button.closest('[data-bootcn-toolbar-exclusive]');
    if (group) {
      group.querySelectorAll('[aria-pressed]').forEach((other) => {
        other.setAttribute('aria-pressed', String(other === button));
      });
    } else {
      button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
    }
    toolbar.dispatchEvent(
      new CustomEvent('bootcn:toolbar:change', {
        bubbles: true,
        detail: { button: button, pressed: button.getAttribute('aria-pressed') === 'true' },
      }),
    );
  }

  function init(root = document) {
    root.querySelectorAll(ROOT).forEach((toolbar) => {
      const list = controls(toolbar);
      if (!list.some((el) => el.getAttribute('tabindex') === '0') && list[0]) {
        list[0].setAttribute('tabindex', '0');
      }
    });
    if (listening) return;
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onClick);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.toolbar = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
