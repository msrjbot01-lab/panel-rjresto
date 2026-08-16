'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';

// Import Firebase Firestore
import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query 
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

interface Meja {
  id: string | number;
  nomor?: string;
  namaMeja?: string;
  status: string;
}

export default function ManajemenMejaPage() {
  const [mejaList, setMejaList] = useState<Meja[]>([
    { id: 1, nomor: '1', status: 'Kosong' },
    { id: 2, nomor: '2', status: 'Kosong' },
    { id: 3, nomor: '3', status: 'Kosong' },
    { id: 4, nomor: '4', status: 'Kosong' },
    { id: 5, nomor: '5', status: 'Kosong' },
    { id: 6, nomor: '6', status: 'Kosong' },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMejaFromFirebase = async () => {
      try {
        const q = query(collection(db, 'tables'));
        const querySnapshot = await getDocs(q);
        const fetchedTables: Meja[] = [];
        
        querySnapshot.forEach((docSnap) => {
          fetchedTables.push({ id: docSnap.id, ...docSnap.data() } as Meja);
        });

        if (fetchedTables.length > 0) {
          setMejaList(fetchedTables);
        } else {
          // Fallback ke localStorage jika Firestore kosong
          const savedMeja = localStorage.getItem('rjresto_meja') || localStorage.getItem('rjresto_tables');
          if (savedMeja) {
            const parsed = JSON.parse(savedMeja);
            if (Array.isArray(parsed)) {
              setMejaList(parsed);
            }
          }
        }
      } catch (e) {
        console.error("Gagal mengambil data meja dari Firebase:", e);
        // Fallback lokal jika error jaringan
        const savedMeja = localStorage.getItem('rjresto_meja') || localStorage.getItem('rjresto_tables');
        if (savedMeja) {
          try {
            const parsed = JSON.parse(savedMeja);
            if (Array.isArray(parsed)) setMejaList(parsed);
          } catch (err) {
            console.error("Gagal parsing localStorage meja", err);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMejaFromFirebase();
  }, []);

  const updateStatus = async (id: string | number, status: string) => {
    try {
      // 1. Update status di Firebase Firestore
      const tableRef = doc(db, 'tables', String(id));
      await updateDoc(tableRef, { status });

      // 2. Update state lokal
      const updated = mejaList.map(m => m.id === id ? { ...m, status } : m);
      setMejaList(updated);

      // 3. Backup ke localStorage
      localStorage.setItem('rjresto_meja', JSON.stringify(updated));
    } catch (e) {
      console.error("Gagal memperbarui status meja ke Firebase:", e);
      alert("Terjadi kesalahan saat memperbarui status meja di server.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-amber-400">Manajemen Status Meja</h1>
              <p className="text-sm text-slate-400 mt-1">Pantau dan ubah status ketersediaan meja restoran secara real-time via Firebase.</p>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Memuat data meja dari database...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mejaList.map((meja) => {
                const displayName = meja.nomor || meja.namaMeja || meja.id;
                return (
                  <div key={meja.id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-3 text-white">Meja {displayName}</h3>
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
                );
              })}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}