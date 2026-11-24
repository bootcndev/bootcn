(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.form) return; // already loaded: idempotent

  // Messages: override them for your language with window.Bootcn.messages,
  // e.g. { 'copy.done': 'Αντιγράφηκε.' } (see the Translations guide).
  // Plural keys end in .one, .other… as chosen by Intl.PluralRules.
  function t(key, fallback, vars) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    let text = typeof custom === 'string' ? custom : fallback;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(String(vars[name]));
    });
    return text;
  }

  function tn(key, count, one, other, vars) {
    let category = count === 1 ? 'one' : 'other';
    try {
      category = new Intl.PluralRules(document.documentElement.lang || undefined).select(count);
    } catch {
      // Unknown language tag: keep the English rule.
    }
    const messages = (window.Bootcn && window.Bootcn.messages) || {};
    const own = messages[key + '.' + category];
    const fallback = typeof own === 'string' ? own : count === 1 ? one : other;
    return t(key + '.' + category, fallback, Object.assign({ count: count }, vars));
  }

  const ROOT = '[data-bootcn-form]';
  // ValidityState flags, in the order they are reported, and the
  // data-error-* attribute that overrides each message.
  const FLAGS = [
    ['valueMissing', 'data-error-value-missing'],
    ['typeMismatch', 'data-error-type-mismatch'],
    ['patternMismatch', 'data-error-pattern-mismatch'],
    ['tooShort', 'data-error-too-short'],
    ['tooLong', 'data-error-too-long'],
    ['rangeUnderflow', 'data-error-range-underflow'],
    ['rangeOverflow', 'data-error-range-overflow'],
    ['stepMismatch', 'data-error-step-mismatch'],
    ['badInput', 'data-error-bad-input'],
  ];
  let listening = false;

  function fields(form) {
    return Array.from(form.elements).filter(function (el) {
      return el.willValidate && el.type !== 'submit' && el.type !== 'button';
    });
  }

  function messageFor(field) {
    const v = field.validity;
    for (let i = 0; i < FLAGS.length; i += 1) {
      if (v[FLAGS[i][0]]) return field.getAttribute(FLAGS[i][1]) || field.validationMessage;
    }
    return field.validationMessage;
  }

  function errorElement(field) {
    const ids = (field.getAttribute('aria-describedby') || '').split(/\s+/);
    for (let i = 0; i < ids.length; i += 1) {
      const el = ids[i] && document.getElementById(ids[i]);
      if (el && el.classList.contains('bootcn-field__error')) return el;
    }
    return null;
  }

  function show(field) {
    const valid = field.checkValidity();
    const error = errorElement(field);
    if (valid) field.removeAttribute('aria-invalid');
    else field.setAttribute('aria-invalid', 'true');
    if (error) {
      error.textContent = valid ? '' : messageFor(field);
      error.hidden = valid;
    }
    return valid;
  }

  function labelText(field) {
    const label = field.labels && field.labels[0];
    if (label) return label.textContent.trim().replace(/\s+/g, ' ');
    const group = field.closest('fieldset');
    const legend = group && group.querySelector('legend');
    return legend ? legend.textContent.trim() : field.name;
  }

  function summarize(form, invalid) {
    const summary = form.querySelector('[data-bootcn-form-summary]');
    if (!summary) return null;
    const list = summary.querySelector('[data-bootcn-form-summary-list]');
    const count = summary.querySelector('[data-bootcn-form-summary-count]');
    if (list) {
      list.replaceChildren();
      invalid.forEach(function (field) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = '#' + field.id;
        link.textContent = labelText(field) + ': ' + messageFor(field);
        item.appendChild(link);
        list.appendChild(item);
      });
    }
    if (count) {
      count.textContent = tn(
        'form.summary',
        invalid.length,
        'There is 1 problem',
        'There are {count} problems',
      );
    }
    summary.hidden = invalid.length === 0;
    return summary;
  }

  // Validates every field; returns the invalid ones (radio groups once).
  function validate(form) {
    const seen = new Set();
    const invalid = [];
    fields(form).forEach(function (field) {
      if (field.type === 'radio') {
        if (seen.has(field.name)) return;
        seen.add(field.name);
      }
      if (!show(field)) invalid.push(field);
    });
    return invalid;
  }

  function onSubmit(event) {
    const form = event.target;
    if (!form.matches || !form.matches(ROOT)) return;
    form.dataset.bootcnSubmitted = 'true';
    const invalid = validate(form);
    const success = form.querySelector('[data-bootcn-form-success]');
    if (success) success.textContent = '';
    if (invalid.length) {
      event.preventDefault();
      const summary = summarize(form, invalid);
      if (summary) summary.focus();
      else invalid[0].focus();
      form.dispatchEvent(
        new CustomEvent('bootcn:form:invalid', { bubbles: true, detail: { fields: invalid } }),
      );
      return;
    }
    summarize(form, []);
    const custom = new CustomEvent('bootcn:form:submit', {
      bubbles: true,
      cancelable: true,
      detail: { data: new FormData(form) },
    });
    const handled = !form.dispatchEvent(custom);
    if (handled || !form.hasAttribute('action')) {
      event.preventDefault();
      if (success && !handled)
        success.textContent = form.getAttribute('data-success') || t('form.saved', 'Saved.');
    }
  }

  // Before the first submit, a field is checked when it is left with a
  // value; after it, every change is checked right away.
  function onInput(event) {
    const field = event.target;
    const form = field.form;
    if (!form || !form.matches(ROOT) || !field.willValidate) return;
    if (form.dataset.bootcnSubmitted === 'true' || field.getAttribute('aria-invalid') === 'true') {
      show(field);
      const summary = form.querySelector('[data-bootcn-form-summary]');
      if (summary && !summary.hidden) {
        const invalid = fields(form).filter(function (other) {
          return other.getAttribute('aria-invalid') === 'true';
        });
        summarize(form, invalid);
      }
    }
  }

  function onFocusOut(event) {
    const field = event.target;
    const form = field.form;
    if (!form || !form.matches || !form.matches(ROOT) || !field.willValidate) return;
    if (field.value !== '' && field.type !== 'checkbox' && field.type !== 'radio') show(field);
  }

  function onClick(event) {
    const link = event.target.closest && event.target.closest('[data-bootcn-form-summary-list] a');
    if (!link) return;
    const field = document.getElementById(link.getAttribute('href').slice(1));
    if (!field) return;
    event.preventDefault();
    field.focus();
    field.scrollIntoView({ block: 'center' });
  }

  function init() {
    if (listening) return;
    document.addEventListener('submit', onSubmit);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    document.addEventListener('focusout', onFocusOut);
    document.addEventListener('click', onClick);
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('submit', onSubmit);
    document.removeEventListener('input', onInput);
    document.removeEventListener('change', onInput);
    document.removeEventListener('focusout', onFocusOut);
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.form = {
    init: init,
    destroy: destroy,
    validate: function (form) {
      const invalid = validate(form);
      summarize(form, invalid);
      return invalid.length === 0;
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
