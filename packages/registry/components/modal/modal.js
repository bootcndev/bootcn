(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.modal) return; // already loaded: idempotent

  const ROOT = '.bootcn-modal';
  const snapshots = new WeakMap();
  const discarding = new WeakSet();
  let listening = false;

  function instance(modal) {
    return window.bootstrap && window.bootstrap.Modal
      ? window.bootstrap.Modal.getOrCreateInstance(modal)
      : null;
  }

  function serialize(form) {
    return form ? new URLSearchParams(new FormData(form)).toString() : '';
  }

  function guarded(modal) {
    const form = modal.querySelector('form');
    return (
      modal.hasAttribute('data-bootcn-modal-guard') &&
      form &&
      snapshots.has(modal) &&
      serialize(form) !== snapshots.get(modal)
    );
  }

  // Shadows under the header and over the footer while the body scrolls.
  function updateShadows(body) {
    const content = body.closest('.modal-content');
    if (!content) return;
    content.classList.toggle('is-scrolled', body.scrollTop > 0);
    content.classList.toggle(
      'has-more',
      body.scrollTop + body.clientHeight < body.scrollHeight - 1,
    );
  }

  function showDiscard(modal, show) {
    const bar = modal.querySelector('[data-bootcn-modal-discard]');
    if (!bar) return;
    bar.hidden = !show;
    if (show) {
      const keep = bar.querySelector('[data-bootcn-modal-keep]');
      if (keep) keep.focus();
    }
  }

  function onShow(event) {
    const modal = event.target;
    if (!(modal instanceof Element) || !modal.matches(ROOT)) return;
    const form = modal.querySelector('form');
    if (form) snapshots.set(modal, serialize(form));
    showDiscard(modal, false);
  }

  function onShown(event) {
    const modal = event.target;
    if (!(modal instanceof Element) || !modal.matches(ROOT)) return;
    // Bootstrap focuses the dialog itself; move on to the field that asks for it.
    const first = modal.querySelector('[autofocus]');
    if (first) first.focus();
    modal.querySelectorAll('.modal-dialog-scrollable .modal-body').forEach(updateShadows);
  }

  // Unsaved changes: ask before closing (Escape, backdrop, close button).
  function onHide(event) {
    const modal = event.target;
    if (!(modal instanceof Element) || !modal.matches(ROOT)) return;
    if (discarding.has(modal) || !guarded(modal)) return;
    event.preventDefault();
    showDiscard(modal, true);
  }

  function onHidden(event) {
    const modal = event.target;
    if (!(modal instanceof Element) || !modal.matches(ROOT)) return;
    discarding.delete(modal);
    showDiscard(modal, false);
    const form = modal.querySelector('form[data-bootcn-modal-form]');
    if (form) reset(form);
  }

  function reset(form) {
    form.reset();
    form.classList.remove('was-validated');
    form.querySelectorAll('[aria-invalid="true"]').forEach(function (field) {
      field.removeAttribute('aria-invalid');
    });
    setBusy(form, false);
  }

  function setBusy(form, busy) {
    const submit = form.querySelector('[type="submit"]');
    if (!submit) return;
    submit.disabled = busy;
    submit.classList.toggle('is-loading', busy);
    submit.setAttribute('aria-busy', String(busy));
  }

  function close(modal) {
    discarding.add(modal);
    const modalInstance = instance(modal);
    if (modalInstance) modalInstance.hide();
  }

  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches('[data-bootcn-modal-form]')) return;
    const modal = form.closest(ROOT);
    event.preventDefault();
    let firstInvalid = null;
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      if (!field.willValidate) return;
      const ok = field.checkValidity();
      if (ok) field.removeAttribute('aria-invalid');
      else {
        field.setAttribute('aria-invalid', 'true');
        if (!firstInvalid) firstInvalid = field;
      }
    });
    form.classList.add('was-validated');
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }
    let done = false;
    const detail = {
      form: form,
      data: new FormData(form),
      // Call when the request has finished (after preventDefault()).
      close: function () {
        if (done) return;
        done = true;
        if (modal) close(modal);
      },
      busy: function (value) {
        setBusy(form, value !== false);
      },
    };
    const proceed = form.dispatchEvent(
      new CustomEvent('bootcn:modal:submit', { bubbles: true, cancelable: true, detail: detail }),
    );
    if (proceed) detail.close();
  }

  function onClick(event) {
    const target = event.target.closest && event.target.closest('button');
    if (!target) return;
    const modal = target.closest(ROOT);
    if (!modal) return;
    if (target.hasAttribute('data-bootcn-modal-keep')) {
      showDiscard(modal, false);
      const first = modal.querySelector('[autofocus]') || modal.querySelector('input, textarea');
      if (first) first.focus();
    } else if (target.hasAttribute('data-bootcn-modal-confirm-discard')) {
      close(modal);
    }
  }

  function onScroll(event) {
    const body = event.target;
    if (body instanceof Element && body.matches(ROOT + ' .modal-dialog-scrollable .modal-body')) {
      updateShadows(body);
    }
  }

  function onInput(event) {
    const field = event.target;
    if (field instanceof Element && field.getAttribute('aria-invalid') === 'true') {
      if (field.checkValidity()) field.removeAttribute('aria-invalid');
    }
  }

  function init() {
    if (listening) return;
    document.addEventListener('show.bs.modal', onShow);
    document.addEventListener('shown.bs.modal', onShown);
    document.addEventListener('hide.bs.modal', onHide);
    document.addEventListener('hidden.bs.modal', onHidden);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('click', onClick);
    document.addEventListener('scroll', onScroll, true);
    document.addEventListener('input', onInput);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('show.bs.modal', onShow);
    document.removeEventListener('shown.bs.modal', onShown);
    document.removeEventListener('hide.bs.modal', onHide);
    document.removeEventListener('hidden.bs.modal', onHidden);
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('click', onClick);
    document.removeEventListener('scroll', onScroll, true);
    document.removeEventListener('input', onInput);
    listening = false;
  }

  ns.modal = {
    init: init,
    destroy: destroy,
    // Closes without the unsaved-changes question.
    close: close,
    open: function (modal) {
      const modalInstance = instance(modal);
      if (modalInstance) modalInstance.show();
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
