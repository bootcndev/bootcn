(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.ticker) return; // already loaded: idempotent

  const SELECTOR = '[data-bootcn-ticker]';
  const started = new WeakSet();
  let observer = null;

  function format(el, value) {
    const decimals = Number(el.getAttribute('data-decimals')) || 0;
    const locale =
      el.getAttribute('data-locale') ||
      (el.closest('[lang]') || document.documentElement).lang ||
      undefined;
    const number = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
    return (el.getAttribute('data-prefix') || '') + number + (el.getAttribute('data-suffix') || '');
  }

  // The final number stays in the page for screen readers; only the
  // counting copy moves, hidden from them.
  function prepare(el) {
    if (el.querySelector('.bootcn-ticker__count')) return;
    const target = Number(el.getAttribute('data-value'));
    if (!Number.isFinite(target)) return;
    const final = document.createElement('span');
    final.className = 'visually-hidden';
    final.textContent = format(el, target);
    const count = document.createElement('span');
    count.className = 'bootcn-ticker__count';
    count.setAttribute('aria-hidden', 'true');
    count.textContent = format(el, Number(el.getAttribute('data-from')) || 0);
    el.replaceChildren(final, count);
  }

  function run(el) {
    if (started.has(el)) return;
    started.add(el);
    const count = el.querySelector('.bootcn-ticker__count');
    const from = Number(el.getAttribute('data-from')) || 0;
    const to = Number(el.getAttribute('data-value'));
    const duration = Number(el.getAttribute('data-duration')) || 1600;
    if (!count) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      count.textContent = format(el, to);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease out
      count.textContent = format(el, from + (to - from) * eased);
      if (t < 1) requestAnimationFrame(step);
      else
        el.dispatchEvent(
          new CustomEvent('bootcn:ticker:done', { bubbles: true, detail: { value: to } }),
        );
    };
    requestAnimationFrame(step);
  }

  function setup(el) {
    prepare(el);
    if (observer) observer.observe(el);
    else run(el);
  }

  function init() {
    if (!observer && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            run(entry.target);
          }),
        { threshold: 0.4 },
      );
    }
    document.querySelectorAll(SELECTOR).forEach(setup);
  }

  function destroy() {
    if (observer) observer.disconnect();
    observer = null;
  }

  ns.ticker = { init, destroy, setup, run };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
