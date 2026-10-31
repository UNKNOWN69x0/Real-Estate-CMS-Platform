import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Skeleton from '../ui/Skeleton.jsx';

export default function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="grid min-h-svh place-items-center bg-sand p-6" aria-busy="true" aria-label="Loading">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  }
  if (status === 'anon') return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
