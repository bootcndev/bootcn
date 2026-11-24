(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.contextMenu) return; // already loaded: idempotent

  const TRIGGER = '[data-bootcn-context-menu]';
  let open = null; // { menu, trigger }
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

  function place(menu, x, y) {
    menu.classList.add('show');
    menu.style.left = '0px';
    menu.style.top = '0px';
    const rect = menu.getBoundingClientRect();
    const left = Math.max(8, Math.min(x, window.innerWidth - rect.width - 8));
    const top = Math.max(8, Math.min(y, window.innerHeight - rect.height - 8));
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }

  function show(trigger, x, y) {
    const menu = document.getElementById(trigger.getAttribute('data-bootcn-context-menu'));
    if (!menu) return;
    hide(false);
    place(menu, x, y);
    trigger.setAttribute('aria-expanded', 'true');
    open = { menu: menu, trigger: trigger };
    const first = menuItems(menu)[0];
    if (first) first.focus();
  }

  function hide(returnFocus) {
    if (!open) return;
    const { menu, trigger } = open;
    open = null;
    menu.classList.remove('show');
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }

  function onContextMenu(event) {
    const trigger = event.target.closest(TRIGGER);
    if (!trigger) return;
    event.preventDefault();
    show(trigger, event.clientX, event.clientY);
  }

  function onKeydown(event) {
    if (open) {
      if (event.key === 'Escape') {
        event.preventDefault();
        hide(true);
        return;
      }
      if (event.key === 'Tab') {
        hide(true);
        return;
      }
      if (open.menu.contains(document.activeElement)) navigateMenu(open.menu, event);
      return;
    }
    const trigger = event.target.closest && event.target.closest(TRIGGER);
    if (!trigger) return;
    if ((event.shiftKey && event.key === 'F10') || event.key === 'ContextMenu') {
      event.preventDefault();
      const rect = trigger.getBoundingClientRect();
      show(trigger, rect.left, rect.bottom);
    }
  }

  function onClick(event) {
    if (!open) return;
    const item = event.target.closest('[role="menuitem"]');
    if (item && open.menu.contains(item)) {
      const trigger = open.trigger;
      hide(true);
      trigger.dispatchEvent(
        new CustomEvent('bootcn:context-menu:select', {
          bubbles: true,
          detail: { value: item.getAttribute('data-value'), item: item },
        }),
      );
      return;
    }
    if (!open.menu.contains(event.target)) hide(false);
  }

  function onScrollOrResize() {
    hide(false);
  }

  function init() {
    document.querySelectorAll(TRIGGER).forEach((trigger) => {
      if (!trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'false');
    });
    if (listening) return;
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('click', onClick);
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    listening = true;
  }

  function destroy() {
    hide(false);
    if (!listening) return;
    document.removeEventListener('contextmenu', onContextMenu);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('click', onClick);
    window.removeEventListener('resize', onScrollOrResize);
    window.removeEventListener('scroll', onScrollOrResize, true);
    listening = false;
  }

  ns.contextMenu = { init: init, destroy: destroy, show: show, hide: hide };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
