import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../../context/ToastContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import Toolbar from '../../components/admin/Toolbar.jsx';
import PageHeader from '../../components/admin/PageHeader.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import SectionForm from '../../components/admin/SectionForm.jsx';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

/**
 * Generic list + create/edit modal + delete confirm + publish toggle for one CMS collection.
 * Everything specific (fields, columns, labels) comes from `config` in admin/resourceConfigs.jsx.
 */
export default function ResourcePage({ config }) {
  const toast = useToast();
  const { path, singular, fields, columns } = config;

  const [searchInput, setSearchInput] = useState('');
  const [params, setParams] = useState({ search: '', status: '', page: 1, sort: config.defaultSort });
  const [state, setState] = useState({ loading: true, rows: [], meta: null, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState(null); // { mode: 'create' | 'edit', record }
  const [deleting, setDeleting] = useState(null);
  const [deletePending, setDeletePending] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  // Debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setParams((p) => (p.search === searchInput ? p : { ...p, search: searchInput, page: 1 })), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: '' }));
    adminApi
      .list(path, { ...params, limit: PAGE_SIZE }, controller.signal)
      .then(({ data, meta }) => {
        // Deleting the last row of a page leaves an empty page: step back
        if (!data.length && meta.page > 1) setParams((p) => ({ ...p, page: meta.pages }));
        else setState({ loading: false, rows: data, meta, error: '' });
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: err.message }));
      });
    return () => controller.abort();
  }, [path, params, reloadKey]);

  const setParam = (patch) => setParams((p) => ({ ...p, page: 1, ...patch }));

  const save = async (payload) => {
    if (editing.mode === 'create') await adminApi.create(path, payload);
    else await adminApi.update(path, editing.record._id, payload);
    toast.success(`${singular[0].toUpperCase()}${singular.slice(1)} ${editing.mode === 'create' ? 'created' : 'updated'}`);
    setEditing(null);
    reload();
  };

  const confirmDelete = async () => {
    setDeletePending(true);
    try {
      await adminApi.remove(path, deleting._id);
      toast.success(`Deleted ${singular}`);
      setDeleting(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletePending(false);
    }
  };

  const togglePublish = async (row) => {
    const next = row.status === 'published' ? 'draft' : 'published';
    setPendingId(row._id);
    try {
      await adminApi.setStatus(path, row._id, next);
      toast.success(next === 'published' ? 'Published' : 'Moved to draft');
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const tableColumns = [
    ...columns,
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <button
          type="button"
          role="switch"
          aria-checked={row.status === 'published'}
          aria-label={`${row.status === 'published' ? 'Unpublish' : 'Publish'} ${row[fields[0].name]}`}
          disabled={pendingId === row._id}
          onClick={() => togglePublish(row)}
          className="inline-flex items-center gap-2 disabled:opacity-50"
        >
          <span className={`relative h-5 w-9 rounded-full transition-colors ${row.status === 'published' ? 'bg-green-600' : 'bg-stone-300'}`}>
            <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${row.status === 'published' ? 'left-[1.1rem]' : 'left-0.5'}`} />
          </span>
          <StatusBadge value={row.status} />
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title={config.title} description={config.description}>
        <Button onClick={() => setEditing({ mode: 'create', record: config.newRecord })}>
          <Plus size={16} /> New {singular}
        </Button>
      </PageHeader>

      <Toolbar
        search={searchInput}
        onSearch={setSearchInput}
        searchPlaceholder={config.searchPlaceholder}
        filters={[{ name: 'status', label: 'Status', value: params.status, onChange: (status) => setParam({ status }), options: STATUS_OPTIONS }]}
      />

      <DataTable
        columns={tableColumns}
        rows={state.rows}
        loading={state.loading}
        error={state.error}
        sort={params.sort}
        onSort={(sort) => setParam({ sort })}
        emptyMessage={params.search || params.status ? `No ${config.title.toLowerCase()} match your filters.` : `No ${config.title.toLowerCase()} yet. Create the first one.`}
        actions={(row) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => setEditing({ mode: 'edit', record: row })}>
              <Pencil size={14} /> Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)} aria-label={`Delete ${row[fields[0].name]}`}>
              <Trash2 size={14} /> Delete
            </Button>
          </>
        )}
      />

      <div className="mt-4">
        <Pagination meta={state.meta} onPage={(page) => setParams((p) => ({ ...p, page }))} />
      </div>

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} size="lg" title={editing?.mode === 'create' ? `New ${singular}` : `Edit ${singular}`}>
        {editing && (
          <SectionForm
            // key remounts the form (fresh state) for each record or after reopening
            key={editing.record._id ?? 'new'}
            fields={fields}
            initialValues={editing.record}
            onSubmit={save}
            onCancel={() => setEditing(null)}
            submitLabel={editing.mode === 'create' ? 'Create' : 'Save changes'}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${singular}?`}
        message={`“${deleting?.[fields[0].name] ?? ''}” will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
