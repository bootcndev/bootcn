(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.checkboxGroup) return; // already loaded: idempotent

  // Messages: override them for your language with window.Bootcn.messages,
  // e.g. { 'copy.done': 'Copié.' } (see the Translations guide).
  // Plural keys end in .one, .other… as chosen by Intl.PluralRules.
  function t(key, fallback, vars) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    let text = typeof custom === 'string' ? custom : fallback;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.split('{' + name + '}').join(String(vars[name]));
    });
    return text;
  }

  const ROOT = '[data-bootcn-checkbox-group]';
  const ALL = '[data-bootcn-checkbox-group-all]';
  let listening = false;

  function boxes(group) {
    return Array.from(
      group.querySelectorAll('.bootcn-checkbox-group__items input[type="checkbox"]'),
    ).filter(function (box) {
      return !box.disabled;
    });
  }

  function syncAll(group) {
    const all = group.querySelector(ALL);
    if (!all) return;
    const list = boxes(group);
    const checked = list.filter(function (box) {
      return box.checked;
    }).length;
    all.checked = checked > 0 && checked === list.length;
    all.indeterminate = checked > 0 && checked < list.length;
  }

  // Returns true when the group meets data-min. The message goes on the first
  // checkbox with setCustomValidity, so form.checkValidity() sees it too.
  function validate(group, show) {
    const min = Number(group.getAttribute('data-min') || 0);
    const list = boxes(group);
    const count = list.filter(function (box) {
      return box.checked;
    }).length;
    const valid = count >= min;
    const message =
      group.getAttribute('data-error') ||
      t('checkbox-group.min', 'Choose at least {min}.', { min: min });
    if (list[0]) list[0].setCustomValidity(valid ? '' : message);
    const error = group.querySelector('.bootcn-checkbox-group__error');
    if (show || valid) {
      group.classList.toggle('is-invalid', !valid);
      if (error) {
        error.hidden = valid;
        error.textContent = valid ? '' : message;
        const described = (group.getAttribute('aria-describedby') || '')
          .split(/\s+/)
          .filter(function (id) {
            return id && id !== error.id;
          });
        if (!valid) described.push(error.id);
        if (described.length) group.setAttribute('aria-describedby', described.join(' '));
        else group.removeAttribute('aria-describedby');
      }
    }
    return valid;
  }

  function onChange(event) {
    const box = event.target;
    if (!box.matches || !box.matches('input[type="checkbox"]')) return;
    const group = box.closest(ROOT);
    if (!group) return;
    if (box.matches(ALL)) {
      boxes(group).forEach(function (other) {
        other.checked = box.checked;
      });
    }
    syncAll(group);
    validate(
      group,
      group.classList.contains('is-invalid') || group.dataset.bootcnTouched === 'true',
    );
    group.dataset.bootcnTouched = 'true';
    group.dispatchEvent(
      new CustomEvent('bootcn:checkbox-group:change', {
        bubbles: true,
        detail: {
          values: boxes(group)
            .filter(function (other) {
              return other.checked;
            })
            .map(function (other) {
              return other.value;
            }),
        },
      }),
    );
  }

  function onSubmit(event) {
    const form = event.target;
    if (!form.querySelectorAll) return;
    let first = null;
    form.querySelectorAll(ROOT).forEach(function (group) {
      if (!validate(group, true) && !first) first = boxes(group)[0] || null;
    });
    if (first) {
      event.preventDefault();
      event.stopImmediatePropagation();
      first.focus();
    }
  }

  function setup(group) {
    syncAll(group);
    validate(group, false);
  }

  function init() {
    if (!listening) {
      document.addEventListener('change', onChange);
      document.addEventListener('submit', onSubmit, true); // before other submit handlers
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('change', onChange);
    document.removeEventListener('submit', onSubmit, true);
    listening = false;
  }

  ns.checkboxGroup = {
    init: init,
    destroy: destroy,
    validate: function (group) {
      return validate(group, true);
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
