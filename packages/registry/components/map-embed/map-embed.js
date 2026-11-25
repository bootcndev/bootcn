(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.mapEmbed) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-map]';
  let listening = false;

  // OpenStreetMap's embed: a bounding box around the point and a marker.
  function embedUrl(root) {
    const lat = Number(root.getAttribute('data-lat'));
    const lon = Number(root.getAttribute('data-lon'));
    const zoom = Number(root.getAttribute('data-zoom') || 15);
    const span = 0.02 * Math.pow(2, 15 - zoom);
    const bbox = [lon - span, lat - span / 2, lon + span, lat + span / 2]
      .map(function (n) {
        return n.toFixed(5);
      })
      .join(',');
    return (
      'https://www.openstreetmap.org/export/embed.html?bbox=' +
      encodeURIComponent(bbox) +
      '&layer=mapnik&marker=' +
      encodeURIComponent(lat + ',' + lon)
    );
  }

  function load(root, focus) {
    const frame = root.querySelector('.bootcn-map__frame');
    if (!frame || frame.querySelector('iframe')) return;
    const iframe = document.createElement('iframe');
    iframe.className = 'bootcn-map__iframe';
    iframe.src = embedUrl(root);
    iframe.title = root.getAttribute('data-title') || 'Map';
    iframe.referrerPolicy = 'no-referrer';
    frame.replaceChildren(iframe);
    if (focus) iframe.focus();
    root.dispatchEvent(new CustomEvent('bootcn:map:load', { bubbles: true }));
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest(ROOT + ' [data-bootcn-map-load]');
    if (button) load(button.closest(ROOT), true);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      listening = true;
    }
    document.querySelectorAll(ROOT + '[data-autoload]').forEach(function (root) {
      load(root, false);
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.mapEmbed = { init: init, destroy: destroy, load: load };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
