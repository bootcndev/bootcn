(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.swipe) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-swipe]';
  const ROW = '.bootcn-swipe';
  const THRESHOLD = 8; // px before a drag counts as a swipe
  let listening = false;
  let drag = null;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function rtl(el) {
    return getComputedStyle(el).direction === 'rtl';
  }

  function side(row, name) {
    return row.querySelector(':scope > .bootcn-swipe__actions--' + name);
  }

  function width(el) {
    return el ? el.scrollWidth : 0;
  }

  // Physical offset in px: positive moves the content right.
  function setOffset(row, x) {
    row.style.setProperty('--bootcn-swipe-x', x + 'px');
    row.dataset.swipeX = String(x);
  }

  function offset(row) {
    return Number(row.dataset.swipeX || 0);
  }

  // Leading actions sit at the start (left in LTR); they show when the
  // content moves towards the end.
  function open(row, name) {
    const root = row.closest(ROOT);
    root.querySelectorAll(ROW).forEach((other) => {
      if (other !== row) close(other);
    });
    const dir = rtl(row) ? -1 : 1;
    const w = width(side(row, name));
    if (!w) return;
    setOffset(row, (name === 'leading' ? 1 : -1) * dir * w);
    row.dataset.swipeOpen = name;
    row.dispatchEvent(
      new CustomEvent('bootcn:swipe:open', { bubbles: true, detail: { row, side: name } }),
    );
  }

  function close(row) {
    if (!row.dataset.swipeOpen && !offset(row)) return;
    row.classList.remove('is-full', 'is-full-leading');
    setOffset(row, 0);
    delete row.dataset.swipeOpen;
  }

  function announce(root, text) {
    let status = root.nextElementSibling;
    if (!status || !status.hasAttribute('data-bootcn-swipe-status')) {
      status = document.createElement('div');
      status.className = 'visually-hidden';
      status.setAttribute('role', 'status');
      status.setAttribute('data-bootcn-swipe-status', '');
      root.after(status);
    }
    status.textContent = '';
    setTimeout(() => (status.textContent = text), 50);
  }

  function focusable(row) {
    return (
      row &&
      row.querySelector(
        '.bootcn-swipe__content a, .bootcn-swipe__content button, .bootcn-swipe__content [tabindex]',
      )
    );
  }

  function remove(row) {
    const root = row.closest(ROOT);
    const next = row.nextElementSibling || row.previousElementSibling;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const done = () => {
      row.remove();
      announce(root, t('swipe.removed', 'Removed'));
      const target = focusable(next);
      if (target) target.focus();
      root.dispatchEvent(
        new CustomEvent('bootcn:swipe:removed', { bubbles: true, detail: { row } }),
      );
    };
    if (reduce) return done();
    row.style.height = row.offsetHeight + 'px';
    void row.offsetHeight; // start the transition from the current height
    row.classList.add('is-removing');
    row.style.height = '0px';
    setTimeout(done, 250);
  }

  function run(row, button) {
    const event = new CustomEvent('bootcn:swipe:action', {
      bubbles: true,
      cancelable: true,
      detail: { row, action: button.dataset.action, button },
    });
    if (!button.dispatchEvent(event)) return;
    if (button.hasAttribute('data-swipe-remove')) remove(row);
    else {
      close(row);
      const target = focusable(row);
      if (target && row.contains(document.activeElement)) target.focus();
    }
  }

  function onPointerDown(event) {
    if (event.button !== 0) return;
    const c = event.target.closest('.bootcn-swipe__content');
    const row = c && c.closest(ROW);
    if (!row || !row.closest(ROOT)) return;
    drag = {
      row,
      c,
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      base: offset(row),
      moving: false,
      moved: false,
    };
  }

  function onPointerMove(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    const { row } = drag;
    if (!drag.moving) {
      if (Math.abs(dx) < THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        drag = null; // a vertical scroll
        return;
      }
      drag.moving = true;
      row.classList.add('is-dragging');
      try {
        drag.c.setPointerCapture(drag.id);
      } catch {
        // capture is a nicety
      }
      row
        .closest(ROOT)
        .querySelectorAll(ROW)
        .forEach((other) => {
          if (other !== row) close(other);
        });
    }
    drag.moved = true;
    const dir = rtl(row) ? -1 : 1;
    let x = drag.base + dx;
    const logical = x * dir; // > 0: leading side shows
    const lead = side(row, 'leading');
    const trail = side(row, 'trailing');
    const max = logical > 0 ? width(lead) : width(trail);
    if (!max) x = 0;
    else if (Math.abs(x) > max) {
      // Past the actions: follow the finger more slowly, unless a full swipe is allowed.
      const full =
        logical > 0
          ? lead.querySelector('[data-swipe-full]')
          : trail.querySelector('[data-swipe-full]');
      if (!full) x = Math.sign(x) * (max + (Math.abs(x) - max) * 0.25);
    }
    const isFull = Math.abs(x) > row.offsetWidth * 0.6;
    row.classList.toggle('is-full', isFull && logical < 0);
    row.classList.toggle('is-full-leading', isFull && logical > 0);
    setOffset(row, x);
  }

  function onPointerUp(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const { row, moved } = drag;
    drag = null;
    row.classList.remove('is-dragging');
    if (!moved) return;
    row.dataset.swipeDragged = '1'; // swallow the click that follows
    setTimeout(() => delete row.dataset.swipeDragged, 0);
    const x = offset(row);
    const logical = x * (rtl(row) ? -1 : 1);
    const name = logical > 0 ? 'leading' : 'trailing';
    const group = side(row, name);
    if (row.classList.contains('is-full') || row.classList.contains('is-full-leading')) {
      const button = group.querySelector('[data-swipe-full]');
      if (button) {
        setOffset(row, Math.sign(x) * row.offsetWidth);
        return run(row, button);
      }
    }
    if (Math.abs(x) > width(group) / 2) open(row, name);
    else close(row);
  }

  function onClick(event) {
    const button = event.target.closest('.bootcn-swipe__action');
    const row = event.target.closest(ROW);
    if (button && row && row.closest(ROOT)) return run(row, button);
    if (row && row.dataset.swipeDragged) {
      event.preventDefault();
      return;
    }
    // A tap on an open row, or anywhere else, closes it.
    document.querySelectorAll(ROOT + ' ' + ROW + '[data-swipe-open]').forEach((open) => {
      if (open === row) event.preventDefault();
      close(open);
    });
  }

  // Firefox starts dragging the row's link (and cancels the pointer) on a
  // mouse swipe; the row moves instead.
  function onDragStart(event) {
    if (event.target.closest && event.target.closest(ROOT + ' .bootcn-swipe__content'))
      event.preventDefault();
  }

  function onFocusIn(event) {
    const button = event.target.closest && event.target.closest('.bootcn-swipe__action');
    const row = button && button.closest(ROW);
    if (!row || !row.closest(ROOT)) return;
    const name = button.closest('.bootcn-swipe__actions--leading') ? 'leading' : 'trailing';
    if (row.dataset.swipeOpen !== name) open(row, name);
  }

  function onFocusOut(event) {
    const row = event.target.closest && event.target.closest(ROW);
    if (!row || !row.dataset.swipeOpen) return;
    if (!event.relatedTarget || !row.contains(event.relatedTarget)) close(row);
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    const row = event.target.closest && event.target.closest(ROW + '[data-swipe-open]');
    if (!row) return;
    close(row);
    const target = focusable(row);
    if (target) target.focus();
  }

  function setup(root) {
    root.classList.add('is-ready');
  }

  function init() {
    if (!listening) {
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
      document.addEventListener('click', onClick, true);
      document.addEventListener('dragstart', onDragStart);
      document.addEventListener('focusin', onFocusIn);
      document.addEventListener('focusout', onFocusOut);
      document.addEventListener('keydown', onKeydown);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('dragstart', onDragStart);
    document.removeEventListener('focusin', onFocusIn);
    document.removeEventListener('focusout', onFocusOut);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  ns.swipe = { init, destroy, setup, open, close, remove };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
