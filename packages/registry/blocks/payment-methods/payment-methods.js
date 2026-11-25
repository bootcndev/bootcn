(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.paymentMethods) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-methods]';
  const states = new WeakMap();
  let listening = false;
  let counter = 0;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  const NAMES = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' };

  function q(root, name) {
    return root.querySelector('[data-bootcn-methods-' + name + ']');
  }

  function modal(el) {
    return window.bootstrap && window.bootstrap.Modal && el
      ? window.bootstrap.Modal.getOrCreateInstance(el)
      : null;
  }

  function state(root) {
    let s = states.get(root);
    if (!s) {
      s = { editing: null, removing: null };
      states.set(root, s);
    }
    return s;
  }

  function label(data) {
    return (
      (NAMES[data.brand] || t('methods.card', 'Card')) +
      ' ' +
      t('methods.ending', 'ending') +
      ' ' +
      data.last4
    );
  }

  function dataOf(item) {
    return {
      id: item.getAttribute('data-card-id'),
      brand: item.getAttribute('data-brand'),
      last4: item.getAttribute('data-last4'),
      name: item.getAttribute('data-name'),
      expiry: item.getAttribute('data-expiry'),
    };
  }

  function announce(root, text) {
    const live = q(root, 'live');
    if (live) live.textContent = text;
  }

  function changed(root, action, item) {
    root.dispatchEvent(
      new CustomEvent('bootcn:payment-methods:change', {
        bubbles: true,
        detail: {
          action: action,
          id: item ? item.getAttribute('data-card-id') : null,
          card: item ? dataOf(item) : null,
        },
      }),
    );
  }

  // Writes a card's text from its data attributes.
  function paint(item) {
    const data = dataOf(item);
    const mini = item.querySelector('.bootcn-pay-card');
    if (mini) {
      mini.setAttribute('data-brand', data.brand);
      const brand = mini.querySelector('.bootcn-pay-card__brand');
      if (brand) brand.textContent = NAMES[data.brand] || '';
    }
    const title = item.querySelector('.bootcn-methods__title');
    const badge = title.querySelector('[data-bootcn-methods-default]');
    title.textContent = label(data) + ' ';
    if (badge) title.appendChild(badge);
    item.querySelector('.bootcn-methods__meta').textContent =
      t('methods.expires', 'Expires') + ' ' + data.expiry;
    const edit = item.querySelector('[data-bootcn-methods-edit]');
    const remove = item.querySelector('[data-bootcn-methods-remove]');
    if (edit) edit.setAttribute('aria-label', t('methods.edit', 'Edit') + ' ' + label(data));
    if (remove)
      remove.setAttribute('aria-label', t('methods.remove', 'Remove') + ' ' + label(data));
  }

  function setDefault(root, item) {
    root.querySelectorAll('[data-card-id]').forEach(function (other) {
      const badge = other.querySelector('[data-bootcn-methods-default]');
      const button = other.querySelector('[data-bootcn-methods-make-default]');
      if (other === item) {
        if (!badge) {
          const b = document.createElement('span');
          b.className = 'badge bootcn-badge bootcn-badge--secondary';
          b.setAttribute('data-bootcn-methods-default', '');
          b.textContent = t('methods.default', 'Default');
          other.querySelector('.bootcn-methods__title').appendChild(b);
        }
        if (button) button.hidden = true;
      } else {
        if (badge) badge.remove();
        if (button) button.hidden = false;
      }
    });
  }

  function add(root, data) {
    const list = q(root, 'list');
    const template = list.querySelector('[data-card-id]');
    let item;
    if (template) {
      item = template.cloneNode(true);
      const badge = item.querySelector('[data-bootcn-methods-default]');
      if (badge) badge.remove();
    } else {
      item = document.createElement('li');
      item.className = 'bootcn-methods__item';
      item.innerHTML =
        '<span class="bootcn-pay-card bootcn-pay-card--mini" aria-hidden="true"><span class="bootcn-pay-card__inner"><span class="bootcn-pay-card__face"><span class="bootcn-pay-card__brand"></span></span></span></span>' +
        '<div class="bootcn-methods__text"><p class="bootcn-methods__title"></p><p class="bootcn-methods__meta"></p></div>' +
        '<div class="bootcn-methods__actions"><button type="button" class="btn bootcn-button bootcn-button--ghost bootcn-button--sm" data-bootcn-methods-make-default></button><button type="button" class="btn bootcn-button bootcn-button--outline bootcn-button--sm" data-bootcn-methods-edit></button><button type="button" class="btn bootcn-button bootcn-button--ghost bootcn-button--sm" data-bootcn-methods-remove></button></div>';
      item.querySelector('[data-bootcn-methods-make-default]').textContent = t(
        'methods.makeDefault',
        'Set as default',
      );
      item.querySelector('[data-bootcn-methods-edit]').textContent = t('methods.edit', 'Edit');
      item.querySelector('[data-bootcn-methods-remove]').textContent = t(
        'methods.remove',
        'Remove',
      );
    }
    item.setAttribute('data-card-id', data.id || 'card-' + Date.now() + '-' + ++counter);
    item.setAttribute('data-brand', data.brand || '');
    item.setAttribute('data-last4', data.last4 || '');
    item.setAttribute('data-name', data.name || '');
    item.setAttribute('data-expiry', data.expiry || '');
    item.classList.add('is-new');
    list.appendChild(item);
    paint(item);
    if (!root.querySelector('[data-bootcn-methods-default]')) setDefault(root, item);
    else {
      const button = item.querySelector('[data-bootcn-methods-make-default]');
      if (button) button.hidden = false;
    }
    sync(root);
    return item;
  }

  function sync(root) {
    const empty = q(root, 'empty');
    if (empty) empty.hidden = root.querySelectorAll('[data-card-id]').length > 0;
  }

  // ---------------------------------------------------------------- dialog

  function openDialog(root, item, opener) {
    const s = state(root);
    s.editing = item;
    const dialog = root.querySelector('#bootcn-methods-dialog') || q(root, 'dialog');
    const form = dialog.querySelector('[data-bootcn-pay-form]');
    const title = q(root, 'dialog-title');
    form.reset();
    form.querySelectorAll('[aria-invalid]').forEach((f) => f.removeAttribute('aria-invalid'));
    const number = form.querySelector('[name="card_number"]');
    const cvc = form.querySelector('[name="card_cvc"]');
    const card = document.getElementById(form.getAttribute('data-bootcn-pay-form'));
    if (item) {
      const data = dataOf(item);
      if (title) title.textContent = t('methods.editTitle', 'Edit card');
      number.value = '•••• •••• •••• ' + data.last4;
      number.readOnly = true;
      cvc.required = false;
      cvc.closest('.bootcn-field').hidden = true;
      form.querySelector('[name="card_name"]').value = data.name;
      form.querySelector('[name="card_expiry"]').value = data.expiry;
      form.setAttribute('data-card-id', data.id);
      if (card) card.setAttribute('data-brand', data.brand);
    } else {
      if (title) title.textContent = t('methods.addTitle', 'Add a card');
      number.readOnly = false;
      cvc.required = true;
      cvc.closest('.bootcn-field').hidden = false;
      form.removeAttribute('data-card-id');
      if (card) card.setAttribute('data-brand', '');
    }
    if (card) card.classList.remove('is-flipped');
    if (ns.paymentCard) ns.paymentCard.render(form);
    const m = modal(dialog);
    if (m) m.show(opener);
  }

  function onPaySubmit(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root) return;
    const s = state(root);
    const d = event.detail;
    let item;
    if (s.editing) {
      item = s.editing;
      item.setAttribute('data-name', d.name);
      item.setAttribute('data-expiry', d.expiry);
      paint(item);
      announce(root, t('methods.updated', 'Card updated:') + ' ' + label(dataOf(item)));
      changed(root, 'update', item);
    } else {
      item = add(root, { brand: d.brand, last4: d.last4, name: d.name, expiry: d.expiry });
      announce(root, t('methods.added', 'Card added:') + ' ' + label(dataOf(item)));
      changed(root, 'add', item);
    }
    s.editing = null;
    const m = modal(event.target.closest('.modal'));
    if (m) m.hide();
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('button');
    if (!button) return;
    const root = button.closest(ROOT);
    if (!root) return;
    const item = button.closest('[data-card-id]');
    if (button.hasAttribute('data-bootcn-methods-add')) openDialog(root, null, button);
    else if (button.hasAttribute('data-bootcn-methods-edit')) openDialog(root, item, button);
    else if (button.hasAttribute('data-bootcn-methods-make-default')) {
      setDefault(root, item);
      announce(
        root,
        label(dataOf(item)) + ' ' + t('methods.isDefault', 'is now your default card.'),
      );
      changed(root, 'default', item);
      const edit = item.querySelector('[data-bootcn-methods-edit]');
      if (edit) edit.focus();
    } else if (button.hasAttribute('data-bootcn-methods-remove')) {
      state(root).removing = item;
      const name = q(root, 'remove-name');
      if (name) name.textContent = label(dataOf(item));
      const m = modal(root.querySelector('#bootcn-methods-remove'));
      if (m) m.show(button);
    } else if (button.hasAttribute('data-bootcn-methods-confirm-remove')) {
      const s = state(root);
      const target = s.removing;
      s.removing = null;
      if (!target) return;
      const wasDefault = Boolean(target.querySelector('[data-bootcn-methods-default]'));
      const data = dataOf(target);
      changed(root, 'remove', target);
      target.remove();
      const next = root.querySelector('[data-card-id]');
      if (wasDefault && next) setDefault(root, next);
      sync(root);
      announce(root, t('methods.removed', 'Card removed:') + ' ' + label(data));
      const m = modal(button.closest('.modal'));
      if (m) m.hide();
      const focus = root.querySelector('[data-bootcn-methods-add]');
      if (focus) setTimeout(() => focus.focus(), 350);
    }
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('bootcn:pay:submit', onPaySubmit);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(sync);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('bootcn:pay:submit', onPaySubmit);
    listening = false;
  }

  ns.paymentMethods = { init: init, destroy: destroy, add: add };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
