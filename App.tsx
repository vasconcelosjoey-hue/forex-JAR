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

const STORAGE_KEY = 'JAR_DASHBOARD_V3_SYNCED';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ROADMAP);
  
  // Inicializa com LocalStorage
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

  const isRemoteUpdate = useRef(false);
  const hasInitialLoad = useRef(false);

  const saveLocalInstant = (state: AppState) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const isStateDifferent = (local: AppState, remote: AppState) => {
      const cleanLocal = JSON.stringify({ ...local, lastUpdated: 0 });
      const cleanRemote = JSON.stringify({ ...remote, lastUpdated: 0 });
      return cleanLocal !== cleanRemote;
  };

  // Helper para garantir que o estado vindo do banco tenha a estrutura completa de drafts
  // Isso evita que inputs zerem se o banco tiver dados parciais
  const sanitizeState = (remoteData: any): AppState => {
      return {
          ...INITIAL_STATE, // Garante base
          ...remoteData,    // Sobrescreve com dados do banco
          drafts: {
              roadmap: { ...INITIAL_STATE.drafts.roadmap, ...(remoteData.drafts?.roadmap || {}) },
              withdrawals: { ...INITIAL_STATE.drafts.withdrawals, ...(remoteData.drafts?.withdrawals || {}) },
              progress: { ...INITIAL_STATE.drafts.progress, ...(remoteData.drafts?.progress || {}) },
          },
          lastUpdated: Date.now()
      };
  };

  // 1. LISTENER DO FIREBASE
  useEffect(() => {
    setIsLoaded(true);

    if (!db) {
        setMissingConfig(true);
        return;
    }
    
    try {
        console.log("Conectando ao Firebase...");
        const unsubscribe = onSnapshot(doc(db, 'jar_state', 'global'), 
          (docSnap) => {
            if (docSnap.exists()) {
              const remoteRaw = docSnap.data();
              // Sanitiza os dados para garantir que drafts existam
              const remoteData = sanitizeState(remoteRaw);
              
              setAppState(currentLocal => {
                  if (!isStateDifferent(currentLocal, remoteData)) {
                      setDbSyncStatus('idle');
                      hasInitialLoad.current = true;
                      return currentLocal;
                  }

                  console.log("Recebendo atualização do servidor (Sync Inputs)...");
                  isRemoteUpdate.current = true; 
                  hasInitialLoad.current = true;

                  saveLocalInstant(remoteData);
                  setDbSyncStatus('idle');
                  return remoteData;
              });
              
            } else {
              console.log("Banco vazio. Criando registro inicial.");
              hasInitialLoad.current = true;
              setDbSyncStatus('idle');
            }
          }, 
          (error) => {
            console.error("Erro Firebase:", error);
            setDbSyncStatus('error');
            hasInitialLoad.current = true;
          }
        );
        return () => unsubscribe();
    } catch (err) {
        setDbSyncStatus('error');
    }
  }, []);

  // 2. DOLLAR RATE
  const fetchDollarRate = useCallback(async () => {
    try {
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        const data = await response.json();
        const bid = parseFloat(data.USDBRL.bid);
        
        if (!isNaN(bid)) {
            setAppState(prev => {
                if (Math.abs(prev.dollarRate - bid) < 0.0001) return prev;
                return { ...prev, dollarRate: bid };
            });
            setLastRateUpdate(Date.now());
        }
    } catch (error) {
        console.error("Erro dollar rate", error);
    }
  }, []);

  useEffect(() => {
    if (!missingConfig) {
        fetchDollarRate();
        const interval = setInterval(fetchDollarRate, 60000); 
        return () => clearInterval(interval);
    }
  }, [fetchDollarRate, missingConfig]);


  // 3. SAVE FUNCTION
  const saveToCloud = useCallback(async (state: AppState) => {
      if (missingConfig || !db) return;
      
      setDbSyncStatus('syncing');
      try {
          const stateToSave = { ...state, lastUpdated: Date.now() };
          await setDoc(doc(db, 'jar_state', 'global'), stateToSave);
          setTimeout(() => setDbSyncStatus('idle'), 300);
      } catch (err) {
          console.error("Erro ao salvar:", err);
          setDbSyncStatus('error');
      }
  }, [missingConfig]);

  // 4. AUTO-SAVE TRIGGER
  useEffect(() => {
    if (missingConfig) return;
    if (!hasInitialLoad.current) return;

    if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
    }

    // Debounce reduzido para 500ms para sync mais rápido de inputs
    const handler = setTimeout(() => {
        saveLocalInstant(appState);
        saveToCloud(appState);
    }, 500); 
    
    return () => clearTimeout(handler);
  }, [appState, saveToCloud, missingConfig]);


  // ACTIONS
  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => {
        // Merge profundo manual para drafts se necessário, ou shallow merge padrão
        // Como 'updates' geralmente vem completo do componente, shallow resolve.
        // Mas garantimos que drafts nunca seja undefined
        const newState = { 
            ...prev, 
            ...updates,
            lastUpdated: Date.now()
        };
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
    hasInitialLoad.current = true;
    isRemoteUpdate.current = false;
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