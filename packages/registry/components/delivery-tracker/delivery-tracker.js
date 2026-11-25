(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.deliveryTracker) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-delivery]';
  const TILE = 256;
  const EARTH = 6378137; // metres
  const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const states = new WeakMap();
  let listening = false;
  let resizeObserver = null;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---------------------------------------------------------------- geometry

  function project(p, zoom) {
    const size = TILE * Math.pow(2, zoom);
    const sin = Math.sin((Math.max(-85, Math.min(85, p.lat)) * Math.PI) / 180);
    return {
      x: ((p.lng + 180) / 360) * size,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
    };
  }

  function distance(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  // Compass bearing from a to b in degrees (0 = north), for the vehicle icon.
  function bearing(a, b) {
    const rad = Math.PI / 180;
    const y = Math.sin((b.lng - a.lng) * rad) * Math.cos(b.lat * rad);
    const x =
      Math.cos(a.lat * rad) * Math.sin(b.lat * rad) -
      Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lng - a.lng) * rad);
    return (Math.atan2(y, x) / rad + 360) % 360;
  }

  function point(value) {
    if (!value) return null;
    if (Array.isArray(value)) return { lat: Number(value[0]), lng: Number(value[1]) };
    if (typeof value === 'string') {
      const parts = value.split(',').map(Number);
      return parts.length === 2 && parts.every(Number.isFinite)
        ? { lat: parts[0], lng: parts[1] }
        : null;
    }
    return { lat: Number(value.lat), lng: Number(value.lng) };
  }

  // The planned-route segment the courier is on (the nearest one), so the
  // part already driven can be drawn differently from the part ahead.
  function nearestSegment(route, p) {
    const k = Math.cos((p.lat * Math.PI) / 180);
    let best = 0;
    let bestDistance = Infinity;
    for (let j = 0; j < route.length - 1; j++) {
      const ax = route[j].lng * k;
      const ay = route[j].lat;
      const dx = route[j + 1].lng * k - ax;
      const dy = route[j + 1].lat - ay;
      const len = dx * dx + dy * dy;
      const u = len
        ? Math.max(0, Math.min(1, ((p.lng * k - ax) * dx + (p.lat - ay) * dy) / len))
        : 0;
      const ex = ax + u * dx - p.lng * k;
      const ey = ay + u * dy - p.lat;
      const d = ex * ex + ey * ey;
      if (d < bestDistance - 1e-14) {
        bestDistance = d;
        best = j;
      }
    }
    return best;
  }

  // Metres still to drive: along the planned route when there is one.
  function remaining(s) {
    if (!s.courier || !s.destination) return 0;
    if (s.route.length < 2) return distance(s.courier, s.destination);
    const j = nearestSegment(s.route, s.courier);
    let metres = distance(s.courier, s.route[j + 1]);
    for (let i = j + 1; i < s.route.length - 1; i++) metres += distance(s.route[i], s.route[i + 1]);
    return metres;
  }

  // ------------------------------------------------------------------- state

  function number(root, name, fallback) {
    const value = Number(root.getAttribute(name));
    return root.hasAttribute(name) && Number.isFinite(value) ? value : fallback;
  }

  function el(root, name) {
    return root.querySelector('[data-bootcn-delivery-' + name + ']');
  }

  function state(root) {
    let s = states.get(root);
    if (s) return s;
    let route;
    try {
      route = JSON.parse(root.getAttribute('data-route') || '[]').map(point);
    } catch {
      route = [];
    }
    s = {
      origin: point(root.getAttribute('data-origin')),
      destination: point(root.getAttribute('data-destination')),
      route: route,
      courier: null, // where the courier is, as last reported
      shown: null, // where the marker is drawn (it glides towards courier)
      trail: [],
      status: null,
      eta: null, // arrival time in ms
      nearby: false,
      zoom: number(root, 'data-zoom', 15),
      center: null,
      follow: true,
      frame: 0,
      glide: 0,
      tiles: new Map(),
      drag: null,
      source: null,
      timer: null,
    };
    states.set(root, s);
    return s;
  }

  // ------------------------------------------------------------------ format

  function locale(root) {
    const host = root.closest('[lang]');
    return host ? host.getAttribute('lang') : undefined;
  }

  function clock(root, ms) {
    try {
      return new Intl.DateTimeFormat(locale(root), { hour: 'numeric', minute: '2-digit' }).format(
        new Date(ms),
      );
    } catch {
      return new Date(ms).toTimeString().slice(0, 5);
    }
  }

  function formatDistance(root, metres) {
    const km = metres >= 1000;
    try {
      return new Intl.NumberFormat(locale(root), {
        style: 'unit',
        unit: km ? 'kilometer' : 'meter',
        maximumFractionDigits: km ? 1 : 0,
      }).format(km ? metres / 1000 : Math.round(metres / 10) * 10);
    } catch {
      return km ? (metres / 1000).toFixed(1) + ' km' : Math.round(metres) + ' m';
    }
  }

  // ------------------------------------------------------------------ render

  function schedule(root) {
    const s = state(root);
    if (s.frame) return;
    s.frame = requestAnimationFrame(function () {
      s.frame = 0;
      render(root);
    });
  }

  function size(root) {
    const view = el(root, 'view');
    return { w: view.clientWidth, h: view.clientHeight };
  }

  function visiblePoints(s) {
    const list = [];
    if (s.shown) list.push(s.shown);
    if (s.destination) list.push(s.destination);
    // Until the courier has left it, the shop matters too.
    if (s.origin && (!s.shown || distance(s.shown, s.origin) < 150)) list.push(s.origin);
    return list;
  }

  function fit(root) {
    const s = state(root);
    const all = visiblePoints(s);
    if (!all.length) return;
    const box = size(root);
    if (!box.w || !box.h) return;
    const pad = 56;
    for (let zoom = number(root, 'data-fit-zoom', 16); zoom >= 3; zoom--) {
      const xs = all.map((p) => project(p, zoom).x);
      const ys = all.map((p) => project(p, zoom).y);
      const minX = Math.min.apply(null, xs);
      const maxX = Math.max.apply(null, xs);
      const minY = Math.min.apply(null, ys);
      const maxY = Math.max.apply(null, ys);
      if (maxX - minX <= box.w - pad * 2 && maxY - minY <= box.h - pad * 2) {
        s.zoom = zoom;
        s.center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        break;
      }
    }
    schedule(root);
  }

  function setZoom(root, zoom) {
    const s = state(root);
    const next = Math.max(3, Math.min(number(root, 'data-max-zoom', 17) + 2, zoom));
    if (s.center) {
      const k = Math.pow(2, next - s.zoom);
      s.center = { x: s.center.x * k, y: s.center.y * k };
    }
    s.zoom = next;
    schedule(root);
  }

  function renderTiles(root, box) {
    const s = state(root);
    const layer = el(root, 'tiles');
    const template = root.hasAttribute('data-tiles') ? root.getAttribute('data-tiles') : OSM;
    if (!template || !s.center) {
      s.tiles.forEach((img) => img.remove());
      s.tiles.clear();
      return;
    }
    const z = s.zoom;
    const count = Math.pow(2, z);
    const left = s.center.x - box.w / 2;
    const top = s.center.y - box.h / 2;
    const wanted = new Set();
    for (let ty = Math.floor(top / TILE); ty <= Math.floor((top + box.h) / TILE); ty++) {
      if (ty < 0 || ty >= count) continue;
      for (let tx = Math.floor(left / TILE); tx <= Math.floor((left + box.w) / TILE); tx++) {
        const key = z + '/' + tx + '/' + ty;
        wanted.add(key);
        let img = s.tiles.get(key);
        if (!img) {
          img = document.createElement('img');
          img.className = 'bootcn-delivery__tile';
          img.alt = '';
          img.draggable = false;
          img.decoding = 'async';
          img.src = template
            .replace('{z}', String(z))
            .replace('{x}', String(((tx % count) + count) % count))
            .replace('{y}', String(ty))
            .replace('{s}', 'abc'.charAt(Math.abs(tx + ty) % 3));
          s.tiles.set(key, img);
          layer.appendChild(img);
        }
        img.style.transform =
          'translate(' +
          Math.round(tx * TILE - left) +
          'px, ' +
          Math.round(ty * TILE - top) +
          'px)';
      }
    }
    s.tiles.forEach(function (img, key) {
      if (!wanted.has(key)) {
        img.remove();
        s.tiles.delete(key);
      }
    });
  }

  function render(root) {
    const s = state(root);
    const box = size(root);
    if (!box.w || !box.h) return;
    if (!s.center) fit(root);
    if (!s.center) return;
    renderTiles(root, box);

    const screen = function (p) {
      const w = project(p, s.zoom);
      return { x: w.x - s.center.x + box.w / 2, y: w.y - s.center.y + box.h / 2 };
    };
    const path = function (list) {
      return list
        .map(function (p, i) {
          const q = screen(p);
          return (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
        })
        .join('');
    };

    // The road ahead (dashed) and the road behind (solid).
    let ahead = [];
    let behind = [];
    if (s.shown && s.destination) {
      if (s.route.length > 1) {
        const j = nearestSegment(s.route, s.shown);
        ahead = [s.shown].concat(s.route.slice(j + 1));
        behind = s.route.slice(0, j + 1).concat([s.shown]);
      } else {
        ahead = [s.shown, s.destination];
        behind = s.trail.concat([s.shown]);
      }
    } else if (s.route.length) {
      ahead = s.route;
    } else if (s.origin && s.destination) {
      ahead = [s.origin, s.destination];
    }
    if (s.status === 'delivered') ahead = [];
    el(root, 'line').setAttribute('viewBox', '0 0 ' + box.w + ' ' + box.h);
    el(root, 'ahead').setAttribute('d', ahead.length > 1 ? path(ahead) : '');
    el(root, 'behind').setAttribute('d', behind.length > 1 ? path(behind) : '');

    [
      ['origin', s.origin],
      ['destination', s.destination],
      ['courier', s.shown],
    ].forEach(function (pair) {
      const node = el(root, pair[0]);
      if (!node) return;
      node.hidden = !pair[1];
      if (pair[1]) {
        const q = screen(pair[1]);
        node.style.transform = 'translate(' + q.x.toFixed(1) + 'px, ' + q.y.toFixed(1) + 'px)';
      }
    });
    const courier = el(root, 'courier');
    if (courier && s.heading !== undefined) {
      courier.style.setProperty('--bootcn-delivery-heading', s.heading.toFixed(0) + 'deg');
    }
    const credit = el(root, 'attribution');
    if (credit) credit.hidden = root.getAttribute('data-tiles') === '';
  }

  // Moves the marker smoothly to the new position over about the time the
  // next update takes, so it glides instead of jumping.
  function glide(root, to, ms) {
    const s = state(root);
    cancelAnimationFrame(s.glide);
    const from = s.shown;
    if (!from || reducedMotion() || ms <= 0) {
      s.shown = to;
      if (s.follow) fit(root);
      schedule(root);
      return;
    }
    const start = performance.now();
    const step = function (now) {
      const k = Math.min(1, (now - start) / ms);
      s.shown = {
        lat: from.lat + (to.lat - from.lat) * k,
        lng: from.lng + (to.lng - from.lng) * k,
      };
      render(root);
      if (k < 1) s.glide = requestAnimationFrame(step);
      else if (s.follow) fit(root);
    };
    s.glide = requestAnimationFrame(step);
  }

  // ------------------------------------------------------------------ status

  function announce(root, message) {
    const status = el(root, 'status');
    if (status) status.textContent = message;
  }

  function steps(root) {
    return Array.from(root.querySelectorAll('[data-step]'));
  }

  function setStatus(root, name) {
    const s = state(root);
    const list = steps(root);
    const index = list.findIndex((li) => li.getAttribute('data-step') === name);
    if (index < 0 || s.status === name) return;
    s.status = name;
    const last = index === list.length - 1;
    list.forEach(function (li, i) {
      li.classList.toggle('is-done', i < index || last);
      li.classList.toggle('is-current', i === index && !last);
      if (i === index) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
    root.setAttribute('data-status', name);
    const label = list[index].querySelector('[data-step-label]') || list[index];
    const heading = el(root, 'state');
    if (heading) heading.textContent = label.textContent.trim();
    announce(root, label.textContent.trim());
    root.dispatchEvent(
      new CustomEvent('bootcn:delivery:status', { bubbles: true, detail: { status: name } }),
    );
  }

  function renderEta(root) {
    const s = state(root);
    const big = el(root, 'eta');
    const detail = el(root, 'arrival');
    const left = el(root, 'remaining');
    if (s.status === 'delivered') {
      // "Delivered" is already the state above: show when.
      if (big) big.textContent = clock(root, s.deliveredAt || Date.now());
      if (detail) detail.textContent = '';
      if (left) left.textContent = '';
      return;
    }
    let eta = s.eta;
    // No time from the server: estimate it from what is left to drive.
    if (eta === null && s.courier) {
      eta = Date.now() + (remaining(s) / (number(root, 'data-speed', 18) / 3.6)) * 1000;
    }
    if (eta === null) return;
    const minutes = Math.max(0, Math.round((eta - Date.now()) / 60000));
    if (big) {
      big.textContent =
        minutes < 1
          ? t('delivery.now', 'Arriving now')
          : t('delivery.in', '{n} min').replace('{n}', String(minutes));
    }
    if (detail) detail.textContent = t('delivery.arrival', 'Arriving at') + ' ' + clock(root, eta);
    if (left && s.courier) left.textContent = formatDistance(root, remaining(s));
  }

  // ------------------------------------------------------------------ update

  // update(root, { lat, lng, status, eta (minutes), arrival (ISO or ms) })
  function update(root, data) {
    const s = state(root);
    data = data || {};
    if (data.status) setStatus(root, String(data.status));
    if (data.status === 'delivered') {
      s.deliveredAt = Date.now();
      if (s.destination)
        data = Object.assign({ lat: s.destination.lat, lng: s.destination.lng }, data);
    }
    if (data.arrival !== undefined) s.eta = new Date(data.arrival).getTime();
    else if (data.eta !== undefined) s.eta = Date.now() + Number(data.eta) * 60000;

    const next = point(data.lat !== undefined ? data : null);
    if (next && Number.isFinite(next.lat) && Number.isFinite(next.lng)) {
      const now = Date.now();
      const gap = s.lastUpdate ? Math.min(2000, now - s.lastUpdate) : 0;
      s.lastUpdate = now;
      if (s.courier) {
        s.trail.push(s.courier);
        // Turn the vehicle the way it moves (or as the server says).
        if (data.heading !== undefined) s.heading = Number(data.heading);
        else if (distance(s.courier, next) > 2) s.heading = bearing(s.courier, next);
      }
      s.courier = next;
      glide(root, next, gap);
      // "Nearby": a heads-up once, when the courier is close.
      const near = s.destination && remaining(s) < number(root, 'data-nearby', 200);
      if (near && !s.nearby && s.status !== 'delivered') {
        s.nearby = true;
        announce(root, t('delivery.nearby', 'Your courier is nearby.'));
        root.dispatchEvent(new CustomEvent('bootcn:delivery:nearby', { bubbles: true }));
      }
    }
    renderEta(root);
    schedule(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:delivery:update', {
        bubbles: true,
        detail: { courier: s.courier, status: s.status, remaining: remaining(s), eta: s.eta },
      }),
    );
  }

  // Live updates from a server: Server-Sent Events whose messages are the
  // JSON that update() takes. Closes itself once delivered.
  function connect(root, url) {
    const s = state(root);
    disconnect(root);
    if (!('EventSource' in window)) return null;
    s.source = new EventSource(url);
    s.source.onmessage = function (event) {
      try {
        const data = JSON.parse(event.data);
        update(root, data);
        if (data.status === 'delivered') disconnect(root);
      } catch {
        /* not JSON: ignore */
      }
    };
    return s.source;
  }

  function disconnect(root) {
    const s = state(root);
    if (s.source) s.source.close();
    s.source = null;
  }

  // ------------------------------------------------------------------ events

  function onClick(event) {
    const button = event.target.closest && event.target.closest(ROOT + ' button');
    if (!button) return;
    const root = button.closest(ROOT);
    const s = state(root);
    if (button.hasAttribute('data-bootcn-delivery-zoom-in')) setZoom(root, s.zoom + 1);
    else if (button.hasAttribute('data-bootcn-delivery-zoom-out')) setZoom(root, s.zoom - 1);
    else if (button.hasAttribute('data-bootcn-delivery-fit')) {
      s.follow = true;
      fit(root);
    } else return;
    if (!button.hasAttribute('data-bootcn-delivery-fit')) s.follow = false;
  }

  function viewOf(event) {
    const view = event.target.closest && event.target.closest('[data-bootcn-delivery-view]');
    return view ? { view: view, root: view.closest(ROOT) } : null;
  }

  function onPointerDown(event) {
    const hit = viewOf(event);
    if (!hit || event.button !== 0) return;
    const s = state(hit.root);
    if (!s.center) return;
    s.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, center: s.center };
    hit.view.setPointerCapture(event.pointerId);
    hit.root.classList.add('is-dragging');
  }

  function onPointerMove(event) {
    const hit = viewOf(event);
    if (!hit) return;
    const s = state(hit.root);
    if (!s.drag || s.drag.id !== event.pointerId) return;
    const dx = event.clientX - s.drag.x;
    const dy = event.clientY - s.drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) s.follow = false;
    s.center = { x: s.drag.center.x - dx, y: s.drag.center.y - dy };
    schedule(hit.root);
  }

  function onPointerUp(event) {
    const hit = viewOf(event);
    if (!hit) return;
    const s = state(hit.root);
    if (!s.drag || s.drag.id !== event.pointerId) return;
    s.drag = null;
    hit.root.classList.remove('is-dragging');
  }

  function setup(root) {
    const s = state(root);
    const current = root.getAttribute('data-status');
    if (current) {
      s.status = null;
      setStatus(root, current);
    }
    if (resizeObserver) resizeObserver.observe(el(root, 'view'));
    if (!s.timer) {
      // The minutes count down between updates too.
      s.timer = setInterval(() => renderEta(root), 30000);
    }
    const source = root.getAttribute('data-source');
    if (source && !s.source) connect(root, source);
    renderEta(root);
    schedule(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('pointerdown', onPointerDown);
      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
      document.addEventListener('pointercancel', onPointerUp);
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(function (entries) {
          entries.forEach(function (entry) {
            const root = entry.target.closest(ROOT);
            if (!root) return;
            if (state(root).follow) fit(root);
            schedule(root);
          });
        });
      }
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.querySelectorAll(ROOT).forEach(function (root) {
      const s = state(root);
      disconnect(root);
      clearInterval(s.timer);
      s.timer = null;
      cancelAnimationFrame(s.glide);
    });
    document.removeEventListener('click', onClick);
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
    if (resizeObserver) resizeObserver.disconnect();
    resizeObserver = null;
    listening = false;
  }

  ns.deliveryTracker = {
    init: init,
    destroy: destroy,
    setup: setup,
    update: update,
    connect: connect,
    disconnect: disconnect,
    fit: function (root) {
      state(root).follow = true;
      fit(root);
    },
    setRoute: function (root, list) {
      state(root).route = (list || []).map(point);
      schedule(root);
    },
    remaining: function (root) {
      return remaining(state(root));
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
