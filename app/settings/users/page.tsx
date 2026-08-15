'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';

interface Karyawan {
  id: number;
  nama: string;
  role: string;
  password?: string;
  status: 'Aktif' | 'Nonaktif';
  allowedMenus: string[];
}

const AVAILABLE_MENUS = [
  { key: '/dashboard', label: 'Dashboard Master' },
  { key: '/kasir', label: 'Kasir POS' },
  { key: '/menu', label: 'Manajemen Menu' },
  { key: '/meja', label: 'Manajemen Meja' },
  { key: '/pemesanan', label: 'Pemesanan Pelanggan' },
  { key: '/settings/users', label: 'Pengaturan Akun' },
  { key: '/settings/system', label: 'Pengaturan Sistem' },
];

export default function UserSettingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [karyawan, setKaryawan] = useState<Karyawan[]>([
    { 
      id: 1, 
      nama: 'Matthew', 
      role: 'Master', 
      password: 'admin123',
      status: 'Aktif',
      allowedMenus: ['/dashboard', '/kasir', '/menu', '/meja', '/pemesanan', '/settings/users', '/settings/system'] 
    }
  ]);

  const [inputNama, setInputNama] = useState('');
  const [inputRole, setInputRole] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [selectedMenus, setSelectedMenus] = useState<string[]>(['/kasir', '/pemesanan']);

  const [editingUser, setEditingUser] = useState<Karyawan | null>(null);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const savedKaryawan = localStorage.getItem('rjresto_karyawan');
    if (savedKaryawan) {
      try {
        const parsed = JSON.parse(savedKaryawan);
        const normalized = parsed.map((user: any) => ({
          ...user,
          password: user.password || '123456',
          allowedMenus: Array.isArray(user.allowedMenus) ? user.allowedMenus : []
        }));
        setKaryawan(normalized);
      } catch (e) {
        console.error("Gagal parsing data karyawan", e);
      }
    }
  }, []);

  const handleCheckboxChange = (menuKey: string, isEditing: boolean = false) => {
    if (isEditing && editingUser) {
      const currentMenus = editingUser.allowedMenus || [];
      const updatedMenus = currentMenus.includes(menuKey)
        ? currentMenus.filter(m => m !== menuKey)
        : [...currentMenus, menuKey];
      setEditingUser({ ...editingUser, allowedMenus: updatedMenus });
    } else {
      setSelectedMenus(prev => 
        prev.includes(menuKey) ? prev.filter(m => m !== menuKey) : [...prev, menuKey]
      );
    }
  };

  const handleTambahKaryawan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNama.trim() || !inputRole.trim() || !inputPassword.trim()) {
      alert('Nama, Peran, dan Password karyawan wajib diisi!');
      return;
    }

    const newKaryawan: Karyawan = {
      id: Date.now(),
      nama: inputNama.trim(),
      role: inputRole.trim(),
      password: inputPassword.trim(),
      status: 'Aktif',
      allowedMenus: selectedMenus,
    };

    const updatedList = [newKaryawan, ...karyawan];
    setKaryawan(updatedList);
    localStorage.setItem('rjresto_karyawan', JSON.stringify(updatedList));

    setInputNama('');
    setInputRole('');
    setInputPassword('');
    setSelectedMenus(['/kasir', '/pemesanan']);
  };

  const handleHapusAkses = (id: number) => {
    if (confirm('Yakin ingin menghapus akses karyawan ini?')) {
      const updatedList = karyawan.filter((user) => user.id !== id);
      setKaryawan(updatedList);
      localStorage.setItem('rjresto_karyawan', JSON.stringify(updatedList));
    }
  };

  const handleResetPassword = (id: number, nama: string) => {
    const newPass = prompt(`Masukkan password baru untuk ${nama}:`);
    if (newPass !== null && newPass.trim() !== '') {
      const updatedList = karyawan.map(user => {
        if (user.id === id) {
          return { ...user, password: newPass.trim() };
        }
        return user;
      });
      setKaryawan(updatedList);
      localStorage.setItem('rjresto_karyawan', JSON.stringify(updatedList));
      alert(`Password untuk ${nama} berhasil direset!`);
    }
  };

  const toggleShowPassword = (id: number) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleStatus = (id: number) => {
    const updatedList = karyawan.map((user) => {
      if (user.id === id) {
        return {
          ...user,
          status: user.status === 'Aktif' ? ('Nonaktif' as const) : ('Aktif' as const),
        };
      }
      return user;
    });
    setKaryawan(updatedList);
    localStorage.setItem('rjresto_karyawan', JSON.stringify(updatedList));
  };

  const handleSaveMenuPermissions = () => {
    if (!editingUser) return;
    const updatedList = karyawan.map(user => user.id === editingUser.id ? editingUser : user);
    setKaryawan(updatedList);
    localStorage.setItem('rjresto_karyawan', JSON.stringify(updatedList));
    setEditingUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row">
      
      {/* SIDEBAR TERPUSAT AGAR SINKRON */}
      <Sidebar />

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl">
            <h1 className="text-2xl font-bold text-amber-400">Manajemen Pengguna & Kredensial Akses</h1>
            <p className="text-sm text-slate-400 mt-1">Kelola akun karyawan, lihat User ID, pantau atau reset password, serta atur batasan hak akses menu.</p>
          </div>
          
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl space-y-4">
            <h2 className="font-bold text-base text-white">Tambah Karyawan Baru & Atur Password</h2>
            <form onSubmit={handleTambahKaryawan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="text" 
                  placeholder="username / nama" 
                  value={inputNama}
                  onChange={(e) => setInputNama(e.target.value)}
                  className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-amber-500"
                />
                <input 
                  type="text" 
                  placeholder="Peran (Contoh: Kasir Shift Pagi)" 
                  value={inputRole}
                  onChange={(e) => setInputRole(e.target.value)}
                  className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-amber-500"
                />
                <input 
                  type="password" 
                  placeholder="Kata Sandi / Password" 
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Hak Akses Menu yang Bisa Dilihat & Digunakan:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-700">
                  {AVAILABLE_MENUS.map((menu) => (
                    <label key={menu.key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={selectedMenus.includes(menu.key)}
                        onChange={() => handleCheckboxChange(menu.key)}
                        className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-800 w-4 h-4"
                      />
                      {menu.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-xl transition shadow text-sm"
                >
                  + Tambah Karyawan
                </button>
              </div>
            </form>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-700">
              <h3 className="font-bold text-lg text-white">Daftar Karyawan Terdaftar ({karyawan.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User ID / Nama</th>
                    <th className="p-4">Password</th>
                    <th className="p-4">Peran</th>
                    <th className="p-4">Menu yang Diizinkan</th>
                    <th className="p-4 text-center">Status Akses</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-sm">
                  {karyawan.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Belum ada data karyawan.
                      </td>
                    </tr>
                  ) : (
                    karyawan.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-700/50 transition">
                        <td className="p-4">
                          <p className="font-semibold text-white">{user.nama}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {user.id}</span>
                        </td>
                        <td className="p-4 font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span>{showPasswords[user.id] ? (user.password || '123456') : '••••••••'}</span>
                            <button 
                              onClick={() => toggleShowPassword(user.id)}
                              className="text-xs text-amber-400 hover:underline bg-slate-900 px-2 py-1 rounded border border-slate-700"
                            >
                              {showPasswords[user.id] ? 'Sembunyi' : 'Lihat'}
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-700 text-amber-300 px-3 py-1 rounded-md text-xs font-semibold">
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {user.allowedMenus && user.allowedMenus.length > 0 ? (
                              user.allowedMenus.map((mKey) => {
                                const found = AVAILABLE_MENUS.find(am => am.key === mKey);
                                return (
                                  <span key={mKey} className="bg-slate-900 text-slate-300 text-[10px] px-2 py-0.5 rounded border border-slate-700">
                                    {found ? found.label : mKey}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-xs text-rose-400">Tidak ada akses menu</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleStatus(user.id)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                              user.status === 'Aktif'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                          >
                            {user.status === 'Aktif' ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="p-4 text-center space-x-1.5 whitespace-nowrap">
                          <button 
                            onClick={() => setEditingUser(user)}
                            className="bg-slate-700 hover:bg-slate-600 text-amber-400 text-xs font-bold px-2.5 py-1.5 rounded-lg transition border border-slate-600"
                          >
                            Atur Menu
                          </button>
                          <button 
                            onClick={() => handleResetPassword(user.id, user.nama)}
                            className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold px-2.5 py-1.5 rounded-lg transition border border-sky-500/30"
                          >
                            Reset Pass
                          </button>
                          <button 
                            onClick={() => handleHapusAkses(user.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold px-2.5 py-1.5 rounded-lg transition border border-red-500/30"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-amber-400">Atur Akses Menu: {editingUser.nama}</h3>
            <p className="text-xs text-slate-400">Centang menu yang diperbolehkan untuk dilihat dan dibuka oleh karyawan ini.</p>
            
            <div className="grid grid-cols-2 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-700 max-h-60 overflow-y-auto">
              {AVAILABLE_MENUS.map((menu) => (
                <label key={menu.key} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={(editingUser.allowedMenus || []).includes(menu.key)}
                    onChange={() => handleCheckboxChange(menu.key, true)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-800 w-4 h-4"
                  />
                  {menu.label}
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setEditingUser(null)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveMenuPermissions}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-5 py-2 rounded-xl text-xs transition shadow"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}