import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// @ts-ignore - Access import.meta.env directly so Vite can replace it during build/dev
const env = import.meta.env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

let db: Firestore;

try {
  // Proteção: Só tenta conectar se houver chave de API, senão o app quebraria na importação
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);
  } else {
      console.warn("Firebase Config incompleta. O app iniciará em modo de configuração.");
  }
} catch (e) {
  console.error("Erro fatal ao inicializar Firebase:", e);
}

// Exporta db (pode ser undefined se falhar, o App.tsx vai lidar com isso)
export { db };