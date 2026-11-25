(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.tour) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-tour]';
  const GAP = 14; // between the highlighted element and the card
  const EDGE = 12; // from the edges of the screen
  const states = new WeakMap();
  let listening = false;
  let active = null; // the tour being shown

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function q(root, name) {
    return root.querySelector('[data-bootcn-tour-' + name + ']');
  }

  // Steps from the page: elements with data-bootcn-tour-step="1", "2", …
  // and data-bootcn-tour-title / -text. With a tour id, only the elements
  // whose data-bootcn-tour-for matches it.
  function stepsFromPage(root) {
    const id = root.id;
    return Array.from(document.querySelectorAll('[data-bootcn-tour-step]'))
      .filter(function (el) {
        const owner = el.getAttribute('data-bootcn-tour-for');
        return !owner || owner === id;
      })
      .sort(function (a, b) {
        return (
          Number(a.getAttribute('data-bootcn-tour-step')) -
          Number(b.getAttribute('data-bootcn-tour-step'))
        );
      })
      .map(function (el) {
        return {
          target: el,
          title: el.getAttribute('data-bootcn-tour-title') || '',
          text: el.getAttribute('data-bootcn-tour-text') || '',
        };
      });
  }

  function targetOf(step) {
    return typeof step.target === 'string' ? document.querySelector(step.target) : step.target;
  }

  function position(root) {
    const s = states.get(root);
    if (!s) return;
    const step = s.steps[s.index];
    const target = step && targetOf(step);
    const spot = q(root, 'spotlight');
    const card = q(root, 'card');
    const arrow = q(root, 'arrow');
    if (!target || !card) return;
    const r = target.getBoundingClientRect();
    const pad = 6;
    if (spot) {
      spot.style.top = r.top - pad + 'px';
      spot.style.left = r.left - pad + 'px';
      spot.style.width = r.width + pad * 2 + 'px';
      spot.style.height = r.height + pad * 2 + 'px';
    }
    const w = card.offsetWidth;
    const h = card.offsetHeight;
    let top = r.bottom + pad + GAP;
    let side = 'below';
    if (top + h > window.innerHeight - EDGE) {
      if (r.top - pad - GAP - h >= EDGE) {
        top = r.top - pad - GAP - h;
        side = 'above';
      } else {
        top = Math.max(EDGE, window.innerHeight - h - EDGE);
        side = 'none';
      }
    }
    const center = r.left + r.width / 2;
    const left = Math.max(EDGE, Math.min(window.innerWidth - w - EDGE, center - w / 2));
    card.style.top = top + 'px';
    card.style.left = left + 'px';
    card.setAttribute('data-side', side);
    if (arrow) arrow.style.left = Math.max(16, Math.min(w - 16, center - left)) + 'px';
  }

  function show(root, index) {
    const s = states.get(root);
    s.index = index;
    const step = s.steps[index];
    const target = targetOf(step);
    const title = q(root, 'title');
    const text = q(root, 'text');
    const count = q(root, 'count');
    const prev = q(root, 'prev');
    const next = q(root, 'next');
    if (title) title.textContent = step.title;
    if (text) text.textContent = step.text;
    if (count) {
      count.textContent = t('tour.count', '{n} of {total}')
        .replace('{n}', String(index + 1))
        .replace('{total}', String(s.steps.length));
    }
    if (prev) prev.hidden = index === 0;
    if (next) {
      next.textContent =
        index === s.steps.length - 1 ? t('tour.done', 'Done') : t('tour.next', 'Next');
    }
    if (target) {
      target.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: reducedMotion() ? 'auto' : 'smooth',
      });
    }
    position(root);
    const card = q(root, 'card');
    if (card) card.focus();
    root.dispatchEvent(
      new CustomEvent('bootcn:tour:step', {
        bubbles: true,
        detail: { index: index, target: target },
      }),
    );
  }

  function start(root, steps) {
    if (active && active !== root) end(active, false);
    const list = (steps || stepsFromPage(root)).filter(function (step) {
      const target = targetOf(step);
      return target && target.getClientRects().length;
    });
    if (!list.length) return false;
    states.set(root, { steps: list, index: 0, returnTo: document.activeElement });
    active = root;
    root.hidden = false;
    document.documentElement.classList.add('bootcn-tour-open');
    root.dispatchEvent(new CustomEvent('bootcn:tour:start', { bubbles: true }));
    show(root, 0);
    return true;
  }

  function end(root, completed) {
    const s = states.get(root);
    root.hidden = true;
    document.documentElement.classList.remove('bootcn-tour-open');
    if (active === root) active = null;
    if (s && s.returnTo && s.returnTo.focus) s.returnTo.focus();
    states.delete(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:tour:end', {
        bubbles: true,
        detail: { completed: Boolean(completed) },
      }),
    );
  }

  function next(root) {
    const s = states.get(root);
    if (!s) return;
    if (s.index >= s.steps.length - 1) end(root, true);
    else show(root, s.index + 1);
  }

  function prev(root) {
    const s = states.get(root);
    if (s && s.index > 0) show(root, s.index - 1);
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('button');
    if (!button) return;
    const starter = button.getAttribute('data-bootcn-tour-start');
    if (starter !== null) {
      const root = starter ? document.querySelector(starter) : document.querySelector(ROOT);
      if (root) start(root);
      return;
    }
    const root = button.closest(ROOT);
    if (!root) return;
    if (button.hasAttribute('data-bootcn-tour-next')) next(root);
    else if (button.hasAttribute('data-bootcn-tour-prev')) prev(root);
    else if (button.hasAttribute('data-bootcn-tour-skip')) end(root, false);
  }

  function onKeydown(event) {
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      end(active, false);
      return;
    }
    if (event.key === 'ArrowRight' && event.target === q(active, 'card')) next(active);
    else if (event.key === 'ArrowLeft' && event.target === q(active, 'card')) prev(active);
    if (event.key !== 'Tab') return;
    // Keep the focus in the card while the tour is open.
    const card = q(active, 'card');
    const focusable = Array.from(card.querySelectorAll('button:not([hidden]), a[href]')).filter(
      (el) => el.getClientRects().length,
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === card)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    } else if (!card.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    }
  }

  let frame = 0;
  function onViewportChange() {
    if (!active || frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      if (active) position(active);
    });
  }

  function init() {
    if (listening) return;
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    if (active) end(active, false);
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
    listening = false;
  }

  ns.tour = {
    init: init,
    destroy: destroy,
    start: start,
    next: next,
    prev: prev,
    end: function (root) {
      end(root, false);
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
