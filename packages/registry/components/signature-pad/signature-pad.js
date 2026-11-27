(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.signature) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-signature]';
  const INK = '#111827'; // exported signatures are always dark ink on transparent
  const FONT = '"Segoe Script", "Brush Script MT", "Snell Roundhand", cursive';
  const states = new WeakMap();
  let listening = false;
  let resizeObserver = null;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function q(root, name) {
    return root.querySelector('[data-bootcn-signature-' + name + ']');
  }

  function state(root) {
    let s = states.get(root);
    if (!s) {
      s = { strokes: [], drawing: null, mode: 'draw' };
      states.set(root, s);
    }
    return s;
  }

  // ------------------------------------------------------------- drawing

  function widthAt(point) {
    // Pens report pressure; mice and fingers draw an even line.
    return point.pressure > 0 && point.pressure !== 0.5 ? 1 + point.pressure * 3 : 2.2;
  }

  // Smooth strokes: curves through the midpoints of the recorded points.
  function paint(ctx, strokes, ink) {
    ctx.strokeStyle = ink;
    ctx.fillStyle = ink;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    strokes.forEach(function (points) {
      if (points.length === 1) {
        ctx.beginPath();
        ctx.arc(points[0].x, points[0].y, widthAt(points[0]) / 2, 0, Math.PI * 2);
        ctx.fill();
        return;
      }
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1];
        const b = points[i];
        const before = points[i - 2] || a;
        ctx.beginPath();
        ctx.lineWidth = (widthAt(a) + widthAt(b)) / 2;
        ctx.moveTo((before.x + a.x) / 2, (before.y + a.y) / 2);
        ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
        ctx.stroke();
      }
    });
  }

  function canvasOf(root) {
    return q(root, 'canvas');
  }

  function redraw(root) {
    const canvas = canvasOf(root);
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const box = canvas.getBoundingClientRect();
    if (!box.width) return;
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const ink = getComputedStyle(root).getPropertyValue('--bootcn-signature-ink').trim() || INK;
    paint(ctx, state(root).strokes, ink);
  }

  function isEmpty(root) {
    const s = state(root);
    if (s.mode === 'type') {
      const field = q(root, 'name');
      return !field || !field.value.trim();
    }
    return s.strokes.length === 0;
  }

  // ------------------------------------------------------------- export

  function size(root) {
    const canvas = canvasOf(root);
    const box = canvas ? canvas.getBoundingClientRect() : { width: 480, height: 180 };
    return { w: Math.round(box.width) || 480, h: Math.round(box.height) || 180 };
  }

  function typedCanvas(root, w, h, scale) {
    const canvas = document.createElement('canvas');
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    const name = (q(root, 'name') || { value: '' }).value.trim();
    let px = Math.min(56, h * 0.42);
    ctx.font = px + 'px ' + FONT;
    while (ctx.measureText(name).width > w - 32 && px > 16) {
      px -= 2;
      ctx.font = px + 'px ' + FONT;
    }
    ctx.fillStyle = INK;
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(name, 16, h * 0.66);
    return canvas;
  }

  // PNG (data URL) by default; "svg" gives an SVG document for drawn ones.
  function toDataURL(root, type) {
    if (isEmpty(root)) return '';
    const s = state(root);
    const { w, h } = size(root);
    if (type === 'svg' && s.mode === 'draw') {
      const paths = s.strokes
        .map(function (points) {
          const d = points
            .map((p, i) => (i ? 'L' : 'M') + p.x.toFixed(1) + ' ' + p.y.toFixed(1))
            .join('');
          return '<path d="' + d + '"/>';
        })
        .join('');
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
        w +
        ' ' +
        h +
        '" fill="none" stroke="' +
        INK +
        '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        paths +
        '</svg>';
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }
    if (s.mode === 'type') return typedCanvas(root, w, h, 2).toDataURL('image/png');
    const out = document.createElement('canvas');
    out.width = w * 2;
    out.height = h * 2;
    const ctx = out.getContext('2d');
    ctx.scale(2, 2);
    paint(ctx, s.strokes, INK);
    return out.toDataURL('image/png');
  }

  function changed(root) {
    const empty = isEmpty(root);
    const value = q(root, 'value');
    const data = empty ? '' : toDataURL(root);
    if (value) value.value = data;
    root.classList.toggle('is-empty', empty);
    const undo = q(root, 'undo');
    if (undo) undo.disabled = state(root).strokes.length === 0;
    const clear = q(root, 'clear');
    if (clear) clear.disabled = state(root).strokes.length === 0;
    if (!empty) {
      root.classList.remove('is-invalid');
      const error = q(root, 'error');
      if (error) error.hidden = true;
    }
    root.dispatchEvent(
      new CustomEvent('bootcn:signature:change', {
        bubbles: true,
        detail: { empty: empty, method: state(root).mode, dataUrl: data },
      }),
    );
  }

  // ------------------------------------------------------------- events

  function point(canvas, event) {
    const box = canvas.getBoundingClientRect();
    return {
      x: event.clientX - box.left,
      y: event.clientY - box.top,
      pressure: event.pressure || 0,
    };
  }

  function onPointerDown(event) {
    const canvas = event.target.closest && event.target.closest('[data-bootcn-signature-canvas]');
    if (!canvas || event.button > 0) return;
    const root = canvas.closest(ROOT);
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const s = state(root);
    s.drawing = { id: event.pointerId, points: [point(canvas, event)] };
    s.strokes.push(s.drawing.points);
    redraw(root);
  }

  function onPointerMove(event) {
    const canvas = event.target.closest && event.target.closest('[data-bootcn-signature-canvas]');
    if (!canvas) return;
    const root = canvas.closest(ROOT);
    const s = state(root);
    if (!s.drawing || s.drawing.id !== event.pointerId) return;
    const events = event.getCoalescedEvents ? event.getCoalescedEvents() : [event];
    (events.length ? events : [event]).forEach((e) => s.drawing.points.push(point(canvas, e)));
    redraw(root);
  }

  function onPointerUp(event) {
    const canvas = event.target.closest && event.target.closest('[data-bootcn-signature-canvas]');
    if (!canvas) return;
    const root = canvas.closest(ROOT);
    const s = state(root);
    if (!s.drawing || s.drawing.id !== event.pointerId) return;
    s.drawing = null;
    changed(root);
    const live = q(root, 'live');
    if (live) live.textContent = t('signature.drawn', 'Signature drawn.');
  }

  function setMode(root, mode) {
    const s = state(root);
    s.mode = mode;
    root.setAttribute('data-mode', mode);
    root.querySelectorAll('[data-bootcn-signature-tab]').forEach(function (tab) {
      const on = tab.getAttribute('data-bootcn-signature-tab') === mode;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (mode === 'draw') redraw(root);
    changed(root);
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('button');
    const root = button && button.closest(ROOT);
    if (!root) return;
    const s = state(root);
    const live = q(root, 'live');
    if (button.hasAttribute('data-bootcn-signature-tab')) {
      setMode(root, button.getAttribute('data-bootcn-signature-tab'));
    } else if (button.hasAttribute('data-bootcn-signature-undo')) {
      s.strokes.pop();
      redraw(root);
      changed(root);
      if (live) live.textContent = t('signature.undone', 'Last stroke removed.');
    } else if (button.hasAttribute('data-bootcn-signature-clear')) {
      s.strokes = [];
      redraw(root);
      changed(root);
      if (live) live.textContent = t('signature.cleared', 'Signature cleared.');
    }
  }

  // Tabs: arrow keys move between Draw and Type.
  function onKeydown(event) {
    const tab = event.target.closest && event.target.closest('[data-bootcn-signature-tab]');
    if (!tab || ['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) < 0) return;
    const root = tab.closest(ROOT);
    const tabs = Array.from(root.querySelectorAll('[data-bootcn-signature-tab]'));
    let i = tabs.indexOf(tab);
    if (event.key === 'ArrowRight') i = (i + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') i = (i - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') i = 0;
    else i = tabs.length - 1;
    event.preventDefault();
    tabs[i].focus();
    setMode(root, tabs[i].getAttribute('data-bootcn-signature-tab'));
  }

  function onInput(event) {
    const field = event.target;
    const root = field.closest && field.closest(ROOT);
    if (!root || !field.matches('[data-bootcn-signature-name]')) return;
    const preview = q(root, 'typed');
    if (preview) preview.textContent = field.value;
    changed(root);
  }

  // In a form with data-required, an empty signature stops the submit.
  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    form.querySelectorAll(ROOT + '[data-required]').forEach(function (root) {
      if (!isEmpty(root)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      root.classList.add('is-invalid');
      const error = q(root, 'error');
      if (error) error.hidden = false;
      const tab = root.querySelector('[data-bootcn-signature-tab][aria-selected="true"]');
      if (tab) tab.focus();
    });
  }

  function setup(root) {
    state(root);
    const canvas = canvasOf(root);
    if (canvas && resizeObserver) resizeObserver.observe(canvas);
    setMode(root, root.getAttribute('data-mode') || 'draw');
  }

  function init() {
    if (!listening) {
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('input', onInput);
      document.addEventListener('submit', onSubmit, true);
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(function (entries) {
          entries.forEach((entry) => redraw(entry.target.closest(ROOT)));
        });
      }
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
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('input', onInput);
    document.removeEventListener('submit', onSubmit, true);
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    listening = false;
  }

  ns.signature = {
    init: init,
    destroy: destroy,
    setup: setup,
    toDataURL: toDataURL,
    isEmpty: isEmpty,
    clear: function (root) {
      state(root).strokes = [];
      const name = q(root, 'name');
      if (name) name.value = '';
      redraw(root);
      changed(root);
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
