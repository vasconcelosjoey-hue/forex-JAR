import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  const [appState, setAppState] = useState<AppState>(() => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
          try {
              return { ...INITIAL_STATE, ...JSON.parse(saved) };
          } catch (e) {
              return { ...INITIAL_STATE, lastUpdated: Date.now() };
          }
      }
      return { ...INITIAL_STATE, lastUpdated: Date.now() };
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'error'>('syncing');
  const [missingConfig, setMissingConfig] = useState(false);
  
  const [lastRateUpdate, setLastRateUpdate] = useState<number | null>(null);

  const saveLocalInstant = (state: AppState) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Helper to check deep equality of shared data
  // ATUALIZAÇÃO: Agora verificamos TUDO, incluindo drafts, para permitir o sync de inputs
  const isDataEqual = (local: AppState, remote: AppState) => {
      // Normalizamos removendo apenas lastUpdated
      const normalize = (s: AppState) => {
          const { lastUpdated, ...rest } = s;
          return rest;
      };
      return JSON.stringify(normalize(local)) === JSON.stringify(normalize(remote));
  };

  useEffect(() => {
    setIsLoaded(true);

    if (!db) {
        setMissingConfig(true);
        return;
    }
    
    try {
        const unsubscribe = onSnapshot(doc(db, 'jar_state', 'global'), 
          (docSnap) => {
            if (docSnap.exists()) {
              const remoteData = docSnap.data() as AppState;
              
              setAppState(currentLocalState => {
                  // BREAK INFINITE LOOP:
                  if (isDataEqual(currentLocalState, remoteData)) {
                      setDbSyncStatus('idle');
                      return currentLocalState;
                  }

                  // SYNC TOTAL:
                  // Agora aceitamos os drafts (inputs) que vêm do servidor.
                  // Isso permite que o PC atualize o Celular.
                  const mergedState = {
                      ...remoteData,
                      // Se o servidor não tiver drafts (legado), usa o local. Se tiver, usa do servidor.
                      drafts: remoteData.drafts || currentLocalState.drafts, 
                      lastUpdated: Date.now()
                  };
                  
                  saveLocalInstant(mergedState);
                  setDbSyncStatus('idle');
                  return mergedState;
              });
              
            } else {
              saveToCloud(appState);
              setDbSyncStatus('idle');
            }
          }, 
          (error) => {
            console.error("Firebase error:", error);
            setDbSyncStatus('error');
          }
        );
        return () => unsubscribe();
    } catch (err) {
        setDbSyncStatus('error');
    }
  }, []);

  const fetchDollarRate = useCallback(async () => {
    try {
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        const data = await response.json();
        const bid = parseFloat(data.USDBRL.bid);
        
        if (!isNaN(bid)) {
            setAppState(prev => {
                const newState = { ...prev, dollarRate: bid };
                saveLocalInstant(newState);
                return newState;
            });
            setLastRateUpdate(Date.now());
        }
    } catch (error) {
        console.error("Failed to fetch dollar rate", error);
    }
  }, []);

  useEffect(() => {
    if (!missingConfig) {
        fetchDollarRate();
        const interval = setInterval(fetchDollarRate, 60000); 
        return () => clearInterval(interval);
    }
  }, [fetchDollarRate, missingConfig]);


  const saveToCloud = useCallback(async (state: AppState) => {
      if (missingConfig || !db) return;
      setDbSyncStatus('syncing');
      try {
          const stateToSave = { ...state, lastUpdated: Date.now() };
          await setDoc(doc(db, 'jar_state', 'global'), stateToSave);
          setTimeout(() => setDbSyncStatus('idle'), 500);
      } catch (err) {
          console.error("Error saving to cloud", err);
          setDbSyncStatus('error');
      }
  }, [missingConfig]);

  // Debounced Cloud Save
  // Reduzido para 300ms para parecer mais "real-time" entre dispositivos
  useEffect(() => {
    if (missingConfig) return;
    const handler = setTimeout(() => {
        saveToCloud(appState);
    }, 500); 
    return () => clearTimeout(handler);
  }, [appState, saveToCloud, missingConfig]);


  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => {
        const newState = { 
            ...prev, 
            ...updates,
            lastUpdated: Date.now()
        };
        saveLocalInstant(newState);
        return newState;
    });
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
    setAppState(newState);
    saveLocalInstant(newState);
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
                  saveLocalInstant(mergedState);
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
                  <p className="text-xs text-neutral-500">{initError}</p>
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