(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.reviews) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-reviews]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function fill(text, values) {
    return text.replace(/\{(\w+)\}/g, (all, key) => (key in values ? values[key] : all));
  }

  function items(root) {
    return [...root.querySelectorAll('[data-reviews-list] > .bootcn-reviews__item')];
  }

  function announce(root, text) {
    const status = root.querySelector('[data-reviews-status]');
    if (!status) return;
    status.textContent = '';
    setTimeout(() => (status.textContent = text), 50);
  }

  function showing(root) {
    const n = items(root).filter((item) => !item.hidden).length;
    const el = root.querySelector('[data-reviews-showing]');
    if (el)
      el.textContent = fill(
        n === 1
          ? t('reviews.showingOne', 'Showing 1 review')
          : t('reviews.showing', 'Showing {count} reviews'),
        { count: n },
      );
    const empty = root.querySelector('[data-reviews-empty]');
    if (empty) empty.hidden = n > 0;
  }

  // ------------------------------------------------------ filter and sort

  function filter(root, stars) {
    root.querySelectorAll('[data-reviews-filter]').forEach((bar) => {
      bar.setAttribute('aria-pressed', String(bar.dataset.reviewsFilter === String(stars)));
    });
    items(root).forEach((item) => {
      item.hidden = Boolean(stars) && item.dataset.rating !== String(stars);
    });
    showing(root);
    root.dispatchEvent(
      new CustomEvent('bootcn:reviews:filter', {
        bubbles: true,
        detail: { rating: stars || null },
      }),
    );
  }

  const ORDER = {
    recent: (a, b) => b.dataset.date.localeCompare(a.dataset.date),
    helpful: (a, b) => Number(b.dataset.helpful) - Number(a.dataset.helpful),
    high: (a, b) => Number(b.dataset.rating) - Number(a.dataset.rating) || ORDER.recent(a, b),
    low: (a, b) => Number(a.dataset.rating) - Number(b.dataset.rating) || ORDER.recent(a, b),
  };

  function sort(root, by) {
    const list = root.querySelector('[data-reviews-list]');
    items(root)
      .sort(ORDER[by] || ORDER.recent)
      .forEach((item) => list.append(item));
    const select = root.querySelector('[data-reviews-sort]');
    if (select && select.value !== by) select.value = by;
  }

  // ---------------------------------------------------------------- votes

  function vote(button) {
    const group = button.closest('.bootcn-reviews__votes');
    const item = button.closest('.bootcn-reviews__item');
    const pressed = button.getAttribute('aria-pressed') === 'true';
    group.querySelectorAll('[data-reviews-vote]').forEach((other) => {
      const was = other.getAttribute('aria-pressed') === 'true';
      const now = other === button ? !pressed : false;
      if (was === now) return;
      other.setAttribute('aria-pressed', String(now));
      const count = other.querySelector('[data-reviews-votes]');
      count.textContent = String(Number(count.textContent) + (now ? 1 : -1));
      if (other.dataset.reviewsVote === 'up' && item) item.dataset.helpful = count.textContent;
    });
    button.dispatchEvent(
      new CustomEvent('bootcn:reviews:vote', {
        bubbles: true,
        detail: { item, vote: pressed ? null : button.dataset.reviewsVote },
      }),
    );
  }

  // -------------------------------------------------------------- summary

  function summary(root) {
    const counts = {};
    let total = 0;
    let sum = 0;
    root.querySelectorAll('[data-reviews-filter]').forEach((bar) => {
      const n = Number(bar.querySelector('[data-reviews-count]').textContent);
      counts[bar.dataset.reviewsFilter] = n;
      total += n;
      sum += n * Number(bar.dataset.reviewsFilter);
    });
    const average = total ? sum / total : 0;
    root.querySelectorAll('[data-reviews-filter]').forEach((bar) => {
      const share = total ? Math.round((counts[bar.dataset.reviewsFilter] / total) * 100) : 0;
      bar
        .querySelector('.bootcn-reviews__track span')
        .style.setProperty('--bootcn-reviews-share', share + '%');
    });
    const avg = root.querySelector('[data-reviews-average]');
    if (avg) avg.textContent = average.toFixed(1);
    const stars = root.querySelector('[data-reviews-stars]');
    if (stars) {
      stars.setAttribute(
        'aria-label',
        fill(t('reviews.rated', 'Rated {value} out of 5'), { value: average.toFixed(1) }),
      );
      stars
        .querySelector('.bootcn-rating__stars')
        .style.setProperty('--bootcn-rating-value', Math.round((average / 5) * 100) + '%');
    }
    const totalEl = root.querySelector('[data-reviews-total]');
    if (totalEl) totalEl.textContent = String(total);
  }

  // ------------------------------------------------------------ the form

  function openForm(root) {
    const dialog = root.querySelector('[data-reviews-dialog]');
    if (!dialog || dialog.open) return;
    dialog.showModal();
    const first = dialog.querySelector('input[name="rating"]');
    if (first) first.focus();
  }

  function setError(form, name, show) {
    const error = form.querySelector('[data-reviews-error="' + name + '"]');
    if (error) error.hidden = !show;
    const field =
      name === 'rating'
        ? form.querySelector('fieldset')
        : form.querySelector('[name="' + name + '"]');
    if (field) {
      if (show) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
    }
    return show;
  }

  function validate(form) {
    const rating = form.querySelector('input[name="rating"]:checked');
    const text = form.querySelector('[name="text"]').value.trim();
    const name = form.querySelector('[name="name"]').value.trim();
    const bad = [];
    if (setError(form, 'rating', !rating)) bad.push(form.querySelector('input[name="rating"]'));
    if (setError(form, 'text', text.length < 20)) bad.push(form.querySelector('[name="text"]'));
    if (setError(form, 'name', !name)) bad.push(form.querySelector('[name="name"]'));
    if (bad.length) {
      bad[0].focus();
      return null;
    }
    return {
      rating: Number(rating.value),
      title: form.querySelector('[name="title"]').value.trim(),
      text,
      name,
    };
  }

  function add(root, review) {
    const template = root.querySelector('template[data-reviews-template]');
    if (!template) return null;
    const item = template.content.querySelector('.bootcn-reviews__item').cloneNode(true);
    const id = 'bootcn-reviews-new-' + Date.now();
    const today = new Date().toISOString().slice(0, 10);
    item.dataset.rating = String(review.rating);
    item.dataset.date = today;
    item.dataset.helpful = '0';
    item.classList.add('is-new');
    item.querySelector('article').setAttribute('aria-labelledby', id);
    const heading = item.querySelector('.bootcn-reviews__review-title');
    heading.id = id;
    heading.textContent = review.title || review.text.split(/[.!?]/)[0].slice(0, 60);
    heading.setAttribute('tabindex', '-1');
    item.querySelector('.bootcn-reviews__name').textContent = review.name;
    item.querySelector('.bootcn-avatar__fallback').textContent = review.name
      .split(/\s+/)
      .map((w) => w[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
    item.querySelector('.bootcn-reviews__text').textContent = review.text;
    const time = item.querySelector('time');
    time.setAttribute('datetime', today);
    time.textContent = t('reviews.justNow', 'Just now');
    const stars = item.querySelector('.bootcn-rating');
    stars.setAttribute(
      'aria-label',
      fill(t('reviews.rated', 'Rated {value} out of 5'), { value: review.rating }),
    );
    stars
      .querySelector('.bootcn-rating__stars')
      .style.setProperty('--bootcn-rating-value', review.rating * 20 + '%');
    const verified = item.querySelector('.bootcn-reviews__verified');
    if (verified) verified.remove();
    root.querySelector('[data-reviews-list]').prepend(item);
    const bar = root.querySelector(
      '[data-reviews-filter="' + review.rating + '"] [data-reviews-count]',
    );
    if (bar) bar.textContent = String(Number(bar.textContent) + 1);
    summary(root);
    filter(root, null);
    sort(root, 'recent');
    return item;
  }

  function submit(form) {
    const root = form.closest(ROOT);
    const review = validate(form);
    if (!review) return;
    if (
      !root.dispatchEvent(
        new CustomEvent('bootcn:reviews:submit', {
          bubbles: true,
          cancelable: true,
          detail: review,
        }),
      )
    )
      return;
    const item = add(root, review);
    form.reset();
    updateCounter(form);
    form.closest('dialog').close();
    announce(root, t('reviews.thanks', 'Thanks, your review was added.'));
    if (item) item.querySelector('.bootcn-reviews__review-title').focus();
  }

  function updateCounter(form) {
    const counter = form.querySelector('[data-reviews-counter]');
    if (counter) counter.textContent = String(form.querySelector('[name="text"]').value.length);
  }

  // -------------------------------------------------------------- events

  function onClick(event) {
    const root = event.target.closest(ROOT);
    if (!root) return;
    const bar = event.target.closest('[data-reviews-filter]');
    if (bar) {
      const pressed = bar.getAttribute('aria-pressed') === 'true';
      return filter(root, pressed ? null : bar.dataset.reviewsFilter);
    }
    const button = event.target.closest('[data-reviews-vote]');
    if (button) return vote(button);
    if (event.target.closest('[data-reviews-write]')) return openForm(root);
    if (event.target.closest('[data-reviews-cancel]'))
      return event.target.closest('dialog').close();
    // A click on the backdrop lands on the dialog itself.
    if (event.target.matches('[data-reviews-dialog]')) event.target.close();
  }

  function onChange(event) {
    const select = event.target.closest && event.target.closest('[data-reviews-sort]');
    if (select) sort(select.closest(ROOT), select.value);
    const form = event.target.closest && event.target.closest('[data-reviews-form]');
    if (form && event.target.name === 'rating') setError(form, 'rating', false);
  }

  function onInput(event) {
    const form = event.target.closest && event.target.closest('[data-reviews-form]');
    if (!form) return;
    if (event.target.name === 'text') {
      updateCounter(form);
      if (event.target.value.trim().length >= 20) setError(form, 'text', false);
    }
    if (event.target.name === 'name' && event.target.value.trim()) setError(form, 'name', false);
  }

  function onSubmit(event) {
    const form = event.target.closest && event.target.closest('[data-reviews-form]');
    if (!form) return;
    event.preventDefault();
    submit(form);
  }

  function onClose(event) {
    const dialog = event.target;
    if (!dialog.matches || !dialog.matches('[data-reviews-dialog]')) return;
    const root = dialog.closest(ROOT);
    const opener = root && root.querySelector('[data-reviews-write]');
    if (opener && !root.contains(document.activeElement)) opener.focus();
    else if (opener && dialog.contains(document.activeElement)) opener.focus();
  }

  function init() {
    if (listening) return;
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('close', onClose, true);
    listening = true;
  }

  function destroy() {
    document.removeEventListener('click', onClick);
    document.removeEventListener('change', onChange);
    document.removeEventListener('input', onInput);
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('close', onClose, true);
    listening = false;
  }

  ns.reviews = { init, destroy, filter, sort, add, open: openForm };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
