import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SectionsProvider } from './context/SectionsContext.jsx';
import { InquiryProvider } from './context/InquiryContext.jsx';
import HomePage from './pages/public/HomePage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

// The admin panel is a separate chunk so public visitors never download it
const AdminApp = lazy(() => import('./admin/AdminApp.jsx'));

const AdminFallback = (
  <div className="grid min-h-svh place-items-center bg-sand text-sm text-brown-600" role="status">
    Loading admin…
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <SectionsProvider>
            <InquiryProvider>
              <HomePage />
            </InquiryProvider>
          </SectionsProvider>
        }
      />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={AdminFallback}>
            <AdminApp />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
