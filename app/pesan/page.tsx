'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  getDocs, 
  updateDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';

interface MenuItem {
  id: string; // Firestore menggunakan string untuk ID dokumen
  nama: string;
  harga: number;
  kategori: string;
  tersedia?: boolean;
}

interface CartItem extends MenuItem {
  qty: number;
}

export default function PesanPelangganPage() {
  const [daftarMenu, setDaftarMenu] = useState<MenuItem[]>([]);
  const [pesanan, setPesanan] = useState<CartItem[]>([]);
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [nomorMeja, setNomorMeja] = useState('');

  // 1. Ambil daftar menu secara real-time dari Firebase Firestore koleksi 'menu'
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items: MenuItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MenuItem, 'id'>)
      }));
      setDaftarMenu(items);
    }, (error) => {
      console.error("Gagal mengambil menu dari Firebase:", error);
    });

    return () => unsubscribe();
  }, []);

  const tambahPesanan = (menu: MenuItem) => {
    if (menu.tersedia === false) {
      return alert('Maaf, menu ini sedang habis!');
    }
    setPesanan((prev) => {
      const existing = prev.find((item) => item.id === menu.id);
      if (existing) {
        return prev.map((item) =>
          item.id === menu.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...menu, qty: 1 }];
    });
  };

  const ubahQty = (id: string, delta: number) => {
    setPesanan((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const totalHarga = pesanan.reduce((total, item) => total + item.harga * item.qty, 0);

  // 2. Fungsi Kirim Pesanan ke Firestore (Kasir, Dashboard, & Update Status Meja Otomatis)
  const kirimPesanan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPelanggan) return alert('Mohon isi nama Anda terlebih dahulu!');
    if (!nomorMeja) return alert('Mohon isi nomor meja Anda!');
    if (pesanan.length === 0) return alert('Keranjang pesanan masih kosong!');

    const totalItemsCount = pesanan.reduce((sum, item) => sum + item.qty, 0);

    const newTx = {
      id: 'WEB-' + Math.floor(100000 + Math.random() * 900000),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('id-ID'),
      itemsCount: totalItemsCount,
      subtotal: totalHarga,
      diskonPersen: 0,
      nilaiDiskon: 0,
      total: totalHarga,
      uangDibayar: totalHarga,
      kembalian: 0,
      metode: 'Tunai',
      tipePesanan: 'Dine In',
      nomorMeja: nomorMeja,
      statusPesanan: 'Pending',
      status: 'Pending',
      namaPelanggan: namaPelanggan,
      items: pesanan.map(({ id, nama, harga, kategori, qty }) => ({
        id, nama, harga, kategori, qty
      })) // Simpan ringkasan item tanpa properti lokal yang tidak perlu
    };

    try {
      // Simpan transaksi baru ke koleksi 'transactions' di Firestore
      await addDoc(collection(db, 'transactions'), newTx);

      // OTOMATIS UPDATE STATUS MEJA KE 'Terisi' DI FIRESTORE BERDASARKAN NOMOR MEJA
      const matchNomor = nomorMeja.match(/\d+/);
      if (matchNomor) {
        const mejaIdNum = parseInt(matchNomor[0], 10);
        
        // Cari dokumen meja yang memiliki nomor/id sesuai di koleksi 'meja'
        const mejaQuery = query(collection(db, 'meja'), where('id', '==', mejaIdNum));
        const mejaSnapshot = await getDocs(mejaQuery);

        if (!mejaSnapshot.empty) {
          const mejaDocRef = mejaSnapshot.docs[0].ref;
          await updateDoc(mejaDocRef, { status: 'Terisi' });
        } else {
          // Fallback jika id disimpan sebagai string atau field berbeda
          const allMejaSnapshot = await getDocs(collection(db, 'meja'));
          const targetMeja = allMejaSnapshot.docs.find(d => {
            const data = d.data();
            return Number(data.id) === mejaIdNum || data.nomor === mejaIdNum;
          });
          if (targetMeja) {
            await updateDoc(targetMeja.ref, { status: 'Terisi' });
          }
        }
      }

      alert(`Pesanan atas nama ${namaPelanggan} (Meja ${nomorMeja}) berhasil dikirim ke kasir!`);
      setPesanan([]);
      setNamaPelanggan('');
      setNomorMeja('');
    } catch (error) {
      console.error("Gagal mengirim pesanan ke Firebase:", error);
      alert('Terjadi kesalahan saat mengirim pesanan. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 text-white overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          
          <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Pemesanan Mandiri - RJResto</h1>
              <p className="text-slate-900/80 text-sm mt-1">Silakan pilih menu favorit Anda dan kirim pesanan dari meja.</p>
            </div>
            <div>
              <Link href="/dashboard" className="bg-black/20 hover:bg-black/30 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition inline-block">
                Lihat Dashboard &rarr;
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-slate-200">Menu Restoran</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {daftarMenu.map((menu) => {
                  const isHabis = menu.tersedia === false;
                  return (
                    <div 
                      key={menu.id} 
                      className={`bg-slate-900 border p-4 rounded-2xl flex flex-col justify-between shadow ${
                        isHabis ? 'border-slate-800 opacity-50' : 'border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs px-2.5 py-1 bg-slate-800 text-amber-300 rounded-md font-medium">
                            {menu.kategori}
                          </span>
                          {isHabis && (
                            <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-md font-bold">
                              Habis
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg mt-2 text-white">{menu.nama}</h3>
                      </div>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-amber-400 font-bold">Rp {menu.harga.toLocaleString('id-ID')}</span>
                        <button
                          onClick={() => tambahPesanan(menu)}
                          disabled={isHabis}
                          className={`text-xs font-bold px-4 py-2 rounded-xl transition ${
                            isHabis 
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                              : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                          }`}
                        >
                          + Tambah
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-lg">
              <form onSubmit={kirimPesanan} className="space-y-4">
                <h2 className="text-lg font-bold border-b border-slate-800 pb-3">Keranjang Pesanan</h2>
                
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Nama Pemesan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Budi"
                    value={namaPelanggan}
                    onChange={(e) => setNamaPelanggan(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Nomor Meja</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 1 atau Meja 1"
                    value={nomorMeja}
                    onChange={(e) => setNomorMeja(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500 text-white"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-400 font-semibold mb-2">Daftar Item:</p>
                  {pesanan.length === 0 ? (
                    <p className="text-slate-500 text-xs py-4 text-center bg-slate-950/50 rounded-xl border border-dashed border-slate-800">
                      Belum ada menu yang dipilih.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                      {pesanan.map((item) => (
                        <div key={item.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg text-xs border border-slate-800">
                          <div>
                            <p className="font-semibold text-white">{item.nama}</p>
                            <p className="text-amber-400">Rp {(item.harga * item.qty).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => ubahQty(item.id, -1)}
                              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition"
                            >-</button>
                            <span className="w-4 text-center font-semibold">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => ubahQty(item.id, 1)}
                              className="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition"
                            >+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-4 mt-4">
                  <div className="flex justify-between items-center mb-4 text-base font-bold">
                    <span>Total:</span>
                    <span className="text-amber-400">Rp {totalHarga.toLocaleString('id-ID')}</span>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-3 rounded-xl transition shadow"
                  >
                    Kirim Pesanan ke Kasir
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}