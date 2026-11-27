(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.flow) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-flow]';
  const NODE = '.bootcn-flow__node';
  const MIN = 0.4;
  const MAX = 1.5;
  let listening = false;
  let pan = null;
  let menu = null; // { root, button, el }

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  }

  function emit(el, name, detail, cancelable) {
    return el.dispatchEvent(
      new CustomEvent('bootcn:flow:' + name, { bubbles: true, cancelable: !!cancelable, detail }),
    );
  }

  function titleOf(node) {
    const el = node && node.querySelector('.bootcn-flow__title');
    return el ? el.textContent.trim() : '';
  }

  function announce(root, text) {
    let status = root.querySelector(':scope > [data-bootcn-flow-status]');
    if (!status) {
      status = document.createElement('div');
      status.className = 'visually-hidden';
      status.setAttribute('role', 'status');
      status.setAttribute('data-bootcn-flow-status', '');
      root.append(status);
    }
    status.textContent = '';
    setTimeout(() => (status.textContent = text), 50);
  }

  // Each + button says where the new step goes.
  function labelAdds(root) {
    root.querySelectorAll('.bootcn-flow__add').forEach((button) => {
      const link = button.closest('.bootcn-flow__link');
      const branch = link.parentElement.closest('.bootcn-flow__branch');
      let label;
      if (link.parentElement.classList.contains('bootcn-flow__step')) {
        label = fill(t('flow.addAfter', 'Add a step after {title}'), {
          title: titleOf(link.parentElement.querySelector(NODE)),
        });
      } else if (branch) {
        const condition = branch.closest('.bootcn-flow__step').querySelector(':scope > ' + NODE);
        const name = branch.querySelector(':scope > .bootcn-flow__label');
        label = fill(t('flow.addBranch', 'Add a step at the start of {branch}: {title}'), {
          branch: name ? name.textContent.trim() : '',
          title: titleOf(condition),
        });
      }
      if (label) button.setAttribute('aria-label', label);
    });
  }

  // ---------------------------------------------------------------- select

  function select(root, node) {
    root.querySelectorAll(NODE + '[aria-pressed="true"]').forEach((other) => {
      if (other !== node) other.setAttribute('aria-pressed', 'false');
    });
    if (!node) return;
    node.setAttribute('aria-pressed', 'true');
    emit(node, 'select', { node, id: node.dataset.id || null, kind: node.dataset.kind || null });
  }

  // Arrow keys move to the nearest node in that direction.
  function neighbour(root, node, key) {
    // Down from a condition goes into its first branch.
    if (key === 'ArrowDown' && node.dataset.kind === 'condition') {
      const first = node.parentElement.querySelector(':scope > .bootcn-flow__branches ' + NODE);
      if (first) return first;
    }
    const from = node.getBoundingClientRect();
    const fx = from.left + from.width / 2;
    const fy = from.top + from.height / 2;
    let best = null;
    let bestScore = Infinity;
    root.querySelectorAll(NODE).forEach((other) => {
      if (other === node) return;
      const r = other.getBoundingClientRect();
      const dx = r.left + r.width / 2 - fx;
      const dy = r.top + r.height / 2 - fy;
      let main;
      let cross;
      if (key === 'ArrowDown') [main, cross] = [dy, dx];
      else if (key === 'ArrowUp') [main, cross] = [-dy, dx];
      else if (key === 'ArrowRight') [main, cross] = [dx, dy];
      else [main, cross] = [-dx, dy];
      if (main <= 1) return;
      const score = main + Math.abs(cross) * 2;
      if (score < bestScore) {
        bestScore = score;
        best = other;
      }
    });
    return best;
  }

  // ------------------------------------------------------------ add/remove

  function templates(root) {
    return [...root.querySelectorAll(':scope > template[data-flow-step]')];
  }

  function closeMenu(focus) {
    if (!menu) return;
    const { button, el } = menu;
    el.remove();
    button.setAttribute('aria-expanded', 'false');
    if (focus) button.focus();
    menu = null;
  }

  function openMenu(root, button) {
    closeMenu(false);
    const list = templates(root);
    if (
      !emit(button, 'add', { button, after: placeOf(button), kind: null }, true) ||
      list.length === 0
    )
      return;
    const el = document.createElement('div');
    el.className = 'bootcn-flow__menu';
    el.setAttribute('role', 'menu');
    el.setAttribute('aria-label', t('flow.menu', 'Add a step'));
    list.forEach((template) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'bootcn-flow__menu-item';
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '-1');
      item.dataset.flowStep = template.dataset.flowStep;
      const node = template.content.querySelector('.bootcn-flow__icon');
      if (node) item.append(node.cloneNode(true));
      item.append(document.createTextNode(template.dataset.label || template.dataset.flowStep));
      item.normalize();
      el.append(item);
    });
    root.append(el);
    const r = button.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
    let top = r.bottom + 6;
    if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
    el.style.left = left + 'px';
    el.style.top = top + 'px';
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'true');
    menu = { root, button, el };
    el.querySelector('[role="menuitem"]').focus();
  }

  // Where a + button puts a new step: after a step, or first in a branch.
  function placeOf(button) {
    const link = button.closest('.bootcn-flow__link');
    const parent = link.parentElement;
    if (parent.classList.contains('bootcn-flow__step')) return { step: parent };
    return { branch: parent };
  }

  function insert(root, button, kind) {
    const template = root.querySelector(':scope > template[data-flow-step="' + kind + '"]');
    if (!template) return null;
    const fragment = template.content.cloneNode(true);
    const step = fragment.querySelector('.bootcn-flow__step');
    if (!step) return null;
    const place = placeOf(button);
    if (place.step) place.step.after(step);
    else place.branch.querySelector(':scope > .bootcn-flow__steps').prepend(step);
    // A new condition takes the steps that followed it into its first branch.
    const first = step.querySelector(
      ':scope > .bootcn-flow__branches > .bootcn-flow__branch > .bootcn-flow__steps',
    );
    if (first && step.nextElementSibling) {
      first.replaceChildren();
      while (step.nextElementSibling) first.append(step.nextElementSibling);
    }
    step.classList.add('is-new');
    setTimeout(() => step.classList.remove('is-new'), 400);
    labelAdds(root);
    const node = step.querySelector(NODE);
    select(root, node);
    node.focus();
    announce(root, fill(t('flow.added', 'Added: {title}'), { title: titleOf(node) }));
    emit(step, 'change', { action: 'add', step, kind });
    return step;
  }

  function remove(root, node) {
    const step = node.closest('.bootcn-flow__step');
    if (!step || node.dataset.kind === 'trigger' || node.hasAttribute('data-flow-locked'))
      return false;
    if (!emit(node, 'remove', { node, step, id: node.dataset.id || null }, true)) return false;
    const nodes = [...root.querySelectorAll(NODE)];
    const index = nodes.indexOf(node);
    const title = titleOf(node);
    step.remove();
    labelAdds(root);
    const rest = [...root.querySelectorAll(NODE)];
    const next = rest[Math.max(0, Math.min(index - 1, rest.length - 1))];
    if (next) {
      select(root, next);
      next.focus();
    }
    announce(root, fill(t('flow.removed', 'Removed: {title}'), { title }));
    emit(root, 'change', { action: 'remove', step });
    return true;
  }

  // ------------------------------------------------------------------ zoom

  function zoomOf(root) {
    return Number(root.dataset.zoom || 1);
  }

  function zoom(root, value) {
    const viewport = root.querySelector('.bootcn-flow__viewport');
    const canvas = root.querySelector('.bootcn-flow__canvas');
    const old = zoomOf(root);
    const next = Math.round(Math.min(MAX, Math.max(MIN, value)) * 100) / 100;
    // Keep the middle of the view where it is.
    const cx = (viewport.scrollLeft + viewport.clientWidth / 2) / old;
    const cy = (viewport.scrollTop + viewport.clientHeight / 2) / old;
    root.dataset.zoom = String(next);
    canvas.style.setProperty('--bootcn-flow-zoom', String(next));
    viewport.scrollLeft = cx * next - viewport.clientWidth / 2;
    viewport.scrollTop = cy * next - viewport.clientHeight / 2;
    const out = root.querySelector('.bootcn-flow__zoom');
    if (out) out.textContent = Math.round(next * 100) + '%';
    emit(root, 'zoom', { zoom: next });
  }

  function fit(root) {
    const viewport = root.querySelector('.bootcn-flow__viewport');
    const canvas = root.querySelector('.bootcn-flow__canvas');
    const z = zoomOf(root);
    const steps = canvas.firstElementChild;
    const w = steps.scrollWidth + 64;
    const h = steps.scrollHeight + 80;
    zoom(root, Math.min(1, (viewport.clientWidth / w) * 1, (viewport.clientHeight / h) * 1) || z);
    viewport.scrollTop = 0;
    centre(root);
  }

  function centre(root) {
    const viewport = root.querySelector('.bootcn-flow__viewport');
    viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
  }

  // ---------------------------------------------------------------- events

  function onClick(event) {
    if (
      menu &&
      !menu.el.contains(event.target) &&
      event.target.closest('.bootcn-flow__add') !== menu.button
    )
      closeMenu(false);
    const root = event.target.closest(ROOT);
    if (!root) return;
    if (root.dataset.panned) return;
    const item = event.target.closest('.bootcn-flow__menu-item');
    if (item && menu) {
      const button = menu.button;
      closeMenu(false);
      if (
        emit(button, 'add', { button, after: placeOf(button), kind: item.dataset.flowStep }, true)
      ) {
        insert(root, button, item.dataset.flowStep);
      }
      return;
    }
    const add = event.target.closest('.bootcn-flow__add');
    if (add) {
      if (menu && menu.button === add) closeMenu(true);
      else openMenu(root, add);
      return;
    }
    const tool = event.target.closest('[data-flow-zoom]');
    if (tool) {
      const action = tool.dataset.flowZoom;
      if (action === 'fit') fit(root);
      else zoom(root, zoomOf(root) + (action === 'in' ? 0.1 : -0.1));
      return;
    }
    const node = event.target.closest(NODE);
    if (node) select(root, node);
  }

  function onKeydown(event) {
    if (menu && menu.el.contains(event.target)) {
      const items = [...menu.el.querySelectorAll('[role="menuitem"]')];
      const i = items.indexOf(event.target);
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault();
        closeMenu(true);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        items[(i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        items[event.key === 'Home' ? 0 : items.length - 1].focus();
      }
      return;
    }
    const node = event.target.closest && event.target.closest(NODE);
    const root = node && node.closest(ROOT);
    if (!root) return;
    if (event.key.startsWith('Arrow')) {
      const next = neighbour(root, node, event.key);
      event.preventDefault();
      if (next) {
        next.focus();
        next.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      if (remove(root, node)) event.preventDefault();
    }
  }

  function onPointerDown(event) {
    const viewport = event.target.closest('.bootcn-flow__viewport');
    if (
      !viewport ||
      event.button !== 0 ||
      event.target.closest('button, a, input, select, textarea')
    )
      return;
    pan = {
      viewport,
      root: viewport.closest(ROOT),
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      left: viewport.scrollLeft,
      top: viewport.scrollTop,
      moved: false,
    };
  }

  function onPointerMove(event) {
    if (!pan || event.pointerId !== pan.id) return;
    const dx = event.clientX - pan.x;
    const dy = event.clientY - pan.y;
    if (!pan.moved && Math.hypot(dx, dy) < 4) return;
    if (!pan.moved) {
      pan.moved = true;
      pan.root.classList.add('is-panning');
      try {
        pan.viewport.setPointerCapture(pan.id);
      } catch {
        // capture is a nicety
      }
    }
    pan.viewport.scrollLeft = pan.left - dx;
    pan.viewport.scrollTop = pan.top - dy;
  }

  function onPointerUp(event) {
    if (!pan || event.pointerId !== pan.id) return;
    const { root, moved } = pan;
    pan = null;
    root.classList.remove('is-panning');
    if (moved) {
      root.dataset.panned = '1';
      setTimeout(() => delete root.dataset.panned, 0);
    }
  }

  function onWheel(event) {
    if (!(event.ctrlKey || event.metaKey)) return;
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || !event.target.closest('.bootcn-flow__viewport')) return;
    event.preventDefault();
    zoom(root, zoomOf(root) * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
  }

  // -------------------------------------------------------------- data out

  function stepsJSON(list) {
    return [...list.children].map((li) => {
      if (li.classList.contains('bootcn-flow__end')) return { kind: 'end' };
      const node = li.querySelector(':scope > ' + NODE);
      const out = {
        id: node.dataset.id || null,
        kind: node.dataset.kind || null,
        title: titleOf(node),
      };
      const branches = li.querySelector(':scope > .bootcn-flow__branches');
      if (branches) {
        out.branches = [...branches.children].map((branch) => ({
          label: (branch.querySelector(':scope > .bootcn-flow__label') || {}).textContent || '',
          steps: stepsJSON(branch.querySelector(':scope > .bootcn-flow__steps')),
        }));
      }
      return out;
    });
  }

  function toJSON(root) {
    return stepsJSON(root.querySelector('.bootcn-flow__canvas > .bootcn-flow__steps'));
  }

  // ------------------------------------------------------------------ setup

  function setup(root) {
    if (root.dataset.flowReady) return;
    root.dataset.flowReady = '1';
    labelAdds(root);
    centre(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
      document.addEventListener('wheel', onWheel, { passive: false });
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    closeMenu(false);
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    document.removeEventListener('wheel', onWheel);
    listening = false;
  }

  ns.flow = {
    init,
    destroy,
    setup,
    select: (root, node) => select(root, node),
    add: (root, button, kind) => insert(root, button, kind),
    remove: (root, node) => remove(root, node),
    zoom: (root, value) => zoom(root, value),
    fit,
    toJSON,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
