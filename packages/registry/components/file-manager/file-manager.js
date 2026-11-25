(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.fileManager) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-files]';
  const ITEM = '[data-bootcn-files-item]';
  let listening = false;

  // Messages: override them with window.Bootcn.messages (Translations guide).
  function t(key, fallback) {
    const custom = window.Bootcn && window.Bootcn.messages && window.Bootcn.messages[key];
    return typeof custom === 'string' ? custom : fallback;
  }

  const PATHS = {
    folder:
      '<path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />',
    image:
      '<rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" />',
    sheet: '<rect x="4" y="3" width="16" height="18" rx="2" /><path d="M4 9h16M4 15h16M10 3v18" />',
    video: '<rect x="3" y="5" width="14" height="14" rx="2" /><path d="m17 10 4-2v8l-4-2" />',
    file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><path d="M14 3v6h6" />',
  };

  function svg(paths, size) {
    return (
      '<svg class="bootcn-icon" width="' +
      size +
      '" height="' +
      size +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
      paths +
      '</svg>'
    );
  }

  function escape(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function typeOf(file) {
    const name = (file.name || '').toLowerCase();
    const mime = file.type || '';
    if (/^image\//.test(mime)) return 'image';
    if (/^video\//.test(mime)) return 'video';
    if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
    if (/\.(csv|xlsx?|ods|numbers)$/.test(name)) return 'sheet';
    return 'file';
  }

  function q(root, name) {
    return root.querySelector('[data-bootcn-files-' + name + ']');
  }

  function rows(root) {
    return Array.from(root.querySelectorAll(ITEM));
  }

  function nameOf(row) {
    return row.getAttribute('data-name') || '';
  }

  function announce(root, text) {
    const live = q(root, 'live');
    if (live) live.textContent = text;
  }

  // ------------------------------------------------------------------ view

  function setView(root, view) {
    root.setAttribute('data-view', view);
    root.querySelectorAll('[data-bootcn-files-view]').forEach(function (button) {
      button.setAttribute(
        'aria-pressed',
        String(button.getAttribute('data-bootcn-files-view') === view),
      );
    });
  }

  // ------------------------------------------------------------------ sort

  function sort(root, key, direction) {
    const list = q(root, 'list');
    const factor = direction === 'descending' ? -1 : 1;
    const value = function (row) {
      if (key === 'size') return Number(row.getAttribute('data-size')) || 0;
      if (key === 'modified') return row.getAttribute('data-modified') || '';
      return nameOf(row).toLowerCase();
    };
    rows(root)
      .sort(function (a, b) {
        // Folders first, whatever the order.
        const folders =
          (b.getAttribute('data-type') === 'folder') - (a.getAttribute('data-type') === 'folder');
        if (folders) return folders;
        const x = value(a);
        const y = value(b);
        if (typeof x === 'number') return (x - y) * factor;
        return x.localeCompare(y, undefined, { numeric: true }) * factor;
      })
      .forEach(function (row) {
        list.appendChild(row);
      });
    root.querySelectorAll('[data-bootcn-files-sort]').forEach(function (button) {
      button.parentElement.setAttribute(
        'aria-sort',
        button.getAttribute('data-bootcn-files-sort') === key ? direction : 'none',
      );
    });
  }

  // ------------------------------------------------------------- selection

  function selected(root) {
    return rows(root).filter(function (row) {
      const box = row.querySelector('[data-bootcn-files-check]');
      return box && box.checked && !row.hidden;
    });
  }

  function syncSelection(root, announceIt) {
    const visible = rows(root).filter((row) => !row.hidden);
    const chosen = selected(root);
    rows(root).forEach(function (row) {
      const box = row.querySelector('[data-bootcn-files-check]');
      row.classList.toggle('is-selected', Boolean(box && box.checked));
    });
    const all = q(root, 'check-all');
    if (all) {
      all.checked = visible.length > 0 && chosen.length === visible.length;
      all.indeterminate = chosen.length > 0 && chosen.length < visible.length;
    }
    const bar = q(root, 'bulk');
    if (bar) bar.hidden = chosen.length === 0;
    const count = q(root, 'count');
    const text = t('files.selected', '{n} selected').replace('{n}', String(chosen.length));
    if (count) count.textContent = text;
    if (announceIt)
      announce(root, chosen.length ? text : t('files.noneSelected', 'Selection cleared'));
    root.dispatchEvent(
      new CustomEvent('bootcn:files:select', {
        bubbles: true,
        detail: { names: chosen.map(nameOf) },
      }),
    );
  }

  // ---------------------------------------------------------------- search

  function filter(root, text) {
    const needle = text.trim().toLowerCase();
    let shown = 0;
    rows(root).forEach(function (row) {
      row.hidden = needle !== '' && nameOf(row).toLowerCase().indexOf(needle) < 0;
      if (!row.hidden) shown++;
    });
    const empty = q(root, 'empty');
    if (empty) empty.hidden = shown > 0;
    syncSelection(root, false);
    if (needle) {
      announce(root, t('files.results', '{n} files').replace('{n}', String(shown)));
    }
  }

  // --------------------------------------------------------------- actions

  function act(root, action, list) {
    if (!list.length) return;
    const proceed = root.dispatchEvent(
      new CustomEvent('bootcn:files:action', {
        bubbles: true,
        cancelable: true,
        detail: { action: action, names: list.map(nameOf), rows: list },
      }),
    );
    if (!proceed || action !== 'delete') return;
    const after = list[list.length - 1].nextElementSibling;
    list.forEach((row) => row.remove());
    syncSelection(root, false);
    announce(
      root,
      list.length === 1
        ? t('files.deleted', 'Deleted {name}').replace('{name}', nameOf(list[0]))
        : t('files.deletedMany', 'Deleted {n} files').replace('{n}', String(list.length)),
    );
    // The focus moves to the next file, or the search box.
    const target = (after && after.querySelector('[data-bootcn-files-check]')) || q(root, 'search');
    if (target) target.focus();
  }

  function add(root, data) {
    const list = q(root, 'list');
    if (!list) return null;
    const type = data.type || 'file';
    const modified = data.modified || new Date().toISOString().slice(0, 10);
    const name = escape(data.name);
    const sizeText =
      data.size === undefined ? '—' : ns.dropzone ? ns.dropzone.size(data.size) : data.size + ' B';
    const row = document.createElement('div');
    row.setAttribute('role', 'row');
    row.className = 'bootcn-files__item';
    row.setAttribute('data-bootcn-files-item', '');
    row.setAttribute('data-name', data.name);
    row.setAttribute('data-type', type);
    row.setAttribute('data-size', String(data.size || 0));
    row.setAttribute('data-modified', modified);
    row.innerHTML =
      '<span role="cell" class="bootcn-files__select"><input class="form-check-input" type="checkbox" data-bootcn-files-check /></span>' +
      '<span role="cell" class="bootcn-files__name"><span class="bootcn-files__icon" data-type="' +
      type +
      '">' +
      svg(PATHS[type === 'pdf' ? 'file' : type] || PATHS.file, 20) +
      '</span><a class="bootcn-files__link"></a></span>' +
      '<span role="cell" class="bootcn-files__size">' +
      escape(sizeText) +
      '</span>' +
      '<span role="cell" class="bootcn-files__modified"><time datetime="' +
      modified +
      '">' +
      escape(data.modifiedLabel || t('files.today', 'Today')) +
      '</time></span>' +
      '<div role="cell" class="bootcn-files__actions"><div class="dropdown"><button type="button" class="bootcn-files__more" data-bs-toggle="dropdown" aria-expanded="false">' +
      svg(
        '<circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" />',
        16,
      ) +
      '</button><ul class="dropdown-menu dropdown-menu-end bootcn-dropdown">' +
      '<li><button type="button" class="dropdown-item" data-bootcn-files-action="download">' +
      escape(t('files.download', 'Download')) +
      '</button></li><li><button type="button" class="dropdown-item" data-bootcn-files-action="rename">' +
      escape(t('files.rename', 'Rename')) +
      '</button></li><li><hr class="dropdown-divider" /></li><li><button type="button" class="dropdown-item text-danger" data-bootcn-files-action="delete">' +
      escape(t('files.delete', 'Delete')) +
      '</button></li></ul></div></div>';
    const link = row.querySelector('.bootcn-files__link');
    link.textContent = data.name;
    link.href = data.href || '#';
    row
      .querySelector('[data-bootcn-files-check]')
      .setAttribute('aria-label', t('files.select', 'Select') + ' ' + data.name);
    row
      .querySelector('.bootcn-files__more')
      .setAttribute('aria-label', t('files.actionsFor', 'Actions for') + ' ' + data.name);
    if (name !== data.name) row.setAttribute('data-name', data.name);
    // After the folders, at the top of the files.
    const firstFile = rows(root).find((r) => r.getAttribute('data-type') !== 'folder');
    list.insertBefore(row, firstFile || null);
    const search = q(root, 'search');
    if (search && search.value) filter(root, search.value);
    return row;
  }

  // ---------------------------------------------------------------- events

  function onClick(event) {
    const target = event.target.closest && event.target.closest('button');
    if (!target) return;
    const root = target.closest(ROOT);
    if (!root) return;
    if (target.hasAttribute('data-bootcn-files-view')) {
      setView(root, target.getAttribute('data-bootcn-files-view'));
    } else if (target.hasAttribute('data-bootcn-files-sort')) {
      const key = target.getAttribute('data-bootcn-files-sort');
      const current = target.parentElement.getAttribute('aria-sort');
      sort(root, key, current === 'ascending' ? 'descending' : 'ascending');
    } else if (target.hasAttribute('data-bootcn-files-action')) {
      act(root, target.getAttribute('data-bootcn-files-action'), [target.closest(ITEM)]);
    } else if (target.hasAttribute('data-bootcn-files-bulk-action')) {
      act(root, target.getAttribute('data-bootcn-files-bulk-action'), selected(root));
    } else if (target.hasAttribute('data-bootcn-files-clear')) {
      rows(root).forEach(function (row) {
        const box = row.querySelector('[data-bootcn-files-check]');
        if (box) box.checked = false;
      });
      syncSelection(root, true);
      const all = q(root, 'check-all');
      if (all) all.focus();
    } else if (target.hasAttribute('data-bootcn-files-upload-toggle')) {
      const panel = document.getElementById(target.getAttribute('aria-controls'));
      const open = target.getAttribute('aria-expanded') !== 'true';
      target.setAttribute('aria-expanded', String(open));
      if (panel) {
        panel.hidden = !open;
        const input = open && panel.querySelector('input[type="file"]');
        if (input) input.focus();
      }
    }
  }

  function onChange(event) {
    const box = event.target;
    if (!(box instanceof HTMLInputElement)) return;
    const root = box.closest(ROOT);
    if (!root) return;
    if (box.hasAttribute('data-bootcn-files-check-all')) {
      rows(root).forEach(function (row) {
        const check = row.querySelector('[data-bootcn-files-check]');
        if (check && !row.hidden) check.checked = box.checked;
      });
      syncSelection(root, true);
    } else if (box.hasAttribute('data-bootcn-files-check')) {
      syncSelection(root, true);
    }
  }

  function onInput(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.hasAttribute('data-bootcn-files-search'))
      return;
    const root = input.closest(ROOT);
    if (root) filter(root, input.value);
  }

  // Finished uploads join the list.
  function onUploaded(event) {
    const root = event.target.closest && event.target.closest(ROOT);
    if (!root || !event.detail || !event.detail.file) return;
    const file = event.detail.file;
    add(root, { name: file.name, type: typeOf(file), size: file.size });
  }

  function setup(root) {
    setView(root, root.getAttribute('data-view') || 'list');
    syncSelection(root, false);
  }

  function init() {
    if (!listening) {
      document.addEventListener('click', onClick);
      document.addEventListener('change', onChange);
      document.addEventListener('input', onInput);
      document.addEventListener('bootcn:dropzone:done', onUploaded);
      listening = true;
    }
    document.querySelectorAll(ROOT).forEach(setup);
  }

  function destroy() {
    if (!listening) return;
    document.removeEventListener('click', onClick);
    document.removeEventListener('change', onChange);
    document.removeEventListener('input', onInput);
    document.removeEventListener('bootcn:dropzone:done', onUploaded);
    listening = false;
  }

  ns.fileManager = {
    init: init,
    destroy: destroy,
    setup: setup,
    add: add,
    setView: setView,
    sort: sort,
    selected: function (root) {
      return selected(root).map(nameOf);
    },
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
