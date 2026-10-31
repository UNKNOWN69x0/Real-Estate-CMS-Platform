import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Eye, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Pagination from '../../components/admin/Pagination.jsx';
import Toolbar from '../../components/admin/Toolbar.jsx';
import SectionForm from '../../components/admin/SectionForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';

const STATUSES = ['new', 'contacted', 'closed'];
const STATUS_OPTIONS = [{ value: '', label: 'All' }, ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))];

const detailFields = [
  { name: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS.slice(1) },
  { name: 'notes', label: 'Internal notes', type: 'textarea', rows: 4, maxLength: 1000, hint: 'Only visible to admins' },
];

export default function InquiriesPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [params, setParams] = useState({ search: '', status: searchParams.get('status') ?? '', page: 1, sort: '-createdAt' });
  const [state, setState] = useState({ loading: true, rows: [], meta: null, error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [selected, setSelected] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setParams((p) => (p.search === searchInput ? p : { ...p, search: searchInput, page: 1 })), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: '' }));
    adminApi
      .list('inquiries', { ...params, limit: 10 }, controller.signal)
      .then(({ data, meta }) => {
        if (!data.length && meta.page > 1) setParams((p) => ({ ...p, page: meta.pages }));
        else setState({ loading: false, rows: data, meta, error: '' });
      })
      .catch((err) => err.name !== 'AbortError' && setState((s) => ({ ...s, loading: false, error: err.message })));
    return () => controller.abort();
  }, [params, reloadKey]);

  const changeStatus = async (row, status) => {
    setPendingId(row._id);
    try {
      await adminApi.update('inquiries', row._id, { status });
      toast.success(`Marked ${row.name} as ${status}`);
      setReloadKey((n) => n + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    setDeletePending(true);
    try {
      await adminApi.remove('inquiries', deleting._id);
      toast.success(`Deleted inquiry from ${deleting.name}`);
      setDeleting(null);
      setReloadKey((n) => n + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletePending(false);
    }
  };

  const saveDetails = async (payload) => {
    await adminApi.update('inquiries', selected._id, payload);
    toast.success('Inquiry updated');
    setSelected(null);
    setReloadKey((n) => n + 1);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const blob = await adminApi.exportInquiries({ search: params.search, status: params.status, sort: params.sort });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = `inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(href);
      toast.success('Exported inquiries as CSV');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', sortKey: 'name', cell: (row) => <span className="font-semibold">{row.name}</span> },
    {
      key: 'contact',
      header: 'Contact',
      cell: (row) => (
        <span className="block break-all">
          <a href={`tel:${row.phone.replace(/[^\d+]/g, '')}`} className="underline-offset-2 hover:underline">{row.phone}</a>
          {row.email && <span className="block text-xs text-brown-600">{row.email}</span>}
        </span>
      ),
    },
    { key: 'message', header: 'Message', className: 'max-w-xs', cell: (row) => <span className="line-clamp-2">{row.message || '—'}</span> },
    { key: 'createdAt', header: 'Received', sortKey: 'createdAt', cell: (row) => formatDateTime(row.createdAt) },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (row) => (
        <select
          aria-label={`Status for ${row.name}`}
          value={row.status}
          disabled={pendingId === row._id}
          onChange={(e) => changeStatus(row, e.target.value)}
          className="border border-brown-400/50 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wider text-brown-900 disabled:opacity-50"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Inquiries" description="Leads from the enquiry form. Update their status and keep notes.">
        <Button variant="ghost" onClick={exportCsv} disabled={exporting || !state.meta?.total}>
          <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
      </PageHeader>

      <Toolbar
        search={searchInput}
        onSearch={setSearchInput}
        searchPlaceholder="Search name, phone, email, message…"
        filters={[{ name: 'status', label: 'Status', value: params.status, onChange: (status) => setParams((p) => ({ ...p, status, page: 1 })), options: STATUS_OPTIONS }]}
      />

      <DataTable
        columns={columns}
        rows={state.rows}
        loading={state.loading}
        error={state.error}
        sort={params.sort}
        onSort={(sort) => setParams((p) => ({ ...p, sort, page: 1 }))}
        emptyMessage={params.search || params.status ? 'No inquiries match your filters.' : 'No inquiries yet.'}
        actions={(row) => (
          <>
            <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
              <Eye size={14} /> Details
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleting(row)} aria-label={`Delete inquiry from ${row.name}`} title="Delete">
              <Trash2 size={14} />
            </Button>
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete inquiry?"
        message={`The inquiry from “${deleting?.name ?? ''}” will be permanently removed. This can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />

      <div className="mt-4">
        <Pagination meta={state.meta} onPage={(page) => setParams((p) => ({ ...p, page }))} />
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} size="lg" title="Inquiry details">
        {selected && (
          <>
            <dl className="mb-5 grid gap-3 border border-brown-400/30 bg-white p-4 text-sm sm:grid-cols-2">
              {[
                ['Name', selected.name],
                ['Phone', selected.phone],
                ['Email', selected.email || '—'],
                ['Received', formatDateTime(selected.createdAt)],
                ['Source', selected.source],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs uppercase tracking-wider text-brown-600">{label}</dt>
                  <dd className="break-all text-brown-900">{value}</dd>
                </div>
              ))}
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-wider text-brown-600">Message</dt>
                <dd className="whitespace-pre-wrap text-brown-900">{selected.message || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-brown-600">Current status</dt>
                <dd><StatusBadge value={selected.status} /></dd>
              </div>
            </dl>
            <SectionForm
              key={selected._id}
              fields={detailFields}
              initialValues={selected}
              onSubmit={saveDetails}
              onCancel={() => setSelected(null)}
              submitLabel="Save"
            />
          </>
        )}
      </Modal>
    </>
  );
}
