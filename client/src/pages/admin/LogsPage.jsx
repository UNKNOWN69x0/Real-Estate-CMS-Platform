import { useEffect, useState } from 'react';
import { adminApi } from '../../api/admin.js';
import { formatDateTime } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import Toolbar from '../../components/admin/Toolbar.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';

const option = (value, label = value) => ({ value, label });
const ENTITY_OPTIONS = [option('', 'All'), option('section', 'Section'), option('amenity', 'Amenity'), option('gallery item', 'Gallery item'), option('floor plan', 'Floor plan'), option('inquiry', 'Inquiry')];
const ACTION_OPTIONS = [option('', 'All'), ...['create', 'update', 'delete', 'publish', 'unpublish'].map((a) => option(a, a[0].toUpperCase() + a.slice(1)))];

// Date inputs give local yyyy-mm-dd; the API wants ISO timestamps covering the whole day
const dayStart = (d) => (d ? new Date(`${d}T00:00:00`).toISOString() : '');
const dayEnd = (d) => (d ? new Date(`${d}T23:59:59.999`).toISOString() : '');

export default function LogsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ search: '', entity: '', action: '', from: '', to: '', page: 1 });
  const [state, setState] = useState({ loading: true, rows: [], meta: null, error: '' });

  useEffect(() => {
    const timer = setTimeout(() => setFilters((f) => (f.search === searchInput ? f : { ...f, search: searchInput, page: 1 })), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: '' }));
    const { from, to, ...rest } = filters;
    adminApi
      .logs({ ...rest, from: dayStart(from), to: dayEnd(to), limit: 15 }, controller.signal)
      .then(({ data, meta }) => setState({ loading: false, rows: data, meta, error: '' }))
      .catch((err) => err.name !== 'AbortError' && setState((s) => ({ ...s, loading: false, error: err.message })));
    return () => controller.abort();
  }, [filters]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch, page: 1 }));

  const columns = [
    { key: 'createdAt', header: 'When', cell: (row) => formatDateTime(row.createdAt) },
    { key: 'action', header: 'Action', cell: (row) => <StatusBadge value={row.action} /> },
    { key: 'entity', header: 'Entity', className: 'capitalize' },
    { key: 'summary', header: 'Summary' },
    { key: 'userEmail', header: 'User', cell: (row) => <span className="break-all">{row.userEmail || '—'}</span> },
  ];

  return (
    <>
      <PageHeader title="Activity Logs" description="Every create, update, delete and publish made in the admin." />
      <Toolbar
        search={searchInput}
        onSearch={setSearchInput}
        searchPlaceholder="Search summary or user…"
        filters={[
          { name: 'entity', label: 'Entity', value: filters.entity, onChange: (entity) => set({ entity }), options: ENTITY_OPTIONS },
          { name: 'action', label: 'Action', value: filters.action, onChange: (action) => set({ action }), options: ACTION_OPTIONS },
          { name: 'from', label: 'From', type: 'date', value: filters.from, onChange: (from) => set({ from }) },
          { name: 'to', label: 'To', type: 'date', value: filters.to, onChange: (to) => set({ to }) },
        ]}
      />
      <DataTable
        columns={columns}
        rows={state.rows}
        loading={state.loading}
        error={state.error}
        emptyMessage="No activity matches your filters."
      />
      <div className="mt-4">
        <Pagination meta={state.meta} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
      </div>
    </>
  );
}
