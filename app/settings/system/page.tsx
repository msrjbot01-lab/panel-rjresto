'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar'; // Menggunakan komponen Sidebar terpusat agar sinkron

export default function SystemSettingsPage() {
  const router = useRouter();
  
  // State untuk pengaturan sistem (disimpan di localStorage agar tetap persisten)
  const [isSelfOrderOpen, setIsSelfOrderOpen] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  // Ambil data pengaturan saat pertama kali dimuat
  useEffect(() => {
    const savedSelfOrder = localStorage.getItem('rjresto_self_order');
    const savedMaintenance = localStorage.getItem('rjresto_maintenance');
    
    if (savedSelfOrder !== null) setIsSelfOrderOpen(JSON.parse(savedSelfOrder));
    if (savedMaintenance !== null) setMaintenanceMode(JSON.parse(savedMaintenance));
  }, []);

  // Fungsi menyimpan perubahan pengaturan
  const handleSaveSettings = () => {
    localStorage.setItem('rjresto_self_order', JSON.stringify(isSelfOrderOpen));
    localStorage.setItem('rjresto_maintenance', JSON.stringify(maintenanceMode));
    
    setSavedStatus(true);
    setTimeout(() => setSavedStatus(false), 3000); // Hilangkan notifikasi setelah 3 detik
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row">
      
      {/* SIDEBAR TERPUSAT AGAR SINKRON */}
      <Sidebar />

      {/* KONTEN UTAMA */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-xl flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-amber-400">Pengaturan Sistem & Akses Publik</h1>
              <p className="text-sm text-slate-400 mt-1">Kontrol akses pemesanan mandiri oleh pelanggan dan mode pemeliharaan aplikasi.</p>
            </div>
          </div>

          {/* Notifikasi Berhasil Simpan */}
          {savedStatus && (
            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-300 px-4 py-3 rounded-xl text-sm font-semibold flex items-center gap-2">
              <span>✅</span> Pengaturan sistem berhasil disimpan!
            </div>
          )}

          {/* Kotak Pengaturan */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
            
            {/* Toggle Pemesanan Mandiri */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 gap-4">
              <div>
                <h3 className="font-bold text-base text-white">Akses Pemesanan Mandiri (Publik)</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Jika dimatikan, pelanggan tidak akan bisa melakukan pemesanan sendiri melalui link/QR code umum. 
                  Sistem akan menampilkan pemberitahuan bahwa pemesanan mandiri ditutup.
                </p>
              </div>
              <button 
                onClick={() => setIsSelfOrderOpen(!isSelfOrderOpen)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition shrink-0 ${
                  isSelfOrderOpen 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-900 shadow-lg shadow-emerald-500/20' 
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20'
                }`}
              >
                {isSelfOrderOpen ? 'AKTIF (DIBUKA)' : 'NONAKTIF (DITUTUP)'}
              </button>
            </div>

            {/* Toggle Maintenance Mode */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700 gap-4">
              <div>
                <h3 className="font-bold text-base text-white">Mode Perbaikan (Maintenance Mode)</h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Aktifkan jika Anda ingin menutup sementara sistem untuk pemeliharaan atau pembaharuan data besar.
                </p>
              </div>
              <button 
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider transition shrink-0 ${
                  maintenanceMode 
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {maintenanceMode ? 'SEDANG MAINTENANCE' : 'NORMAL'}
              </button>
            </div>

            {/* Tombol Simpan Utama */}
            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSaveSettings}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-xl transition shadow-lg text-sm"
              >
                Simpan Perubahan Sistem
              </button>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}