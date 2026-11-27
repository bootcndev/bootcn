(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.purchases) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-purchase]';
  const OFF = 'bootcn-purchase-off';
  const states = new WeakMap();
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function off() {
    try {
      return sessionStorage.getItem(OFF) === '1';
    } catch {
      return false;
    }
  }

  function get(root) {
    let s = states.get(root);
    if (!s) {
      s = { queue: [], showing: null, timer: 0, paused: false, poll: 0, seen: new Set() };
      states.set(root, s);
    }
    return s;
  }

  function ago(root, iso) {
    const date = new Date(iso);
    if (Number.isNaN(+date)) return '';
    const seconds = Math.round((date - Date.now()) / 1000);
    const locale = (root.closest('[lang]') || document.documentElement).lang || undefined;
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    const abs = Math.abs(seconds);
    if (abs < 60) return rtf.format(seconds, 'second');
    if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
    return rtf.format(Math.round(seconds / 86400), 'day');
  }

  // A purchase: { id, name, place, product, href, image, time } from your
  // own data. Shown one at a time; repeated ids are skipped.
  function show(root, purchase) {
    if (!root || off()) return;
    const s = get(root);
    if (purchase.id && s.seen.has(purchase.id)) return;
    if (purchase.id) s.seen.add(purchase.id);
    s.queue.push(purchase);
    if (!s.showing) next(root);
  }

  function next(root) {
    const s = get(root);
    const purchase = s.queue.shift();
    if (!purchase || off()) return;
    const template = root.querySelector('template[data-purchase-template]');
    const notice = template.content.firstElementChild.cloneNode(true);
    const who = notice.querySelector('[data-purchase-who]');
    who.textContent = purchase.place
      ? t('purchase.whoFrom', '{name} in {place}')
          .replace('{name}', purchase.name || t('purchase.someone', 'Someone'))
          .replace('{place}', purchase.place)
      : purchase.name || t('purchase.someone', 'Someone');
    const product = notice.querySelector('[data-purchase-product]');
    product.textContent = purchase.product;
    if (purchase.href) product.href = purchase.href;
    else product.removeAttribute('href');
    const time = notice.querySelector('[data-purchase-time]');
    if (purchase.time) {
      time.dateTime = purchase.time;
      time.textContent = ago(root, purchase.time);
    } else time.remove();
    if (purchase.image) {
      const box = notice.querySelector('.bootcn-purchase__image');
      const img = document.createElement('img');
      img.src = purchase.image;
      img.alt = '';
      box.replaceChildren(img);
    }
    root.append(notice);
    s.showing = notice;
    root.dispatchEvent(
      new CustomEvent('bootcn:purchase:show', { bubbles: true, detail: { purchase } }),
    );
    schedule(root);
  }

  function schedule(root) {
    const s = get(root);
    clearTimeout(s.timer);
    if (s.paused) return;
    s.timer = setTimeout(() => hide(root), Number(root.getAttribute('data-duration')) || 6000);
  }

  function hide(root) {
    const s = get(root);
    const notice = s.showing;
    if (!notice) return;
    clearTimeout(s.timer);
    const done = () => {
      notice.remove();
      s.showing = null;
      setTimeout(() => next(root), Number(root.getAttribute('data-gap')) || 1500);
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return done();
    notice.classList.add('is-leaving');
    setTimeout(done, 200);
  }

  // Polls data-feed-url for recent purchases (a JSON array, newest first).
  function poll(root) {
    const url = root.getAttribute('data-feed-url');
    if (!url || off()) return;
    fetch(url, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : []))
      .then((list) =>
        (Array.isArray(list) ? list : [])
          .slice(0, 3)
          .reverse()
          .forEach((p) => show(root, p)),
      )
      .catch(() => {});
  }

  function stop(root) {
    try {
      sessionStorage.setItem(OFF, '1');
    } catch {
      // private mode: just this page
    }
    const s = get(root);
    s.queue = [];
    clearInterval(s.poll);
    hide(root);
    root.dispatchEvent(new CustomEvent('bootcn:purchase:off', { bubbles: true }));
  }

  function onClick(event) {
    const close = event.target.closest('[data-purchase-close]');
    const root = close && close.closest(ROOT);
    if (root) stop(root);
  }

  // Hovering or focusing a notice keeps it on screen.
  function onEnter(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    get(root).paused = true;
    clearTimeout(get(root).timer);
  }

  function onLeave(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || (event.relatedTarget && root.contains(event.relatedTarget))) return;
    get(root).paused = false;
    schedule(root);
  }

  function setup(root) {
    const s = get(root);
    if (s.poll || !root.hasAttribute('data-feed-url')) return;
    poll(root);
    s.poll = setInterval(
      () => poll(root),
      (Number(root.getAttribute('data-interval')) || 30) * 1000,
    );
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('pointerover', onEnter);
      document.addEventListener('pointerout', onLeave);
      document.addEventListener('focusin', onEnter);
      document.addEventListener('focusout', onLeave);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    document.removeEventListener('click', onClick);
    document.removeEventListener('pointerover', onEnter);
    document.removeEventListener('pointerout', onLeave);
    document.removeEventListener('focusin', onEnter);
    document.removeEventListener('focusout', onLeave);
    document.querySelectorAll(ROOT).forEach((root) => clearInterval(get(root).poll));
    listening = false;
  }

  ns.purchases = { init, destroy, show, hide, stop };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
