(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.article) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-article]';
  const ready = new WeakSet();
  let listening = false;
  let frame = 0;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  // Share links point at this page and its title.
  function shareLinks(root) {
    const url = location.href.split('#')[0];
    const title = (root.querySelector('.bootcn-article__title') || document).textContent.trim();
    root.querySelectorAll('[data-article-share]').forEach((link) => {
      const target = new URL(link.href);
      if (link.dataset.articleShare === 'x') {
        target.searchParams.set('url', url);
        target.searchParams.set('text', title);
      } else {
        target.searchParams.set('url', url);
      }
      link.href = target.toString();
    });
  }

  // "On this page": the last heading in the top third of the window is current.
  function spy(root) {
    const links = [...root.querySelectorAll('.bootcn-article__toc a[href^="#"]')];
    if (!links.length) return;
    const line = window.innerHeight / 3;
    let current = null;
    links.forEach((link) => {
      const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (heading && (!current || heading.getBoundingClientRect().top <= line)) current = link;
    });
    links.forEach((link) => {
      if (link === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  // Reading progress: how much of the article has scrolled past.
  function progress() {
    frame = 0;
    document.querySelectorAll(ROOT).forEach((root) => {
      spy(root);
      const bar = document.querySelector('[data-article-progress]');
      if (!bar) return;
      const rect = root.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const done = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      bar.style.setProperty('--bootcn-article-progress', done.toFixed(3));
    });
  }

  function onScroll() {
    if (!frame) frame = requestAnimationFrame(progress);
  }

  async function copy(button) {
    const root = button.closest(ROOT);
    const status = root.querySelector('[data-article-status]');
    const label = button.querySelector('[data-article-copy-label]');
    let text;
    try {
      await navigator.clipboard.writeText(location.href.split('#')[0]);
      text = t('article.copied', 'Link copied');
    } catch {
      text = t('article.copyFailed', 'Could not copy the link');
    }
    if (status) status.textContent = text;
    if (label) {
      label.textContent = text;
      setTimeout(() => (label.textContent = t('article.copy', 'Copy link')), 2000);
    }
  }

  function onClick(event) {
    const button = event.target.closest('[data-article-copy]');
    if (button && button.closest(ROOT)) copy(button);
  }

  function setup(root) {
    if (ready.has(root)) return;
    ready.add(root);
    shareLinks(root);
    spy(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
    progress();
  }

  function destroy() {
    document.removeEventListener('click', onClick);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    listening = false;
  }

  ns.article = { init, destroy, setup };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
