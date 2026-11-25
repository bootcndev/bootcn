(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.toast) return; // already loaded: idempotent

  const POSITIONS = [
    'top-left',
    'top-center',
    'top-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ];
  const ICONS = {
    success: '<path d="M20 6 9 17l-5-5"/>',
    error: '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
    warning: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
  };
  const VISIBLE = 3;
  const toasts = new Map(); // id -> { el, toaster, options, remaining, started, timer }
  let counter = 0;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function svg(paths) {
    return (
      '<svg class="bootcn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      paths +
      '</svg>'
    );
  }

  // One toaster per position, made on first use, with two live regions:
  // polite for most toasts, assertive for errors.
  function toasterFor(position) {
    const where = POSITIONS.includes(position) ? position : 'bottom-right';
    let toaster = document.querySelector('.bootcn-toaster[data-position="' + where + '"]');
    if (toaster) return toaster;
    toaster = document.createElement('section');
    toaster.className = 'bootcn-toaster';
    toaster.setAttribute('data-position', where);
    toaster.setAttribute('aria-label', t('toast.region', 'Notifications'));
    toaster.setAttribute('tabindex', '-1');
    const list = document.createElement('ol');
    list.className = 'bootcn-toaster__list';
    list.style.cssText = 'margin:0;padding:0;list-style:none;';
    toaster.appendChild(list);
    ['polite', 'assertive'].forEach(function (mode) {
      const live = document.createElement('div');
      live.className = 'visually-hidden';
      live.setAttribute('aria-live', mode);
      live.setAttribute('data-live', mode);
      toaster.appendChild(live);
    });
    toaster.addEventListener('pointerenter', function () {
      pause(toaster, true);
    });
    toaster.addEventListener('pointerleave', function () {
      if (!toaster.contains(document.activeElement)) pause(toaster, false);
    });
    toaster.addEventListener('focusin', function () {
      pause(toaster, true);
    });
    toaster.addEventListener('focusout', function (event) {
      if (!toaster.contains(event.relatedTarget)) pause(toaster, false);
    });
    document.body.appendChild(toaster);
    return toaster;
  }

  function announce(toaster, text, assertive) {
    const live = toaster.querySelector(
      '[data-live="' + (assertive ? 'assertive' : 'polite') + '"]',
    );
    if (!live) return;
    live.textContent = '';
    setTimeout(function () {
      live.textContent = text;
    }, 100);
  }

  // Collapsed: front toast flat, two behind it smaller; expanded: stacked
  // with their real heights.
  function layout(toaster) {
    const items = Array.from(
      toaster.querySelectorAll('.bootcn-toaster__toast:not(.is-leaving)'),
    ).reverse();
    const expanded = toaster.classList.contains('is-expanded');
    const gap =
      parseFloat(getComputedStyle(toaster).getPropertyValue('--bootcn-toaster-gap')) * 16 || 12;
    let offset = 0;
    const frontHeight = items[0] ? items[0].offsetHeight : 0;
    items.forEach(function (el, i) {
      el.classList.toggle('is-hidden', i >= VISIBLE);
      el.style.zIndex = String(100 - i);
      if (expanded) {
        el.style.setProperty('--bootcn-toast-y', offset + 'px');
        el.style.setProperty('--bootcn-toast-scale', '1');
        offset += el.offsetHeight + gap;
      } else {
        // Older toasts peek out above the front one, whatever their height.
        const step = Math.min(i, VISIBLE - 1);
        const lift = Math.max(0, frontHeight - el.offsetHeight) + step * 12;
        el.style.setProperty('--bootcn-toast-y', (step ? lift : 0) + 'px');
        el.style.setProperty('--bootcn-toast-scale', String(1 - step * 0.05));
      }
    });
    const front = items[0];
    toaster.style.height = expanded ? offset + 'px' : front ? front.offsetHeight + 20 + 'px' : '0';
  }

  function pause(toaster, paused) {
    toaster.classList.toggle('is-paused', paused);
    toaster.classList.toggle('is-expanded', paused);
    toasts.forEach(function (item) {
      if (item.toaster !== toaster || !item.timer) return;
      if (paused) {
        clearTimeout(item.timer);
        item.timer = 'paused';
        item.remaining -= Date.now() - item.started;
      }
    });
    if (!paused) {
      toasts.forEach(function (item, id) {
        if (item.toaster === toaster && item.timer === 'paused') schedule(id);
      });
    }
    layout(toaster);
  }

  function schedule(id) {
    const item = toasts.get(id);
    if (!item || item.remaining === Infinity) return;
    item.started = Date.now();
    item.timer = setTimeout(
      function () {
        dismiss(id);
      },
      Math.max(0, item.remaining),
    );
  }

  function render(item) {
    const o = item.options;
    const el = item.el;
    el.setAttribute('data-type', o.type || 'default');
    el.replaceChildren();
    if (o.type === 'loading' || (o.type && ICONS[o.type])) {
      const icon = document.createElement('span');
      icon.className = 'bootcn-toaster__icon';
      if (o.type === 'loading') {
        const spinner = document.createElement('span');
        spinner.className = 'bootcn-toaster__spinner';
        icon.appendChild(spinner);
      } else {
        icon.innerHTML = svg(ICONS[o.type]);
      }
      el.appendChild(icon);
    }
    const body = document.createElement('div');
    body.className = 'bootcn-toaster__body';
    const title = document.createElement('p');
    title.className = 'bootcn-toaster__title';
    title.textContent = o.message;
    body.appendChild(title);
    if (o.description) {
      const description = document.createElement('p');
      description.className = 'bootcn-toaster__description';
      description.textContent = o.description;
      body.appendChild(description);
    }
    el.appendChild(body);
    const actions = document.createElement('div');
    actions.className = 'bootcn-toaster__actions';
    if (o.action && o.action.label) {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'bootcn-toaster__action';
      action.textContent = o.action.label;
      action.addEventListener('click', function () {
        if (typeof o.action.onClick === 'function') o.action.onClick();
        dismiss(item.id);
      });
      actions.appendChild(action);
    }
    if (o.dismissible !== false) {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'bootcn-toaster__close';
      close.setAttribute('aria-label', t('toast.close', 'Close notification'));
      close.innerHTML = svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>');
      close.addEventListener('click', function () {
        dismiss(item.id);
      });
      actions.appendChild(close);
    }
    el.appendChild(actions);
    if (item.remaining !== Infinity) {
      const timer = document.createElement('span');
      timer.className = 'bootcn-toaster__timer';
      timer.setAttribute('aria-hidden', 'true');
      el.style.setProperty('--bootcn-toast-duration', item.remaining + 'ms');
      el.appendChild(timer);
    }
  }

  function swipe(item) {
    const el = item.el;
    let start = null;
    el.addEventListener('pointerdown', function (event) {
      if (event.target.closest('button')) return;
      start = event.clientX;
      el.setPointerCapture(event.pointerId);
    });
    el.addEventListener('pointermove', function (event) {
      if (start === null) return;
      const dx = event.clientX - start;
      el.classList.add('is-swiping');
      el.style.translate = dx + 'px 0';
      el.style.opacity = String(Math.max(0, 1 - Math.abs(dx) / 200));
    });
    function end(event) {
      if (start === null) return;
      const dx = event.clientX - start;
      start = null;
      el.classList.remove('is-swiping');
      if (Math.abs(dx) > 80) {
        dismiss(item.id);
      } else {
        el.style.translate = '';
        el.style.opacity = '';
      }
    }
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  function show(message, options) {
    const o = Object.assign(
      { type: 'default', duration: 4000, position: 'bottom-right' },
      options || {},
      {
        message: String(message),
      },
    );
    const id = o.id || 'bootcn-toast-' + (counter += 1);
    if (toasts.has(id)) return update(id, o);
    const toaster = toasterFor(o.position);
    const el = document.createElement('li');
    el.className = 'bootcn-toaster__toast is-entering';
    el.id = id;
    const item = {
      id: id,
      el: el,
      toaster: toaster,
      options: o,
      remaining: o.type === 'loading' || o.duration === Infinity ? Infinity : o.duration,
    };
    toasts.set(id, item);
    render(item);
    swipe(item);
    el.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') dismiss(id);
    });
    toaster.querySelector('.bootcn-toaster__list').appendChild(el);
    layout(toaster);
    requestAnimationFrame(function () {
      el.classList.remove('is-entering');
    });
    announce(toaster, o.message + (o.description ? '. ' + o.description : ''), o.type === 'error');
    if (!toaster.classList.contains('is-paused')) schedule(id);
    else item.timer = 'paused';
    document.dispatchEvent(
      new CustomEvent('bootcn:toast:show', { detail: { id: id, type: o.type } }),
    );
    return id;
  }

  function update(id, options) {
    const item = toasts.get(id);
    if (!item) return show(options.message || '', Object.assign({}, options, { id: id }));
    clearTimeout(item.timer);
    item.options = Object.assign({}, item.options, options);
    item.remaining = item.options.type === 'loading' ? Infinity : item.options.duration || 4000;
    render(item);
    layout(item.toaster);
    announce(item.toaster, item.options.message, item.options.type === 'error');
    if (!item.toaster.classList.contains('is-paused')) schedule(id);
    else item.timer = 'paused';
    return id;
  }

  function dismiss(id) {
    if (id === undefined) {
      Array.from(toasts.keys()).forEach(dismiss);
      return;
    }
    const item = toasts.get(id);
    if (!item) return;
    clearTimeout(item.timer);
    toasts.delete(id);
    const hadFocus = item.el.contains(document.activeElement);
    item.el.classList.add('is-leaving');
    const toaster = item.toaster;
    layout(toaster);
    const remove = function () {
      item.el.remove();
      layout(toaster);
      if (hadFocus) {
        const next = toaster.querySelector('.bootcn-toaster__toast:not(.is-leaving) button');
        (next || toaster).focus();
      }
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) remove();
    else setTimeout(remove, 300);
    document.dispatchEvent(new CustomEvent('bootcn:toast:dismiss', { detail: { id: id } }));
  }

  function promise(value, messages, options) {
    const id = show(
      messages.loading || t('toast.loading', 'Loading…'),
      Object.assign({}, options, { type: 'loading' }),
    );
    return Promise.resolve(value).then(
      function (result) {
        const text =
          typeof messages.success === 'function' ? messages.success(result) : messages.success;
        update(id, { type: 'success', message: text || t('toast.done', 'Done.') });
        return result;
      },
      function (error) {
        const text = typeof messages.error === 'function' ? messages.error(error) : messages.error;
        update(id, { type: 'error', message: text || t('toast.failed', 'Something went wrong.') });
        throw error;
      },
    );
  }

  const toast = function (message, options) {
    return show(message, options);
  };
  ['success', 'error', 'warning', 'info', 'loading'].forEach(function (type) {
    toast[type] = function (message, options) {
      return show(message, Object.assign({}, options, { type: type }));
    };
  });
  toast.update = update;
  toast.dismiss = dismiss;
  toast.promise = promise;

  // Declarative triggers: data-bootcn-toast="Message" with data-type,
  // data-description, data-action and data-position.
  function onClick(event) {
    const trigger = event.target.closest && event.target.closest('[data-bootcn-toast]');
    if (trigger) {
      const action = trigger.getAttribute('data-action');
      toast(trigger.getAttribute('data-bootcn-toast'), {
        type: trigger.getAttribute('data-type') || 'default',
        description: trigger.getAttribute('data-description') || undefined,
        position: trigger.getAttribute('data-position') || undefined,
        action: action ? { label: action } : undefined,
      });
      return;
    }
    const demo = event.target.closest && event.target.closest('[data-bootcn-toast-demo="promise"]');
    if (demo) {
      promise(
        new Promise(function (resolve) {
          setTimeout(resolve, 1500);
        }),
        {
          loading: 'Saving your changes…',
          success: 'All changes saved.',
          error: 'Could not save.',
        },
      );
    }
  }

  // Alt + T moves focus to the newest notification.
  function onKeydown(event) {
    if (!(event.altKey && (event.key === 't' || event.key === 'T' || event.code === 'KeyT')))
      return;
    const button = document.querySelector('.bootcn-toaster__toast:not(.is-leaving) button');
    if (button) {
      event.preventDefault();
      button.focus();
    }
  }

  let listening = false;
  function init() {
    if (listening) return;
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKeydown);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  toast.init = init;
  toast.destroy = destroy;
  ns.toast = toast;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
