(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.reveal) return; // already loaded: idempotent

  let observer = null;

  function show(el) {
    el.classList.add('is-revealed');
    el.dispatchEvent(new CustomEvent('bootcn:reveal', { bubbles: true }));
  }

  function targets(root) {
    const list = [...root.querySelectorAll('[data-bootcn-reveal]')];
    root.querySelectorAll('[data-bootcn-reveal-stagger]').forEach((group) => {
      const step = Number(group.getAttribute('data-bootcn-reveal-stagger')) || 90;
      [...group.children].forEach((child, i) => {
        child.style.setProperty('--bootcn-reveal-delay', i * step + 'ms');
        list.push(child);
      });
    });
    return list;
  }

  function setup(root) {
    const list = targets(root || document);
    if (!observer || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      list.forEach(show);
      return;
    }
    list.forEach((el) => {
      if (!el.classList.contains('is-revealed')) observer.observe(el);
    });
  }

  function init() {
    if (!observer && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            show(entry.target);
          }),
        { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
      );
    }
    // From here on, waiting parts start hidden (see scroll-reveal.css).
    document.documentElement.classList.add('bootcn-reveal-ready');
    setup(document);
  }

  function destroy() {
    if (observer) observer.disconnect();
    observer = null;
    document.documentElement.classList.remove('bootcn-reveal-ready');
  }

  ns.reveal = { init, destroy, setup, show };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
