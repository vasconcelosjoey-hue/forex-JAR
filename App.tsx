import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Roadmap } from './views/Roadmap';
import { Progress } from './views/Progress';
import { Withdrawals } from './views/Withdrawals';
import { Dashboard } from './views/Dashboard';
import { DatabaseModal } from './components/DatabaseModal';
import { Tab, AppState, Transaction } from './types';
import { INITIAL_STATE } from './constants';
import { db, initError } from './services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const STORAGE_KEY = 'JAR_DASHBOARD_V1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ROADMAP);
  const [appState, setAppState] = useState<AppState>({
    ...INITIAL_STATE,
    lastUpdated: Date.now()
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [missingConfig, setMissingConfig] = useState(false);
  
  const [lastRateUpdate, setLastRateUpdate] = useState<number | null>(null);

  // Initialize App Data and Database Connection
  useEffect(() => {
    // Se o objeto db não foi criado (erro na init do services/firebase.ts), mostra tela de config
    if (!db) {
        setMissingConfig(true);
        setIsLoaded(true);
        return;
    }

    // 1. Load local preferences instantly
    const savedStateStr = localStorage.getItem(STORAGE_KEY);
    if (savedStateStr) {
        try {
            const localState = JSON.parse(savedStateStr);
            setAppState(prev => ({ ...prev, ...localState }));
        } catch (e) {
            console.error("Local storage parse error", e);
        }
    }
    
    // 2. Subscribe to Firestore Realtime Updates
    try {
        const unsubscribe = onSnapshot(doc(db, 'jar_state', 'global'), 
          (docSnap) => {
            setIsLoaded(true);
            if (docSnap.exists()) {
              const remoteData = docSnap.data() as AppState;
              console.log("Received update from Firebase");
              
              // Simple merge: Remote data takes precedence for shared state
              setAppState(remoteData);
              localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteData));
              setDbSyncStatus('idle');
            } else {
              console.log("No global document found. Using initial/local state.");
              // Create the initial document if it doesn't exist
              saveToCloud(INITIAL_STATE);
            }
          }, 
          (error) => {
            console.error("Firebase subscription error:", error);
            setDbSyncStatus('error');
            setIsLoaded(true);
          }
        );
        return () => unsubscribe();
    } catch (err) {
        console.error("Erro crítico ao conectar no Firestore:", err);
        setDbSyncStatus('error');
        setIsLoaded(true);
    }
  }, []);

  // Fetch Dollar Rate
  const fetchDollarRate = useCallback(async () => {
    try {
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        const data = await response.json();
        const bid = parseFloat(data.USDBRL.bid);
        
        if (!isNaN(bid)) {
            setAppState(prev => {
                const newState = { ...prev, dollarRate: bid };
                return newState;
            });
            setLastRateUpdate(Date.now());
        }
    } catch (error) {
        console.error("Failed to fetch dollar rate", error);
    }
  }, []);

  // Auto-Update Dollar Rate
  useEffect(() => {
    if (!missingConfig) {
        fetchDollarRate();
        const interval = setInterval(fetchDollarRate, 60000); // Update every 60s
        return () => clearInterval(interval);
    }
  }, [fetchDollarRate, missingConfig]);


  // Sync Function: Save to Cloud
  const saveToCloud = useCallback(async (state: AppState) => {
      if (missingConfig || !db) return;
      setDbSyncStatus('syncing');
      try {
          await setDoc(doc(db, 'jar_state', 'global'), state);
          setDbSyncStatus('idle');
      } catch (err) {
          console.error("Error saving to cloud", err);
          setDbSyncStatus('error');
      }
  }, [missingConfig]);

  // Debounced Auto-Save
  useEffect(() => {
    if (!isLoaded || missingConfig) return;

    // 1. Save Local
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

    // 2. Save Cloud (Debounced)
    const handler = setTimeout(() => {
        saveToCloud(appState);
    }, 1000); // 1 second debounce

    return () => clearTimeout(handler);
  }, [appState, isLoaded, saveToCloud, missingConfig]);


  // Actions
  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => ({ 
        ...prev, 
        ...updates,
        lastUpdated: Date.now() // Always update timestamp on change
    }));
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    updateState({ transactions: [...appState.transactions, newTransaction] });
  };

  const deleteTransaction = (id: string) => {
    updateState({ transactions: appState.transactions.filter(t => t.id !== id) });
  };

  const setDollarRate = (rate: number) => {
    updateState({ dollarRate: rate });
  };

  const handleClearData = () => {
    const newState = {
        ...INITIAL_STATE,
        dollarRate: appState.dollarRate || INITIAL_STATE.dollarRate,
        lastUpdated: Date.now()
    };
    // Force update to cloud immediately
    setAppState(newState);
    saveToCloud(newState);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `jar_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              if (e.target?.result) {
                  const importedState = JSON.parse(e.target.result as string);
                  const mergedState = { ...INITIAL_STATE, ...importedState, lastUpdated: Date.now() };
                  setAppState(mergedState);
                  saveToCloud(mergedState);
              }
          } catch (err) {
              alert("Erro ao ler arquivo de backup.");
          }
      };
      reader.readAsText(file);
  };

  if (missingConfig) {
      return (
          <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-8 text-center font-mono">
              <h1 className="text-3xl text-[#FF6F00] font-black mb-4">CONFIGURAÇÃO NECESSÁRIA</h1>
              <div className="bg-[#111] border-2 border-white/20 p-6 max-w-xl text-left">
                  <p className="text-white mb-4">O app não conseguiu inicializar o Firebase.</p>
                  <ol className="list-decimal pl-5 text-neutral-400 space-y-2 text-sm">
                      <li>As chaves estão configuradas no código.</li>
                      <li>Verifique se o seu deploy na Vercel está atualizado com o último commit.</li>
                  </ol>
                  <div className="mt-8 pt-4 border-t border-white/10 text-xs text-neutral-500 break-all">
                      <span className="text-white font-bold block mb-1">DETALHES DO ERRO:</span>
                      {initError ? initError : "DB Object is undefined (Configuração provavelmente não foi carregada)"}
                  </div>
              </div>
          </div>
      );
  }

  if (!isLoaded) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#FF6F00] font-black animate-pulse">LOADING J.A.R. SYSTEM...</div>;

  return (
    <>
        <Layout 
        currentTab={activeTab} 
        setTab={setActiveTab}
        dollarRate={appState.dollarRate}
        setDollarRate={setDollarRate}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRefreshRate={fetchDollarRate}
        lastRateUpdate={lastRateUpdate}
        isDbConnected={true} 
        dbSyncStatus={dbSyncStatus}
        >
        {activeTab === Tab.ROADMAP && (
            <Roadmap 
            state={appState} 
            addTransaction={addTransaction} 
            deleteTransaction={deleteTransaction}
            updateState={updateState}
            />
        )}
        {activeTab === Tab.PROGRESSO && (
            <Progress 
            state={appState} 
            updateState={updateState}
            />
        )}
        {activeTab === Tab.SAQUES && (
            <Withdrawals 
            state={appState} 
            addTransaction={addTransaction} 
            deleteTransaction={deleteTransaction}
            updateState={updateState}
            />
        )}
        {activeTab === Tab.DASHBOARD && (
            <Dashboard 
            state={appState} 
            />
        )}
        </Layout>

        <DatabaseModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            config={{ url: 'FIREBASE', key: 'ENV', connected: true }} 
            onSaveConfig={() => {}}
            onExport={handleExport}
            onImport={handleImport}
            onReset={handleClearData}
        />
    </>
  );
};

export default App;