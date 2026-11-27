(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.share) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-share]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  // Where each service takes a link to share (no scripts or trackers from
  // them: plain links that open in a new tab).
  const TARGETS = {
    x: (u, title) => 'https://x.com/intent/post?url=' + u + '&text=' + title,
    linkedin: (u) => 'https://www.linkedin.com/sharing/share-offsite/?url=' + u,
    facebook: (u) => 'https://www.facebook.com/sharer/sharer.php?u=' + u,
    whatsapp: (u, title) => 'https://wa.me/?text=' + title + '%20' + u,
    reddit: (u, title) => 'https://www.reddit.com/submit?url=' + u + '&title=' + title,
    email: (u, title, text) =>
      'mailto:?subject=' + title + '&body=' + (text ? text + '%0A%0A' : '') + u,
  };

  function details(root) {
    return {
      url: root.getAttribute('data-url') || window.location.href,
      title: root.getAttribute('data-title') || document.title,
      text: root.getAttribute('data-text') || '',
    };
  }

  function setup(root) {
    const d = details(root);
    const u = encodeURIComponent(d.url);
    const title = encodeURIComponent(d.title);
    const text = encodeURIComponent(d.text);
    root.querySelectorAll('[data-bootcn-share-to]').forEach(function (link) {
      const make = TARGETS[link.getAttribute('data-bootcn-share-to')];
      if (make) link.href = make(u, title, text);
    });
    const field = root.querySelector('[data-bootcn-share-link]');
    if (field) field.value = d.url;
    // The system share sheet, where there is one (phones, some desktops).
    const native = root.querySelector('[data-bootcn-share-native]');
    if (native)
      native.hidden = !(navigator.share && (!navigator.canShare || navigator.canShare(d)));
  }

  function announce(root, text) {
    const live = root.querySelector('[data-bootcn-share-live]');
    if (live) live.textContent = text;
  }

  function onClick(event) {
    const target = event.target.closest && event.target.closest('button, a');
    const root = target && target.closest(ROOT);
    if (!root) return;
    const d = details(root);
    if (target.hasAttribute('data-bootcn-share-copy')) {
      const label = target.querySelector('[data-bootcn-share-copy-label]') || target;
      const done = function () {
        label.textContent = t('share.copied', 'Copied');
        announce(root, t('share.copiedLong', 'Link copied to the clipboard.'));
        setTimeout(() => (label.textContent = t('share.copy', 'Copy')), 2000);
        root.dispatchEvent(
          new CustomEvent('bootcn:share', {
            bubbles: true,
            detail: { target: 'copy', url: d.url },
          }),
        );
      };
      const field = root.querySelector('[data-bootcn-share-link]');
      if (navigator.clipboard)
        navigator.clipboard.writeText(d.url).then(done, () => field && field.select());
      else if (field) field.select();
    } else if (target.hasAttribute('data-bootcn-share-native')) {
      navigator
        .share(d)
        .then(() =>
          root.dispatchEvent(
            new CustomEvent('bootcn:share', {
              bubbles: true,
              detail: { target: 'native', url: d.url },
            }),
          ),
        )
        .catch(() => {});
    } else if (target.hasAttribute('data-bootcn-share-to')) {
      root.dispatchEvent(
        new CustomEvent('bootcn:share', {
          bubbles: true,
          detail: { target: target.getAttribute('data-bootcn-share-to'), url: d.url },
        }),
      );
    }
  }

  // Clicking the link field selects all of it, for a manual copy.
  function onFocus(event) {
    if (event.target.matches && event.target.matches('[data-bootcn-share-link]'))
      event.target.select();
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('focusin', onFocus);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('focusin', onFocus);
    listening = false;
  }

  ns.share = { init: init, destroy: destroy, setup: setup, targets: TARGETS };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
