import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ExternalLink, Images, Inbox, KeyRound, Layers, LayoutDashboard, LogOut, Menu, Ruler, ScrollText, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sections', label: 'Sections', icon: Layers },
  { to: '/admin/amenities', label: 'Amenities', icon: Sparkles },
  { to: '/admin/gallery', label: 'Gallery', icon: Images },
  { to: '/admin/floor-plans', label: 'Floor Plans', icon: Ruler },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox },
  { to: '/admin/logs', label: 'Activity Logs', icon: ScrollText },
  { to: '/admin/account', label: 'Account', icon: KeyRound },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
  }`;

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error('Could not log out cleanly, but your session on this device was cleared.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5">
        <p className="text-[0.55rem] font-medium uppercase tracking-[0.25em] text-white/70">Codename</p>
        <p className="-my-0.5 text-3xl font-bold lowercase leading-none text-white">one</p>
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-white">Chembur · Admin</p>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-0.5 overflow-y-auto px-2">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate} className={linkClass}>
            <Icon size={18} aria-hidden="true" /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/15 px-2 py-3">
        <a href="/" target="_blank" rel="noopener noreferrer" className={linkClass({ isActive: false })}>
          <ExternalLink size={18} aria-hidden="true" /> View site
        </a>
        <button type="button" onClick={handleLogout} className={`${linkClass({ isActive: false })} w-full`}>
          <LogOut size={18} aria-hidden="true" /> Log out
        </button>
        {user && <p className="truncate px-4 pt-2 text-xs text-white/60">{user.email}</p>}
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="min-h-svh bg-sand lg:pl-60">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 bg-gradient-to-b from-brown-600 to-brown-800 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-brown-600 px-4 shadow-md lg:hidden">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">One Chembur · Admin</p>
        <button type="button" aria-label="Open menu" aria-expanded={open} aria-controls="admin-drawer" onClick={() => setOpen(true)} className="p-2 text-white">
          <Menu size={24} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-brown-900/60" onClick={() => setOpen(false)} />
          <aside id="admin-drawer" className="absolute inset-y-0 left-0 w-64 max-w-[85%] bg-gradient-to-b from-brown-600 to-brown-800 shadow-2xl">
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-2 top-3 p-2 text-white">
              <X size={22} />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        <Outlet />
      </main>
    </div>
  );
}
