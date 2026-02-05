import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
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

const initFirestore = (): Firestore | null => {
  if (db) return db;
  try {
    const apps = getApps();
    const app: FirebaseApp = apps.length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    return db;
  } catch (e: any) {
    console.error("Erro fatal ao inicializar Firebase:", e);
    initError = e.message || "Erro desconhecido ao inicializar o Firestore.";
    return null;
  }
};

// Inicialização imediata
initFirestore();

export { db, initError };

export async function saveDashboardState(state: DashboardState): Promise<void> {
  const instance = db || initFirestore();
  if (!instance) throw new Error("Firestore não disponível.");
  
  try {
    const payload = { ...state, lastUpdated: Date.now() };
    await setDoc(doc(instance, 'jar_state', 'global'), payload);
  } catch (error) {
    console.error("Erro ao salvar DashboardState:", error);
    throw error;
  }
}

export function subscribeToDashboardState(callback: (state: DashboardState) => void): () => void {
  const instance = db || initFirestore();
  if (!instance) {
    console.warn("Firebase não inicializado, subscrição cancelada.");
    return () => {};
  }

  try {
    const unsubscribe = onSnapshot(
      doc(instance, 'jar_state', 'global'),
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
  } catch (err) {
    console.error("Falha ao criar listener do Firestore:", err);
    return () => {};
  }
}