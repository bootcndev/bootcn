(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.passwordStrength) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-password]';
  const LEVELS = ['too weak', 'weak', 'fair', 'good', 'strong'];
  const timers = new WeakMap();
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  function ruleMet(rule, value, li) {
    switch (rule) {
      case 'length':
        return value.length >= Number(li.getAttribute('data-min') || 8);
      case 'number':
        return /\d/.test(value);
      case 'symbol':
        return /[^\p{L}\p{N}\s]/u.test(value);
      case 'case':
        return /\p{Ll}/u.test(value) && /\p{Lu}/u.test(value);
      default:
        return true;
    }
  }

  // Level 0-4: the share of rules met, plus one for long passwords
  // (16+ characters), capped at 4. An empty field is level 0.
  function check(root, announce) {
    const input = root.querySelector('[data-bootcn-password-input]');
    const value = input.value;
    const rules = Array.from(root.querySelectorAll('[data-rule]'));
    let met = 0;
    rules.forEach(function (li) {
      const ok = value !== '' && ruleMet(li.getAttribute('data-rule'), value, li);
      li.setAttribute('data-met', String(ok));
      if (ok) met += 1;
      let note = li.querySelector('.visually-hidden');
      if (!note) {
        note = document.createElement('span');
        note.className = 'visually-hidden';
        li.appendChild(note);
      }
      note.textContent = ok ? t('password.met', ' (done)') : t('password.unmet', ' (not yet)');
    });
    let level = value === '' ? 0 : Math.round((met / Math.max(rules.length, 1)) * 4);
    if (value.length >= 16) level = Math.min(4, level + 1);
    if (value !== '' && level === 0) level = 1;
    root.setAttribute('data-level', String(level));
    const name = t('password.level.' + level, LEVELS[level]);
    const strength = root.querySelector('[data-bootcn-password-strength]');
    if (strength)
      strength.textContent = t('password.strength', 'Strength: {level}').replace('{level}', name);
    // Required fields need every rule, so form validation (and the Form
    // component) blocks a weak password.
    const all = met === rules.length;
    input.setCustomValidity(
      input.required && value !== '' && !all
        ? t('password.invalid', 'Meet every requirement below.')
        : '',
    );
    // Screen readers hear the strength after a pause in typing, not per key.
    if (announce) {
      clearTimeout(timers.get(root));
      timers.set(
        root,
        setTimeout(function () {
          const status = root.querySelector('[data-bootcn-password-status]');
          if (status) status.textContent = strength ? strength.textContent : name;
        }, 700),
      );
    }
    root.dispatchEvent(
      new CustomEvent('bootcn:password:change', {
        bubbles: true,
        detail: { level: level, valid: all },
      }),
    );
  }

  function onInput(event) {
    const input = event.target;
    if (!input.matches || !input.matches(ROOT + ' [data-bootcn-password-input]')) return;
    check(input.closest(ROOT), true);
  }

  function onClick(event) {
    const button =
      event.target.closest && event.target.closest(ROOT + ' [data-bootcn-password-toggle]');
    if (!button) return;
    const input = button.closest(ROOT).querySelector('[data-bootcn-password-input]');
    const show = button.getAttribute('aria-pressed') !== 'true';
    input.type = show ? 'text' : 'password';
    button.setAttribute('aria-pressed', String(show));
  }

  function init() {
    if (!listening) {
      document.addEventListener('input', onInput);
      document.addEventListener('click', onClick);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(function (root) {
      check(root, false);
    });
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('input', onInput);
    document.removeEventListener('click', onClick);
    listening = false;
  }

  ns.passwordStrength = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
