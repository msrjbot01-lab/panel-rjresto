// Import fungsi yang diperlukan dari SDK Firebase
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase Anda (yang sudah Anda isi dengan data asli)
const firebaseConfig = {
  apiKey: "AIzaSyAqSAJhynAI3ox57-Lvjq8FnEV2yxqAjR8",
  authDomain: "rjresto-db.firebaseapp.com",
  projectId: "rjresto-db",
  storageBucket: "rjresto-db.firebasestorage.app",
  messagingSenderId: "401090247313",
  appId: "1:401090247313:web:5c28bf1bea899342eddd30"
};

// Inisialisasi Firebase (mencegah inisialisasi ganda di Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Inisialisasi Firestore Database
export const db = getFirestore(app);