(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.combobox) return; // already loaded: idempotent

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

  const ROOT = '[data-bootcn-combobox]';
  const INIT = 'data-bootcn-combobox-initialized';
  const cleanups = new Map();

  // Case- and accent-insensitive matching ("e" finds "é").
  function fold(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function setup(root) {
    const input = root.querySelector('[role="combobox"]');
    const listbox = root.querySelector('[role="listbox"]');
    if (!input || !listbox) return null;
    const toggle = root.querySelector('.bootcn-combobox__toggle');
    const empty = root.querySelector('.bootcn-combobox__empty');
    const status = root.querySelector('[data-bootcn-combobox-status]');
    const single = root.querySelector('[data-bootcn-combobox-value]');
    const chips = root.querySelector('.bootcn-combobox__chips');
    const multiple = root.hasAttribute('data-bootcn-combobox-multiple');
    const name = root.getAttribute('data-bootcn-combobox-name') || '';
    const options = Array.from(listbox.querySelectorAll('[role="option"]'));
    let active = null;

    const labelOf = (option) => option.textContent.trim();
    const visible = () => options.filter((option) => !option.hidden);
    const selected = () =>
      options.filter((option) => option.getAttribute('aria-selected') === 'true');
    const isOpen = () => !listbox.hidden || (empty && !empty.hidden);

    function announce(message) {
      if (status) status.textContent = message;
    }

    function setActive(option) {
      if (active) active.classList.remove('is-active');
      active = option;
      if (option) {
        option.classList.add('is-active');
        input.setAttribute('aria-activedescendant', option.id);
        option.scrollIntoView({ block: 'nearest' });
      } else {
        input.removeAttribute('aria-activedescendant');
      }
    }

    function filter() {
      const query = fold(input.value.trim());
      options.forEach((option) => {
        option.hidden = query !== '' && !fold(labelOf(option)).includes(query);
      });
      const count = visible().length;
      announce(
        count === 0
          ? t('combobox.none', 'No results.')
          : tn('combobox.count', count, '1 result.', '{count} results.'),
      );
      return count;
    }

    function open() {
      const count = filter();
      listbox.hidden = count === 0;
      if (empty) empty.hidden = count !== 0;
      input.setAttribute('aria-expanded', count === 0 ? 'false' : 'true');
      if (!active || active.hidden) setActive(visible()[0] || null);
    }

    function close() {
      listbox.hidden = true;
      if (empty) empty.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      setActive(null);
    }

    function syncValue() {
      if (multiple) {
        root.querySelectorAll('input[data-bootcn-combobox-value]').forEach((el) => el.remove());
        if (chips) chips.textContent = '';
        selected().forEach((option) => {
          const hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = name + '[]';
          hidden.value = option.getAttribute('data-value') || labelOf(option);
          hidden.setAttribute('data-bootcn-combobox-value', '');
          root.appendChild(hidden);
          if (!chips) return;
          const chip = document.createElement('span');
          chip.className = 'bootcn-combobox__chip';
          chip.textContent = labelOf(option);
          const remove = document.createElement('button');
          remove.type = 'button';
          remove.className = 'bootcn-combobox__chip-remove';
          remove.setAttribute('aria-label', 'Remove ' + labelOf(option));
          remove.setAttribute('data-option', option.id);
          remove.innerHTML =
            '<svg class="bootcn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
          chip.appendChild(remove);
          chips.appendChild(chip);
        });
      } else {
        const current = selected()[0];
        if (single) single.value = current ? current.getAttribute('data-value') || '' : '';
        input.value = current ? labelOf(current) : '';
      }
    }

    function choose(option) {
      if (multiple) {
        const on = option.getAttribute('aria-selected') !== 'true';
        option.setAttribute('aria-selected', String(on));
        syncValue();
        announce(
          on
            ? t('combobox.selected', '{label} selected.', { label: labelOf(option) })
            : t('combobox.removed', '{label} removed.', { label: labelOf(option) }),
        );
        input.value = '';
        open();
        setActive(option);
      } else {
        options.forEach((other) => other.setAttribute('aria-selected', String(other === option)));
        syncValue();
        close();
      }
      root.dispatchEvent(
        new CustomEvent('bootcn:combobox:change', {
          bubbles: true,
          detail: {
            value: multiple
              ? selected().map((o) => o.getAttribute('data-value'))
              : option.getAttribute('data-value'),
          },
        }),
      );
    }

    function move(step) {
      const list = visible();
      if (list.length === 0) return;
      const index = list.indexOf(active);
      setActive(list[(index + step + list.length) % list.length]);
    }

    function onKeydown(event) {
      const expanded = input.getAttribute('aria-expanded') === 'true';
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!expanded) open();
          else if (!event.altKey) move(1);
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (event.altKey) close();
          else if (!expanded) {
            open();
            const list = visible();
            setActive(list[list.length - 1] || null);
          } else move(-1);
          break;
        case 'Home':
        case 'End':
          if (!expanded) return;
          event.preventDefault();
          setActive(event.key === 'Home' ? visible()[0] : visible()[visible().length - 1]);
          break;
        case 'Enter':
          if (expanded && active) {
            event.preventDefault();
            choose(active);
          }
          break;
        case 'Escape':
          if (isOpen()) {
            event.preventDefault();
            close();
            if (!multiple) syncValue();
          } else if (input.value) {
            input.value = '';
          }
          break;
        case 'Backspace':
          if (multiple && input.value === '' && selected().length > 0) {
            const last = selected()[selected().length - 1];
            last.setAttribute('aria-selected', 'false');
            syncValue();
            announce(t('combobox.removed', '{label} removed.', { label: labelOf(last) }));
          }
          break;
        default:
          break;
      }
    }

    function onInput() {
      open();
      setActive(visible()[0] || null);
    }

    function onFocusOut(event) {
      if (root.contains(event.relatedTarget)) return;
      close();
      if (multiple) input.value = '';
      else syncValue();
    }

    function onListboxDown(event) {
      // Keep focus in the input when choosing with the pointer.
      event.preventDefault();
      const option = event.target.closest('[role="option"]');
      if (option) choose(option);
    }

    function onToggle(event) {
      event.preventDefault();
      if (isOpen()) close();
      else open();
      input.focus();
    }

    function onChipClick(event) {
      const button = event.target.closest('.bootcn-combobox__chip-remove');
      if (!button) return;
      const option = document.getElementById(button.getAttribute('data-option'));
      if (!option) return;
      option.setAttribute('aria-selected', 'false');
      syncValue();
      announce(t('combobox.removed', '{label} removed.', { label: labelOf(option) }));
      input.focus();
    }

    input.addEventListener('keydown', onKeydown);
    input.addEventListener('input', onInput);
    input.addEventListener('click', open);
    root.addEventListener('focusout', onFocusOut);
    listbox.addEventListener('mousedown', onListboxDown);
    if (toggle) toggle.addEventListener('mousedown', onToggle);
    if (chips) chips.addEventListener('click', onChipClick);
    syncValue();
    close();
    root.setAttribute(INIT, '');

    return function cleanup() {
      input.removeEventListener('keydown', onKeydown);
      input.removeEventListener('input', onInput);
      input.removeEventListener('click', open);
      root.removeEventListener('focusout', onFocusOut);
      listbox.removeEventListener('mousedown', onListboxDown);
      if (toggle) toggle.removeEventListener('mousedown', onToggle);
      if (chips) chips.removeEventListener('click', onChipClick);
      root.removeAttribute(INIT);
    };
  }

  function init(root = document) {
    root.querySelectorAll(ROOT + ':not([' + INIT + '])').forEach((element) => {
      const cleanup = setup(element);
      if (cleanup) cleanups.set(element, cleanup);
    });
  }

  function destroy(root = document) {
    cleanups.forEach((cleanup, element) => {
      if (root === document || root.contains(element)) {
        cleanup();
        cleanups.delete(element);
      }
    });
  }

  ns.combobox = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
