(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.routeTracker) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-route]';
  const TILE = 256;
  const EARTH = 6378137; // metres
  const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const states = new WeakMap();
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  // ---------------------------------------------------------------- geometry

  // Web Mercator: degrees to "world pixels" at a zoom level.
  function project(lat, lng, zoom) {
    const size = TILE * Math.pow(2, zoom);
    const sin = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
    return {
      x: ((lng + 180) / 360) * size,
      y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size,
    };
  }

  function unproject(x, y, zoom) {
    const size = TILE * Math.pow(2, zoom);
    const n = Math.PI - (2 * Math.PI * y) / size;
    return {
      lat: (180 / Math.PI) * Math.atan(Math.sinh(n)),
      lng: (x / size) * 360 - 180,
    };
  }

  // Great-circle distance in metres.
  function distance(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad;
    const dLng = (b.lng - a.lng) * rad;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  function metresPerPixel(lat, zoom) {
    return (2 * Math.PI * EARTH * Math.cos((lat * Math.PI) / 180)) / (TILE * Math.pow(2, zoom));
  }

  // ------------------------------------------------------------------ format

  function locale(root) {
    return root.closest('[lang]') ? root.closest('[lang]').getAttribute('lang') : undefined;
  }

  function formatDistance(root, metres) {
    const km = metres >= 1000;
    try {
      return new Intl.NumberFormat(locale(root), {
        style: 'unit',
        unit: km ? 'kilometer' : 'meter',
        maximumFractionDigits: km ? 2 : 0,
      }).format(km ? metres / 1000 : metres);
    } catch {
      return km ? (metres / 1000).toFixed(2) + ' km' : Math.round(metres) + ' m';
    }
  }

  function formatSpeed(root, kmh) {
    try {
      return new Intl.NumberFormat(locale(root), {
        style: 'unit',
        unit: 'kilometer-per-hour',
        maximumFractionDigits: 1,
      }).format(kmh);
    } catch {
      return kmh.toFixed(1) + ' km/h';
    }
  }

  function formatTime(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(total / 3600);
    const m = Math.floor(total / 60) % 60;
    const s = total % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s).padStart(2, '0');
  }

  // ------------------------------------------------------------------- state

  function number(root, name, fallback) {
    const value = Number(root.getAttribute(name));
    return root.hasAttribute(name) && Number.isFinite(value) ? value : fallback;
  }

  function state(root) {
    let s = states.get(root);
    if (s) return s;
    s = {
      points: [], // { lat, lng, time, accuracy, gap }
      here: null,
      zoom: number(root, 'data-zoom', 16),
      center: null, // world pixels at s.zoom
      follow: true,
      watch: null,
      timer: null,
      frame: 0,
      tiles: new Map(),
      drag: null,
    };
    states.set(root, s);
    return s;
  }

  function el(root, name) {
    return root.querySelector('[data-bootcn-route-' + name + ']');
  }

  function tracking(root) {
    return state(root).watch !== null;
  }

  function stats(root) {
    const s = state(root);
    let metres = 0;
    let ms = 0;
    for (let i = 1; i < s.points.length; i++) {
      if (s.points[i].gap) continue;
      metres += distance(s.points[i - 1], s.points[i]);
      ms += s.points[i].time - s.points[i - 1].time;
    }
    const last = s.points[s.points.length - 1];
    if (tracking(root) && last) ms += Math.max(0, Date.now() - last.time);
    return { distance: metres, duration: ms, speed: ms > 0 ? metres / 1000 / (ms / 3600000) : 0 };
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

  function setZoom(root, zoom) {
    const s = state(root);
    const next = Math.max(
      number(root, 'data-min-zoom', 3),
      Math.min(number(root, 'data-max-zoom', 19), zoom),
    );
    if (s.center) {
      const k = Math.pow(2, next - s.zoom);
      s.center = { x: s.center.x * k, y: s.center.y * k };
    }
    s.zoom = next;
    schedule(root);
  }

  function centerOn(root, lat, lng) {
    const s = state(root);
    s.center = project(lat, lng, s.zoom);
    schedule(root);
  }

  // The largest zoom that shows every point, with some room around them.
  function fit(root) {
    const s = state(root);
    const all = s.points.concat(s.here ? [s.here] : []);
    if (!all.length) return;
    const box = size(root);
    const pad = 48;
    for (let zoom = number(root, 'data-max-zoom', 19) - 1; zoom >= 3; zoom--) {
      const xs = [];
      const ys = [];
      all.forEach(function (p) {
        const w = project(p.lat, p.lng, zoom);
        xs.push(w.x);
        ys.push(w.y);
      });
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

  function tileUrl(root, z, x, y) {
    const template = root.hasAttribute('data-tiles') ? root.getAttribute('data-tiles') : OSM;
    return template
      .replace('{z}', String(z))
      .replace('{x}', String(x))
      .replace('{y}', String(y))
      .replace('{s}', 'abc'.charAt((x + y) % 3));
  }

  function renderTiles(root, box) {
    const s = state(root);
    const layer = el(root, 'tiles');
    const template = root.hasAttribute('data-tiles') ? root.getAttribute('data-tiles') : OSM;
    // No tiles until there is something to show: nothing is requested from
    // the tile server before tracking starts.
    if (!template || !s.center) {
      s.tiles.forEach(function (img) {
        img.remove();
      });
      s.tiles.clear();
      layer.hidden = !template;
      return;
    }
    layer.hidden = false;
    const z = Math.round(s.zoom);
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
          img.className = 'bootcn-route__tile';
          img.alt = '';
          img.draggable = false;
          img.decoding = 'async';
          img.src = tileUrl(root, z, ((tx % count) + count) % count, ty);
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

  function place(node, x, y) {
    node.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
  }

  function render(root) {
    const s = state(root);
    const box = size(root);
    if (!box.w || !box.h) return;
    renderTiles(root, box);

    const toScreen = function (p) {
      const w = project(p.lat, p.lng, s.zoom);
      return { x: w.x - s.center.x + box.w / 2, y: w.y - s.center.y + box.h / 2 };
    };

    const svg = el(root, 'line');
    svg.setAttribute('viewBox', '0 0 ' + box.w + ' ' + box.h);
    let d = '';
    if (s.center) {
      s.points.forEach(function (p, i) {
        const q = toScreen(p);
        d += (i === 0 || p.gap ? 'M' : 'L') + q.x.toFixed(1) + ' ' + q.y.toFixed(1);
      });
    }
    svg.querySelectorAll('path').forEach(function (path) {
      path.setAttribute('d', d);
    });

    const start = el(root, 'start');
    start.hidden = !s.center || !s.points.length;
    if (!start.hidden) {
      const q = toScreen(s.points[0]);
      place(start, q.x, q.y);
    }

    const here = el(root, 'here');
    here.hidden = !s.center || !s.here;
    if (!here.hidden) {
      const q = toScreen(s.here);
      place(here, q.x, q.y);
      const ring = here.querySelector('.bootcn-location-dot__accuracy');
      if (ring) {
        const px = s.here.accuracy ? (2 * s.here.accuracy) / metresPerPixel(s.here.lat, s.zoom) : 0;
        ring.style.setProperty('--bootcn-location-accuracy', Math.max(0, Math.min(px, 600)) + 'px');
      }
    }

    const empty = el(root, 'empty');
    if (empty) empty.hidden = Boolean(s.center);
    const credit = el(root, 'attribution');
    if (credit) credit.hidden = !s.center || root.getAttribute('data-tiles') === '';
    renderStats(root);
  }

  function renderStats(root) {
    const now = stats(root);
    const d = el(root, 'distance');
    const time = el(root, 'duration');
    const speed = el(root, 'speed');
    if (d) d.textContent = formatDistance(root, now.distance);
    if (time) time.textContent = formatTime(now.duration);
    if (speed) speed.textContent = formatSpeed(root, now.speed);
  }

  function announce(root, message) {
    const status = el(root, 'status');
    if (status) status.textContent = message;
  }

  // ------------------------------------------------------------------ points

  // Adds a position. Positions less accurate than data-max-accuracy (metres)
  // move the dot but not the line; so do moves under data-min-distance.
  function add(root, point) {
    const s = state(root);
    const p = {
      lat: Number(point.lat),
      lng: Number(point.lng),
      time: Number(point.time) || Date.now(),
      accuracy: Number(point.accuracy) || 0,
      gap: false,
    };
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
    s.here = p;
    if (!s.center) centerOn(root, p.lat, p.lng);
    else if (s.follow) centerOn(root, p.lat, p.lng);

    const last = s.points[s.points.length - 1];
    const tooVague = p.accuracy > number(root, 'data-max-accuracy', 50);
    const tooClose = last && !s.resumed && distance(last, p) < number(root, 'data-min-distance', 5);
    if (tooVague || tooClose) {
      schedule(root);
      return false;
    }
    p.gap = Boolean(s.resumed && last);
    s.resumed = false;
    s.points.push(p);
    schedule(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:route:point', {
        bubbles: true,
        detail: { point: Object.assign({}, p), stats: stats(root) },
      }),
    );
    return true;
  }

  function syncButton(root) {
    const button = el(root, 'toggle');
    if (!button) return;
    const on = tracking(root);
    root.classList.toggle('is-tracking', on);
    const label = button.querySelector('[data-bootcn-route-toggle-label]') || button;
    label.textContent = on ? t('route.stop', 'Stop') : t('route.start', 'Start');
  }

  function start(root) {
    const s = state(root);
    if (s.watch !== null) return;
    if (!('geolocation' in navigator)) {
      announce(root, t('route.unsupported', 'This browser cannot share your location.'));
      return;
    }
    s.resumed = true;
    s.follow = true;
    s.watch = navigator.geolocation.watchPosition(
      function (position) {
        add(root, {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          time: position.timestamp,
        });
      },
      function (error) {
        if (error.code === 1) {
          announce(
            root,
            t('route.denied', 'Location access is blocked. Allow it in your browser settings.'),
          );
          stop(root, true);
        } else if (error.code === 2) {
          announce(root, t('route.unavailable', 'Your position is not available right now.'));
        }
        root.dispatchEvent(
          new CustomEvent('bootcn:route:error', { bubbles: true, detail: { code: error.code } }),
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
    s.timer = setInterval(function () {
      renderStats(root);
    }, 1000);
    syncButton(root);
    announce(root, t('route.started', 'Tracking your route.'));
    root.dispatchEvent(new CustomEvent('bootcn:route:start', { bubbles: true }));
  }

  function stop(root, quiet) {
    const s = state(root);
    if (s.watch === null) return;
    navigator.geolocation.clearWatch(s.watch);
    s.watch = null;
    clearInterval(s.timer);
    s.timer = null;
    syncButton(root);
    renderStats(root);
    if (!quiet) {
      const now = stats(root);
      announce(
        root,
        t('route.stopped', 'Tracking stopped.') +
          ' ' +
          formatDistance(root, now.distance) +
          ', ' +
          formatTime(now.duration) +
          '.',
      );
    }
    root.dispatchEvent(
      new CustomEvent('bootcn:route:stop', { bubbles: true, detail: { stats: stats(root) } }),
    );
  }

  function clear(root) {
    const s = state(root);
    s.points = [];
    s.here = tracking(root) ? s.here : null;
    if (!s.here) s.center = null;
    s.resumed = true;
    schedule(root);
    announce(root, t('route.cleared', 'Route cleared.'));
    root.dispatchEvent(new CustomEvent('bootcn:route:clear', { bubbles: true }));
  }

  function toGeoJSON(root) {
    const s = state(root);
    const lines = [[]];
    s.points.forEach(function (p) {
      if (p.gap) lines.push([]);
      lines[lines.length - 1].push([p.lng, p.lat]);
    });
    return {
      type: 'Feature',
      properties: { times: s.points.map((p) => new Date(p.time).toISOString()) },
      geometry: { type: 'MultiLineString', coordinates: lines.filter((l) => l.length) },
    };
  }

  // ------------------------------------------------------------------ events

  function onClick(event) {
    const button = event.target.closest && event.target.closest(ROOT + ' button');
    if (!button) return;
    const root = button.closest(ROOT);
    const s = state(root);
    if (button.hasAttribute('data-bootcn-route-toggle')) {
      if (tracking(root)) stop(root);
      else start(root);
    } else if (button.hasAttribute('data-bootcn-route-clear')) {
      clear(root);
    } else if (button.hasAttribute('data-bootcn-route-zoom-in')) {
      setZoom(root, s.zoom + 1);
    } else if (button.hasAttribute('data-bootcn-route-zoom-out')) {
      setZoom(root, s.zoom - 1);
    } else if (button.hasAttribute('data-bootcn-route-fit')) {
      s.follow = tracking(root);
      fit(root);
    } else if (button.hasAttribute('data-bootcn-route-locate')) {
      s.follow = true;
      if (s.here) centerOn(root, s.here.lat, s.here.lng);
    }
  }

  // Drag to pan; following the position stops until "Center" is pressed.
  function onPointerDown(event) {
    const view = event.target.closest && event.target.closest('[data-bootcn-route-view]');
    if (!view || event.button !== 0) return;
    const root = view.closest(ROOT);
    const s = state(root);
    if (!s.center) return;
    s.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, center: s.center };
    view.setPointerCapture(event.pointerId);
    root.classList.add('is-dragging');
  }

  function onPointerMove(event) {
    const view = event.target.closest && event.target.closest('[data-bootcn-route-view]');
    if (!view) return;
    const root = view.closest(ROOT);
    const s = state(root);
    if (!s.drag || s.drag.id !== event.pointerId) return;
    const dx = event.clientX - s.drag.x;
    const dy = event.clientY - s.drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) s.follow = false;
    s.center = { x: s.drag.center.x - dx, y: s.drag.center.y - dy };
    schedule(root);
  }

  function onPointerUp(event) {
    const view = event.target.closest && event.target.closest('[data-bootcn-route-view]');
    if (!view) return;
    const root = view.closest(ROOT);
    const s = state(root);
    if (!s.drag || s.drag.id !== event.pointerId) return;
    s.drag = null;
    root.classList.remove('is-dragging');
  }

  let resizeObserver = null;

  function setup(root) {
    state(root);
    syncButton(root);
    if (resizeObserver) resizeObserver.observe(el(root, 'view'));
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
            if (root) schedule(root);
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
      stop(root, true);
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

  ns.routeTracker = {
    init: init,
    destroy: destroy,
    setup: setup,
    start: start,
    stop: function (root) {
      stop(root);
    },
    clear: clear,
    add: add,
    fit: fit,
    points: function (root) {
      return state(root).points.map(function (p) {
        return Object.assign({}, p);
      });
    },
    stats: stats,
    toGeoJSON: toGeoJSON,
    distance: distance,
    unproject: unproject,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
