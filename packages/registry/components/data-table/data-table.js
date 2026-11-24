(function () {
  'use strict';

  const ns = (window.Bootcn = window.Bootcn || {});
  if (ns.dataTable) return; // already loaded: idempotent

  const ROOT = '[data-bootcn-data-table]';
  const INIT = 'data-bootcn-data-table-initialized';
  const tables = new Map();

  function cellValue(row, column, type) {
    const cell = row.cells[column];
    if (!cell) return '';
    const raw = cell.hasAttribute('data-value')
      ? cell.getAttribute('data-value')
      : cell.textContent;
    return type === 'number' ? Number(raw) : raw.trim().toLowerCase();
  }

  function setup(root) {
    const tbody = root.querySelector('tbody');
    if (!tbody) return null;
    const rows = Array.from(tbody.rows);
    const filterInput = root.querySelector('[data-bootcn-data-table-filter]');
    const selectAll = root.querySelector('[data-bootcn-data-table-select-all]');
    const prev = root.querySelector('[data-bootcn-data-table-prev]');
    const next = root.querySelector('[data-bootcn-data-table-next]');
    const status = root.querySelector('[data-bootcn-data-table-status]');
    const selection = root.querySelector('[data-bootcn-data-table-selection]');
    const empty = root.querySelector('.bootcn-data-table__empty');
    const pageSize = Number(root.getAttribute('data-page-size')) || 10;
    const t = { rows: rows, order: rows.slice(), page: 0, query: '' };

    const checkbox = (row) => row.querySelector('[data-bootcn-data-table-select]');
    const matching = () =>
      t.order.filter((row) => t.query === '' || row.textContent.toLowerCase().includes(t.query));

    function update() {
      const list = matching();
      const pages = Math.max(1, Math.ceil(list.length / pageSize));
      t.page = Math.min(t.page, pages - 1);
      const start = t.page * pageSize;
      const shown = list.slice(start, start + pageSize);
      t.order.forEach((row) => {
        row.hidden = !shown.includes(row);
        tbody.appendChild(row); // keep DOM order = sort order
      });
      if (empty) empty.hidden = list.length !== 0;
      if (prev) prev.disabled = t.page === 0;
      if (next) next.disabled = t.page >= pages - 1;
      if (status) {
        status.textContent =
          list.length === 0
            ? 'No rows'
            : 'Showing ' + (start + 1) + '–' + (start + shown.length) + ' of ' + list.length;
      }
      const selected = t.rows.filter((row) => checkbox(row) && checkbox(row).checked);
      t.rows.forEach((row) => row.classList.toggle('is-selected', selected.includes(row)));
      if (selection)
        selection.textContent = selected.length + ' of ' + t.rows.length + ' rows selected.';
      if (selectAll) {
        const visible = list.filter((row) => checkbox(row));
        const on = visible.filter((row) => checkbox(row).checked).length;
        selectAll.checked = visible.length > 0 && on === visible.length;
        selectAll.indeterminate = on > 0 && on < visible.length;
      }
      root.dispatchEvent(
        new CustomEvent('bootcn:data-table:change', {
          bubbles: true,
          detail: { page: t.page, visible: list.length, selected: selected },
        }),
      );
    }

    // ascending -> descending -> original order
    function sort(button) {
      const th = button.closest('th');
      const column = Number(button.getAttribute('data-bootcn-data-table-sort'));
      const type = button.getAttribute('data-type') || 'text';
      const current = th.getAttribute('aria-sort');
      const nextSort =
        current === 'ascending' ? 'descending' : current === 'descending' ? 'none' : 'ascending';
      root
        .querySelectorAll('th[aria-sort]')
        .forEach((other) => other.setAttribute('aria-sort', 'none'));
      th.setAttribute('aria-sort', nextSort);
      if (nextSort === 'none') {
        t.order = t.rows.slice();
      } else {
        const direction = nextSort === 'ascending' ? 1 : -1;
        t.order = t.rows.slice().sort((a, b) => {
          const x = cellValue(a, column, type);
          const y = cellValue(b, column, type);
          return (x > y ? 1 : x < y ? -1 : 0) * direction;
        });
      }
      t.page = 0;
      update();
    }

    function onClick(event) {
      const sortButton = event.target.closest('[data-bootcn-data-table-sort]');
      if (sortButton) return sort(sortButton);
      if (event.target.closest('[data-bootcn-data-table-prev]')) {
        t.page = Math.max(0, t.page - 1);
        return update();
      }
      if (event.target.closest('[data-bootcn-data-table-next]')) {
        t.page += 1;
        return update();
      }
      return undefined;
    }

    function onChange(event) {
      if (event.target === selectAll) {
        matching().forEach((row) => {
          if (checkbox(row)) checkbox(row).checked = selectAll.checked;
        });
      }
      if (
        event.target.matches('[data-bootcn-data-table-select], [data-bootcn-data-table-select-all]')
      ) {
        update();
      }
    }

    function onInput(event) {
      if (event.target !== filterInput) return;
      t.query = filterInput.value.trim().toLowerCase();
      t.page = 0;
      update();
    }

    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    root.addEventListener('input', onInput);
    root.setAttribute(INIT, '');
    update();

    return function cleanup() {
      root.removeEventListener('click', onClick);
      root.removeEventListener('change', onChange);
      root.removeEventListener('input', onInput);
      root.removeAttribute(INIT);
      t.rows.forEach((row) => {
        row.hidden = false;
      });
    };
  }

  function init(root = document) {
    root.querySelectorAll(ROOT + ':not([' + INIT + '])').forEach((element) => {
      const cleanup = setup(element);
      if (cleanup) tables.set(element, cleanup);
    });
  }

  function destroy(root = document) {
    tables.forEach((cleanup, element) => {
      if (root === document || root.contains(element)) {
        cleanup();
        tables.delete(element);
      }
    });
  }

  ns.dataTable = { init: init, destroy: destroy };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }
})();
