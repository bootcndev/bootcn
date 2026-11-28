import * as React from 'react';

import '{{bootcn:css}}/table.css';
import '{{bootcn:css}}/input.css';
import '{{bootcn:css}}/button.css';
import '{{bootcn:css}}/data-table.css';

export interface DataTableColumn<Row> {
  /** The row field this column shows, sorts and filters by. */
  key: keyof Row & string;
  header: React.ReactNode;
  sortable?: boolean;
  /** Sort as numbers (amounts, counts) instead of text. */
  numeric?: boolean;
  align?: 'start' | 'end';
  /** Custom cell content; the field's value is used for sorting either way. */
  cell?: (row: Row) => React.ReactNode;
}

export interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows: Row[];
  /** A unique, stable id for each row. */
  rowId: (row: Row) => string;
  /** For screen readers: what the table holds. */
  caption: string;
  pageSize?: number;
  /** A filter field above the table (its visible placeholder and hidden label). */
  filterLabel?: string;
  filterPlaceholder?: string;
  /** Row checkboxes. Selection is controlled when `selected` is given. */
  selectable?: boolean;
  selected?: string[];
  onSelectedChange?: (ids: string[]) => void;
  /** Name of a row's checkbox, for screen readers. */
  rowLabel?: (row: Row) => string;
  emptyText?: string;
  previousLabel?: string;
  nextLabel?: string;
}

type Sort = { key: string; direction: 'ascending' | 'descending' } | null;

const SORT_ICON = (
  <svg
    className="bootcn-icon"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
);

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

/**
 * A table with sorting (ascending, descending, original order), filtering,
 * pagination and row selection. The column header buttons carry aria-sort;
 * the page status is announced.
 */
export function DataTable<Row>({
  columns,
  rows,
  rowId,
  caption,
  pageSize = 10,
  filterLabel,
  filterPlaceholder,
  selectable = false,
  selected,
  onSelectedChange,
  rowLabel = (row) => `Select row ${rowId(row)}`,
  emptyText = 'No rows match.',
  previousLabel = 'Previous',
  nextLabel = 'Next',
}: DataTableProps<Row>) {
  const id = React.useId();
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState<Sort>(null);
  const [page, setPage] = React.useState(0);
  const [own, setOwn] = React.useState<string[]>([]);
  const chosen = selected ?? own;
  const selectAll = React.useRef<HTMLInputElement>(null);

  const setChosen = (ids: string[]) => {
    if (selected === undefined) setOwn(ids);
    onSelectedChange?.(ids);
  };

  const matching = React.useMemo(() => {
    const folded = query.trim().toLowerCase();
    const list = rows.filter(
      (row) =>
        folded === '' ||
        columns.some((column) => text(row[column.key]).toLowerCase().includes(folded)),
    );
    if (!sort) return list;
    const column = columns.find((item) => item.key === sort.key);
    const factor = sort.direction === 'ascending' ? 1 : -1;
    return list.slice().sort((a, b) => {
      const x = column?.numeric
        ? Number(a[sort.key as keyof Row])
        : text(a[sort.key as keyof Row]).toLowerCase();
      const y = column?.numeric
        ? Number(b[sort.key as keyof Row])
        : text(b[sort.key as keyof Row]).toLowerCase();
      return (x > y ? 1 : x < y ? -1 : 0) * factor;
    });
  }, [rows, columns, query, sort]);

  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const current = Math.min(page, pages - 1);
  const start = current * pageSize;
  const shown = matching.slice(start, start + pageSize);

  const visibleIds = matching.map(rowId);
  const on = visibleIds.filter((rowKey) => chosen.includes(rowKey)).length;
  React.useEffect(() => {
    if (selectAll.current) selectAll.current.indeterminate = on > 0 && on < visibleIds.length;
  }, [on, visibleIds.length]);

  function cycle(key: string) {
    setSort((now) =>
      !now || now.key !== key
        ? { key, direction: 'ascending' }
        : now.direction === 'ascending'
          ? { key, direction: 'descending' }
          : null,
    );
    setPage(0);
  }

  return (
    <div className="bootcn-data-table">
      {filterLabel ? (
        <div className="bootcn-data-table__toolbar">
          <label className="visually-hidden" htmlFor={`${id}-filter`}>
            {filterLabel}
          </label>
          <input
            className="form-control bootcn-input bootcn-data-table__filter"
            id={`${id}-filter`}
            type="search"
            placeholder={filterPlaceholder}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        </div>
      ) : null}
      <div className="table-responsive">
        <table className="table bootcn-table">
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {selectable ? (
                <th scope="col" className="bootcn-data-table__check">
                  <input
                    ref={selectAll}
                    className="form-check-input"
                    type="checkbox"
                    aria-label="Select all rows"
                    checked={visibleIds.length > 0 && on === visibleIds.length}
                    onChange={(event) => {
                      const others = chosen.filter((rowKey) => !visibleIds.includes(rowKey));
                      setChosen(event.target.checked ? [...others, ...visibleIds] : others);
                    }}
                  />
                </th>
              ) : null}
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={column.align === 'end' ? 'text-end' : undefined}
                  aria-sort={
                    column.sortable
                      ? sort?.key === column.key
                        ? sort.direction
                        : 'none'
                      : undefined
                  }
                >
                  {column.sortable ? (
                    <button
                      type="button"
                      className="bootcn-data-table__sort"
                      onClick={() => cycle(column.key)}
                    >
                      {column.header}
                      {SORT_ICON}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => {
              const rowKey = rowId(row);
              const isChosen = chosen.includes(rowKey);
              return (
                <tr key={rowKey} className={isChosen ? 'is-selected' : undefined}>
                  {selectable ? (
                    <td className="bootcn-data-table__check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        aria-label={rowLabel(row)}
                        checked={isChosen}
                        onChange={(event) =>
                          setChosen(
                            event.target.checked
                              ? [...chosen, rowKey]
                              : chosen.filter((other) => other !== rowKey),
                          )
                        }
                      />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.align === 'end' ? 'text-end' : undefined}
                    >
                      {column.cell ? column.cell(row) : text(row[column.key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="bootcn-data-table__empty" hidden={matching.length !== 0}>
        {emptyText}
      </p>
      <div className="bootcn-data-table__footer">
        {selectable ? (
          <p className="bootcn-data-table__status">
            {chosen.length} of {rows.length} rows selected.
          </p>
        ) : null}
        <p className="bootcn-data-table__status" role="status">
          {matching.length === 0
            ? 'No rows'
            : `Showing ${start + 1}–${start + shown.length} of ${matching.length}`}
        </p>
        <div className="bootcn-data-table__pages">
          <button
            type="button"
            className="btn bootcn-button bootcn-button--outline bootcn-button--sm"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            {previousLabel}
          </button>
          <button
            type="button"
            className="btn bootcn-button bootcn-button--outline bootcn-button--sm"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
