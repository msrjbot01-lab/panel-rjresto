'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [allowedMenus, setAllowedMenus] = useState<string[]>([]);
  const [currentUserName, setCurrentUserName] = useState('Karyawan');
  const [currentUserRole, setCurrentUserRole] = useState('Master');
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const currentUserStr = localStorage.getItem('rjresto_current_user');
    
    const defaultMenus = [
      '/dashboard', 
      '/kasir', 
      '/menu', 
      '/meja', 
      '/pesan', 
      '/settings/users', 
      '/settings/system'
    ];

    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        setCurrentUserName(user.nama || 'Karyawan');
        setCurrentUserRole(user.role || 'Master');

        const roleLower = (user.role || '').trim().toLowerCase();
        const namaLower = (user.nama || '').trim().toLowerCase();

        if (
          roleLower === 'master' || 
          roleLower === 'super admin' || 
          roleLower === 'admin' || 
          namaLower === 'matthew' || 
          namaLower === 'admin'
        ) {
          setAllowedMenus(defaultMenus);
        } else {
          let userMenus = Array.isArray(user.allowedMenus) ? [...user.allowedMenus] : [];
          if (!userMenus.includes('/meja')) {
            userMenus.push('/meja');
          }
          setAllowedMenus(userMenus);
        }
      } catch (e) {
        console.error("Gagal parsing user session", e);
        setAllowedMenus(defaultMenus);
      }
    } else {
      setAllowedMenus(defaultMenus);
    }
  }, []);

  const handleLogout = () => {
    document.cookie = "isAuthenticated=; path=/; max-age=0";
    localStorage.removeItem('rjresto_current_user');
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard Master', href: '/dashboard', icon: '📊' },
    { name: 'Kasir POS', href: '/kasir', icon: '💻' },
    { name: 'Manajemen Menu', href: '/menu', icon: '📋' },
    { name: 'Manajemen Meja', href: '/meja', icon: '🪑' },
    { name: 'Pemesanan Pelanggan', href: '/pemesanan', icon: '📱' },
    { name: 'Pengaturan Akun', href: '/settings/users', icon: '👥' },
    { name: 'Pengaturan Sistem', href: '/settings/system', icon: '⚙️' },
  ];

  const filteredMenus = menuItems.filter(item => allowedMenus.includes(item.href));

  return (
    <>
      {/* Mobile Header Navbar */}
      <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-800 sticky top-0 z-50 md:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-white text-2xl focus:outline-none bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition"
            aria-label="Toggle Menu"
          >
            ☰
          </button>
          <div>
            <h1 className="font-bold text-amber-400">RJResto Panel</h1>
            <p className="text-[10px] text-slate-400">👤 {currentUserName} ({currentUserRole})</p>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-white transform transition-transform duration-300 ease-in-out flex flex-col justify-between md:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold text-amber-400">RJResto Panel</h2>
              <p className="text-xs text-slate-400 mt-0.5">Sistem Manajemen Restoran</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>
          </div>

          <nav className="p-4 space-y-2 flex-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">MENU NAVIGASI</p>
            {filteredMenus.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                    isActive 
                      ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-950/50 shrink-0 space-y-3">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <p className="text-xs text-slate-400">Akun Aktif:</p>
              <p className="text-sm font-bold text-amber-400 truncate capitalize">👤 {currentUserName} ({currentUserRole})</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              <span>🚪</span> Keluar (Logout)
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay Backdrop Mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-white justify-between shrink-0 p-6 min-h-screen">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-amber-400">RJResto Panel</h2>
            <p className="text-xs text-slate-400 mt-0.5">Sistem Manajemen Restoran</p>
          </div>

          <nav className="space-y-2">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">MENU NAVIGASI</p>
            {filteredMenus.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition ${
                    isActive 
                      ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
            <p className="text-xs text-slate-400">Akun Aktif:</p>
            <p className="text-sm font-bold text-amber-400 truncate capitalize">👤 {currentUserName} ({currentUserRole})</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <span>🚪</span> Keluar (Logout)
          </button>
        </div>
      </aside>
    </>
  );
}