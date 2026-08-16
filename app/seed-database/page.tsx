'use client';
import { useState } from 'react';

export default function SeedDatabasePage() {
  const [status, setStatus] = useState<string>('Siap mengisi data...');

  const runSeed = async () => {
    setStatus('Sedang mengirim data ke Firebase...');
    try {
      const res = await fetch('/api/seed');
      const data = await res.json();
      if (data.success) {
        setStatus('SUKSES! Data berhasil masuk ke Firebase!');
      } else {
        setStatus(`GAGAL: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`GAGAL: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
        <h1 className="text-xl font-bold text-amber-400">Pengisi Database Otomatis</h1>
        <button 
          onClick={runSeed}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg cursor-pointer"
        >
          Klik untuk Isi Database
        </button>
        <p className="text-xs mt-3 text-amber-300 font-semibold">{status}</p>
      </div>
    </div>
  );
}