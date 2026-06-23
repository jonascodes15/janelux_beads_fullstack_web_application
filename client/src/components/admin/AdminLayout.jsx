import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Icons } from '../common/Icons';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: Icons.Dashboard, exact: true },
  { href: '/admin/products', label: 'Products', icon: Icons.Package },
  { href: '/admin/orders', label: 'Orders', icon: Icons.Truck },
  { href: '/admin/categories', label: 'Categories', icon: Icons.Tag },
  { href: '/admin/customers', label: 'Customers', icon: Icons.Users },
  { href: '/admin/coupons', label: 'Coupons', icon: Icons.Tag },
  { href: '/admin/reviews', label: 'Reviews', icon: Icons.Star },
  { href: '/admin/newsletter', label: 'Newsletter', icon: Icons.Mail },
  { href: '/admin/settings', label: 'Settings', icon: Icons.Settings },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (href, exact) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  const handleLogout = () => { logout(); navigate('/login'); };

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'flex flex-col h-full' : 'hidden lg:flex flex-col h-screen sticky top-0'} w-64 bg-obsidian border-r border-obsidian-border shrink-0`}>
      {/* Brand */}
      <div className="px-6 py-5 border-b border-obsidian-border shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg tracking-widest2 text-cream leading-none">JANELUX</p>
            <p className="font-sans text-[8px] tracking-widest3 text-gold/70 uppercase">ADMIN PANEL</p>
          </div>
          {mobile && (
            <button onClick={() => setSidebarOpen(false)} className="text-cream/40 hover:text-gold">
              <Icons.Close size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <li key={href}>
              <Link
                to={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-widest uppercase transition-all rounded-sm ${
                  isActive(href, exact)
                    ? 'bg-gold/10 text-gold border-l-2 border-gold pl-[10px]'
                    : 'text-cream/50 hover:text-cream hover:bg-obsidian-light border-l-2 border-transparent'
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User */}
      <div className="border-t border-obsidian-border px-4 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cream text-xs font-semibold truncate max-w-[140px]">{user?.full_name}</p>
            <p className="text-gold/50 text-[10px] tracking-widest uppercase">Administrator</p>
          </div>
          <button onClick={handleLogout} className="text-cream/30 hover:text-terracotta transition-colors p-1" title="Logout">
            <Icons.LogOut size={16} />
          </button>
        </div>
        <Link to="/" className="block text-cream/30 hover:text-gold text-[10px] tracking-widest uppercase mt-2 transition-colors">
          ← View Store
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-obsidian flex">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <Sidebar mobile />
          </div>
        </>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-obsidian-border bg-obsidian-mid flex items-center px-4 gap-4 sticky top-0 z-30 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-cream/60 hover:text-gold lg:hidden">
            <Icons.Menu size={22} />
          </button>
          <div className="flex-1" />
          <span className="text-cream/30 text-xs tracking-widest hidden sm:block">
            {new Date().toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
