(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.tagGroup) return; // already loaded: idempotent

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

  const ROOT = '[data-bootcn-tag-group]';
  let listening = false;

  // Removing a tag keeps focus in the group: on the next tag's button, else
  // the previous one, else the group's label.
  function remove(button) {
    const tag = button.closest('.bootcn-tag');
    const root = button.closest(ROOT);
    if (!tag || !root) return;
    const buttons = Array.from(root.querySelectorAll('.bootcn-tag__remove'));
    const index = buttons.indexOf(button);
    const name = tag.textContent.trim();
    tag.remove();
    const rest = Array.from(root.querySelectorAll('.bootcn-tag__remove'));
    const next = rest[index] || rest[index - 1];
    if (next) next.focus();
    else {
      const label = root.querySelector('.bootcn-tag-group__label');
      if (label) {
        label.setAttribute('tabindex', '-1');
        label.focus();
      }
    }
    const status = root.querySelector('[data-bootcn-tag-group-status]');
    if (status) status.textContent = t('tag-group.removed', '{name} removed.', { name: name });
    root.dispatchEvent(
      new CustomEvent('bootcn:tag-group:remove', { bubbles: true, detail: { value: name } }),
    );
  }

  function onClick(event) {
    const button = event.target.closest && event.target.closest(ROOT + ' .bootcn-tag__remove');
    if (button) remove(button);
  }

  function onKeydown(event) {
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    const button = event.target.closest && event.target.closest(ROOT + ' .bootcn-tag__remove');
    if (!button) return;
    event.preventDefault();
    remove(button);
  }

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

  ns.tagGroup = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
