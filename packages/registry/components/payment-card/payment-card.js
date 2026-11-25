(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.paymentCard) return; // already loaded: idempotent

  const FORM = '[data-bootcn-pay-form]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function digits(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function brand(number) {
    if (/^4/.test(number)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(number)) return 'mastercard';
    if (/^3[47]/.test(number)) return 'amex';
    return '';
  }

  const NAMES = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' };

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

  // American Express groups 4-6-5, the others in fours.
  function group(text, kind) {
    if (kind === 'amex') {
      return [text.slice(0, 4), text.slice(4, 10), text.slice(10, 15)].filter(Boolean).join(' ');
    }
    return (text.match(/.{1,4}/g) || []).join(' ');
  }

  function spaced(number) {
    return group(number, brand(number));
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

  function cardOf(form) {
    const id = form.getAttribute('data-bootcn-pay-form');
    return (id && document.getElementById(id)) || form.querySelector('[data-bootcn-pay-card]');
  }

  function set(card, name, text) {
    const el = card && card.querySelector('[data-bootcn-pay-' + name + ']');
    if (el) el.textContent = text;
  }

  // The picture follows the form: number, brand, name, expiry, code.
  function render(form) {
    const card = cardOf(form);
    if (!card) return;
    const field = (name) => form.querySelector('[name="' + name + '"]');
    const numberField = field('card_number');
    const number = numberField ? digits(numberField.value) : '';
    const locked = numberField && numberField.readOnly;
    const kind = brand(number) || card.getAttribute('data-brand') || '';
    if (!locked) card.setAttribute('data-brand', kind);
    // The digits typed so far, then dots for the rest: "4242 42•• •••• ••••".
    const length = kind === 'amex' ? 15 : 16;
    const shown = number + '•'.repeat(Math.max(0, length - number.length));
    set(card, 'number', locked ? numberField.value : group(shown, kind));
    set(card, 'brand', NAMES[kind] || '');
    const name = field('card_name');
    set(card, 'name', (name && name.value.trim()) || t('pay.namePlaceholder', 'Your name'));
    const expiry = field('card_expiry');
    set(card, 'expiry', (expiry && expiry.value) || 'MM / YY');
    const cvc = field('card_cvc');
    set(card, 'cvc', (cvc && cvc.value.replace(/./g, '•')) || '•••');
  }

  function format(field, deleting) {
    if (field.name === 'card_number' && !field.readOnly) {
      field.value = spaced(
        digits(field.value).slice(0, brand(digits(field.value)) === 'amex' ? 15 : 19),
      );
    } else if (field.name === 'card_expiry') {
      let value = digits(field.value).slice(0, 4);
      if (value.length === 1 && Number(value) > 1) value = '0' + value;
      field.value =
        value.length > 2 || (value.length === 2 && !deleting)
          ? value.slice(0, 2) + ' / ' + value.slice(2)
          : value;
    } else if (field.name === 'card_cvc') {
      field.value = digits(field.value).slice(0, 4);
    }
  }

  function validate(form) {
    const number = form.querySelector('[name="card_number"]');
    if (number && !number.readOnly)
      number.setCustomValidity(number.value && !luhn(digits(number.value)) ? 'invalid' : '');
    const expiry = form.querySelector('[name="card_expiry"]');
    if (expiry)
      expiry.setCustomValidity(expiry.value && !expiryValid(expiry.value) ? 'invalid' : '');
    let first = null;
    form.querySelectorAll('input').forEach(function (input) {
      if (!input.willValidate || input.type === 'checkbox' || input.type === 'hidden') return;
      if (input.checkValidity()) input.removeAttribute('aria-invalid');
      else {
        input.setAttribute('aria-invalid', 'true');
        if (!first) first = input;
      }
    });
    if (first) first.focus();
    return !first;
  }

  function onInput(event) {
    const field = event.target;
    const form = field.closest && field.closest(FORM);
    if (!form) return;
    format(field, event.inputType === 'deleteContentBackward');
    if (field.getAttribute('aria-invalid') === 'true') {
      field.setCustomValidity('');
      if (field.checkValidity()) field.removeAttribute('aria-invalid');
    }
    render(form);
  }

  // The card turns over while the security code is being typed.
  function onFocus(event) {
    const field = event.target;
    const form = field.closest && field.closest(FORM);
    if (!form) return;
    const card = cardOf(form);
    if (card) card.classList.toggle('is-flipped', field.name === 'card_cvc');
  }

  function onSubmit(event) {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.matches(FORM)) return;
    event.preventDefault();
    if (!validate(form)) return;
    const number = digits((form.querySelector('[name="card_number"]') || {}).value);
    const card = cardOf(form);
    // Only what is safe to keep: never the full number or the code.
    const detail = {
      form: form,
      brand: brand(number) || (card && card.getAttribute('data-brand')) || '',
      last4: number.slice(-4),
      name: (form.querySelector('[name="card_name"]') || {}).value || '',
      expiry: (form.querySelector('[name="card_expiry"]') || {}).value || '',
      id: form.getAttribute('data-card-id') || '',
    };
    form.dispatchEvent(new CustomEvent('bootcn:pay:submit', { bubbles: true, detail: detail }));
  }

  function setup(form) {
    render(form);
  }

  function init() {
    if (!listening) {
      document.addEventListener('input', onInput);
      document.addEventListener('focusin', onFocus);
      document.addEventListener('submit', onSubmit);
      listening = true;
    }
    document.querySelectorAll(FORM).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('input', onInput);
    document.removeEventListener('focusin', onFocus);
    document.removeEventListener('submit', onSubmit);
    listening = false;
  }

  ns.paymentCard = {
    init: init,
    destroy: destroy,
    render: render,
    brand: brand,
    luhn: luhn,
    names: NAMES,
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
