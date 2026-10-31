import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin.js';
import { formatDateTime } from '../../utils/format.js';
import PageHeader from '../../components/admin/PageHeader.jsx';
import StatusBadge from '../../components/admin/StatusBadge.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

function CountCard({ to, label, total, detail }) {
  return (
    <Link to={to} className="block border border-brown-400/30 border-l-4 border-l-brown-600 bg-white p-4 transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-brown-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-brown-700">{total}</p>
      <p className="mt-1 text-xs text-brown-600">{detail}</p>
    </Link>
  );
}

function Panel({ title, to, linkLabel, children }) {
  return (
    <section className="border border-brown-400/30 bg-white">
      <header className="flex items-center justify-between border-b border-brown-400/20 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-brown-700">{title}</h2>
        <Link to={to} className="text-xs font-semibold text-brown-600 underline underline-offset-2 hover:text-brown-900">
          {linkLabel}
        </Link>
      </header>
      {children}
    </section>
  );
}

export default function DashboardPage() {
  const [state, setState] = useState({ loading: true, data: null, error: '' });

  useEffect(() => {
    let cancelled = false;
    adminApi
      .stats()
      .then((data) => !cancelled && setState({ loading: false, data, error: '' }))
      .catch((err) => !cancelled && setState({ loading: false, data: null, error: err.message }));
    return () => {
      cancelled = true;
    };
  }, []);

  const { data } = state;
  const published = (s) => `${s.published} published · ${s.draft} draft`;

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your site content and enquiries." />

      {state.error && (
        <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CountCard to="/admin/sections" label="Sections" total={data.sections.total} detail={published(data.sections)} />
              <CountCard to="/admin/amenities" label="Amenities" total={data.amenities.total} detail={published(data.amenities)} />
              <CountCard to="/admin/gallery" label="Gallery photos" total={data.gallery.total} detail={published(data.gallery)} />
              <CountCard to="/admin/floor-plans" label="Floor plans" total={data.floorPlans.total} detail={published(data.floorPlans)} />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CountCard to="/admin/inquiries" label="Inquiries" total={data.inquiries.total} detail="All time" />
              {['new', 'contacted', 'closed'].map((status) => (
                <CountCard key={status} to={`/admin/inquiries?status=${status}`} label={`${status} inquiries`} total={data.inquiries[status]} detail="Filter inquiries" />
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <Panel title="Latest inquiries" to="/admin/inquiries" linkLabel="View all">
                {data.recentInquiries.length === 0 ? (
                  <p className="p-4 text-sm text-brown-600">No inquiries yet.</p>
                ) : (
                  <ul className="divide-y divide-brown-400/20">
                    {data.recentInquiries.map((inquiry) => (
                      <li key={inquiry._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-brown-900">{inquiry.name}</p>
                          <p className="truncate text-xs text-brown-600">
                            {inquiry.phone} · {formatDateTime(inquiry.createdAt)}
                          </p>
                        </div>
                        <StatusBadge value={inquiry.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Latest activity" to="/admin/logs" linkLabel="View all">
                {data.recentActivity.length === 0 ? (
                  <p className="p-4 text-sm text-brown-600">No activity yet.</p>
                ) : (
                  <ul className="divide-y divide-brown-400/20">
                    {data.recentActivity.map((log) => (
                      <li key={log._id} className="flex items-start gap-3 px-4 py-3 text-sm">
                        <StatusBadge value={log.action} />
                        <div className="min-w-0">
                          <p className="text-brown-900">{log.summary}</p>
                          <p className="truncate text-xs text-brown-600">
                            {log.userEmail} · {formatDateTime(log.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </>
        )
      )}
    </>
  );
}
