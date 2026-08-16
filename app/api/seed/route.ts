export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inisialisasi aman
let app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
let db = getFirestore(app);

export async function GET() {
  try {
    // Memasukkan data uji coba ke koleksi standar
    await setDoc(doc(db, 'menu', '1'), { nama: 'Nasi Goreng', harga: 25000 });
    await setDoc(doc(db, 'meja', '1'), { nomor: '1', status: 'Kosong' });
    await setDoc(doc(db, 'users', 'matthew'), { username: 'matthew', role: 'master', password: 'matthewsel18' });

    return NextResponse.json({ success: true, message: 'Data berhasil masuk!' });
  } catch (error: any) {
    console.error("Firebase Seed Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}