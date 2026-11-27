(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.blog) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-blog]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function count(n) {
    const text = n === 1 ? t('blog.post', '{count} post') : t('blog.posts', '{count} posts');
    return text.replace('{count}', String(n));
  }

  // Show the posts of one topic ("all" shows every post).
  function filter(root, topic) {
    root.querySelectorAll('[data-blog-filter]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.blogFilter === topic));
    });
    let shown = 0;
    root.querySelectorAll('.bootcn-blog__post').forEach((post) => {
      const match = topic === 'all' || post.dataset.category === topic;
      post.hidden = !match;
      if (match) shown += 1;
    });
    const empty = root.querySelector('[data-blog-empty]');
    if (empty) empty.hidden = shown > 0;
    const status = root.querySelector('[data-blog-status]');
    if (status) status.textContent = count(shown);
    root.dispatchEvent(
      new CustomEvent('bootcn:blog:filter', { bubbles: true, detail: { topic, shown } }),
    );
    return shown;
  }

  function onClick(event) {
    const button = event.target.closest('[data-blog-filter]');
    const root = button && button.closest(ROOT);
    if (root) filter(root, button.dataset.blogFilter);
  }

  function init() {
    if (listening) return;
    document.addEventListener('click', onClick);
    listening = true;
  }

  function destroy() {
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.blog = { init, destroy, filter };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
