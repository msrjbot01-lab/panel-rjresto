'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Import Firebase Firestore
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

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

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedUsername = username.trim();

    // 1. Definisikan Akun Master Default (Sesuai profil master Matthew)
    const defaultAdmin = {
      id: 'master-default',
      nama: 'demo',
      password: 'demo123',
      role: 'Master',
      status: 'Aktif',
      allowedMenus: ['/dashboard', '/kasir', '/menu', '/meja', '/pemesanan', '/settings/users', '/settings/system']
    };

    // Cek apakah yang login adalah akun master default
    if (defaultAdmin.nama.toLowerCase() === trimmedUsername.toLowerCase()) {
      if (defaultAdmin.password === password) {
        // Simpan sesi user aktif ke localStorage & cookie middleware
        localStorage.setItem('rjresto_current_user', JSON.stringify(defaultAdmin));
        document.cookie = "isAuthenticated=true; path=/; max-age=86400";
        router.push('/dashboard');
        return;
      } else {
        setError('Nama pengguna atau kata sandi salah.');
        setIsLoading(false);
        return;
      }
    }

    try {
      // 2. Cari data karyawan dari koleksi 'karyawan' di Firebase Firestore
      const karyawanQuery = query(collection(db, 'karyawan'));
      const querySnapshot = await getDocs(karyawanQuery);
      
      let foundUser: any = null;

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const namaKaryawan = data.nama || data.username || '';
        
        // Cocokkan nama dan password
        if (
          namaKaryawan.trim().toLowerCase() === trimmedUsername.toLowerCase() &&
          data.password === password
        ) {
          foundUser = { id: docSnap.id, ...data };
        }
      });

      if (foundUser) {
        if (foundUser.status === 'Nonaktif') {
          setError('Akun ini telah dinonaktifkan oleh Administrator.');
          setIsLoading(false);
          return;
        }

        // --- [PENTING] SIMPAN DATA USER YANG AKTIF LOGIN ---
        localStorage.setItem('rjresto_current_user', JSON.stringify(foundUser));

        // Buat cookie autentikasi middleware
        document.cookie = "isAuthenticated=true; path=/; max-age=86400";
        
        router.push('/dashboard');
      } else {
        // Fallback cek localStorage jika belum tersinkronisasi sempurna di Firestore
        const savedKaryawan = localStorage.getItem('rjresto_karyawan');
        const daftarKaryawan = savedKaryawan ? JSON.parse(savedKaryawan) : [];
        
        const localFound = daftarKaryawan.find(
          (user: any) => 
            user.nama.toLowerCase() === trimmedUsername.toLowerCase() && 
            user.password === password
        );

        if (localFound) {
          if (localFound.status === 'Nonaktif') {
            setError('Akun ini telah dinonaktifkan oleh Administrator.');
            setIsLoading(false);
            return;
          }
          localStorage.setItem('rjresto_current_user', JSON.stringify(localFound));
          document.cookie = "isAuthenticated=true; path=/; max-age=86400";
          router.push('/dashboard');
        } else {
          setError('Nama pengguna atau kata sandi salah.');
        }
      }
    } catch (err) {
      console.error('Gagal melakukan login via Firebase:', err);
      setError('Terjadi kesalahan koneksi database. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-amber-400">RJResto Login</h1>
          <p className="text-slate-400 text-xs mt-1">Masukkan kredensial untuk masuk</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text"
            placeholder="Username / Nama"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white focus:border-amber-500 outline-none text-sm"
            required
          />
          <input 
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-950 p-3 rounded-xl border border-slate-700 text-white focus:border-amber-500 outline-none text-sm"
            required
          />
          
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl transition text-sm shadow disabled:opacity-50"
          >
            {isLoading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}