import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDateTime } from '../../utils/format.js';
import { isBuiltInSection } from '../../utils/sectionKeys.js';
import { SECTION_KEY_PATTERN, getSectionConfig } from '../../admin/sectionConfigs.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Toolbar from '../../components/admin/Toolbar.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import SectionForm from '../../components/admin/SectionForm.jsx';
import Button from '../../components/ui/Button.jsx';
import Modal from '../../components/ui/Modal.jsx';

const newSectionFields = [
  {
    name: 'key',
    label: 'Key',
    type: 'text',
    required: true,
    maxLength: 40,
    pattern: SECTION_KEY_PATTERN,
    patternMessage: 'Start with a lowercase letter; use letters, numbers or dashes (2-40 characters)',
    hint: 'Short and permanent, e.g. offers or neighbourhood. It cannot be changed later.',
  },
  { name: 'title', label: 'Heading', type: 'text', required: true, maxLength: 200 },
];

export default function SectionsListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('order');
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  const [reloadKey, setReloadKey] = useState(0);
  const [pendingId, setPendingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletePending, setDeletePending] = useState(false);

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
        toast.success(`${row.title || row.key} ${next === 'published' ? 'published' : 'moved to draft'}`);
        setReloadKey((n) => n + 1);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setPendingId(null);
      }
    },
    [toast],
  );

  // New custom sections start as drafts; the editor opens straight away to write the content
  const createSection = async ({ key, title }) => {
    const created = await adminApi.create('sections', {
      key,
      title,
      content: { imagePosition: 'right', background: 'white', cta: { label: '', href: '' } },
      status: 'draft',
      order: 100,
    });
    toast.success('Section created as a draft. Add its content below.');
    navigate(`/admin/sections/${created.key}`);
  };

  const confirmDelete = async () => {
    setDeletePending(true);
    try {
      await adminApi.remove('sections', deleting._id);
      toast.success(`Deleted section “${deleting.key}”`);
      setDeleting(null);
      setReloadKey((n) => n + 1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletePending(false);
    }
  };

  const columns = [
    {
      key: 'key',
      header: 'Section',
      sortKey: 'key',
      cell: (row) => (
        <Link to={`/admin/sections/${row.key}`} className="font-semibold text-brown-700 underline-offset-2 hover:underline">
          {isBuiltInSection(row.key) ? getSectionConfig(row.key).label : row.title || row.key}
          <span className="ml-2 font-normal text-brown-400">{row.key}</span>
        </Link>
      ),
    },
    { key: 'type', header: 'Type', cell: (row) => (isBuiltInSection(row.key) ? 'Built-in' : 'Custom') },
    { key: 'title', header: 'Heading', cell: (row) => <span className="line-clamp-1">{row.title || '—'}</span> },
    { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
    { key: 'updatedAt', header: 'Updated', sortKey: 'updatedAt', cell: (row) => formatDateTime(row.updatedAt) },
  ];

  return (
    <>
      <PageHeader title="Sections" description="Every block of text, links and images on the public site. Built-in sections can be edited and unpublished; add your own custom sections too.">
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} /> New section
        </Button>
      </PageHeader>
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
            {/* Built-in blocks are part of the page layout, so they can be unpublished but not deleted */}
            {!isBuiltInSection(row.key) && (
              <Button variant="ghost" size="sm" onClick={() => setDeleting(row)} aria-label={`Delete section ${row.key}`} title="Delete">
                <Trash2 size={14} />
              </Button>
            )}
          </>
        )}
      />

      <Modal open={creating} onClose={() => setCreating(false)} title="New custom section">
        {creating && (
          <SectionForm fields={newSectionFields} initialValues={{ key: '', title: '' }} onSubmit={createSection} onCancel={() => setCreating(false)} submitLabel="Create" />
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete section?"
        message={`“${deleting?.title || deleting?.key || ''}” will be permanently removed from the site. This can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={deletePending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </>
  );
}
