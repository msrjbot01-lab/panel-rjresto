'use client';
import { useState, useEffect } from 'react';
import Sidebar '@/app/components/Sidebar';
// Import Firebase Firestore
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

interface CartItem {
  id: number;
  nama: string;
  harga: number;
  qty: number;
}

interface Transaction {
  id: string;
  time: string;
  date: string;
  itemsCount: number;
  subtotal: number;
  diskonPersen: number;
  nilaiDiskon: number;
  total: number;
  uangDibayar: number;
  kembalian: number;
  metode: string;
  tipePesanan: string;
  nomorMeja: string;
  statusPesanan: string;
  status: string;
  namaKasir?: string;       
  namaPelanggan?: string;   
  items: CartItem[];
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [currentUserName, setCurrentUserName] = useState('Karyawan');
  const [currentUserRole, setCurrentUserRole] = useState('Master');

  // Ambil sesi user dari localStorage (hanya untuk identifikasi role & nama di sisi klien)
  useEffect(() => {
    const currentUserStr = localStorage.getItem('rjresto_current_user');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        setCurrentUserName(user.nama || user.username || 'Karyawan');
        setCurrentUserRole(user.role || 'Master');
      } catch (e) {
        console.error("Gagal parsing user session", e);
      }
    }

    // Ambil data transaksi langsung dari Firestore
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const q = query(collection(db, 'transactions'));
      const querySnapshot = await getDocs(q);
      const fetchedTx: Transaction[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedTx.push({
          id: docSnap.id,
          ...data,
        } as Transaction);
      });
      setTransactions(fetchedTx);
    } catch (e) {
      console.error("Gagal mengambil transaksi dari Firebase:", e);
    }
  };

  const roleLower = currentUserRole.trim().toLowerCase();
  const nameLower = currentUserName.trim().toLowerCase();
  const isMasterOrAdmin = 
    roleLower === 'master' || 
    roleLower === 'super admin' || 
    roleLower === 'admin' || 
    nameLower === 'matthew' || 
    nameLower === 'admin';

  const clearData = async () => {
    if (!isMasterOrAdmin) {
      alert('Akses ditolak! Hanya Akun Master/Admin yang diizinkan mereset data.');
      return;
    }
    if (confirm('Yakin ingin menghapus semua riwayat transaksi dari database Firebase?')) {
      try {
        // Hapus semua dokumen transaksi di Firestore
        const querySnapshot = await getDocs(collection(db, 'transactions'));
        const deletePromises = querySnapshot.docs.map((document) => 
          deleteDoc(doc(db, 'transactions', document.id))
        );
        await Promise.all(deletePromises);
        setTransactions([]);
        alert('Semua riwayat transaksi berhasil direset.');
      } catch (e) {
        console.error("Gagal menghapus data di Firebase:", e);
        alert('Terjadi kesalahan saat menghapus data.');
      }
    }
  };

  const updateStatus = async (id: string, newStatusPesanan: string, newStatus: string) => {
    try {
      const txRef = doc(db, 'transactions', id);
      await updateDoc(txRef, {
        statusPesanan: newStatusPesanan,
        status: newStatus
      });

      // Update state lokal agar langsung berubah tanpa perlu refresh
      const updated = transactions.map((tx) =>
        tx.id === id ? { ...tx, statusPesanan: newStatusPesanan, status: newStatus } : tx
      );
      setTransactions(updated);
    } catch (e) {
      console.error("Gagal memperbarui status di Firebase:", e);
      alert('Gagal memperbarui status pesanan.');
    }
  };

  const printReceipt = (tx: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Struk - ${tx.id}</title>
            <style>
              body { font-family: monospace; font-size: 12px; width: 300px; padding: 10px; color: #000; }
              .center { text-align: center; }
              .flex { display: flex; justify-content: space-between; }
              hr { border: dashed 1px #000; }
            </style>
          </head>
          <body>
            <div class="center">
              <h3>RJResto</h3>
              <p>Sistem Kasir Restoran</p>
            </div>
            <hr/>
            <p>ID Transaksi : ${tx.id}</p>
            <p>Tanggal      : ${tx.date} ${tx.time}</p>
            <p>Kasir/Staff  : ${tx.namaKasir || 'Kasir Utama'}</p>
            ${tx.namaPelanggan ? `<p>Pelanggan  : ${tx.namaPelanggan}</p>` : ''}
            <p>Tipe Pesanan : ${tx.tipePesanan || 'Dine In'} ${tx.nomorMeja && tx.nomorMeja !== '-' ? `(Meja ${tx.nomorMeja})` : ''}</p>
            <p>Status       : ${tx.statusPesanan || tx.status || 'Berhasil'}</p>
            <p>Metode Bayar : ${tx.metode || 'Tunai'}</p>
            <hr/>
            <div>
              ${tx.items && Array.isArray(tx.items) ? tx.items.map((i: any) => `
                <div style="margin-bottom: 4px;">
                  <div>${i.nama}</div>
                  <div class="flex">
                    <span>${i.qty}x @ Rp ${i.harga.toLocaleString('id-ID')}</span>
                    <span>Rp ${(i.harga * i.qty).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              `).join('') : '<p>Detail item tidak tersedia</p>'}
            </div>
            <hr/>
            <div class="flex"><span>Subtotal</span> <span>Rp ${(tx.subtotal || tx.total).toLocaleString('id-ID')}</span></div>
            ${tx.diskonPersen > 0 ? `<div class="flex"><span>Diskon (${tx.diskonPersen}%)</span> <span>-Rp ${(tx.nilaiDiskon || 0).toLocaleString('id-ID')}</span></div>` : ''}
            <div class="flex"><span><strong>Total Pembelian</strong></span> <strong>Rp ${(tx.total || 0).toLocaleString('id-ID')}</strong></div>
            ${tx.uangDibayar ? `<div class="flex"><span>Uang Dibayar</span> Rp ${tx.uangDibayar.toLocaleString('id-ID')}</div>` : ''}
            ${tx.kembalian !== undefined ? `<div class="flex"><span>Kembalian</span> Rp ${tx.kembalian.toLocaleString('id-ID')}</div>` : ''}
            <hr/>
            <div class="center">
              <p>Terima Kasih Atas Kunjungan Anda!</p>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const formattedFilterDate = filterDate ? (() => {
    const [year, month, day] = filterDate.split('-');
    return `${Number(day)}/${Number(month)}/${year}`;
  })() : '';

  const filteredData = formattedFilterDate 
    ? transactions.filter(t => t.date === formattedFilterDate || t.date === filterDate) 
    : transactions;

  const totalRevenue = filteredData.reduce((sum, tx) => sum + (Number(tx.total) || 0), 0);
  const totalItemsSold = filteredData.reduce((sum, tx) => sum + (Number(tx.itemsCount) || 0), 0);

  const currentDateText = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 text-white max-w-7xl mx-auto w-full overflow-y-auto">
        <div className="space-y-6">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-amber-500 to-orange-600 text-slate-900 p-6 rounded-2xl shadow-lg">
            <div>
              <h1 className="text-2xl font-bold">Dashboard RJResto</h1>
              <p className="text-slate-900/80 text-sm mt-1">Ringkasan performa penjualan dan statistik operasional (Database Firebase).</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <div className="bg-black/15 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold text-white">
                📅 {currentDateText}
              </div>
              
              {isMasterOrAdmin && (
                <button 
                  onClick={clearData} 
                  className="bg-red-900/80 hover:bg-red-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow transition"
                >
                  Reset Data
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-sm font-semibold text-slate-300">Filter Tanggal:</span>
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')} 
                  className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-xl text-slate-300"
                >
                  Reset Filter
                </button>
              )}
            </div>
            <div className="text-xs text-slate-400">
              Menampilkan <span className="text-amber-400 font-bold">{filteredData.length}</span> transaksi
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Pendapatan</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-1">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
              <p className="text-xs text-emerald-400 font-semibold mt-1">📈 Sesuai filter aktif</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Pesanan</p>
              <h3 className="text-2xl font-bold text-white mt-1">{filteredData.length}</h3>
              <p className="text-xs text-blue-400 font-semibold mt-1">🧾 Transaksi tercatat</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Menu Terjual</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalItemsSold} Porsi</h3>
              <p className="text-xs text-amber-400 font-semibold mt-1">🍽️ Makanan & Minuman</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Riwayat Transaksi (Cloud Database)</h3>
              <button 
                onClick={fetchTransactions}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 px-3 py-1.5 rounded-lg font-medium transition"
              >
                🔄 Refresh Data
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6 font-semibold">ID Transaksi</th>
                    <th className="py-4 px-6 font-semibold">Waktu / Tipe</th>
                    <th className="py-4 px-6 font-semibold">Kasir & Pelanggan</th>
                    <th className="py-4 px-6 font-semibold">Item</th>
                    <th className="py-4 px-6 font-semibold">Total</th>
                    <th className="py-4 px-6 font-semibold text-center">Status</th>
                    <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400">
                        Tidak ada transaksi yang cocok dengan filter atau database masih kosong.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-4 px-6 font-bold text-white">
                          {tx.id}
                          <div className="text-xs font-normal text-slate-400">{tx.metode || 'Tunai'}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          <div className="font-medium">{tx.date} - {tx.time}</div>
                          <div className="text-xs text-amber-400">
                            {tx.tipePesanan || 'Dine In'} {tx.nomorMeja && tx.nomorMeja !== '-' ? `(Meja ${tx.nomorMeja})` : ''}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {tx.namaPelanggan || tx.id.startsWith('WEB-') ? (
                            <div className="flex flex-col">
                              <span className="text-blue-400 font-bold">
                                🏷️ Pelanggan: {tx.namaPelanggan || 'Pelanggan Mandiri'}
                              </span>
                              <span className="text-[10px] text-blue-300/80 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 w-fit mt-0.5">
                                Pesanan Mandiri (Web)
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-semibold text-white">
                                👤 Kasir: <span className="text-amber-400">{tx.namaKasir || 'Kasir Utama'}</span>
                              </span>
                              <span className="text-slate-500 text-xs mt-0.5 italic">Pesanan Langsung POS</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-300">{tx.itemsCount} Item</td>
                        <td className="py-4 px-6 font-bold text-amber-400">Rp {(tx.total || 0).toLocaleString('id-ID')}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            (tx.statusPesanan === 'Pending' || tx.status?.includes('Pending'))
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : (tx.statusPesanan === 'Di Proses'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20')
                          }`}>
                            {tx.statusPesanan || tx.status || 'Berhasil'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            {tx.statusPesanan !== 'Selesai' && (
                              <button
                                onClick={() => updateStatus(tx.id, 'Selesai', 'Berhasil')}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                              >
                                Selesai
                              </button>
                            )}
                            <button
                              onClick={() => printReceipt(tx)}
                              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition"
                            >
                              Cetak Struk
                            </button>
                          </div>
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
    </div>
  );
}