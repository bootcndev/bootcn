(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.success) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-success]';
  const wasShown = new WeakMap();
  let observer = null;
  let visibility = null;

  function shown(el) {
    return !el.closest('[hidden]') && el.getClientRects().length > 0;
  }

  // Draws the check (again) and, with data-bootcn-success-confetti and the
  // confetti component loaded, celebrates from the mark.
  function play(el) {
    el.classList.add('is-ready');
    el.classList.remove('is-playing', 'is-played');
    void el.offsetWidth; // restart the animations
    el.classList.add('is-playing');
    const mark = el.querySelector('.bootcn-success__mark');
    if (mark) {
      mark.addEventListener(
        'animationend',
        function () {
          el.classList.add('is-played');
        },
        { once: true },
      );
    }
    if (el.hasAttribute('data-bootcn-success-confetti') && ns.confetti && mark) {
      setTimeout(function () {
        const box = mark.getBoundingClientRect();
        ns.confetti({ x: box.left + box.width / 2, y: box.top + box.height / 2 });
      }, 700);
    }
    el.dispatchEvent(new CustomEvent('bootcn:success:play', { bubbles: true }));
  }

  function check(el) {
    const now = shown(el);
    if (now && !wasShown.get(el)) play(el);
    wasShown.set(el, now);
  }

  function setup(el) {
    el.classList.add('is-ready');
    wasShown.set(el, false);
    check(el);
    if (visibility) visibility.observe(el);
  }

  function init() {
    if (!observer) {
      // Plays when the state appears: a hidden attribute removed, a panel
      // switched, a modal opened.
      observer = new MutationObserver(function () {
        document.querySelectorAll(ROOT).forEach(check);
      });
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['hidden', 'class', 'style'],
        subtree: true,
      });
      if ('IntersectionObserver' in window) {
        visibility = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            check(entry.target);
          });
        });
      }
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (observer) observer.disconnect();
    if (visibility) visibility.disconnect();
    observer = null;
    visibility = null;
  }

  ns.success = { init: init, destroy: destroy, play: play };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
