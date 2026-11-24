(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.colorArea) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-color-area]';
  const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
  const model = new WeakMap(); // root -> { h, s, v } (0-360, 0-100, 0-100)
  let listening = false;
  let dragging = null;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function hsvToHex(h, s, v) {
    s /= 100;
    v /= 100;
    const f = function (n) {
      const k = (n + h / 60) % 6;
      const c = v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
      return Math.round(c * 255)
        .toString(16)
        .padStart(2, '0');
    };
    return '#' + f(5) + f(3) + f(1);
  }

  // '#ABC' or 'abc' -> '#aabbcc'
  function normalize(hex) {
    let value = hex.trim().replace('#', '').toLowerCase();
    if (value.length === 3) {
      value = value
        .split('')
        .map(function (c) {
          return c + c;
        })
        .join('');
    }
    return '#' + value;
  }

  // The exact hex is kept until the color is changed in HSV, so a given
  // value never comes back rounded.
  function hexToHsv(hex) {
    const value = normalize(hex);
    const n = parseInt(value.slice(1), 16);
    const r = ((n >> 16) & 255) / 255;
    const g = ((n >> 8) & 255) / 255;
    const b = (n & 255) / 255;
    const max = Math.max(r, g, b);
    const d = max - Math.min(r, g, b);
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    return {
      h: Math.round(h),
      s: max ? Math.round((d / max) * 100) : 0,
      v: Math.round(max * 100),
      exact: value,
    };
  }

  function parts(root) {
    return {
      area: root.querySelector('[data-bootcn-color-area-area]'),
      x: root.querySelector('[data-axis="x"]'),
      y: root.querySelector('[data-axis="y"]'),
      hue: root.querySelector('[data-bootcn-color-area-hue]'),
      hex: root.querySelector('[data-bootcn-color-area-hex]'),
      value: root.querySelector('[data-bootcn-color-area-value]'),
    };
  }

  function render(root, emit, keepHex) {
    const m = model.get(root);
    const p = parts(root);
    const hex = m.exact || hsvToHex(m.h, m.s, m.v);
    root.style.setProperty('--bootcn-color-area-hue', String(m.h));
    root.style.setProperty('--bootcn-color-area-x', m.s + '%');
    root.style.setProperty('--bootcn-color-area-y', 100 - m.v + '%');
    root.style.setProperty('--bootcn-color-area-color', hex);
    const text = 'Saturation ' + m.s + '%, brightness ' + m.v + '%';
    if (p.x) {
      p.x.value = String(m.s);
      p.x.setAttribute('aria-valuetext', text);
    }
    if (p.y) {
      p.y.value = String(m.v);
      p.y.setAttribute('aria-valuetext', text);
    }
    if (p.hue) {
      p.hue.value = String(m.h);
      p.hue.setAttribute('aria-valuetext', m.h + ' degrees');
    }
    if (p.hex && !keepHex) {
      p.hex.value = hex;
      p.hex.removeAttribute('aria-invalid');
    }
    if (p.value) p.value.value = hex;
    if (emit) {
      root.dispatchEvent(
        new CustomEvent('bootcn:color-area:change', { bubbles: true, detail: { value: hex } }),
      );
    }
  }

  function fromPointer(root, event) {
    const rect = parts(root).area.getBoundingClientRect();
    const m = model.get(root);
    delete m.exact;
    m.s = Math.round(clamp((event.clientX - rect.left) / rect.width, 0, 1) * 100);
    m.v = Math.round(100 - clamp((event.clientY - rect.top) / rect.height, 0, 1) * 100);
    render(root, true);
  }

  function onPointerDown(event) {
    const area =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-color-area-area]');
    if (!area || event.button !== 0) return;
    const root = area.closest(ROOT);
    event.preventDefault();
    dragging = root;
    area.setPointerCapture(event.pointerId);
    parts(root).x.focus({ preventScroll: true });
    fromPointer(root, event);
  }

  // The thumb's input keeps focus: a click in the area must not move it.
  function onMouseDown(event) {
    if (event.target.closest && event.target.closest(ROOT + ' [data-bootcn-color-area-area]')) {
      event.preventDefault();
    }
  }

  function onPointerMove(event) {
    if (dragging) fromPointer(dragging, event);
  }

  function onPointerUp() {
    dragging = null;
  }

  // Both axes from either input: ←/→ saturation, ↑/↓ brightness,
  // Shift for steps of 10, Page Up/Down brightness by 10, Home/End
  // saturation 0/100.
  function onKeydown(event) {
    const input = event.target;
    if (!input.matches || !input.matches(ROOT + ' .bootcn-color-area__input')) return;
    const root = input.closest(ROOT);
    const m = model.get(root);
    const step = event.shiftKey ? 10 : 1;
    const keys = {
      ArrowLeft: ['s', -step],
      ArrowRight: ['s', step],
      ArrowUp: ['v', step],
      ArrowDown: ['v', -step],
      PageUp: ['v', 10],
      PageDown: ['v', -10],
      Home: ['s', -100],
      End: ['s', 100],
    };
    const change = keys[event.key];
    if (!change) return;
    event.preventDefault();
    delete m.exact;
    m[change[0]] = clamp(m[change[0]] + change[1], 0, 100);
    render(root, true);
  }

  function onInput(event) {
    const target = event.target;
    const root = target.closest && target.closest(ROOT);
    if (!root || !model.has(root)) return;
    const m = model.get(root);
    if (target.hasAttribute('data-bootcn-color-area-hue')) {
      delete m.exact;
      m.h = Number(target.value);
      render(root, true);
    } else if (target.hasAttribute('data-bootcn-color-area-hex')) {
      const valid = HEX.test(target.value.trim());
      if (valid) {
        Object.assign(m, hexToHsv(target.value.trim()));
        target.removeAttribute('aria-invalid');
        render(root, true, true);
      }
    } else if (target.matches('.bootcn-color-area__input')) {
      delete m.exact;
      m[target.getAttribute('data-axis') === 'x' ? 's' : 'v'] = Number(target.value);
      render(root, true);
    }
  }

  function onChange(event) {
    const target = event.target;
    if (!target.matches || !target.matches(ROOT + ' [data-bootcn-color-area-hex]')) return;
    const root = target.closest(ROOT);
    if (HEX.test(target.value.trim())) render(root, false);
    else target.setAttribute('aria-invalid', 'true');
  }

  function setColor(root, hex) {
    if (!HEX.test(hex)) return;
    model.set(root, hexToHsv(hex));
    render(root, true);
  }

  function setup(root) {
    const p = parts(root);
    const start = (p.value && p.value.value) || (p.hex && p.hex.value) || '#000000';
    model.set(root, hexToHsv(HEX.test(start) ? start : '#000000'));
    render(root, false);
  }

  const handlers = [
    ['pointerdown', onPointerDown],
    ['mousedown', onMouseDown],
    ['pointermove', onPointerMove],
    ['pointerup', onPointerUp],
    ['pointercancel', onPointerUp],
    ['keydown', onKeydown],
    ['input', onInput],
    ['change', onChange],
  ];

  function init() {
    if (!listening) {
      handlers.forEach(function (pair) {
        document.addEventListener(pair[0], pair[1]);
      });
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    handlers.forEach(function (pair) {
      document.removeEventListener(pair[0], pair[1]);
    });
    listening = false;
  }

  ns.colorArea = { init: init, destroy: destroy, setColor: setColor };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
