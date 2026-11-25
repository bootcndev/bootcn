(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.choropleth) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-choropleth]';
  const SVG = 'http://www.w3.org/2000/svg';
  const STEPS = 6;
  const state = new WeakMap();
  let listening = false;

  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function locale(root) {
    return root.getAttribute('data-locale') || document.documentElement.lang || undefined;
  }

  function formatter(root, metric, compact) {
    const m = state.get(root).data.metrics[metric] || {};
    const options =
      m.format === 'currency' ? { style: 'currency', currency: m.currency || 'EUR' } : {};
    if (compact) Object.assign(options, { notation: 'compact', maximumFractionDigits: 1 });
    try {
      return new Intl.NumberFormat(locale(root), options).format;
    } catch {
      return String;
    }
  }

  // Equirectangular projection, corrected for the latitude: fine for a
  // country or a region.
  function project(geo) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    geo.features.forEach(function (f) {
      f.geometry.coordinates.forEach(function (poly) {
        poly[0].forEach(function (p) {
          minX = Math.min(minX, p[0]);
          maxX = Math.max(maxX, p[0]);
          minY = Math.min(minY, p[1]);
          maxY = Math.max(maxY, p[1]);
        });
      });
    });
    const k = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
    const width = 1000;
    const scale = width / ((maxX - minX) * k);
    const height = (maxY - minY) * scale;
    return {
      width: width,
      height: height,
      point: function (p) {
        return [((p[0] - minX) * k * scale).toFixed(1), ((maxY - p[1]) * scale).toFixed(1)];
      },
    };
  }

  function pathData(geometry, proj) {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons
      .map(function (poly) {
        return poly
          .map(function (ring) {
            return 'M' + ring.map(proj.point).join('L') + 'Z';
          })
          .join('');
      })
      .join('');
  }

  // Thresholds: equal steps from 0 to a rounded maximum.
  function scale(values) {
    const max = Math.max.apply(null, values.concat([1]));
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const top = Math.ceil(max / magnitude) * magnitude;
    const step = top / STEPS;
    return {
      step: step,
      bucket: function (v) {
        return Math.min(STEPS - 1, Math.floor(v / step));
      },
    };
  }

  function valueOf(root, id, metric) {
    const region = state.get(root).data.regions[id];
    return region && typeof region[metric] === 'number' ? region[metric] : null;
  }

  function paint(root) {
    const s = state.get(root);
    const metric = s.metric;
    const values = s.features
      .map(function (f) {
        return valueOf(root, f.id, metric);
      })
      .filter(function (v) {
        return v !== null;
      });
    s.scale = scale(values);
    const full = formatter(root, metric, false);
    const label = s.data.metrics[metric].label;
    s.paths.forEach(function (path, i) {
      const f = s.features[i];
      const v = valueOf(root, f.id, metric);
      path.style.fill =
        v === null
          ? 'var(--bootcn-choropleth-empty)'
          : 'var(--bootcn-choropleth-' + s.scale.bucket(v) + ')';
      path.setAttribute(
        'aria-label',
        f.properties.name +
          ': ' +
          label +
          ' ' +
          (v === null ? t('choropleth.empty', 'no data') : full(v)),
      );
    });
    legend(root);
    if (s.active) showTooltip(root, s.active);
  }

  function legend(root) {
    const s = state.get(root);
    const el = root.querySelector('[data-bootcn-choropleth-legend]');
    if (!el) return;
    const short = formatter(root, s.metric, true);
    el.replaceChildren();
    const title = document.createElement('span');
    title.textContent = s.data.metrics[s.metric].label + ':';
    el.appendChild(title);
    for (let i = 0; i < STEPS; i += 1) {
      const item = document.createElement('span');
      item.className = 'bootcn-choropleth__legend-item';
      const swatch = document.createElement('span');
      swatch.className = 'bootcn-choropleth__swatch';
      swatch.style.background = 'var(--bootcn-choropleth-' + i + ')';
      item.append(swatch, short(i * s.scale.step) + '–' + short((i + 1) * s.scale.step));
      el.appendChild(item);
    }
  }

  function table(root) {
    const s = state.get(root);
    const holder = root.querySelector('[data-bootcn-choropleth-table]');
    if (!holder) return;
    const metrics = Object.keys(s.data.metrics);
    const tableEl = document.createElement('table');
    const caption = document.createElement('caption');
    caption.className = 'visually-hidden';
    caption.textContent = (root.querySelector('figcaption') || {}).textContent || 'Map data';
    const head = document.createElement('tr');
    const first = document.createElement('th');
    first.scope = 'col';
    first.textContent = t('choropleth.region', 'Region');
    head.appendChild(first);
    metrics.forEach(function (m) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = s.data.metrics[m].label;
      head.appendChild(th);
    });
    const thead = document.createElement('thead');
    thead.appendChild(head);
    const tbody = document.createElement('tbody');
    s.features
      .slice()
      .sort(function (a, b) {
        return a.properties.name.localeCompare(b.properties.name);
      })
      .forEach(function (f) {
        const tr = document.createElement('tr');
        const th = document.createElement('th');
        th.scope = 'row';
        th.textContent = f.properties.name;
        tr.appendChild(th);
        metrics.forEach(function (m) {
          const td = document.createElement('td');
          const v = valueOf(root, f.id, m);
          td.textContent = v === null ? '–' : formatter(root, m, false)(v);
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    tableEl.append(caption, thead, tbody);
    holder.replaceChildren(tableEl);
    // The table scrolls: keyboard users can focus it to scroll.
    holder.setAttribute('tabindex', '0');
    holder.setAttribute('role', 'region');
    holder.setAttribute('aria-label', caption.textContent);
  }

  function showTooltip(root, path, x, y) {
    const s = state.get(root);
    const tip = root.querySelector('.bootcn-choropleth__tooltip');
    const map = root.querySelector('[data-bootcn-choropleth-map]');
    if (!tip) return;
    s.paths.forEach(function (p) {
      p.classList.toggle('is-active', p === path);
    });
    s.active = path;
    const f = s.features[s.paths.indexOf(path)];
    tip.replaceChildren();
    const name = document.createElement('p');
    name.className = 'bootcn-choropleth__tooltip-name';
    name.textContent = f.properties.name;
    tip.appendChild(name);
    Object.keys(s.data.metrics).forEach(function (m) {
      const row = document.createElement('p');
      row.className = 'bootcn-choropleth__tooltip-row' + (m === s.metric ? ' is-current' : '');
      const label = document.createElement('span');
      label.textContent = s.data.metrics[m].label;
      const value = document.createElement('strong');
      const v = valueOf(root, f.id, m);
      value.textContent = v === null ? '–' : formatter(root, m, m === 'revenue')(v);
      row.append(label, value);
      tip.appendChild(row);
    });
    const box = map.getBoundingClientRect();
    if (x === undefined) {
      const r = path.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    tip.hidden = false;
    const half = tip.offsetWidth / 2;
    const left = Math.min(Math.max(x - box.left, half + 4), box.width - half - 4);
    tip.style.left = left + 'px';
    tip.style.top = Math.max(y - box.top, tip.offsetHeight + 16) + 'px';
  }

  function hideTooltip(root) {
    const s = state.get(root);
    const tip = root.querySelector('.bootcn-choropleth__tooltip');
    if (tip) tip.hidden = true;
    s.paths.forEach(function (p) {
      p.classList.remove('is-active');
    });
    s.active = null;
  }

  // Zoom and pan change the viewBox, clamped to the map.
  function setView(root, view) {
    const s = state.get(root);
    const w = Math.min(s.full.w, Math.max(s.full.w / 8, view.w));
    const h = (w / s.full.w) * s.full.h;
    const x = Math.min(Math.max(view.x, 0), s.full.w - w);
    const y = Math.min(Math.max(view.y, 0), s.full.h - h);
    s.view = { x: x, y: y, w: w, h: h };
    s.svg.setAttribute(
      'viewBox',
      [x, y, w, h]
        .map(function (n) {
          return n.toFixed(1);
        })
        .join(' '),
    );
  }

  function zoom(root, factor, cx, cy) {
    const v = state.get(root).view;
    const px = cx === undefined ? v.x + v.w / 2 : cx;
    const py = cy === undefined ? v.y + v.h / 2 : cy;
    setView(root, { x: px - (px - v.x) / factor, y: py - (py - v.y) / factor, w: v.w / factor });
  }

  function toMap(root, clientX, clientY) {
    const s = state.get(root);
    const r = s.svg.getBoundingClientRect();
    // preserveAspectRatio meet: the drawing is centred in the box.
    const k = Math.min(r.width / s.view.w, r.height / s.view.h);
    const ox = (r.width - s.view.w * k) / 2;
    const oy = (r.height - s.view.h * k) / 2;
    return [s.view.x + (clientX - r.left - ox) / k, s.view.y + (clientY - r.top - oy) / k, k];
  }

  function build(root, geo) {
    const s = state.get(root);
    const map = root.querySelector('[data-bootcn-choropleth-map]');
    const proj = project(geo);
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'bootcn-choropleth__svg');
    svg.setAttribute('viewBox', '0 0 ' + proj.width + ' ' + proj.height.toFixed(1));
    svg.setAttribute('role', 'group');
    const title = root.querySelector('figcaption');
    if (title && title.id) svg.setAttribute('aria-labelledby', title.id);
    const g = document.createElementNS(SVG, 'g');
    s.features = geo.features.slice().sort(function (a, b) {
      return a.properties.name.localeCompare(b.properties.name);
    });
    s.paths = s.features.map(function (f, i) {
      const path = document.createElementNS(SVG, 'path');
      path.setAttribute('class', 'bootcn-choropleth__region');
      path.setAttribute('d', pathData(f.geometry, proj));
      path.setAttribute('role', 'img');
      path.setAttribute('tabindex', i === 0 ? '0' : '-1');
      path.setAttribute('data-region', f.id);
      g.appendChild(path);
      return path;
    });
    svg.appendChild(g);
    const loading = map.querySelector('.bootcn-choropleth__loading');
    if (loading) loading.remove();
    map.insertBefore(svg, map.querySelector('.bootcn-choropleth__tooltip'));
    s.svg = svg;
    s.full = { w: proj.width, h: proj.height };
    setView(root, { x: 0, y: 0, w: proj.width });
    paint(root);
    table(root);
    root.dispatchEvent(new CustomEvent('bootcn:choropleth:ready', { bubbles: true }));
  }

  function setup(root) {
    if (state.has(root)) return;
    const script = root.querySelector('script[data-bootcn-choropleth-data]');
    let data;
    try {
      data = JSON.parse(script ? script.textContent : '{}');
    } catch {
      return;
    }
    const select = root.querySelector('[data-bootcn-choropleth-metric]');
    state.set(root, {
      data: data,
      metric: (select && select.value) || Object.keys(data.metrics)[0],
      paths: [],
      features: [],
      active: null,
    });
    // Boundaries: a registered shape set (window.BootcnGeo, e.g. the sample
    // choropleth-sample.js) or a GeoJSON URL in data-geo.
    const name = root.getAttribute('data-geo-name');
    const registered = name && window.BootcnGeo && window.BootcnGeo[name];
    (registered
      ? Promise.resolve(registered)
      : fetch(root.getAttribute('data-geo')).then(function (response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          return response.json();
        })
    )
      .then(function (geo) {
        build(root, geo);
      })
      .catch(function () {
        const loading = root.querySelector('.bootcn-choropleth__loading');
        if (loading) loading.textContent = t('choropleth.error', 'The map could not be loaded.');
      });
  }

  function regionOf(event) {
    return event.target.closest && event.target.closest(ROOT + ' .bootcn-choropleth__region');
  }

  function onPointerMove(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || !state.has(root)) return;
    const s = state.get(root);
    if (s.pan) {
      const p = toMap(root, event.clientX, event.clientY);
      setView(root, {
        x: s.pan.x - (p[0] - s.pan.px),
        y: s.pan.y - (p[1] - s.pan.py),
        w: s.view.w,
      });
      s.pan.moved = true;
      return;
    }
    const path = regionOf(event);
    if (path) showTooltip(root, path, event.clientX, event.clientY);
    else if (s.active && document.activeElement !== s.active) hideTooltip(root);
  }

  function onPointerDown(event) {
    const map =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-choropleth-map]');
    if (!map || event.target.closest('button') || event.button !== 0) return;
    const root = map.closest(ROOT);
    const s = state.get(root);
    if (!s || !s.svg || s.view.w >= s.full.w) return; // nothing to pan
    const p = toMap(root, event.clientX, event.clientY);
    s.pan = { px: p[0], py: p[1], x: s.view.x, y: s.view.y };
    map.classList.add('is-panning');
    map.setPointerCapture(event.pointerId);
  }

  function onPointerUp(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || !state.has(root)) return;
    const s = state.get(root);
    if (s.pan) root.querySelector('[data-bootcn-choropleth-map]').classList.remove('is-panning');
    s.pan = null;
  }

  function onLeave(event) {
    const root =
      event.target.matches &&
      event.target.matches(ROOT + ' [data-bootcn-choropleth-map]') &&
      event.target.closest(ROOT);
    if (root && state.has(root) && !root.contains(document.activeElement)) hideTooltip(root);
  }

  // Ctrl/⌘ + wheel (and trackpad pinch) zooms; plain wheel scrolls the page.
  function onWheel(event) {
    const map =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-choropleth-map]');
    if (!map || !(event.ctrlKey || event.metaKey)) return;
    const root = map.closest(ROOT);
    if (!state.get(root) || !state.get(root).svg) return;
    event.preventDefault();
    const p = toMap(root, event.clientX, event.clientY);
    zoom(root, event.deltaY < 0 ? 1.25 : 0.8, p[0], p[1]);
  }

  function onDblClick(event) {
    const map =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-choropleth-map]');
    if (!map || event.target.closest('button')) return;
    const root = map.closest(ROOT);
    if (!state.get(root) || !state.get(root).svg) return;
    const p = toMap(root, event.clientX, event.clientY);
    zoom(root, 1.6, p[0], p[1]);
  }

  function onClick(event) {
    const button =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-choropleth-zoom]');
    if (!button) return;
    const root = button.closest(ROOT);
    const s = state.get(root);
    if (!s || !s.svg) return;
    const action = button.getAttribute('data-bootcn-choropleth-zoom');
    if (action === 'in') zoom(root, 1.5);
    else if (action === 'out') zoom(root, 1 / 1.5);
    else setView(root, { x: 0, y: 0, w: s.full.w });
  }

  function onChange(event) {
    const select = event.target;
    if (!select.matches || !select.matches(ROOT + ' [data-bootcn-choropleth-metric]')) return;
    const root = select.closest(ROOT);
    const s = state.get(root);
    if (!s) return;
    s.metric = select.value;
    if (s.svg) paint(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:choropleth:metric', { bubbles: true, detail: { metric: s.metric } }),
    );
  }

  // Keyboard: one tab stop; arrows move between regions (in name order),
  // + and − zoom; the focused region shows its tooltip.
  function onKeydown(event) {
    const path = regionOf(event);
    if (!path) return;
    const root = path.closest(ROOT);
    const s = state.get(root);
    const i = s.paths.indexOf(path);
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = s.paths[(i + 1) % s.paths.length];
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = s.paths[(i - 1 + s.paths.length) % s.paths.length];
    else if (event.key === 'Home') next = s.paths[0];
    else if (event.key === 'End') next = s.paths[s.paths.length - 1];
    else if (event.key === '+' || event.key === '=') zoom(root, 1.5);
    else if (event.key === '-') zoom(root, 1 / 1.5);
    else if (event.key === 'Escape') hideTooltip(root);
    else return;
    event.preventDefault();
    if (next) {
      path.setAttribute('tabindex', '-1');
      next.setAttribute('tabindex', '0');
      next.focus();
    }
  }

  function onFocusIn(event) {
    const path = regionOf(event);
    if (path) showTooltip(path.closest(ROOT), path);
  }

  function onFocusOut(event) {
    const path = regionOf(event);
    if (!path) return;
    const root = path.closest(ROOT);
    if (!root.contains(event.relatedTarget)) hideTooltip(root);
  }

  const handlers = [
    ['pointermove', onPointerMove],
    ['pointerdown', onPointerDown],
    ['pointerup', onPointerUp],
    ['pointercancel', onPointerUp],
    ['pointerout', onLeave],
    ['dblclick', onDblClick],
    ['click', onClick],
    ['change', onChange],
    ['keydown', onKeydown],
    ['focusin', onFocusIn],
    ['focusout', onFocusOut],
  ];

  function init() {
    if (!listening) {
      handlers.forEach(function (pair) {
        document.addEventListener(pair[0], pair[1]);
      });
      document.addEventListener('wheel', onWheel, { passive: false });
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    handlers.forEach(function (pair) {
      document.removeEventListener(pair[0], pair[1]);
    });
    document.removeEventListener('wheel', onWheel);
    listening = false;
  }

  function setData(root, data) {
    const s = state.get(root);
    if (!s) return;
    s.data = data;
    if (s.svg) {
      paint(root);
      table(root);
    }
  }

  ns.choropleth = { init: init, destroy: destroy, setData: setData };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
