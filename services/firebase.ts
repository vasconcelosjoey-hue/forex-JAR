import { initializeApp } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { DashboardState } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyBYvMiwh4B3TE5sE_HzJ3-ryLKkG93pgXY",
  authDomain: "forex-jar.firebaseapp.com",
  projectId: "forex-jar",
  storageBucket: "forex-jar.firebasestorage.app",
  messagingSenderId: "470134672900",
  appId: "1:470134672900:web:e81f2a295a04e83524af51"
};

let db: Firestore | null = null;
let initError: string | null = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e: any) {
  console.error("Erro fatal ao inicializar Firebase:", e);
  initError = e.message || JSON.stringify(e);
}

export { db, initError };

export async function saveDashboardState(state: DashboardState): Promise<void> {
  if (!db) throw new Error("Firebase não inicializado.");
  
  try {
    const payload = { ...state, lastUpdated: Date.now() };
    await setDoc(doc(db, 'jar_state', 'global'), payload);
  } catch (error) {
    console.error("Erro ao salvar DashboardState:", error);
    throw error;
  }
}

export function subscribeToDashboardState(callback: (state: DashboardState) => void): () => void {
  if (!db) {
    console.warn("Firebase não inicializado, subscrição cancelada.");
    return () => {};
  }

  const unsubscribe = onSnapshot(
    doc(db, 'jar_state', 'global'),
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as DashboardState;
        callback(data);
      } else {
        console.log("Nenhum documento encontrado no Firebase.");
      }
    },
    (error) => {
      console.error("Erro na subscrição do DashboardState:", error);
    }
  );

  return unsubscribe;
}