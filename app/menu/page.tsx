'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
// Import inisialisasi firebase Anda (sesuaikan path foldernya)
import { db } from '@/lib/firebase'; 
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot 
} from 'firebase/firestore';

interface MenuItem {
  id: string; // Firestore menggunakan string untuk ID dokumen
  nama: string;
  harga: number;
  kategori: string;
  deskripsi?: string;
  tersedia?: boolean;
}

// Komponen Sidebar Terpadu di dalam file yang sama
function Sidebar() {
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
          namaLower === 'Demo' || 
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
    { name: 'Pemesanan Pelanggan', href: '/pesan', icon: '📱' },
    { name: 'Pengaturan Akun', href: '/settings/users', icon: '👥' },
    { name: 'Pengaturan Sistem', href: '/settings/system', icon: '⚙️' },
  ];

  const filteredMenus = menuItems.filter(item => allowedMenus.includes(item.href));

  return (
    <>
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

      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm md:hidden"
        />
      )}

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

export default function ManajemenMenuPage() {
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [kategori, setKategori] = useState('Makanan');
  const [deskripsi, setDeskripsi] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('Semua');

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editNama, setEditNama] = useState('');
  const [editHarga, setEditHarga] = useState('');
  const [editKategori, setEditKategori] = useState('Makanan');
  const [editDeskripsi, setEditDeskripsi] = useState('');

  // Mengambil data secara real-time dari Firestore koleksi 'menu'
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items: MenuItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuItem, 'id'>)
      }));
      setMenuList(items);
    }, (error) => {
      console.error("Gagal mengambil data menu dari Firebase:", error);
    });

    return () => unsubscribe();
  }, []);

  const tambahMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !harga) return alert('Nama dan harga wajib diisi!');

    try {
      await addDoc(collection(db, 'menu'), {
        nama,
        harga: Number(harga),
        kategori,
        deskripsi,
        tersedia: true,
      });

      setNama('');
      setHarga('');
      setDeskripsi('');
    } catch (error) {
      console.error("Gagal menambah menu:", error);
      alert('Terjadi kesalahan saat menyimpan ke database.');
    }
  };

  const hapusMenu = async (id: string) => {
    if (confirm('Yakin ingin menghapus menu ini?')) {
      try {
        await deleteDoc(doc(db, 'menu', id));
      } catch (error) {
        console.error("Gagal menghapus menu:", error);
        alert('Terjadi kesalahan saat menghapus data.');
      }
    }
  };

  const toggleKetersediaan = async (item: MenuItem) => {
    try {
      const menuRef = doc(db, 'menu', item.id);
      await updateDoc(menuRef, {
        tersedia: item.tersedia === false ? true : false
      });
    } catch (error) {
      console.error("Gagal mengubah ketersediaan:", error);
    }
  };

  const mulaiEdit = (item: MenuItem) => {
    setEditingItem(item);
    setEditNama(item.nama);
    setEditHarga(item.harga.toString());
    setEditKategori(item.kategori);
    setEditDeskripsi(item.deskripsi || '');
  };

  const simpanEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editNama || !editHarga) return alert('Nama dan harga wajib diisi!');

    try {
      const menuRef = doc(db, 'menu', editingItem.id);
      await updateDoc(menuRef, {
        nama: editNama,
        harga: Number(editHarga),
        kategori: editKategori,
        deskripsi: editDeskripsi,
      });

      setEditingItem(null);
    } catch (error) {
      console.error("Gagal memperbarui menu:", error);
      alert('Terjadi kesalahan saat memperbarui data.');
    }
  };

  const filteredMenu = menuList.filter((item) => {
    const matchesSearch = item.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.deskripsi && item.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedKategori === 'Semua' || item.kategori === selectedKategori;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      
      {/* SIDEBAR TERPADU */}
      <Sidebar />

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Header Konten */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div>
              <h1 className="text-2xl font-bold text-amber-400">Manajemen Menu</h1>
              <p className="text-sm text-slate-400 mt-1">Tambah, edit, cari, dan kelola ketersediaan menu makanan & minuman (Firebase).</p>
            </div>
            <Link href="/kasir" className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition border border-slate-700">
              &larr; Ke Halaman Kasir
            </Link>
          </div>

          {/* Form Tambah Menu */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              Tambah Menu Baru
            </h2>
            <form onSubmit={tambahMenu} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <input 
                type="text" 
                placeholder="Nama Makanan/Minuman" 
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
              <input 
                type="number" 
                placeholder="Harga (Contoh: 15000)" 
                value={harga}
                onChange={(e) => setHarga(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
              <select 
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-300"
              >
                <option value="Makanan">Makanan</option>
                <option value="Minuman">Minuman</option>
                <option value="Cemilan">Cemilan</option>
                <option value="Dessert">Dessert</option>
              </select>
              <input 
                type="text" 
                placeholder="Deskripsi singkat (opsional)" 
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
              <button 
                type="submit" 
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
              >
                + Simpan Menu
              </button>
            </form>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {['Semua', 'Makanan', 'Minuman', 'Cemilan', 'Dessert'].map((kat) => (
                <button
                  key={kat}
                  onClick={() => setSelectedKategori(kat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedKategori === kat
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>
            <div className="w-full md:w-72">
              <input
                type="text"
                placeholder="Cari nama menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Daftar Menu Saat Ini */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">Daftar Menu Tersedia ({filteredMenu.length})</h3>
              <span className="text-xs text-slate-400">Total keseluruhan: {menuList.length} menu</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Nama Menu & Deskripsi</th>
                    <th className="py-4 px-6">Kategori</th>
                    <th className="py-4 px-6">Harga</th>
                    <th className="py-4 px-6 text-center">Status</th>
                    <th className="py-4 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredMenu.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        Tidak ada menu yang ditemukan sesuai pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredMenu.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white text-base">{item.nama}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{item.deskripsi || 'Tidak ada deskripsi'}</div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-800 text-amber-300 text-xs px-2.5 py-1 rounded-md font-semibold">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-amber-400">Rp {item.harga.toLocaleString('id-ID')}</td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => toggleKetersediaan(item)}
                            className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                              item.tersedia !== false
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                          >
                            {item.tersedia !== false ? 'Tersedia' : 'Habis'}
                          </button>
                        </td>
                        <td className="py-4 px-6 text-center space-x-2">
                          <button 
                            onClick={() => mulaiEdit(item)}
                            className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 text-xs font-bold px-3 py-1.5 rounded-lg transition border border-sky-500/30"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => hapusMenu(item.id)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg transition border border-red-500/30"
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

          {/* Modal Edit Menu */}
          {editingItem && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
                <h3 className="text-lg font-bold text-amber-400">Edit Menu</h3>
                <form onSubmit={simpanEdit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nama Menu</label>
                    <input 
                      type="text" 
                      value={editNama}
                      onChange={(e) => setEditNama(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Harga (Rp)</label>
                    <input 
                      type="number" 
                      value={editHarga}
                      onChange={(e) => setEditHarga(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Kategori</label>
                    <select 
                      value={editKategori}
                      onChange={(e) => setEditKategori(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-slate-300"
                    >
                      <option value="Makanan">Makanan</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Cemilan">Cemilan</option>
                      <option value="Dessert">Dessert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Deskripsi Singkat</label>
                    <input 
                      type="text" 
                      value={editDeskripsi}
                      onChange={(e) => setEditDeskripsi(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setEditingItem(null)}
                      className="bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl transition shadow"
                    >
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}