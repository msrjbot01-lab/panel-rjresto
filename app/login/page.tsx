'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Ambil data karyawan dari localStorage
    const savedKaryawan = localStorage.getItem('rjresto_karyawan');
    const daftarKaryawan = savedKaryawan ? JSON.parse(savedKaryawan) : [];

    // 2. Akun admin default (disesuaikan dengan profil master Matthew dan path rute /meja)
    const defaultAdmin = {
      id: 1,
      nama: 'Matthew',
      password: 'matthewsel18',
      role: 'Master',
      status: 'Aktif',
      allowedMenus: ['/dashboard', '/kasir', '/menu', '/meja', '/pemesanan', '/settings/users', '/settings/system']
    };

    const allUsers = [defaultAdmin, ...daftarKaryawan];

    // 3. Cari user yang cocok
    const foundUser = allUsers.find(
      (user: any) => 
        user.nama.toLowerCase() === username.trim().toLowerCase() && 
        user.password === password
    );

    if (foundUser) {
      if (foundUser.status === 'Nonaktif') {
        setError('Akun ini telah dinonaktifkan oleh Administrator.');
        return;
      }

      // --- [PENTING] SIMPAN DATA USER YANG AKTIF LOGIN ---
      localStorage.setItem('rjresto_current_user', JSON.stringify(foundUser));

      // Buat cookie autentikasi middleware
      document.cookie = "isAuthenticated=true; path=/; max-age=86400";
      
      router.push('/dashboard');
    } else {
      setError('Nama pengguna atau kata sandi salah.');
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
            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl transition text-sm shadow"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}