(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.hoverCard) return; // already loaded: idempotent

  const SELECTOR = '[data-bootcn-hover-card]';
  const OPEN_DELAY = 300;
  const CLOSE_DELAY = 150;
  const timers = new WeakMap();
  let listening = false;

  function plugin() {
    return window.bootstrap && window.bootstrap.Popover;
  }

  function instanceFor(trigger) {
    const Popover = plugin();
    const existing = Popover.getInstance(trigger);
    if (existing) return existing;
    const template = document.getElementById(trigger.getAttribute('data-bootcn-hover-card'));
    return new Popover(trigger, {
      trigger: 'manual',
      html: true,
      placement: trigger.getAttribute('data-bootcn-placement') || 'bottom',
      customClass: 'bootcn-hover-card',
      content: template ? template.innerHTML : '',
    });
  }

  function tipOf(trigger) {
    const id = trigger.getAttribute('aria-describedby');
    return id ? document.getElementById(id) : null;
  }

  function schedule(trigger, action, delay) {
    clearTimeout(timers.get(trigger));
    timers.set(
      trigger,
      setTimeout(function () {
        const instance = instanceFor(trigger);
        if (action === 'show') instance.show();
        else instance.hide();
      }, delay),
    );
  }

  // WCAG 1.4.13: the card stays open while the pointer is over it.
  function onOver(event) {
    const trigger = event.target.closest(SELECTOR);
    if (trigger) {
      schedule(trigger, 'show', OPEN_DELAY);
      return;
    }
    const tip = event.target.closest('.bootcn-hover-card');
    if (!tip) return;
    const owner = document.querySelector('[aria-describedby="' + tip.id + '"]');
    if (owner) clearTimeout(timers.get(owner));
  }

  function onOut(event) {
    const trigger = event.target.closest(SELECTOR);
    if (trigger && !trigger.contains(event.relatedTarget)) {
      const tip = tipOf(trigger);
      if (!tip || !tip.contains(event.relatedTarget)) schedule(trigger, 'hide', CLOSE_DELAY);
      return;
    }
    const tip = event.target.closest('.bootcn-hover-card');
    if (!tip || tip.contains(event.relatedTarget)) return;
    const owner = document.querySelector('[aria-describedby="' + tip.id + '"]');
    if (owner && !owner.contains(event.relatedTarget)) schedule(owner, 'hide', CLOSE_DELAY);
  }

  function onFocusIn(event) {
    const trigger = event.target.closest && event.target.closest(SELECTOR);
    if (trigger) schedule(trigger, 'show', 0);
  }

  function onFocusOut(event) {
    const trigger = event.target.closest && event.target.closest(SELECTOR);
    if (trigger) schedule(trigger, 'hide', 0);
  }

  // WCAG 1.4.13: dismissible without moving the pointer or focus.
  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    document.querySelectorAll(SELECTOR + '[aria-describedby]').forEach(function (trigger) {
      clearTimeout(timers.get(trigger));
      instanceFor(trigger).hide();
    });
  }

  function init() {
    if (!plugin()) {
      console.error(
        '[bootcn] hover-card: Bootstrap JavaScript is required. Load the Bootstrap bundle (window.bootstrap.Popover) before bootcn hover-card.js.',
      );
      return;
    }
    if (listening) return;
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('keydown', onKeydown);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('mouseover', onOver);
    document.removeEventListener('mouseout', onOut);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
    const Popover = plugin();
    if (!Popover) return;
    document.querySelectorAll(SELECTOR).forEach(function (trigger) {
      const instance = Popover.getInstance(trigger);
      if (instance) instance.dispose();
    });
  }

  ns.hoverCard = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
