import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '../../api/admin.js';
import { useToast } from '../../context/ToastContext.jsx';
import { getSectionConfig, orderField, seoFields, statusField } from '../../admin/sectionConfigs.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import SectionForm from '../../components/admin/SectionForm.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

export default function SectionEditorPage() {
  const { key } = useParams();
  const toast = useToast();
  const [state, setState] = useState({ loading: true, section: null, error: '' });
  const [version, setVersion] = useState(0); // bumping remounts the form with fresh server data

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true, section: null, error: '' });
    // The admin API looks sections up by id, so find this key in the (small) full list
    adminApi
      .list('sections', { search: key, limit: 100 }, controller.signal)
      .then(({ data }) => {
        const section = data.find((s) => s.key === key);
        setState(section ? { loading: false, section, error: '' } : { loading: false, section: null, error: `No section called “${key}”.` });
      })
      .catch((err) => err.name !== 'AbortError' && setState({ loading: false, section: null, error: err.message }));
    return () => controller.abort();
  }, [key]);

  const config = getSectionConfig(key);
  const fields = [...config.fields, ...seoFields, orderField, statusField];

  const save = useCallback(
    async (payload) => {
      const updated = await adminApi.update('sections', state.section._id, payload);
      setState((s) => ({ ...s, section: updated }));
      setVersion((v) => v + 1);
      toast.success(`${config.label} saved${updated.status === 'published' ? ' and live on the site' : ' as a draft'}`);
    },
    [state.section, config.label, toast],
  );

  return (
    <>
      <Link to="/admin/sections" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brown-600 hover:text-brown-900">
        <ArrowLeft size={16} /> All sections
      </Link>

      <PageHeader title={config.label} description={config.description}>
        {state.section && <StatusBadge value={state.section.status} />}
      </PageHeader>

      {state.loading && (
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      )}

      {state.error && (
        <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.section && (
        <div className="max-w-3xl border border-brown-400/30 bg-white p-4 sm:p-6">
          <SectionForm
            key={`${state.section._id}-${version}`}
            fields={fields}
            initialValues={state.section}
            onSubmit={save}
            submitLabel="Save changes"
            requireDirty
          />
        </div>
      )}
    </>
  );
}
