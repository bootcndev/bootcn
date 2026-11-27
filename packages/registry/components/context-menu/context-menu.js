(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.contextMenu) return; // already loaded: idempotent

  const TRIGGER = '[data-bootcn-context-menu]';
  const ITEMS = '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';
  let open = null; // { menu, trigger, subs: [submenu, ...] }
  let listening = false;
  let hoverTimer = 0;

  // The items of this menu, not of its submenus.
  function menuItems(menu) {
    return Array.from(menu.querySelectorAll(ITEMS)).filter(
      (item) =>
        item.closest('[role="menu"]') === menu &&
        !item.disabled &&
        item.getAttribute('aria-disabled') !== 'true',
    );
  }

  function currentMenu() {
    if (!open) return null;
    return open.subs.length ? open.subs[open.subs.length - 1] : open.menu;
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

  // ------------------------------------------------------------- submenus

  function submenuOf(item) {
    const id = item.getAttribute('aria-controls');
    return id ? document.getElementById(id) : null;
  }

  // Next to its item, on the other side when there is no room.
  function openSubmenu(item, focusFirst) {
    const sub = submenuOf(item);
    if (!sub || !open) return;
    const level = open.subs.indexOf(item.closest('[role="menu"]')) + 1;
    closeSubmenus(level);
    const box = item.getBoundingClientRect();
    sub.classList.add('show');
    sub.style.left = '0px';
    sub.style.top = '0px';
    const rect = sub.getBoundingClientRect();
    const rtl = getComputedStyle(item).direction === 'rtl';
    let left = rtl ? box.left - rect.width + 4 : box.right - 4;
    if (!rtl && left + rect.width > window.innerWidth - 8) left = box.left - rect.width + 4;
    if (rtl && left < 8) left = box.right - 4;
    sub.style.left = Math.max(8, left) + 'px';
    sub.style.top = Math.max(8, Math.min(box.top - 6, window.innerHeight - rect.height - 8)) + 'px';
    item.setAttribute('aria-expanded', 'true');
    open.subs.push(sub);
    if (focusFirst) {
      const first = menuItems(sub)[0];
      if (first) first.focus();
    }
  }

  // Closes the submenus deeper than `level` (0 closes them all).
  function closeSubmenus(level) {
    if (!open) return;
    while (open.subs.length > level) {
      const sub = open.subs.pop();
      sub.classList.remove('show');
      const owner = document.querySelector('[aria-controls="' + sub.id + '"]');
      if (owner) owner.setAttribute('aria-expanded', 'false');
    }
  }

  // ------------------------------------------------------------ open/close

  function show(trigger, x, y) {
    const menu = document.getElementById(trigger.getAttribute('data-bootcn-context-menu'));
    if (!menu) return;
    hide(false);
    place(menu, x, y);
    trigger.setAttribute('aria-expanded', 'true');
    open = { menu: menu, trigger: trigger, subs: [] };
    const first = menuItems(menu)[0];
    if (first) first.focus();
  }

  function hide(returnFocus) {
    if (!open) return;
    closeSubmenus(0);
    const { menu, trigger } = open;
    open = null;
    menu.classList.remove('show');
    trigger.setAttribute('aria-expanded', 'false');
    if (returnFocus) trigger.focus();
  }

  // --------------------------------------------------------------- choose

  function choose(item) {
    const trigger = open.trigger;
    const role = item.getAttribute('role');
    if (role === 'menuitemcheckbox') {
      item.setAttribute('aria-checked', String(item.getAttribute('aria-checked') !== 'true'));
    } else if (role === 'menuitemradio') {
      const group = item.closest('[role="group"]') || item.closest('[role="menu"]');
      group
        .querySelectorAll('[role="menuitemradio"]')
        .forEach((other) => other.setAttribute('aria-checked', String(other === item)));
    }
    trigger.dispatchEvent(
      new CustomEvent('bootcn:context-menu:select', {
        bubbles: true,
        detail: {
          value: item.getAttribute('data-value'),
          item: item,
          checked: role === 'menuitem' ? undefined : item.getAttribute('aria-checked') === 'true',
        },
      }),
    );
    // Checkable items keep the menu open so the change can be seen.
    if (role === 'menuitem') hide(true);
  }

  // ---------------------------------------------------------------- events

  function onContextMenu(event) {
    const trigger = event.target.closest(TRIGGER);
    if (!trigger) return;
    event.preventDefault();
    show(trigger, event.clientX, event.clientY);
  }

  function onKeydown(event) {
    if (open) {
      const menu = currentMenu();
      const item = document.activeElement;
      const rtl = getComputedStyle(menu).direction === 'rtl';
      const into = rtl ? 'ArrowLeft' : 'ArrowRight';
      const back = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (event.key === 'Escape' || (event.key === back && open.subs.length)) {
        event.preventDefault();
        if (open.subs.length) {
          const sub = open.subs[open.subs.length - 1];
          closeSubmenus(open.subs.length - 1);
          const owner = document.querySelector('[aria-controls="' + sub.id + '"]');
          if (owner) owner.focus();
        } else hide(true);
        return;
      }
      if (event.key === 'Tab') {
        hide(true);
        return;
      }
      if (menu.contains(item) && item.matches(ITEMS)) {
        if (
          (event.key === into || event.key === 'Enter' || event.key === ' ') &&
          item.hasAttribute('aria-haspopup')
        ) {
          event.preventDefault();
          openSubmenu(item, true);
          return;
        }
        if ((event.key === 'Enter' || event.key === ' ') && !item.matches('button')) {
          event.preventDefault();
          choose(item);
          return;
        }
      }
      if (menu.contains(document.activeElement)) navigateMenu(menu, event);
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

  function inOpenMenus(node) {
    return open && (open.menu.contains(node) || open.subs.some((sub) => sub.contains(node)));
  }

  function onClick(event) {
    if (!open) return;
    const item = event.target.closest(ITEMS);
    if (item && inOpenMenus(item)) {
      if (item.hasAttribute('aria-haspopup')) openSubmenu(item, true);
      else choose(item);
      return;
    }
    if (!inOpenMenus(event.target)) hide(false);
  }

  // Pointing at an item with a submenu opens it after a moment; pointing at
  // another item of the same menu closes the open submenu.
  function onPointerOver(event) {
    if (!open || event.pointerType === 'touch') return;
    const item = event.target.closest && event.target.closest(ITEMS);
    if (!item || !inOpenMenus(item)) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () {
      if (!open) return;
      const level = open.subs.indexOf(item.closest('[role="menu"]')) + 1;
      if (item.hasAttribute('aria-haspopup')) {
        if (item.getAttribute('aria-expanded') !== 'true') openSubmenu(item, false);
      } else closeSubmenus(level);
    }, 150);
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
    document.addEventListener('pointerover', onPointerOver);
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
    document.removeEventListener('pointerover', onPointerOver);
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
