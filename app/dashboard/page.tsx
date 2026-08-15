'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';

interface Transaction {
  id: string;
  time: string;
  date: string;
  itemsCount: number;
  total: number;
  status: string;
}

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterDate, setFilterDate] = useState('');
  const [currentUserName, setCurrentUserName] = useState('Karyawan');
  const [currentUserRole, setCurrentUserRole] = useState('Master');

  useEffect(() => {
    // Ambil informasi sesi user aktif dari localStorage
    const currentUserStr = localStorage.getItem('rjresto_current_user');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        setCurrentUserName(user.nama || 'Karyawan');
        setCurrentUserRole(user.role || 'Master');
      } catch (e) {
        console.error("Gagal parsing user session", e);
      }
    }

    // Ambil data transaksi
    const saved = localStorage.getItem('rjresto_transactions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setTransactions(parsed);
        }
      } catch (e) {
        console.error("Gagal parsing transaksi", e);
      }
    }
  }, []);

  // Cek apakah akun yang login memiliki hak akses master/admin/matthew
  const roleLower = currentUserRole.trim().toLowerCase();
  const nameLower = currentUserName.trim().toLowerCase();
  const isMasterOrAdmin = 
    roleLower === 'master' || 
    roleLower === 'super admin' || 
    roleLower === 'admin' || 
    nameLower === 'matthew' || 
    nameLower === 'admin';

  const clearData = () => {
    if (!isMasterOrAdmin) {
      alert('Akses ditolak! Hanya Akun Master/Admin yang diizinkan mereset data.');
      return;
    }
    if (confirm('Yakin ingin menghapus semua riwayat transaksi?')) {
      localStorage.removeItem('rjresto_transactions');
      setTransactions([]);
    }
  };

  const updateStatus = (id: string, newStatus: string) => {
    const updated = transactions.map((tx) =>
      tx.id === id ? { ...tx, status: newStatus } : tx
    );
    setTransactions(updated);
    localStorage.setItem('rjresto_transactions', JSON.stringify(updated));
  };

  const printReceipt = (tx: Transaction) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Struk - ${tx.id}</title></head>
          <body style="font-family: monospace; padding: 20px;">
            <h3>RJResto</h3>
            <p>--------------------------------</p>
            <p>ID Transaksi : ${tx.id}</p>
            <p>Waktu        : ${tx.date} ${tx.time}</p>
            <p>--------------------------------</p>
            <p><strong>Total Pembayaran: Rp ${tx.total.toLocaleString('id-ID')}</strong></p>
            <p>Status       : ${tx.status}</p>
            <p>--------------------------------</p>
            <p style="text-align: center;">Terima Kasih!</p>
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
              <p className="text-slate-900/80 text-sm mt-1">Ringkasan performa penjualan dan statistik operasional.</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-3">
              <div className="bg-black/15 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-semibold text-white">
                📅 {currentDateText}
              </div>
              
              {/* Tombol Reset Data hanya dirender jika akun adalah Master / Admin */}
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
              <p className="text-xs text-blue-400 font-semibold mt-1">🧾 Transaksi berhasil</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Menu Terjual</p>
              <h3 className="text-2xl font-bold text-white mt-1">{totalItemsSold} Porsi</h3>
              <p className="text-xs text-amber-400 font-semibold mt-1">🍽️ Makanan & Minuman</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-lg text-white">Riwayat Transaksi</h3>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-medium">
                Data Sinkron dengan Kasir POS
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 uppercase text-xs tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6 font-semibold">ID Transaksi</th>
                    <th className="py-4 px-6 font-semibold">Waktu</th>
                    <th className="py-4 px-6 font-semibold">Jumlah Item</th>
                    <th className="py-4 px-6 font-semibold">Total Pembayaran</th>
                    <th className="py-4 px-6 font-semibold text-center">Status</th>
                    <th className="py-4 px-6 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        Tidak ada transaksi yang cocok dengan filter atau belum ada data.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/50 transition">
                        <td className="py-4 px-6 font-bold text-white">{tx.id}</td>
                        <td className="py-4 px-6 text-slate-300">{tx.date} - {tx.time}</td>
                        <td className="py-4 px-6 text-slate-300">{tx.itemsCount} Item</td>
                        <td className="py-4 px-6 font-bold text-amber-400">Rp {(tx.total || 0).toLocaleString('id-ID')}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                            tx.status && tx.status.includes('Pending')
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {tx.status || 'Berhasil'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {tx.status && tx.status.includes('Pending') && (
                              <button
                                onClick={() => updateStatus(tx.id, 'Berhasil')}
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