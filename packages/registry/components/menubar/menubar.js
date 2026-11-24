(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.menubar) return; // already loaded: idempotent

  const BAR = '[role="menubar"].bootcn-menubar';
  let listening = false;

  function menuItems(menu) {
    return Array.from(
      menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]'),
    ).filter((item) => !item.disabled && item.getAttribute('aria-disabled') !== 'true');
  }

  // Up/Down/Home/End and typeahead inside an open menu. Returns true if handled.
  function navigateMenu(menu, event) {
    const items = menuItems(menu);
    const index = items.indexOf(document.activeElement);
    let next = null;
    if (event.key === 'ArrowDown') next = items[(index + 1) % items.length];
    else if (event.key === 'ArrowUp') next = items[(index - 1 + items.length) % items.length];
    else if (event.key === 'Home') next = items[0];
    else if (event.key === 'End') next = items[items.length - 1];
    else if (event.key.length === 1 && /\S/.test(event.key)) {
      const key = event.key.toLowerCase();
      const rotated = items.slice(index + 1).concat(items.slice(0, index + 1));
      next = rotated.find((item) => item.textContent.trim().toLowerCase().startsWith(key)) || null;
    }
    if (!next) return false;
    event.preventDefault();
    next.focus();
    return true;
  }

  function triggers(bar) {
    return Array.from(bar.querySelectorAll('.bootcn-menubar__trigger'));
  }

  function menuOf(trigger) {
    return document.getElementById(trigger.getAttribute('aria-controls'));
  }

  function openTrigger(bar) {
    return triggers(bar).find((t) => t.getAttribute('aria-expanded') === 'true') || null;
  }

  // Roving tabindex: only one trigger is in the tab order.
  function focusTrigger(bar, trigger) {
    triggers(bar).forEach((t) => t.setAttribute('tabindex', t === trigger ? '0' : '-1'));
    trigger.focus();
  }

  function close(bar, returnFocus) {
    const trigger = openTrigger(bar);
    if (!trigger) return;
    trigger.setAttribute('aria-expanded', 'false');
    menuOf(trigger).classList.remove('show');
    if (returnFocus) focusTrigger(bar, trigger);
  }

  function open(bar, trigger, focus) {
    close(bar, false);
    trigger.setAttribute('aria-expanded', 'true');
    const menu = menuOf(trigger);
    menu.classList.add('show');
    triggers(bar).forEach((t) => t.setAttribute('tabindex', t === trigger ? '0' : '-1'));
    const items = menuItems(menu);
    if (focus === 'first' && items[0]) items[0].focus();
    else if (focus === 'last' && items.length) items[items.length - 1].focus();
  }

  function adjacent(bar, trigger, step) {
    const list = triggers(bar);
    return list[(list.indexOf(trigger) + step + list.length) % list.length];
  }

  function activate(bar, item) {
    if (item.getAttribute('role') === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
    }
    close(bar, true);
    bar.dispatchEvent(
      new CustomEvent('bootcn:menubar:select', {
        bubbles: true,
        detail: { item: item, checked: item.getAttribute('aria-checked') },
      }),
    );
  }

  function onKeydown(event) {
    const bar = event.target.closest && event.target.closest(BAR);
    if (!bar) return;
    const trigger = event.target.closest('.bootcn-menubar__trigger');
    const menu = event.target.closest('[role="menu"]');

    if (trigger) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const next = adjacent(bar, trigger, event.key === 'ArrowRight' ? 1 : -1);
        if (openTrigger(bar)) open(bar, next, 'first');
        focusTrigger(bar, next);
        if (openTrigger(bar)) menuItems(menuOf(next))[0].focus();
      } else if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(bar, trigger, 'first');
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        open(bar, trigger, 'last');
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const list = triggers(bar);
        focusTrigger(bar, event.key === 'Home' ? list[0] : list[list.length - 1]);
      } else if (event.key === 'Escape') {
        close(bar, true);
      }
      return;
    }

    if (!menu) return;
    const owner = openTrigger(bar);
    if (event.key === 'Escape') {
      event.preventDefault();
      close(bar, true);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const next = adjacent(bar, owner, event.key === 'ArrowRight' ? 1 : -1);
      open(bar, next, 'first');
    } else if (event.key === 'Tab') {
      close(bar, false);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(bar, event.target.closest('[role^="menuitem"]'));
    } else {
      navigateMenu(menu, event);
    }
  }

  function onClick(event) {
    document.querySelectorAll(BAR).forEach((bar) => {
      if (!bar.contains(event.target)) close(bar, false);
    });
    const bar = event.target.closest(BAR);
    if (!bar) return;
    const trigger = event.target.closest('.bootcn-menubar__trigger');
    if (trigger) {
      if (trigger.getAttribute('aria-expanded') === 'true') close(bar, true);
      else open(bar, trigger, null);
      return;
    }
    const item = event.target.closest('[role^="menuitem"]');
    if (item && item.closest('[role="menu"]')) activate(bar, item);
  }

  // Moving the pointer to another trigger switches menus while one is open.
  function onPointerOver(event) {
    const trigger = event.target.closest && event.target.closest('.bootcn-menubar__trigger');
    if (!trigger) return;
    const bar = trigger.closest(BAR);
    const current = openTrigger(bar);
    if (current && current !== trigger) {
      open(bar, trigger, null);
      trigger.focus();
    }
  }

  function init() {
    if (listening) return;
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onClick);
    document.addEventListener('pointerover', onPointerOver);
    listening = true;
  }

  function destroy() {
    document.querySelectorAll(BAR).forEach((bar) => close(bar, false));
    if (!listening) return;
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClick);
    document.removeEventListener('pointerover', onPointerOver);
    listening = false;
  }

  ns.menubar = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
