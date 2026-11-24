(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.chart) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-chart]';
  const SVG = 'http://www.w3.org/2000/svg';
  const charts = new Map(); // root -> { config, observer }
  let uid = 0;

  // ------------------------------------------------------------- helpers

  function el(name, attrs, parent) {
    const node = document.createElementNS(SVG, name);
    Object.keys(attrs || {}).forEach((key) => node.setAttribute(key, String(attrs[key])));
    if (parent) parent.appendChild(node);
    return node;
  }

  function seriesColor(config, index) {
    const series = config.series[index];
    return (series && series.color) || 'var(--bootcn-chart-' + ((index % 5) + 1) + ')';
  }

  function sliceColor(config, index) {
    const colors = config.colors || [];
    return colors[index] || 'var(--bootcn-chart-' + ((index % 5) + 1) + ')';
  }

  function locale(root) {
    const owner = root.closest('[lang]');
    return (owner && owner.getAttribute('lang')) || 'en';
  }

  function formatter(root, config) {
    const format = new Intl.NumberFormat(locale(root), config.format || {});
    return (value) => format.format(value);
  }

  // A round upper bound for the value axis (1, 2, 2.5, 5 or 10 × 10^n).
  function niceMax(max) {
    if (!(max > 0)) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(max)));
    const f = max / exp;
    const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return nice * exp;
  }

  function linearPath(points) {
    return points.map((p, i) => (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  }

  // Monotone cubic interpolation (Fritsch–Carlson): smooth, never overshoots.
  function monotonePath(points, continuing) {
    const n = points.length;
    if (n < 3) return (continuing ? 'L' : 'M') + linearPath(points).slice(1);
    const dx = [];
    const slope = [];
    for (let i = 0; i < n - 1; i += 1) {
      dx.push(points[i + 1][0] - points[i][0]);
      slope.push((points[i + 1][1] - points[i][1]) / dx[i]);
    }
    const t = [slope[0]];
    for (let i = 1; i < n - 1; i += 1) {
      t.push(slope[i - 1] * slope[i] <= 0 ? 0 : (slope[i - 1] + slope[i]) / 2);
    }
    t.push(slope[n - 2]);
    for (let i = 0; i < n - 1; i += 1) {
      if (slope[i] === 0) {
        t[i] = 0;
        t[i + 1] = 0;
        continue;
      }
      const a = t[i] / slope[i];
      const b = t[i + 1] / slope[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        t[i] = tau * a * slope[i];
        t[i + 1] = tau * b * slope[i];
      }
    }
    let d = (continuing ? 'L' : 'M') + points[0][0] + ',' + points[0][1];
    for (let i = 0; i < n - 1; i += 1) {
      const h = dx[i] / 3;
      d +=
        ' C' +
        (points[i][0] + h) +
        ',' +
        (points[i][1] + t[i] * h) +
        ' ' +
        (points[i + 1][0] - h) +
        ',' +
        (points[i + 1][1] - t[i + 1] * h) +
        ' ' +
        points[i + 1][0] +
        ',' +
        points[i + 1][1];
    }
    return d;
  }

  function curvePath(points, curve, continuing) {
    if (curve === 'linear') return (continuing ? 'L' : 'M') + linearPath(points).slice(1);
    if (curve === 'step') {
      let d = (continuing ? 'L' : 'M') + points[0][0] + ',' + points[0][1];
      for (let i = 1; i < points.length; i += 1) {
        const mid = (points[i - 1][0] + points[i][0]) / 2;
        d += ' H' + mid + ' V' + points[i][1] + ' H' + points[i][0];
      }
      return d;
    }
    return monotonePath(points, continuing);
  }

  // Rectangle with rounded top corners (or right corners when horizontal).
  function barPath(x, y, w, h, r, horizontal) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (horizontal) {
      return (
        'M' +
        x +
        ',' +
        y +
        ' H' +
        (x + w - r) +
        ' Q' +
        (x + w) +
        ',' +
        y +
        ' ' +
        (x + w) +
        ',' +
        (y + r) +
        ' V' +
        (y + h - r) +
        ' Q' +
        (x + w) +
        ',' +
        (y + h) +
        ' ' +
        (x + w - r) +
        ',' +
        (y + h) +
        ' H' +
        x +
        ' Z'
      );
    }
    return (
      'M' +
      x +
      ',' +
      (y + h) +
      ' V' +
      (y + r) +
      ' Q' +
      x +
      ',' +
      y +
      ' ' +
      (x + r) +
      ',' +
      y +
      ' H' +
      (x + w - r) +
      ' Q' +
      (x + w) +
      ',' +
      y +
      ' ' +
      (x + w) +
      ',' +
      (y + r) +
      ' V' +
      (y + h) +
      ' Z'
    );
  }

  function arcPath(cx, cy, outer, inner, start, end) {
    const large = end - start > Math.PI ? 1 : 0;
    const p = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    const [x1, y1] = p(outer, start);
    const [x2, y2] = p(outer, end);
    if (inner <= 0) {
      return (
        'M' +
        cx +
        ',' +
        cy +
        ' L' +
        x1 +
        ',' +
        y1 +
        ' A' +
        outer +
        ',' +
        outer +
        ' 0 ' +
        large +
        ' 1 ' +
        x2 +
        ',' +
        y2 +
        ' Z'
      );
    }
    const [x3, y3] = p(inner, end);
    const [x4, y4] = p(inner, start);
    return (
      'M' +
      x1 +
      ',' +
      y1 +
      ' A' +
      outer +
      ',' +
      outer +
      ' 0 ' +
      large +
      ' 1 ' +
      x2 +
      ',' +
      y2 +
      ' L' +
      x3 +
      ',' +
      y3 +
      ' A' +
      inner +
      ',' +
      inner +
      ' 0 ' +
      large +
      ' 0 ' +
      x4 +
      ',' +
      y4 +
      ' Z'
    );
  }

  // ------------------------------------------------------------- chrome

  function caption(root) {
    const figcaption = root.querySelector('figcaption');
    const labelled = root.getAttribute('aria-labelledby');
    const label = labelled && document.getElementById(labelled);
    return ((figcaption || label || {}).textContent || 'Chart data').trim();
  }

  function legend(root, config, entries) {
    if (config.legend === false) return;
    const list = document.createElement('ul');
    list.className = 'bootcn-chart__legend';
    list.setAttribute('aria-hidden', 'true'); // the data table carries the names
    entries.forEach((entry) => {
      const item = document.createElement('li');
      const swatch = document.createElement('span');
      swatch.className = 'bootcn-chart__swatch';
      swatch.style.background = entry.color;
      item.appendChild(swatch);
      item.appendChild(document.createTextNode(entry.name));
      list.appendChild(item);
    });
    root.appendChild(list);
  }

  // The same numbers as an accessible table, behind a "Show data" toggle.
  function dataTable(root, config, format) {
    const details = document.createElement('details');
    details.className = 'bootcn-chart__data';
    const summary = document.createElement('summary');
    summary.textContent = config.tableLabel || 'Show data';
    details.appendChild(summary);
    const wrap = document.createElement('div');
    wrap.className = 'table-responsive';
    const table = document.createElement('table');
    table.className = 'bootcn-chart__table';
    const cap = document.createElement('caption');
    cap.textContent = caption(root);
    table.appendChild(cap);
    const head = table.createTHead().insertRow();
    const th = (text, scope, row) => {
      const cell = document.createElement('th');
      cell.scope = scope;
      cell.textContent = text;
      row.appendChild(cell);
    };
    th(config.categoryLabel || '', 'col', head);
    config.series.forEach((series) => th(series.name, 'col', head));
    const body = table.createTBody();
    config.categories.forEach((category, i) => {
      const row = body.insertRow();
      th(category, 'row', row);
      config.series.forEach((series) => {
        const cell = row.insertCell();
        cell.textContent = format(series.data[i]);
      });
    });
    wrap.appendChild(table);
    details.appendChild(wrap);
    root.appendChild(details);
  }

  function tooltip(root) {
    let tip = root.querySelector('.bootcn-chart__tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'bootcn-chart__tooltip';
      tip.setAttribute('aria-hidden', 'true');
      tip.hidden = true;
      root.querySelector('.bootcn-chart__plot').appendChild(tip);
    }
    return tip;
  }

  function showTip(root, x, y, title, rows) {
    const tip = tooltip(root);
    tip.textContent = '';
    if (title) {
      const head = document.createElement('div');
      head.className = 'bootcn-chart__tooltip-title';
      head.textContent = title;
      tip.appendChild(head);
    }
    rows.forEach((row) => {
      const line = document.createElement('div');
      line.className = 'bootcn-chart__tooltip-row';
      const swatch = document.createElement('span');
      swatch.className = 'bootcn-chart__swatch';
      swatch.style.background = row.color;
      const name = document.createElement('span');
      name.className = 'bootcn-chart__tooltip-name';
      name.textContent = row.name;
      const value = document.createElement('span');
      value.className = 'bootcn-chart__tooltip-value';
      value.textContent = row.value;
      line.append(swatch, name, value);
      tip.appendChild(line);
    });
    tip.hidden = false;
    const plot = root.querySelector('.bootcn-chart__plot');
    const left = Math.min(Math.max(x + 12, 0), plot.clientWidth - tip.offsetWidth);
    const top = Math.max(y - tip.offsetHeight - 8, 0);
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
  }

  function hideTip(root) {
    const tip = root.querySelector('.bootcn-chart__tooltip');
    if (tip) tip.hidden = true;
    const cursor = root.querySelector('.bootcn-chart__cursor');
    if (cursor) cursor.setAttribute('visibility', 'hidden');
    root.querySelectorAll('.is-dimmed').forEach((node) => node.classList.remove('is-dimmed'));
  }

  // ---------------------------------------------------------- cartesian

  function cartesian(root, config, svg, width, height, format) {
    const type = config.type;
    const horizontal = type === 'bar' && config.orientation === 'horizontal';
    const stacked = !!config.stacked;
    const cats = config.categories;
    const series = config.series;
    const totals = cats.map((_, i) => series.reduce((sum, s) => sum + (s.data[i] || 0), 0));
    const peak = stacked ? Math.max(...totals) : Math.max(...series.flatMap((s) => s.data));
    const max = niceMax(peak);
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
    const showValueAxis = config.valueAxis !== false;
    const valueWidth = showValueAxis ? Math.max(...ticks.map((t) => format(t).length)) * 7 + 12 : 4;
    const catWidth = horizontal ? Math.max(...cats.map((c) => String(c).length)) * 7 + 12 : 0;
    const pad = horizontal
      ? { top: 4, right: 12, bottom: showValueAxis ? 24 : 4, left: catWidth }
      : { top: 8, right: 8, bottom: 24, left: valueWidth };
    const plotW = Math.max(10, width - pad.left - pad.right);
    const plotH = Math.max(10, height - pad.top - pad.bottom);
    const band = (horizontal ? plotH : plotW) / cats.length;
    const scale = (v) => (v / max) * (horizontal ? plotW : plotH);

    // Grid lines and value labels.
    const grid = el('g', { class: 'bootcn-chart__grid' }, svg);
    ticks.forEach((t) => {
      if (horizontal) {
        const x = pad.left + scale(t);
        el('line', { x1: x, x2: x, y1: pad.top, y2: pad.top + plotH }, grid);
        if (showValueAxis) {
          const label = el(
            'text',
            { x: x, y: height - 6, 'text-anchor': 'middle', class: 'bootcn-chart__tick' },
            svg,
          );
          label.textContent = format(t);
        }
      } else {
        const y = pad.top + plotH - scale(t);
        el('line', { x1: pad.left, x2: pad.left + plotW, y1: y, y2: y }, grid);
        if (showValueAxis) {
          const label = el(
            'text',
            { x: pad.left - 8, y: y + 4, 'text-anchor': 'end', class: 'bootcn-chart__tick' },
            svg,
          );
          label.textContent = format(t);
        }
      }
    });

    // Category labels, thinned out when they would overlap.
    const longest = Math.max(...cats.map((c) => String(c).length)) * 7 + 8;
    const every = horizontal ? 1 : Math.max(1, Math.ceil(longest / band));
    cats.forEach((cat, i) => {
      if (i % every !== 0) return;
      const label = horizontal
        ? el(
            'text',
            {
              x: pad.left - 8,
              y: pad.top + band * (i + 0.5) + 4,
              'text-anchor': 'end',
              class: 'bootcn-chart__tick',
            },
            svg,
          )
        : el(
            'text',
            {
              x: pad.left + band * (i + 0.5),
              y: height - 6,
              'text-anchor': 'middle',
              class: 'bootcn-chart__tick',
            },
            svg,
          );
      label.textContent = cat;
    });

    const cursor =
      horizontal || type === 'bar'
        ? el(
            'rect',
            { class: 'bootcn-chart__cursor bootcn-chart__cursor--band', visibility: 'hidden' },
            svg,
          )
        : el(
            'line',
            {
              class: 'bootcn-chart__cursor',
              visibility: 'hidden',
              y1: pad.top,
              y2: pad.top + plotH,
            },
            svg,
          );

    const marks = el('g', { class: 'bootcn-chart__marks' }, svg);
    const base = cats.map(() => 0);

    if (type === 'bar') {
      const inner = band * (stacked ? 0.6 : 0.8);
      const gap = stacked ? 0 : Math.min(4, inner / series.length / 4);
      const barSize = stacked ? inner : (inner - gap * (series.length - 1)) / series.length;
      series.forEach((s, si) => {
        cats.forEach((_, i) => {
          const value = s.data[i] || 0;
          const size = scale(value);
          const offset = stacked ? scale(base[i]) : 0;
          const along = band * i + (band - inner) / 2 + (stacked ? 0 : si * (barSize + gap));
          const top = stacked ? si === series.length - 1 : true;
          const radius = top ? 4 : 0;
          const d = horizontal
            ? barPath(pad.left + offset, pad.top + along, size, barSize, radius, true)
            : barPath(
                pad.left + along,
                pad.top + plotH - offset - size,
                barSize,
                size,
                radius,
                false,
              );
          el(
            'path',
            {
              d: d,
              class: 'bootcn-chart__bar',
              'data-series': si,
              style: 'fill:' + seriesColor(config, si),
            },
            marks,
          );
          if (stacked) base[i] += value;
        });
      });
    } else {
      const defs = el('defs', {}, svg);
      const id = 'bootcn-chart-' + (uid += 1);
      const lines = [];
      series.forEach((s, si) => {
        const points = cats.map((_, i) => {
          const value = (s.data[i] || 0) + (stacked ? base[i] : 0);
          return [pad.left + band * (i + 0.5), pad.top + plotH - scale(value)];
        });
        const below = cats.map((_, i) => [
          pad.left + band * (i + 0.5),
          pad.top + plotH - scale(stacked ? base[i] : 0),
        ]);
        const color = seriesColor(config, si);
        if (type === 'area') {
          const gradient = el(
            'linearGradient',
            { id: id + '-' + si, x1: 0, y1: 0, x2: 0, y2: 1 },
            defs,
          );
          el(
            'stop',
            { offset: '5%', style: 'stop-color:' + color + ';stop-opacity:0.45' },
            gradient,
          );
          el(
            'stop',
            { offset: '95%', style: 'stop-color:' + color + ';stop-opacity:0.05' },
            gradient,
          );
          const fill =
            curvePath(points, config.curve) +
            ' ' +
            curvePath(below.slice().reverse(), stacked && si > 0 ? config.curve : 'linear', true) +
            ' Z';
          el(
            'path',
            {
              d: fill,
              class: 'bootcn-chart__area',
              'data-series': si,
              style: 'fill:url(#' + id + '-' + si + ')',
            },
            marks,
          );
        }
        lines.push({ points: points, color: color, si: si });
        if (stacked) s.data.forEach((v, i) => (base[i] += v || 0));
      });
      lines.forEach((line) => {
        el(
          'path',
          {
            d: curvePath(line.points, config.curve),
            class: 'bootcn-chart__line',
            'data-series': line.si,
            style: 'stroke:' + line.color,
          },
          marks,
        );
        if (config.dots) {
          line.points.forEach((p) => {
            el(
              'circle',
              {
                cx: p[0],
                cy: p[1],
                r: 3.5,
                class: 'bootcn-chart__dot',
                style: 'stroke:' + line.color,
              },
              marks,
            );
          });
        }
      });
    }

    // Hover: the band under the pointer, with every series' value.
    return function onMove(x, y) {
      const position = horizontal ? y - pad.top : x - pad.left;
      const i = Math.floor(position / band);
      if (i < 0 || i >= cats.length || (horizontal ? x < pad.left : y > pad.top + plotH)) {
        hideTip(root);
        return;
      }
      cursor.setAttribute('visibility', 'visible');
      if (cursor.tagName === 'rect') {
        if (horizontal) {
          cursor.setAttribute('x', pad.left);
          cursor.setAttribute('y', pad.top + band * i);
          cursor.setAttribute('width', plotW);
          cursor.setAttribute('height', band);
        } else {
          cursor.setAttribute('x', pad.left + band * i);
          cursor.setAttribute('y', pad.top);
          cursor.setAttribute('width', band);
          cursor.setAttribute('height', plotH);
        }
      } else {
        const cx = pad.left + band * (i + 0.5);
        cursor.setAttribute('x1', cx);
        cursor.setAttribute('x2', cx);
      }
      showTip(
        root,
        x,
        y,
        cats[i],
        series.map((s, si) => ({
          name: s.name,
          value: format(s.data[i] || 0),
          color: seriesColor(config, si),
        })),
      );
    };
  }

  // ---------------------------------------------------------------- pie

  function pie(root, config, svg, width, height, format) {
    const values = config.series[0].data;
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const cx = width / 2;
    const cy = height / 2;
    const outer = Math.max(10, Math.min(width, height) / 2 - 8);
    const inner = config.donut ? outer * 0.62 : 0;
    let angle = -Math.PI / 2;
    const slices = values.map((value, i) => {
      const sweep = (value / total) * Math.PI * 2;
      const start = angle;
      angle += sweep;
      const path = el(
        'path',
        {
          d: arcPath(cx, cy, outer, inner, start, angle - (values.length > 1 ? 0.004 : 0)),
          class: 'bootcn-chart__slice',
          style: 'fill:' + sliceColor(config, i),
        },
        svg,
      );
      return { path: path, start: start, end: angle };
    });
    if (config.donut && config.centerLabel !== false) {
      const value = el(
        'text',
        { x: cx, y: cy, 'text-anchor': 'middle', class: 'bootcn-chart__center-value' },
        svg,
      );
      value.textContent = format(total);
      const label = el(
        'text',
        { x: cx, y: cy + 20, 'text-anchor': 'middle', class: 'bootcn-chart__center-label' },
        svg,
      );
      label.textContent = config.centerLabel || 'Total';
    }
    return function onMove(x, y) {
      const dx = x - cx;
      const dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r > outer || r < inner) return hideTip(root);
      let a = Math.atan2(dy, dx);
      if (a < -Math.PI / 2) a += Math.PI * 2;
      const i = slices.findIndex((s) => a >= s.start && a < s.end);
      if (i < 0) return hideTip(root);
      slices.forEach((s, j) => s.path.classList.toggle('is-dimmed', j !== i));
      const percent = new Intl.NumberFormat(locale(root), {
        style: 'percent',
        maximumFractionDigits: 1,
      }).format(values[i] / total);
      showTip(root, x, y, null, [
        {
          name: config.categories[i],
          value: format(values[i]) + ' (' + percent + ')',
          color: sliceColor(config, i),
        },
      ]);
      return undefined;
    };
  }

  // -------------------------------------------------------------- radar

  function radar(root, config, svg, width, height, format) {
    const cats = config.categories;
    const n = cats.length;
    const cx = width / 2;
    const cy = height / 2;
    const r = Math.max(10, Math.min(width, height) / 2 - 28);
    const max = niceMax(Math.max(...config.series.flatMap((s) => s.data)));
    const at = (i, value) => {
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      const d = (value / max) * r;
      return [cx + d * Math.cos(a), cy + d * Math.sin(a)];
    };
    const grid = el('g', { class: 'bootcn-chart__grid' }, svg);
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      el('polygon', { points: cats.map((_, i) => at(i, max * f).join(',')).join(' ') }, grid);
    });
    cats.forEach((cat, i) => {
      const [x, y] = at(i, max);
      el('line', { x1: cx, y1: cy, x2: x, y2: y }, grid);
      const [lx, ly] = at(i, max * 1.16);
      const label = el(
        'text',
        {
          x: lx,
          y: ly + 4,
          'text-anchor': Math.abs(lx - cx) < 4 ? 'middle' : lx > cx ? 'start' : 'end',
          class: 'bootcn-chart__tick',
        },
        svg,
      );
      label.textContent = cat;
    });
    config.series.forEach((s, si) => {
      const color = seriesColor(config, si);
      el(
        'polygon',
        {
          points: s.data.map((v, i) => at(i, v).join(',')).join(' '),
          class: 'bootcn-chart__radar',
          style: 'fill:' + color + ';stroke:' + color,
        },
        svg,
      );
    });
    return function onMove(x, y) {
      let a = Math.atan2(y - cy, x - cx) + Math.PI / 2;
      if (a < 0) a += Math.PI * 2;
      const i = Math.round((a / (Math.PI * 2)) * n) % n;
      showTip(
        root,
        x,
        y,
        cats[i],
        config.series.map((s, si) => ({
          name: s.name,
          value: format(s.data[i] || 0),
          color: seriesColor(config, si),
        })),
      );
    };
  }

  // ------------------------------------------------------------- radial

  function radial(root, config, svg, width, height, format) {
    const values = config.series[0].data;
    const max = config.max || niceMax(Math.max(...values));
    const cx = width / 2;
    const cy = height / 2;
    const outer = Math.max(10, Math.min(width, height) / 2 - 8);
    const inner = outer * 0.3;
    const ring = (outer - inner) / values.length;
    const rings = values.map((value, i) => {
      const r1 = outer - ring * i;
      const r0 = r1 - ring * 0.72;
      el(
        'path',
        {
          d: arcPath(cx, cy, r1, r0, -Math.PI / 2, (Math.PI * 3) / 2 - 0.0001),
          class: 'bootcn-chart__track',
        },
        svg,
      );
      const sweep = Math.max(0.0001, (value / max) * Math.PI * 2 - 0.0001);
      const path = el(
        'path',
        {
          d: arcPath(cx, cy, r1, r0, -Math.PI / 2, -Math.PI / 2 + sweep),
          class: 'bootcn-chart__slice',
          style: 'fill:' + sliceColor(config, i),
        },
        svg,
      );
      return { path: path, r0: r0, r1: r1 };
    });
    return function onMove(x, y) {
      const d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const i = rings.findIndex((ringItem) => d >= ringItem.r0 && d <= ringItem.r1);
      if (i < 0) return hideTip(root);
      rings.forEach((ringItem, j) => ringItem.path.classList.toggle('is-dimmed', j !== i));
      showTip(root, x, y, null, [
        { name: config.categories[i], value: format(values[i]), color: sliceColor(config, i) },
      ]);
      return undefined;
    };
  }

  // -------------------------------------------------------------- render

  function readConfig(root) {
    const script = root.querySelector('script[type="application/json"]');
    if (!script) return null;
    try {
      return JSON.parse(script.textContent);
    } catch (error) {
      console.error('[bootcn] chart: invalid JSON configuration.', error);
      return null;
    }
  }

  function render(root) {
    const entry = charts.get(root);
    if (!entry) return;
    const config = entry.config;
    root
      .querySelectorAll('.bootcn-chart__plot, .bootcn-chart__legend, .bootcn-chart__data')
      .forEach((n) => n.remove());

    const plot = document.createElement('div');
    plot.className = 'bootcn-chart__plot';
    const caption = root.querySelector('figcaption');
    root.insertBefore(plot, caption && caption.nextSibling ? caption.nextSibling : root.firstChild);

    const width = Math.max(120, plot.clientWidth || root.clientWidth || 300);
    const round = ['pie', 'radar', 'radial'].includes(config.type);
    const height = Number(root.getAttribute('data-height')) || config.height || (round ? 250 : 220);
    const svg = el(
      'svg',
      {
        width: width,
        height: height,
        viewBox: '0 0 ' + width + ' ' + height,
        'aria-hidden': 'true',
        focusable: 'false',
        class: 'bootcn-chart__svg',
      },
      plot,
    );

    const format = formatter(root, config);
    const draw = { pie: pie, radar: radar, radial: radial }[config.type] || cartesian;
    const onMove = draw(root, config, svg, width, height, format);

    const byCategory = config.type === 'pie' || config.type === 'radial';
    legend(
      root,
      config,
      byCategory
        ? config.categories.map((name, i) => ({ name: name, color: sliceColor(config, i) }))
        : config.series.map((s, i) => ({ name: s.name, color: seriesColor(config, i) })),
    );
    dataTable(root, config, format);

    svg.addEventListener('pointermove', (event) => {
      const box = svg.getBoundingClientRect();
      onMove(event.clientX - box.left, event.clientY - box.top);
    });
    svg.addEventListener('pointerleave', () => hideTip(root));
  }

  function setup(root) {
    const config = readConfig(root);
    if (!config || !Array.isArray(config.categories) || !Array.isArray(config.series)) return;
    let lastWidth = 0;
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            const width = root.clientWidth;
            if (Math.abs(width - lastWidth) < 1) return;
            lastWidth = width;
            render(root);
          });
    charts.set(root, { config: config, observer: observer });
    root.setAttribute('data-bootcn-chart-initialized', '');
    render(root);
    lastWidth = root.clientWidth;
    if (observer) observer.observe(root);
  }

  function init(root = document) {
    root.querySelectorAll(ROOT + ':not([data-bootcn-chart-initialized])').forEach(setup);
  }

  function destroy(root = document) {
    charts.forEach((entry, element) => {
      if (root !== document && !root.contains(element)) return;
      if (entry.observer) entry.observer.disconnect();
      element
        .querySelectorAll('.bootcn-chart__plot, .bootcn-chart__legend, .bootcn-chart__data')
        .forEach((n) => n.remove());
      element.removeAttribute('data-bootcn-chart-initialized');
      charts.delete(element);
    });
  }

  // Replaces a chart's configuration and redraws it.
  function update(root, config) {
    const entry = charts.get(root);
    if (!entry) return;
    entry.config = config;
    render(root);
  }

  ns.chart = { init: init, destroy: destroy, update: update };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
