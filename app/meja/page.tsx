'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';

interface Meja {
  id: number;
  number?: string;
  status: string;
}

export default function ManajemenMejaPage() {
  const [mejaList, setMejaList] = useState<Meja[]>([
    { id: 1, number: '1', status: 'Kosong' }, 
    { id: 2, number: '2', status: 'Kosong' },
    { id: 3, number: '3', status: 'Kosong' }, 
    { id: 4, number: '4', status: 'Kosong' },
    { id: 5, number: '5', status: 'Kosong' }, 
    { id: 6, number: '6', status: 'Kosong' },
  ]);

  const loadMeja = () => {
    // Menggunakan key 'rjresto_tables' agar sinkron dengan halaman kasir
    const savedMeja = localStorage.getItem('rjresto_tables');
    if (savedMeja) {
      try {
        const parsed = JSON.parse(savedMeja);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalisasi format agar id selalu number untuk konsistensi
          const normalized = parsed.map((m: any) => ({
            id: Number(m.id || m.number),
            number: String(m.number || m.id),
            status: m.status || 'Kosong'
          }));
          setMejaList(normalized);
        }
      } catch (e) {
        console.error("Gagal parsing meja", e);
      }
    }
  };

  useEffect(() => {
    loadMeja();

    // Sinkronisasi real-time antar tab / window
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rjresto_tables') {
        loadMeja();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Interval sync otomatis di tab yang sama ketika kasir melakukan transaksi
    const interval = setInterval(() => {
      loadMeja();
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const updateStatus = (id: number, status: string) => {
    const updated = mejaList.m => mejaList.map(m => m.id === id ? { ...m, status } : m);
    const newMejaList = updated(mejaList);
    setMejaList(newMejaList);
    // Simpan ke 'rjresto_tables' agar halaman kasir ikut membaca perubahan ini
    localStorage.setItem('rjresto_tables', JSON.stringify(newMejaList));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-amber-400">Manajemen Status Meja</h1>
              <p className="text-sm text-slate-400 mt-1">Pantau dan ubah status ketersediaan meja restoran secara real-time.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mejaList.map((meja) => (
              <div key={meja.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-3 text-white">Meja {meja.number || meja.id}</h3>
                  <div className={`px-4 py-2 rounded-xl font-bold text-center text-sm mb-4 ${
                    meja.status === 'Kosong' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                    meja.status === 'Terisi' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {meja.status}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button 
                    onClick={() => updateStatus(meja.id, 'Kosong')} 
                    className="bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold rounded-xl transition text-slate-200"
                  >
                    Kosong
                  </button>
                  <button 
                    onClick={() => updateStatus(meja.id, 'Terisi')} 
                    className="bg-slate-800 hover:bg-slate-700 px-3 py-2 text-xs font-semibold rounded-xl transition text-slate-200"
                  >
                    Terisi
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}