(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.social) return; // already loaded: idempotent

  let listening = false;

  function locale() {
    return document.documentElement.lang || undefined;
  }

  function compact(n) {
    try {
      return new Intl.NumberFormat(locale(), {
        notation: 'compact',
        maximumFractionDigits: 1,
      }).format(n);
    } catch {
      return String(n);
    }
  }

  function full(n) {
    try {
      return new Intl.NumberFormat(locale()).format(n);
    } catch {
      return String(n);
    }
  }

  // Counts under 10,000 are shown in full; above, compact (12.4K).
  function show(el, n) {
    el.textContent = n >= 10000 ? compact(n) : full(n);
  }

  function toggleLike(button) {
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    const count = Number(button.getAttribute('data-count') || 0) + (pressed ? 1 : -1);
    button.setAttribute('aria-pressed', String(pressed));
    button.setAttribute('data-count', String(Math.max(0, count)));
    const el = button.querySelector('[data-bootcn-count]');
    if (el) show(el, Math.max(0, count));
    if (pressed) {
      button.classList.remove('is-popping');
      void button.offsetWidth; // restart the animation
      button.classList.add('is-popping');
    }
    button.dispatchEvent(
      new CustomEvent('bootcn:like', {
        bubbles: true,
        detail: { pressed: pressed, count: Math.max(0, count) },
      }),
    );
  }

  function toggleFollow(button) {
    const pressed = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(pressed));
    button.dispatchEvent(
      new CustomEvent('bootcn:follow', { bubbles: true, detail: { pressed: pressed } }),
    );
  }

  // Like and dislike: one at a time; choosing one takes back the other.
  function vote(button) {
    const group = button.closest('[data-bootcn-vote]');
    if (!group) return;
    const pressing = button.getAttribute('aria-pressed') !== 'true';
    group.querySelectorAll('[data-bootcn-vote-button]').forEach(function (other) {
      const was = other.getAttribute('aria-pressed') === 'true';
      const now = other === button ? pressing : false;
      if (was === now) return;
      const count = Math.max(0, Number(other.getAttribute('data-count') || 0) + (now ? 1 : -1));
      other.setAttribute('aria-pressed', String(now));
      other.setAttribute('data-count', String(count));
      const el = other.querySelector('[data-bootcn-count]');
      if (el) show(el, count);
      if (now) {
        other.classList.remove('is-popping');
        void other.offsetWidth;
        other.classList.add('is-popping');
      }
    });
    const value = pressing
      ? button.getAttribute('data-bootcn-vote-button') === 'down'
        ? -1
        : 1
      : 0;
    group.dispatchEvent(
      new CustomEvent('bootcn:vote', { bubbles: true, detail: { value: value } }),
    );
  }

  function onClick(event) {
    const voteButton = event.target.closest && event.target.closest('[data-bootcn-vote-button]');
    if (voteButton) {
      vote(voteButton);
      return;
    }
    const like = event.target.closest && event.target.closest('[data-bootcn-like]');
    if (like) {
      toggleLike(like);
      return;
    }
    const follow = event.target.closest && event.target.closest('[data-bootcn-follow]');
    if (follow) toggleFollow(follow);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      listening = true;
    }
    document.querySelectorAll('[data-bootcn-compact]').forEach(function (el) {
      const n = Number(el.getAttribute('value'));
      if (!Number.isNaN(n)) {
        show(el, n);
        // Screen readers get the exact number, not "12.4K".
        if (n >= 10000) el.setAttribute('aria-label', full(n));
      }
    });
    document.querySelectorAll('[data-bootcn-like]').forEach(function (button) {
      const el = button.querySelector('[data-bootcn-count]');
      if (el) show(el, Number(button.getAttribute('data-count') || 0));
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.social = { init: init, destroy: destroy, compact: compact };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
