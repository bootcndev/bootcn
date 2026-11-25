(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.timeline) return; // already loaded: idempotent

  const UNITS = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  // "2 hours ago", "yesterday", "in 3 days", in the page's language.
  function relative(date, now) {
    const seconds = (date.getTime() - (now || Date.now())) / 1000;
    const lang = document.documentElement.lang || undefined;
    let format;
    try {
      format = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
    } catch {
      return null;
    }
    for (let i = 0; i < UNITS.length; i++) {
      const [unit, size] = UNITS[i];
      if (Math.abs(seconds) >= size) return format.format(Math.round(seconds / size), unit);
    }
    return format.format(0, 'minute');
  }

  // <time datetime="…" data-bootcn-relative> shows a relative time; the
  // exact date stays in the tooltip and the datetime attribute.
  function update(root) {
    (root || document).querySelectorAll('time[data-bootcn-relative]').forEach(function (el) {
      const date = new Date(el.getAttribute('datetime'));
      if (Number.isNaN(date.getTime())) return;
      const text = relative(date);
      if (!text) return;
      if (!el.title) el.title = date.toLocaleString(document.documentElement.lang || undefined);
      el.textContent = text;
    });
  }

  let timer = null;

  function init() {
    update();
    if (!timer) timer = setInterval(update, 60000);
  }

  function destroy() {
    clearInterval(timer);
    timer = null;
  }

  ns.timeline = { init: init, destroy: destroy, update: update, relative: relative };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
