'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/Sidebar';

interface MenuItem {
  id: number;
  nama: string;
  harga: number;
  kategori: string;
  deskripsi?: string;
  tersedia?: boolean;
}

interface CartItem extends MenuItem {
  qty: number;
}

interface TableItem {
  id: string;
  number: string;
  status: string;
}

export default function KasirPage() {
  const [daftarMenu, setDaftarMenu] = useState<MenuItem[]>([]);
  const [daftarMeja, setDaftarMeja] = useState<TableItem[]>([]);
  const [pesanan, setPesanan] = useState<CartItem[]>([]);
  const [selectedKategori, setSelectedKategori] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [metodePembayaran, setMetodePembayaran] = useState('Tunai');
  const [diskonPersen, setDiskonPersen] = useState(0);
  const [uangDibayar, setUangDibayar] = useState('');

  const [tipePesanan, setTipePesanan] = useState<'Dine In' | 'Take Away'>('Dine In');
  const [nomorMeja, setNomorMeja] = useState('');
  const [statusPesanan, setStatusPesanan] = useState('Pending');

  useEffect(() => {
    const savedMenu = localStorage.getItem('rjresto_menu');
    if (savedMenu) {
      try {
        setDaftarMenu(JSON.parse(savedMenu));
      } catch (e) {
        console.error("Gagal parsing menu", e);
      }
    } else {
      const defaultMenu: MenuItem[] = [
        { id: 1, nama: 'Nasi Goreng Spesial', harga: 25000, kategori: 'Makanan', tersedia: true },
        { id: 4, nama: 'Es Teh Manis', harga: 5000, kategori: 'Minuman', tersedia: true },
      ];
      setDaftarMenu(defaultMenu);
      localStorage.setItem('rjresto_menu', JSON.stringify(defaultMenu));
    }

    const savedTables = localStorage.getItem('rjresto_tables');
    if (savedTables) {
      try {
        setDaftarMeja(JSON.parse(savedTables));
      } catch (e) {
        console.error("Gagal parsing meja", e);
      }
    }
  }, []);

  const tambahPesanan = (menu: MenuItem) => {
    if (menu.tersedia === false) return alert('Menu ini sedang kosong/habis!');
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

  const ubahQty = (id: number, delta: number) => {
    setPesanan((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const subtotalHarga = pesanan.reduce((total, item) => total + item.harga * item.qty, 0);
  const nilaiDiskon = (subtotalHarga * diskonPersen) / 100;
  const totalHarga = subtotalHarga - nilaiDiskon;
  const numericUangDibayar = Number(uangDibayar) || 0;
  const kembalian = numericUangDibayar - totalHarga;

  const cetakStruk = (tx: any) => {
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
            <p>Tipe Pesanan : ${tx.tipePesanan} ${tx.tipePesanan === 'Dine In' ? `(Meja ${tx.nomorMeja})` : ''}</p>
            <p>Status       : ${tx.statusPesanan}</p>
            <p>Metode Bayar : ${tx.metode}</p>
            <hr/>
            <div>
              ${tx.items.map((i: any) => `
                <div style="margin-bottom: 4px;">
                  <div>${i.nama}</div>
                  <div class="flex">
                    <span>${i.qty}x @ Rp ${i.harga.toLocaleString('id-ID')}</span>
                    <span>Rp ${(i.harga * i.qty).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              `).join('')}
            </div>
            <hr/>
            <div class="flex"><span>Subtotal</span> <span>Rp ${tx.subtotal.toLocaleString('id-ID')}</span></div>
            ${tx.diskonPersen > 0 ? `<div class="flex"><span>Diskon (${tx.diskonPersen}%)</span> <span>-Rp ${tx.nilaiDiskon.toLocaleString('id-ID')}</span></div>` : ''}
            <div class="flex"><span><strong>Total Pembelian</strong></span> <strong>Rp ${tx.total.toLocaleString('id-ID')}</strong></div>
            <div class="flex"><span>Uang Dibayar</span> Rp ${tx.uangDibayar.toLocaleString('id-ID')}</div>
            <div class="flex"><span>Kembalian</span> Rp ${tx.kembalian.toLocaleString('id-ID')}</div>
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

  const prosesPembayaran = () => {
    if (pesanan.length === 0) return alert('Keranjang masih kosong!');
    if (metodePembayaran === 'Tunai' && numericUangDibayar < totalHarga) {
      return alert('Jumlah uang tunai kurang dari total pembayaran!');
    }
    if (tipePesanan === 'Dine In' && !nomorMeja) {
      return alert('Silakan pilih nomor meja untuk pesanan Dine In!');
    }

    const totalItemsCount = pesanan.reduce((sum, item) => sum + item.qty, 0);

    const newTx = {
      id: 'TRX-' + Math.floor(100000 + Math.random() * 900000),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString('id-ID'),
      itemsCount: totalItemsCount,
      subtotal: subtotalHarga,
      diskonPersen,
      nilaiDiskon,
      total: totalHarga,
      uangDibayar: numericUangDibayar,
      kembalian: Math.max(0, kembalian),
      metode: metodePembayaran,
      tipePesanan,
      nomorMeja: tipePesanan === 'Dine In' ? nomorMeja : '-',
      statusPesanan,
      items: pesanan,
      status: 'Berhasil (Kasir)'
    };

    let existingTransactions = [];
    try {
      existingTransactions = JSON.parse(localStorage.getItem('rjresto_transactions') || '[]');
    } catch (e) {
      existingTransactions = [];
    }

    const updatedTransactions = [newTx, ...existingTransactions];
    localStorage.setItem('rjresto_transactions', JSON.stringify(updatedTransactions));

    cetakStruk(newTx);

    alert(`Pembayaran berhasil diproses! Kembalian: Rp ${Math.max(0, kembalian).toLocaleString('id-ID')}`);
    setPesanan([]);
    setUangDibayar('');
    setDiskonPersen(0);
    setNomorMeja('');
    setStatusPesanan('Pending');
  };

  const filteredMenu = daftarMenu.filter((menu) => {
    const matchesCategory = selectedKategori === 'Semua' || menu.kategori === selectedKategori;
    const matchesSearch = menu.nama.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8 text-white overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <header className="border-b border-slate-800 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-amber-400">RJResto - POS Kasir</h1>
              <p className="text-sm text-slate-400">Sistem Kasir Utama Restoran</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/menu" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
                Kelola Menu
              </Link>
              <Link href="/meja" className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition">
                Kelola Meja
              </Link>
              <Link href="/dashboard" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-xl text-sm font-semibold transition">
                Lihat Dashboard &rarr;
              </Link>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 shadow">
                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
                  {['Semua', 'Makanan', 'Minuman', 'Cemilan', 'Dessert'].map((kat) => (
                    <button
                      key={kat}
                      onClick={() => setSelectedKategori(kat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        selectedKategori === kat
                          ? 'bg-amber-500 text-slate-900 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {kat}
                    </button>
                  ))}
                </div>
                <div className="w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Cari menu kasir..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {filteredMenu.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-12 rounded-2xl text-center text-slate-400 shadow">
                  Tidak ada menu ditemukan. Silakan tambah menu melalui menu <Link href="/menu" className="text-amber-400 underline">Kelola Menu</Link>.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredMenu.map((menu) => {
                    const isHabis = menu.tersedia === false;
                    return (
                      <button
                        key={menu.id}
                        onClick={() => tambahPesanan(menu)}
                        disabled={isHabis}
                        className={`p-4 rounded-2xl text-left transition flex flex-col justify-between shadow border ${
                          isHabis 
                            ? 'bg-slate-900/40 border-slate-800 opacity-50 cursor-not-allowed' 
                            : 'bg-slate-900 border-slate-800 hover:border-amber-500'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-xs px-2 py-0.5 bg-slate-800 text-amber-300 rounded-md font-medium">
                              {menu.kategori}
                            </span>
                            {isHabis && (
                              <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-400 rounded-md font-bold">
                                Habis
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-base mt-2 text-white">{menu.nama}</h3>
                        </div>
                        <p className="text-amber-400 font-bold mt-4">
                          Rp {menu.harga.toLocaleString('id-ID')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-lg space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-3 border-b border-slate-800 pb-2 flex justify-between items-center">
                  <span>Pesanan Saat Ini</span>
                  <span className="text-xs text-amber-400 font-normal">{pesanan.length} item unik</span>
                </h2>

                <div className="space-y-3 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1">Tipe Pesanan</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setTipePesanan('Dine In')}
                        className={`py-1.5 rounded-lg font-bold transition ${tipePesanan === 'Dine In' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                      >
                        🍽️ Dine In
                      </button>
                      <button
                        onClick={() => setTipePesanan('Take Away')}
                        className={`py-1.5 rounded-lg font-bold transition ${tipePesanan === 'Take Away' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}
                      >
                        🛍️ Take Away
                      </button>
                    </div>
                  </div>

                  {tipePesanan === 'Dine In' && (
                    <div>
                      <span className="text-slate-400 block mb-1">Nomor Meja</span>
                      <select
                        value={nomorMeja}
                        onChange={(e) => setNomorMeja(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">-- Pilih Nomor Meja --</option>
                        {daftarMeja.map((meja) => (
                          <option key={meja.id} value={meja.number}>Meja {meja.number} ({meja.status})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block mb-1">Status Pesanan</span>
                    <select
                      value={statusPesanan}
                      onChange={(e) => setStatusPesanan(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Di Proses">Di Proses</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </div>
                </div>

                {pesanan.length === 0 ? (
                  <p className="text-slate-400 text-sm py-6 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                    Belum ada menu yang dipilih.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                    {pesanan.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <div>
                          <p className="font-medium text-xs text-white">{item.nama}</p>
                          <p className="text-xs text-amber-400 font-semibold mt-0.5">
                            Rp {(item.harga * item.qty).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => ubahQty(item.id, -1)}
                            className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center font-bold text-white transition text-xs"
                          >
                            -
                          </button>
                          <span className="text-xs font-semibold w-5 text-center">{item.qty}</span>
                          <button
                            onClick={() => ubahQty(item.id, 1)}
                            className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center font-bold text-white transition text-xs"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {pesanan.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Subtotal</span>
                    <span>Rp {subtotalHarga.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Diskon (%)</span>
                    <select
                      value={diskonPersen}
                      onChange={(e) => setDiskonPersen(Number(e.target.value))}
                      className="bg-slate-950 border border-slate-800 px-2 py-1 rounded-lg text-xs text-amber-400 focus:outline-none"
                    >
                      <option value={0}>0% (Tanpa Diskon)</option>
                      <option value={10}>10%</option>
                      <option value={15}>15%</option>
                      <option value={20}>20%</option>
                      <option value={50}>50%</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span>Metode Bayar</span>
                    <div className="flex gap-1">
                      {['Tunai', 'QRIS', 'Debit'].map((metode) => (
                        <button
                          key={metode}
                          onClick={() => setMetodePembayaran(metode)}
                          className={`px-2 py-1 rounded-lg font-bold transition text-xs ${
                            metodePembayaran === metode
                              ? 'bg-amber-500 text-slate-900'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {metode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {metodePembayaran === 'Tunai' && (
                    <div className="space-y-1 pt-1">
                      <span className="text-slate-400">Uang Diterima (Rp)</span>
                      <input
                        type="number"
                        placeholder="Contoh: 50000"
                        value={uangDibayar}
                        onChange={(e) => setUangDibayar(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-amber-300 font-semibold"
                      />
                      {numericUangDibayar >= totalHarga && (
                        <p className="text-emerald-400 text-right mt-0.5">
                          Kembalian: Rp {kembalian.toLocaleString('id-ID')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-800 pt-3">
                <div className="flex justify-between items-center mb-3 text-base font-bold">
                  <span>Total Akhir:</span>
                  <span className="text-amber-400">Rp {totalHarga.toLocaleString('id-ID')}</span>
                </div>
                <button
                  onClick={prosesPembayaran}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl transition shadow-lg text-sm"
                >
                  Proses Pembayaran & Cetak Struk
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}