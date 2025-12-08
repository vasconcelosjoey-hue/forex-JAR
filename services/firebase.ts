import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuração direta para garantir funcionamento no deploy (Vercel)
const firebaseConfig = {
  apiKey: "AIzaSyBYvMiwh4B3TE5sE_HzJ3-ryLKkG93pgXY",
  authDomain: "forex-jar.firebaseapp.com",
  projectId: "forex-jar",
  storageBucket: "forex-jar.firebasestorage.app",
  messagingSenderId: "470134672900",
  appId: "1:470134672900:web:e81f2a295a04e83524af51"
};

let db: Firestore;
let initError: string | null = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e: any) {
  console.error("Erro fatal ao inicializar Firebase:", e);
  initError = e.message || JSON.stringify(e);
}

export { db, initError };