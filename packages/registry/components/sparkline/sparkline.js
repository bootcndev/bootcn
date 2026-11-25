(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.sparkline) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-sparkline]';
  const SVG = 'http://www.w3.org/2000/svg';

  function values(root) {
    return (root.getAttribute('data-values') || '')
      .split(',')
      .map(Number)
      .filter(function (n) {
        return !Number.isNaN(n);
      });
  }

  function format(root, n) {
    return (root.getAttribute('data-format') || '{value}').replace('{value}', String(n));
  }

  // A text version for screen readers: first, lowest, highest and last.
  function summary(root, data) {
    const label = root.getAttribute('data-label') || 'Trend';
    const first = data[0];
    const last = data[data.length - 1];
    const change = first ? Math.round(((last - first) / first) * 100) : 0;
    return (
      label +
      ': from ' +
      format(root, first) +
      ' to ' +
      format(root, last) +
      ' (' +
      (change >= 0 ? '+' : '') +
      change +
      '%), lowest ' +
      format(root, Math.min.apply(null, data)) +
      ', highest ' +
      format(root, Math.max.apply(null, data)) +
      '.'
    );
  }

  function el(name, attrs) {
    const node = document.createElementNS(SVG, name);
    Object.keys(attrs).forEach(function (key) {
      node.setAttribute(key, attrs[key]);
    });
    return node;
  }

  function draw(root) {
    const data = values(root);
    if (data.length < 2) return;
    const w = 100;
    const h = 28;
    const min = Math.min.apply(null, data);
    const max = Math.max.apply(null, data);
    const y = function (v) {
      return max === min ? h / 2 : h - 2 - ((v - min) / (max - min)) * (h - 4);
    };
    const svg = el('svg', {
      viewBox: '0 0 ' + w + ' ' + h,
      preserveAspectRatio: 'none',
      'aria-hidden': 'true',
      focusable: 'false',
    });
    if (root.getAttribute('data-type') === 'bar') {
      const band = w / data.length;
      data.forEach(function (v, i) {
        const top = max === 0 ? h : h - (v / max) * h;
        svg.appendChild(
          el('rect', {
            class: 'bootcn-sparkline__bar',
            x: (i * band + band * 0.15).toFixed(2),
            y: top.toFixed(2),
            width: (band * 0.7).toFixed(2),
            height: (h - top).toFixed(2),
            rx: '0.8',
          }),
        );
      });
    } else {
      const step = w / (data.length - 1);
      const points = data.map(function (v, i) {
        return (i * step).toFixed(2) + ',' + y(v).toFixed(2);
      });
      svg.appendChild(
        el('path', {
          class: 'bootcn-sparkline__area',
          d: 'M0,' + h + ' L' + points.join(' L') + ' L' + w + ',' + h + ' Z',
        }),
      );
      svg.appendChild(
        el('polyline', { class: 'bootcn-sparkline__line', points: points.join(' ') }),
      );
    }
    root.replaceChildren(svg);
    root.setAttribute('role', 'img');
    if (!root.hasAttribute('aria-label')) root.setAttribute('aria-label', summary(root, data));
  }

  function init() {
    document.querySelectorAll(ROOT).forEach(draw);
  }

  ns.sparkline = { init: init, destroy: function () {}, draw: draw };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
