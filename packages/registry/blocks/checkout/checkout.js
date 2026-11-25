(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.checkout) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-checkout]';
  const states = new WeakMap();
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function q(root, name) {
    return root.querySelector('[data-bootcn-checkout-' + name + ']');
  }

  function money(root, value) {
    try {
      return new Intl.NumberFormat(root.getAttribute('data-locale') || undefined, {
        style: 'currency',
        currency: root.getAttribute('data-currency') || 'USD',
      }).format(value);
    } catch {
      return value.toFixed(2);
    }
  }

  function state(root) {
    let s = states.get(root);
    if (!s) {
      s = { discount: 0, code: '' };
      states.set(root, s);
    }
    return s;
  }

  // ----------------------------------------------------------------- items

  // The cart's items when the cart component has some; otherwise the rows
  // written in the page (data-price and data-quantity).
  function items(root) {
    if (ns.cart && ns.cart.items().length) return ns.cart.items();
    return Array.from(root.querySelectorAll('[data-bootcn-checkout-item]')).map(function (row) {
      return {
        name: row.getAttribute('data-name') || '',
        price: Number(row.getAttribute('data-price')) || 0,
        quantity: Number(row.getAttribute('data-quantity')) || 1,
      };
    });
  }

  function renderCartItems(root) {
    if (!ns.cart || !ns.cart.items().length) return;
    const list = q(root, 'items');
    if (!list) return;
    list.textContent = '';
    ns.cart.items().forEach(function (item) {
      const li = document.createElement('li');
      li.className = 'bootcn-checkout__item';
      li.setAttribute('data-bootcn-checkout-item', '');
      const thumb = document.createElement('span');
      thumb.className = 'bootcn-checkout__thumb';
      const qty = document.createElement('span');
      qty.className = 'bootcn-checkout__qty';
      qty.textContent = String(item.quantity);
      qty.setAttribute('aria-hidden', 'true');
      thumb.appendChild(qty);
      const text = document.createElement('div');
      text.className = 'bootcn-checkout__item-text';
      const name = document.createElement('p');
      name.className = 'bootcn-checkout__item-name';
      name.textContent = item.name;
      text.appendChild(name);
      const meta = document.createElement('p');
      meta.className = 'bootcn-checkout__item-meta';
      meta.textContent =
        (item.variant ? item.variant + ' · ' : '') + t('checkout.qty', 'Qty') + ' ' + item.quantity;
      text.appendChild(meta);
      const price = document.createElement('p');
      price.className = 'bootcn-checkout__item-price';
      price.textContent = money(root, item.price * item.quantity);
      li.append(thumb, text, price);
      list.appendChild(li);
    });
  }

  // ---------------------------------------------------------------- totals

  function totals(root) {
    const s = state(root);
    const subtotal = items(root).reduce((n, i) => n + i.price * i.quantity, 0);
    const method = root.querySelector('input[name="shipping"]:checked');
    const shipping = method ? Number(method.getAttribute('data-cost')) || 0 : 0;
    const discount = Math.round(subtotal * s.discount) / 100;
    const rate = Number(root.getAttribute('data-tax-rate')) || 0;
    const tax = Math.round((subtotal - discount) * rate * 100) / 100;
    const total = Math.round((subtotal - discount + shipping + tax) * 100) / 100;
    return { subtotal: subtotal, shipping: shipping, discount: discount, tax: tax, total: total };
  }

  function render(root) {
    const sums = totals(root);
    const set = function (name, text) {
      const el = q(root, name);
      if (el) el.textContent = text;
    };
    set('subtotal', money(root, sums.subtotal));
    set('shipping', sums.shipping ? money(root, sums.shipping) : t('checkout.free', 'Free'));
    set('tax', money(root, sums.tax));
    set('total', money(root, sums.total));
    set('pay-amount', money(root, sums.total));
    const discountRow = q(root, 'discount-row');
    if (discountRow) discountRow.hidden = !sums.discount;
    set('discount', '−' + money(root, sums.discount));
    set('discount-code', state(root).code);
    return sums;
  }

  // ------------------------------------------------------------- the card

  function digits(value) {
    return value.replace(/\D/g, '');
  }

  function luhn(number) {
    let sum = 0;
    for (let i = 0; i < number.length; i++) {
      let d = Number(number.charAt(number.length - 1 - i));
      if (i % 2 === 1) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
    }
    return number.length >= 13 && sum % 10 === 0;
  }

  function brand(number) {
    if (/^4/.test(number)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(number)) return 'Mastercard';
    if (/^3[47]/.test(number)) return 'American Express';
    return '';
  }

  function formatCard(input) {
    const number = digits(input.value).slice(0, 19);
    input.value = number.replace(/(\d{4})(?=\d)/g, '$1 ');
    const root = input.closest(ROOT);
    const label = root && q(root, 'brand');
    if (label) label.textContent = brand(number);
  }

  function formatExpiry(input, deleting) {
    let value = digits(input.value).slice(0, 4);
    if (value.length === 1 && Number(value) > 1) value = '0' + value;
    input.value =
      value.length > 2 || (value.length === 2 && !deleting)
        ? value.slice(0, 2) + ' / ' + value.slice(2)
        : value;
  }

  function expiryValid(value) {
    const match = /^(\d{2}) \/ (\d{2})$/.exec(value);
    if (!match) return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12) return false;
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  }

  // --------------------------------------------------------------- submit

  function validate(form) {
    const card = form.querySelector('[data-bootcn-checkout-card]');
    if (card) card.setCustomValidity(card.value && !luhn(digits(card.value)) ? 'invalid' : '');
    const expiry = form.querySelector('[data-bootcn-checkout-expiry]');
    if (expiry)
      expiry.setCustomValidity(expiry.value && !expiryValid(expiry.value) ? 'invalid' : '');
    let first = null;
    form.querySelectorAll('input, select, textarea').forEach(function (field) {
      if (!field.willValidate || field.type === 'radio' || field.type === 'checkbox') return;
      if (field.checkValidity()) field.removeAttribute('aria-invalid');
      else {
        field.setAttribute('aria-invalid', 'true');
        if (!first) first = field;
      }
    });
    if (first) first.focus();
    return !first;
  }

  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.hasAttribute('data-bootcn-checkout-form'))
      return;
    event.preventDefault();
    const root = form.closest(ROOT);
    const status = q(root, 'status');
    if (!validate(form)) {
      if (status) status.textContent = t('checkout.fix', 'Some details need fixing.');
      return;
    }
    const pay = form.querySelector('[type="submit"]');
    if (pay) {
      pay.disabled = true;
      pay.setAttribute('aria-busy', 'true');
    }
    let finished = false;
    const detail = {
      form: form,
      totals: totals(root),
      items: items(root),
      // Call with the order number once your server has taken the payment.
      done: function (orderNumber) {
        if (finished) return;
        finished = true;
        complete(root, orderNumber);
      },
      fail: function (message) {
        if (pay) {
          pay.disabled = false;
          pay.removeAttribute('aria-busy');
        }
        if (status)
          status.textContent = message || t('checkout.failed', 'The payment did not go through.');
      },
    };
    const proceed = root.dispatchEvent(
      new CustomEvent('bootcn:checkout:submit', {
        bubbles: true,
        cancelable: true,
        detail: detail,
      }),
    );
    // Nothing listening: the demo confirms the order.
    if (proceed) detail.done(String(Math.floor(100000 + Math.random() * 900000)));
  }

  function complete(root, orderNumber) {
    const form = q(root, 'form');
    const done = q(root, 'done');
    const number = q(root, 'order-number');
    if (number) number.textContent = '#' + orderNumber;
    if (form) form.hidden = true;
    if (done) {
      done.hidden = false;
      const heading = done.querySelector('h1, h2, h3');
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus();
      }
    }
    if (ns.cart) ns.cart.clear();
  }

  // ------------------------------------------------------------- discount

  function applyCode(root) {
    const input = q(root, 'code');
    const message = q(root, 'code-message');
    const code = (input.value || '').trim().toUpperCase();
    if (!code) return;
    let settled = false;
    const detail = {
      code: code,
      apply: function (percent) {
        if (settled) return;
        settled = true;
        state(root).discount = Number(percent) || 0;
        state(root).code = code;
        input.removeAttribute('aria-invalid');
        message.textContent = t('checkout.codeApplied', '{code} applied.').replace('{code}', code);
        message.classList.remove('is-error');
        render(root);
      },
      reject: function (text) {
        if (settled) return;
        settled = true;
        input.setAttribute('aria-invalid', 'true');
        message.textContent = text || t('checkout.codeInvalid', 'This code is not valid.');
        message.classList.add('is-error');
      },
    };
    const proceed = root.dispatchEvent(
      new CustomEvent('bootcn:checkout:discount', {
        bubbles: true,
        cancelable: true,
        detail: detail,
      }),
    );
    // The demo knows one code; your server knows the real ones.
    if (proceed) {
      if (code === 'WELCOME10') detail.apply(10);
      else detail.reject();
    }
  }

  // ---------------------------------------------------------------- events

  function onInput(event) {
    const field = event.target;
    if (!(field instanceof HTMLInputElement) || !field.closest(ROOT)) return;
    if (field.hasAttribute('data-bootcn-checkout-card')) formatCard(field);
    else if (field.hasAttribute('data-bootcn-checkout-expiry')) {
      formatExpiry(field, event.inputType === 'deleteContentBackward');
    } else if (field.hasAttribute('data-bootcn-checkout-cvc'))
      field.value = digits(field.value).slice(0, 4);
    if (field.getAttribute('aria-invalid') === 'true' && field.name !== 'code') {
      field.setCustomValidity('');
      if (field.checkValidity()) field.removeAttribute('aria-invalid');
    }
  }

  function onChange(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root && event.target.name === 'shipping') render(root);
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest('[data-bootcn-checkout-apply]');
    if (button) applyCode(button.closest(ROOT));
  }

  // Enter in the code field applies it instead of placing the order.
  function onKeydown(event) {
    if (
      event.key === 'Enter' &&
      event.target.matches &&
      event.target.matches('[data-bootcn-checkout-code]')
    ) {
      event.preventDefault();
      applyCode(event.target.closest(ROOT));
    }
  }

  function setup(root) {
    renderCartItems(root);
    render(root);
  }

  function init() {
    if (!listening) {
      document.addEventListener('submit', onSubmit);
      document.addEventListener('input', onInput);
      document.addEventListener('change', onChange);
      document.addEventListener('click', onClick);
      document.addEventListener('keydown', onKeydown);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('input', onInput);
    document.removeEventListener('change', onChange);
    document.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKeydown);
    listening = false;
  }

  ns.checkout = { init: init, destroy: destroy, setup: setup, totals: totals, luhn: luhn };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
