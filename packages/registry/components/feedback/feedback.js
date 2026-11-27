(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.feedback) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-feedback]';
  const INLINE = '[data-bootcn-feedback-inline]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  // Send to data-feedback-url as JSON, unless a listener cancelled the event.
  function send(root, detail) {
    const event = new CustomEvent('bootcn:feedback:submit', {
      bubbles: true,
      cancelable: true,
      detail,
    });
    if (!root.dispatchEvent(event)) return Promise.resolve(false);
    const url = root.getAttribute('data-feedback-url');
    if (!url) return Promise.resolve(true);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(detail),
    })
      .then((r) => r.ok)
      .catch(() => false);
  }

  // ------------------------------------------------------------ widget

  function panel(root) {
    return root.querySelector('.bootcn-feedback__panel');
  }

  function open(root) {
    const p = panel(root);
    if (!p.hidden) return;
    p.hidden = false;
    root.querySelector('.bootcn-feedback__toggle').setAttribute('aria-expanded', 'true');
    reset(root);
    const first = p.querySelector('input[name="rating"]');
    if (first) first.focus();
    root.dispatchEvent(new CustomEvent('bootcn:feedback:open', { bubbles: true }));
  }

  function close(root, focus) {
    const p = panel(root);
    if (p.hidden) return;
    p.hidden = true;
    const toggle = root.querySelector('.bootcn-feedback__toggle');
    toggle.setAttribute('aria-expanded', 'false');
    if (focus) toggle.focus();
  }

  function reset(root) {
    const form = root.querySelector('[data-feedback-form]');
    const thanks = root.querySelector('[data-feedback-thanks]');
    if (!thanks.hidden) {
      form.reset();
      form.hidden = false;
      thanks.hidden = true;
      root.querySelector('[data-feedback-email]').hidden = true;
      root.querySelector('[data-feedback-picked]').textContent = '';
    }
  }

  function submitWidget(form) {
    const root = form.closest(ROOT);
    const rating = form.querySelector('input[name="rating"]:checked');
    const error = form.querySelector('[data-feedback-error]');
    const scale = form.querySelector('.bootcn-feedback__scale');
    if (!rating) {
      error.hidden = false;
      scale.setAttribute('aria-invalid', 'true');
      form.querySelector('input[name="rating"]').focus();
      return;
    }
    const contact = form.querySelector('[data-feedback-contact]').checked;
    const detail = {
      rating: Number(rating.value),
      label: rating.dataset.label,
      comment: form.querySelector('[name="comment"]').value.trim(),
      email: contact ? form.querySelector('[name="email"]').value.trim() : '',
      page: location.href,
    };
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    send(root, detail).then((sent) => {
      button.disabled = false;
      if (!sent) return;
      form.hidden = true;
      const thanks = root.querySelector('[data-feedback-thanks]');
      thanks.hidden = false;
      thanks.focus();
    });
  }

  // ------------------------------------------------------------ inline

  function answer(button) {
    const root = button.closest(INLINE);
    root
      .querySelectorAll('[data-feedback-answer]')
      .forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
    root.dataset.answer = button.dataset.feedbackAnswer;
    const more = root.querySelector('[data-feedback-more]');
    const label = root.querySelector('[data-feedback-more-label]');
    if (label)
      label.textContent =
        button.dataset.feedbackAnswer === 'yes'
          ? t('feedback.moreYes', 'What did you find useful?')
          : t('feedback.moreNo', 'What could we do better?');
    more.hidden = false;
    more.querySelector('textarea').focus();
  }

  function finishInline(root, comment) {
    send(root, { helpful: root.dataset.answer === 'yes', comment, page: location.href }).then(
      (sent) => {
        if (!sent) return;
        root.querySelector('.bootcn-feedback-inline__ask').hidden = true;
        root.querySelector('[data-feedback-more]').hidden = true;
        const thanks = root.querySelector('[data-feedback-thanks]');
        thanks.hidden = false;
        thanks.focus();
      },
    );
  }

  // ------------------------------------------------------------ events

  function onClick(event) {
    const inline = event.target.closest(INLINE);
    if (inline) {
      const ans = event.target.closest('[data-feedback-answer]');
      if (ans) return answer(ans);
      if (event.target.closest('[data-feedback-skip]')) return finishInline(inline, '');
      return;
    }
    document.querySelectorAll(ROOT).forEach((root) => {
      if (!root.contains(event.target) && !panel(root).hidden) close(root, false);
    });
    const root = event.target.closest(ROOT);
    if (!root) return;
    if (event.target.closest('.bootcn-feedback__toggle')) {
      if (panel(root).hidden) open(root);
      else close(root, true);
    } else if (event.target.closest('[data-feedback-close]')) {
      close(root, true);
    }
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    if (event.target.name === 'rating') {
      root.querySelector('[data-feedback-picked]').textContent = event.target.dataset.label;
      root.querySelector('[data-feedback-error]').hidden = true;
      root.querySelector('.bootcn-feedback__scale').removeAttribute('aria-invalid');
    }
    if (event.target.matches('[data-feedback-contact]')) {
      const box = root.querySelector('[data-feedback-email]');
      box.hidden = !event.target.checked;
      if (event.target.checked) box.querySelector('input').focus();
    }
  }

  function onSubmit(event) {
    const form = event.target;
    if (form.matches('[data-feedback-form]')) {
      event.preventDefault();
      submitWidget(form);
    } else if (form.matches('[data-feedback-more]')) {
      event.preventDefault();
      finishInline(form.closest(INLINE), form.querySelector('textarea').value.trim());
    }
  }

  function onKeydown(event) {
    if (event.key !== 'Escape') return;
    const root = event.target.closest && event.target.closest(ROOT);
    if (root && !panel(root).hidden) {
      event.preventDefault();
      close(root, true);
    }
  }

  function init() {
    if (listening) return;
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKeydown);
    listening = true;
  }

  function destroy() {
    document.removeEventListener('click', onClick);
    document.removeEventListener('change', onChange);
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  ns.feedback = { init, destroy, open, close };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
