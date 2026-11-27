(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.largeTitle) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-large-title]';
  const observers = new Map();

  // The scroll box: data-scroll-container="#id", else the nearest scrolling
  // ancestor, else the page.
  function scroller(root) {
    const selector = root.getAttribute('data-scroll-container');
    if (selector) return document.querySelector(selector);
    for (let el = root.parentElement; el && el !== document.body; el = el.parentElement) {
      const overflow = getComputedStyle(el).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') return el;
    }
    return null;
  }

  function setup(root) {
    if (observers.has(root)) return;
    const title = root.querySelector('.bootcn-large-title__title');
    const bar = root.querySelector('.bootcn-large-title__bar');
    if (!title || !bar || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const collapsed =
          !entry.isIntersecting &&
          entry.boundingClientRect.top < entry.rootBounds.top + bar.offsetHeight;
        if (root.classList.contains('is-collapsed') === collapsed) return;
        root.classList.toggle('is-collapsed', collapsed);
        root.dispatchEvent(
          new CustomEvent('bootcn:large-title:change', { bubbles: true, detail: { collapsed } }),
        );
      },
      { root: scroller(root), rootMargin: `-${bar.offsetHeight}px 0px 0px 0px`, threshold: 0 },
    );
    observer.observe(title);
    observers.set(root, observer);
  }

  function init() {
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    observers.forEach((observer, root) => {
      observer.disconnect();
      root.classList.remove('is-collapsed');
    });
    observers.clear();
  }

  ns.largeTitle = { init, destroy, setup };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
