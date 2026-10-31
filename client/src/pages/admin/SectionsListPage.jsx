import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime } from '../../utils/format.js';
import { getSectionConfig } from '../../admin/sectionConfigs.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Toolbar from '../../components/admin/Toolbar.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';

export default function SectionsListPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('order');
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setState((s) => ({ ...s, loading: true, error: '' }));
      adminApi
        .list('sections', { search, status, sort, limit: 100 }, controller.signal)
        .then(({ data }) => setState({ loading: false, rows: data, error: '' }))
        .catch((err) => err.name !== 'AbortError' && setState((s) => ({ ...s, loading: false, error: err.message })));
    }, search ? 300 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, status, sort, reloadKey]);

  const togglePublish = useCallback(
    async (row) => {
      const next = row.status === 'published' ? 'draft' : 'published';
      setPendingId(row._id);
      try {
        await adminApi.setStatus('sections', row._id, next);
        toast.success(`${getSectionConfig(row.key).label} ${next === 'published' ? 'published' : 'moved to draft'}`);
        setReloadKey((n) => n + 1);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setPendingId(null);
      }
    },
    [toast],
  );

  const columns = [
    {
      key: 'key',
      header: 'Section',
      sortKey: 'key',
      cell: (row) => (
        <Link to={`/admin/sections/${row.key}`} className="font-semibold text-brown-700 underline-offset-2 hover:underline">
          {getSectionConfig(row.key).label}
          <span className="ml-2 font-normal text-brown-400">{row.key}</span>
        </Link>
      ),
    },
    { key: 'title', header: 'Heading', cell: (row) => <span className="line-clamp-1">{row.title || '—'}</span> },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
    { key: 'updatedAt', header: 'Updated', sortKey: 'updatedAt', cell: (row) => formatDateTime(row.updatedAt) },
  ];

  return (
    <>
      <PageHeader title="Sections" description="Every block of text, links and images on the public site. Pick a section to edit it." />
      <Toolbar
        search={search}
        onSearch={setSearch}
        searchPlaceholder="Search sections…"
        filters={[
          {
            name: 'status',
            label: 'Status',
            value: status,
            onChange: setStatus,
            options: [
              { value: '', label: 'All' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
            ],
          },
        ]}
      />
      <DataTable
        columns={columns}
        rows={state.rows}
        loading={state.loading}
        error={state.error}
        sort={sort}
        onSort={setSort}
        emptyMessage="No sections match your filters."
        actions={(row) => (
          <>
            <Button variant="ghost" size="sm" disabled={pendingId === row._id} onClick={() => togglePublish(row)}>
              {row.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
            <Button variant="primary" size="sm" href={`/admin/sections/${row.key}`}>
              <Pencil size={14} /> Edit
            </Button>
          </>
        )}
      />
    </>
  );
}
