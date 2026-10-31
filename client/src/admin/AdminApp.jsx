import { Navigate, Route, Routes } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import ProtectedRoute from '../components/admin/ProtectedRoute.jsx';
import AdminLayout from '../components/admin/AdminLayout.jsx';
import LoginPage from '../pages/admin/LoginPage.jsx';
import DashboardPage from '../pages/admin/DashboardPage.jsx';
import SectionsListPage from '../pages/admin/SectionsListPage.jsx';
import SectionEditorPage from '../pages/admin/SectionEditorPage.jsx';
import ResourcePage from '../pages/admin/ResourcePage.jsx';
import InquiriesPage from '../pages/admin/InquiriesPage.jsx';
import LogsPage from '../pages/admin/LogsPage.jsx';
import AccountPage from '../pages/admin/AccountPage.jsx';
import { resourceConfigs } from './resourceConfigs.jsx';

// Mounted at /admin/* and code-split from the public site
export default function AdminApp() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Helmet>
            <title>Admin · One Chembur</title>
            <meta name="robots" content="noindex, nofollow" />
          </Helmet>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="sections" element={<SectionsListPage />} />
                <Route path="sections/:key" element={<SectionEditorPage />} />
                {Object.values(resourceConfigs).map((config) => (
                  <Route key={config.path} path={config.path} element={<ResourcePage key={config.path} config={config} />} />
                ))}
                <Route path="inquiries" element={<InquiriesPage />} />
                <Route path="logs" element={<LogsPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
