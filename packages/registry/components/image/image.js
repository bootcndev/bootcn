(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.image) return; // already loaded: idempotent

  // Messages: override them for your language with window.Bootcn.messages,
  // e.g. { 'copy.done': 'Αντιγράφηκε.' } (see the Translations guide).
  // Plural keys end in .one, .other… as chosen by Intl.PluralRules.
  function t(key, fallback, vars) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    let text = typeof custom === 'string' ? custom : fallback;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(String(vars[name]));
    });
    return text;
  }

  const ROOT = '[data-bootcn-image]';
  const ICON =
    '<svg class="bootcn-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false"><path d="m2 2 20 20"/><path d="M10.4 4H19a2 2 0 0 1 2 2v8.6"/>' +
    '<path d="M21 21H5a2 2 0 0 1-2-2V5"/><path d="m3 17 5-5 4 4"/></svg>';

  function fail(root, img) {
    root.classList.remove('is-loading');
    root.classList.add('is-error');
    if (root.querySelector('.bootcn-image__fallback')) return;
    const fallback = document.createElement('div');
    fallback.className = 'bootcn-image__fallback';
    fallback.setAttribute('role', 'img');
    fallback.setAttribute('aria-label', img.alt || t('image.unavailable', 'Image unavailable'));
    fallback.innerHTML = ICON;
    const text = document.createElement('span');
    text.setAttribute('aria-hidden', 'true');
    text.textContent = img.alt || t('image.unavailable', 'Image unavailable');
    fallback.appendChild(text);
    img.insertAdjacentElement('afterend', fallback);
    root.dispatchEvent(new CustomEvent('bootcn:image:error', { bubbles: true }));
  }

  function setup(root) {
    const img = root.querySelector('img');
    if (!img || root.hasAttribute('data-bootcn-image-ready')) return;
    root.setAttribute('data-bootcn-image-ready', '');
    if (img.complete) {
      if (img.naturalWidth === 0 && img.getAttribute('src')) fail(root, img);
      return;
    }
    root.classList.add('is-loading');
    img.addEventListener(
      'load',
      function () {
        root.classList.remove('is-loading');
      },
      { once: true },
    );
    img.addEventListener(
      'error',
      function () {
        fail(root, img);
      },
      { once: true },
    );
  }

  function init() {
    document.querySelectorAll(ROOT).forEach(setup);
  }

  ns.image = { init: init, destroy: function () {}, setup: setup };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
