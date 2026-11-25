(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.stepper) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-stepper]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function parts(root) {
    const own = function (selector) {
      return Array.from(root.querySelectorAll(selector)).filter(function (node) {
        return node.closest(ROOT) === root;
      });
    };
    return {
      items: own('[data-bootcn-stepper-item]'),
      panels: own('[data-bootcn-stepper-panel]'),
      next: own('[data-bootcn-stepper-next]')[0],
      prev: own('[data-bootcn-stepper-prev]')[0],
      live: own('[data-bootcn-stepper-live]')[0],
      complete: own('[data-bootcn-stepper-complete]')[0],
    };
  }

  function current(root) {
    return Number(root.getAttribute('data-step') || 0);
  }

  function render(root, index, focus) {
    const p = parts(root);
    root.setAttribute('data-step', String(index));
    p.items.forEach(function (item, i) {
      item.classList.toggle('is-complete', i < index);
      item.classList.toggle('is-current', i === index);
      if (i === index) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      const state = item.querySelector('[data-bootcn-stepper-state]');
      if (state) {
        state.textContent =
          i < index
            ? t('stepper.complete', 'Completed')
            : i === index
              ? t('stepper.current', 'Current')
              : '';
      }
    });
    p.panels.forEach(function (panel, i) {
      panel.hidden = i !== index;
    });
    const last = index === p.panels.length - 1;
    if (p.prev) p.prev.hidden = index === 0;
    if (p.next) {
      const label = p.next.querySelector('[data-bootcn-stepper-next-label]') || p.next;
      label.textContent = last
        ? p.next.getAttribute('data-finish-label') || t('stepper.finish', 'Finish')
        : p.next.getAttribute('data-next-label') || t('stepper.next', 'Continue');
    }
    if (focus) {
      const panel = p.panels[index];
      const heading = panel && panel.querySelector('[data-bootcn-stepper-heading]');
      const target = heading || panel;
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus();
      }
      const title = p.items[index] && p.items[index].querySelector('.bootcn-stepper__title');
      if (p.live) {
        p.live.textContent = t('stepper.position', 'Step {n} of {total}')
          .replace('{n}', String(index + 1))
          .replace('{total}', String(p.items.length || p.panels.length))
          .concat(title ? ': ' + title.textContent.trim() : '');
      }
    }
  }

  // The fields of the current step must be valid before moving on.
  function validate(panel) {
    if (!panel) return true;
    let first = null;
    panel.querySelectorAll('input, select, textarea').forEach(function (field) {
      if (!field.willValidate) return;
      if (field.checkValidity()) field.removeAttribute('aria-invalid');
      else {
        field.setAttribute('aria-invalid', 'true');
        if (!first) first = field;
      }
    });
    if (first) first.focus();
    return !first;
  }

  function go(root, index, options) {
    const p = parts(root);
    const from = current(root);
    const to = Math.max(0, Math.min(p.panels.length - 1, index));
    if (to === from) return false;
    if (to > from && !(options && options.skipValidation) && !validate(p.panels[from])) {
      return false;
    }
    const proceed = root.dispatchEvent(
      new CustomEvent('bootcn:stepper:change', {
        bubbles: true,
        cancelable: true,
        detail: { from: from, to: to },
      }),
    );
    if (!proceed) return false;
    render(root, to, true);
    return true;
  }

  // options.skipEvent: show the end without firing bootcn:stepper:finish
  // again (after your listener has saved the data).
  function finish(root, options) {
    const p = parts(root);
    if (!validate(p.panels[current(root)])) return false;
    const proceed =
      (options && options.skipEvent) ||
      root.dispatchEvent(
        new CustomEvent('bootcn:stepper:finish', {
          bubbles: true,
          cancelable: true,
          detail: { form: root.closest('form') || root.querySelector('form') },
        }),
      );
    if (!proceed) return false;
    // An optional closing panel replaces the steps.
    if (p.complete) {
      root.classList.add('is-finished');
      p.items.forEach(function (item) {
        item.classList.add('is-complete');
        item.classList.remove('is-current');
        item.removeAttribute('aria-current');
      });
      p.panels.forEach(function (panel) {
        panel.hidden = true;
      });
      p.complete.hidden = false;
      const heading = p.complete.querySelector('h1, h2, h3, [data-bootcn-stepper-heading]');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }
    return true;
  }

  function next(root) {
    const p = parts(root);
    if (current(root) >= p.panels.length - 1) return finish(root);
    return go(root, current(root) + 1);
  }

  function prev(root) {
    return go(root, current(root) - 1);
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('button');
    if (!button) return;
    const root = button.closest(ROOT);
    if (!root) return;
    if (button.hasAttribute('data-bootcn-stepper-next')) {
      event.preventDefault();
      next(root);
    } else if (button.hasAttribute('data-bootcn-stepper-prev')) {
      event.preventDefault();
      prev(root);
    } else if (button.hasAttribute('data-bootcn-stepper-goto')) {
      // Completed steps can be revisited from the list.
      const index = Number(button.getAttribute('data-bootcn-stepper-goto'));
      if (index < current(root)) go(root, index);
    }
  }

  // Enter in a field moves on instead of submitting a surrounding form early.
  function onKeydown(event) {
    if (event.key !== 'Enter' || event.target.tagName !== 'INPUT') return;
    const root = event.target.closest(ROOT);
    if (!root || root.classList.contains('is-finished')) return;
    event.preventDefault();
    next(root);
  }

  function onInput(event) {
    const field = event.target;
    if (
      field instanceof Element &&
      field.getAttribute('aria-invalid') === 'true' &&
      field.closest(ROOT)
    ) {
      if (field.checkValidity()) field.removeAttribute('aria-invalid');
    }
  }

  function setup(root) {
    render(root, current(root), false);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', onKeydown);
      document.addEventListener('input', onInput);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('input', onInput);
    listening = false;
  }

  ns.stepper = {
    init: init,
    destroy: destroy,
    setup: setup,
    go: go,
    next: next,
    prev: prev,
    finish: finish,
    current: current,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
