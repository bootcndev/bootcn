(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.autocomplete) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-autocomplete]';
  const OPTION = '[role="option"]';
  const state = new WeakMap(); // root -> { timer, controller }
  let listening = false;

  function parts(root) {
    return {
      input: root.querySelector('[role="combobox"]'),
      list: root.querySelector('[role="listbox"]'),
      status: root.querySelector('[data-bootcn-autocomplete-status]'),
    };
  }

  function stateOf(root) {
    if (!state.has(root)) state.set(root, {});
    return state.get(root);
  }

  function labelOf(option) {
    if (!option.hasAttribute('data-label'))
      option.setAttribute('data-label', option.textContent.trim());
    return option.getAttribute('data-label');
  }

  function valueOf(option) {
    return option.getAttribute('data-value') || labelOf(option);
  }

  function visible(root) {
    return Array.from(parts(root).list.querySelectorAll(OPTION)).filter(function (option) {
      return !option.hidden;
    });
  }

  // The matched part in <mark>, built from text nodes (never parsed as HTML).
  function highlight(option, query) {
    const label = labelOf(option);
    const at = query ? label.toLowerCase().indexOf(query) : -1;
    option.replaceChildren();
    if (at < 0) {
      option.textContent = label;
      return;
    }
    const mark = document.createElement('mark');
    mark.textContent = label.slice(at, at + query.length);
    option.append(label.slice(0, at), mark, label.slice(at + query.length));
  }

  function announce(root, text) {
    const status = parts(root).status;
    if (status) status.textContent = text;
  }

  function setActive(root, option) {
    const p = parts(root);
    p.list.querySelectorAll(OPTION).forEach(function (other) {
      other.setAttribute('aria-selected', String(other === option));
    });
    if (option) {
      p.input.setAttribute('aria-activedescendant', option.id);
      option.scrollIntoView({ block: 'nearest' });
    } else {
      p.input.removeAttribute('aria-activedescendant');
    }
  }

  function open(root) {
    const p = parts(root);
    if (visible(root).length === 0) return close(root);
    p.list.hidden = false;
    p.input.setAttribute('aria-expanded', 'true');
  }

  function close(root) {
    const p = parts(root);
    p.list.hidden = true;
    p.input.setAttribute('aria-expanded', 'false');
    setActive(root, null);
  }

  function filter(root) {
    const p = parts(root);
    const query = p.input.value.trim().toLowerCase();
    let count = 0;
    p.list.querySelectorAll(OPTION).forEach(function (option) {
      const match = !query || labelOf(option).toLowerCase().includes(query);
      option.hidden = !match;
      highlight(option, match ? query : '');
      if (match) count += 1;
    });
    setActive(root, null);
    if (count) open(root);
    else close(root);
    announce(root, count === 1 ? '1 suggestion.' : count + ' suggestions.');
  }

  // Remote suggestions: data-bootcn-autocomplete-url + the encoded query
  // returns a JSON array of strings or { value, label } objects.
  function fetchRemote(root) {
    const p = parts(root);
    const url = root.getAttribute('data-bootcn-autocomplete-url');
    const s = stateOf(root);
    clearTimeout(s.timer);
    if (s.controller) s.controller.abort();
    const query = p.input.value.trim();
    if (!query) {
      p.list.replaceChildren();
      close(root);
      return;
    }
    s.timer = setTimeout(function () {
      s.controller = new AbortController();
      fetch(url + encodeURIComponent(query), { signal: s.controller.signal })
        .then(function (response) {
          return response.ok ? response.json() : [];
        })
        .then(function (items) {
          p.list.replaceChildren();
          (Array.isArray(items) ? items : []).slice(0, 50).forEach(function (item, index) {
            const option = document.createElement('li');
            option.className = 'bootcn-autocomplete__option';
            option.id = p.list.id + '-' + index;
            option.setAttribute('role', 'option');
            option.setAttribute('aria-selected', 'false');
            const label = typeof item === 'string' ? item : String(item.label || item.value);
            option.setAttribute('data-label', label);
            if (typeof item === 'object' && item.value !== undefined) {
              option.setAttribute('data-value', String(item.value));
            }
            p.list.appendChild(option);
          });
          filter(root);
        })
        .catch(function () {
          // Aborted or offline: keep the current list.
        });
    }, 200);
  }

  function choose(root, option) {
    const p = parts(root);
    p.input.value = valueOf(option);
    close(root);
    p.input.dispatchEvent(new Event('change', { bubbles: true }));
    root.dispatchEvent(
      new CustomEvent('bootcn:autocomplete:select', {
        bubbles: true,
        detail: { value: valueOf(option), label: labelOf(option) },
      }),
    );
  }

  function move(root, delta) {
    const options = visible(root);
    if (!options.length) return;
    const p = parts(root);
    const current = p.input.getAttribute('aria-activedescendant');
    let index = options.findIndex(function (option) {
      return option.id === current;
    });
    index =
      index < 0
        ? delta > 0
          ? 0
          : options.length - 1
        : (index + delta + options.length) % options.length;
    setActive(root, options[index]);
  }

  function onInput(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || event.target !== parts(root).input) return;
    if (root.hasAttribute('data-bootcn-autocomplete-url')) fetchRemote(root);
    else filter(root);
  }

  function onKeydown(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || event.target !== parts(root).input) return;
    const p = parts(root);
    const expanded = !p.list.hidden;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!expanded) {
        filter(root);
        if (event.altKey) return;
      }
      move(root, event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter' && expanded) {
      const active = p.input.getAttribute('aria-activedescendant');
      const option = active && document.getElementById(active);
      if (option) {
        event.preventDefault();
        choose(root, option);
      } else {
        close(root);
      }
    } else if (event.key === 'Escape') {
      if (expanded) {
        event.preventDefault();
        close(root);
      } else if (p.input.value) {
        event.preventDefault();
        p.input.value = '';
        filter(root);
        close(root);
      }
    } else if (event.key === 'Tab') {
      close(root);
    }
  }

  function onMousedown(event) {
    const option = event.target.closest && event.target.closest(ROOT + ' ' + OPTION);
    if (option) event.preventDefault(); // keep focus in the input
  }

  function onClick(event) {
    const option = event.target.closest && event.target.closest(ROOT + ' ' + OPTION);
    if (option) choose(option.closest(ROOT), option);
  }

  function onFocusOut(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (root && !root.contains(event.relatedTarget)) close(root);
  }

  const handlers = [
    ['input', onInput],
    ['keydown', onKeydown],
    ['mousedown', onMousedown],
    ['click', onClick],
    ['focusout', onFocusOut],
  ];

  function init() {
    if (listening) return;
    handlers.forEach(function (pair) {
      document.addEventListener(pair[0], pair[1]);
    });
    listening = true;
  }

  function destroy() {
    if (!listening) return;
    handlers.forEach(function (pair) {
      document.removeEventListener(pair[0], pair[1]);
    });
    listening = false;
  }

  ns.autocomplete = { init: init, destroy: destroy, close: close };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
