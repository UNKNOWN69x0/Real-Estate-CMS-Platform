import { ArrowDown, ArrowUp } from 'lucide-react';
import Skeleton from '../ui/Skeleton.jsx';

/**
 * Responsive table: a real <table> from md up, stacked cards on phones.
 *  columns: [{ key, header, cell?(row), sortKey?, className? }]  (the first column is the card title on mobile)
 *  sort / onSort: current "field" or "-field" string and its setter (only for columns with a sortKey)
 *  actions(row): optional per-row buttons
 */
export default function DataTable({ columns, rows, loading, error, sort, onSort, actions, rowKey = '_id', emptyMessage = 'Nothing here yet.' }) {
  const toggleSort = (sortKey) => onSort(sort === sortKey ? `-${sortKey}` : sortKey);
  const render = (col, row) => (col.cell ? col.cell(row) : row[col.key] ?? '—');

  if (error) {
    return (
      <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </p>
    );
  }

  if (loading && !rows.length) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return <p className="border border-dashed border-brown-400/50 bg-white p-8 text-center text-sm text-brown-600">{emptyMessage}</p>;
  }

  return (
    <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-brown-400/30 bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-sand text-xs uppercase tracking-wider text-brown-700">
            <tr>
              {columns.map((col) => {
                const active = Boolean(col.sortKey && sort) && (sort === col.sortKey || sort === `-${col.sortKey}`);
                return (
                  <th key={col.key} scope="col" className={`px-4 py-3 font-semibold ${col.className ?? ''}`} aria-sort={active ? (sort.startsWith('-') ? 'descending' : 'ascending') : undefined}>
                    {col.sortKey ? (
                      <button type="button" onClick={() => toggleSort(col.sortKey)} className="inline-flex items-center gap-1 uppercase tracking-wider hover:text-brown-900">
                        {col.header}
                        {active && (sort.startsWith('-') ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
              {actions && <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-400/20">
            {rows.map((row) => (
              <tr key={row[rowKey]} className="align-middle hover:bg-cream">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 text-brown-900 ${col.className ?? ''}`}>
                    {render(col, row)}
                  </td>
                ))}
                {actions && <td className="px-4 py-3"><div className="flex justify-end gap-2">{actions(row)}</div></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={row[rowKey]} className="space-y-2 border border-brown-400/30 bg-white p-4 text-sm">
            <div className="font-semibold text-brown-900">{render(columns[0], row)}</div>
            <dl className="space-y-1.5">
              {columns.slice(1).map((col) => (
                <div key={col.key} className="flex items-center justify-between gap-4">
                  <dt className="text-xs uppercase tracking-wider text-brown-600">{col.header}</dt>
                  <dd className="min-w-0 text-right text-brown-900">{render(col, row)}</dd>
                </div>
              ))}
            </dl>
            {actions && <div className="flex flex-wrap justify-end gap-2 border-t border-brown-400/20 pt-3">{actions(row)}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
