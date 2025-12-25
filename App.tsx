
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Roadmap } from './views/Roadmap';
import { Progress } from './views/Progress';
import { Withdrawals } from './views/Withdrawals';
import { Dashboard } from './views/Dashboard';
import { DatabaseModal } from './components/DatabaseModal';
import { Tab, AppState, Transaction, DashboardState } from './types';
import { INITIAL_STATE } from './constants';
import { db, initError, saveDashboardState, subscribeToDashboardState } from './services/firebase';

const STORAGE_KEY = 'JAR_DASHBOARD_V6_REALTIME';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PROGRESSO);
  
  // 1. Inicializa Estado
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
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('syncing');
  const [missingConfig, setMissingConfig] = useState(false);
  const [lastRateUpdate, setLastRateUpdate] = useState<number | null>(null);

  const isRemoteUpdate = useRef(false);

  // Helper para garantir estrutura de dados válida vindo do servidor
  const sanitizeState = (remoteData: any): DashboardState => {
      const baseDrafts = INITIAL_STATE.drafts;
      const remoteDrafts = remoteData.drafts || {};

      return {
          ...INITIAL_STATE, 
          ...remoteData,    
          drafts: {
              roadmap: { ...baseDrafts.roadmap, ...(remoteDrafts.roadmap || {}) },
              withdrawals: { ...baseDrafts.withdrawals, ...(remoteDrafts.withdrawals || {}) },
              progress: { ...baseDrafts.progress, ...(remoteDrafts.progress || {}) },
          },
      };
  };

  // 2. SUBSCRIPTION (Realtime Listener)
  useEffect(() => {
    setIsLoaded(true);

    if (!db) {
        setMissingConfig(true);
        return;
    }
    
    console.log("Iniciando subscrição em tempo real...");
    
    // Usa a função do service conforme solicitado
    const unsubscribe = subscribeToDashboardState((newState) => {
        const sanitized = sanitizeState(newState);
        
        // Verificação simples para evitar re-render desnecessário se for idêntico
        setAppState(currentState => {
            const currentStr = JSON.stringify({ ...currentState, lastUpdated: 0 });
            const newStr = JSON.stringify({ ...sanitized, lastUpdated: 0 });
            
            if (currentStr === newStr) {
                setDbSyncStatus('idle');
                return currentState;
            }

            console.log("SYNC: Atualização recebida do servidor.");
            isRemoteUpdate.current = true; // Marca flag para evitar loop de auto-save imediato
            
            // Persiste localmente também
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            
            setDbSyncStatus('idle');
            return sanitized;
        });
    });

    return () => unsubscribe();
  }, []);

  // 3. DOLLAR RATE (Background Fetch)
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


  // 4. SAVE FUNCTION (Centralizada no Service)
  const handleSaveToCloud = useCallback(async (state: AppState, isManual: boolean = false) => {
      if (missingConfig || !db) return;
      
      setDbSyncStatus('syncing');
      try {
          // Usa a função exportada do service
          await saveDashboardState(state);
          
          if (isManual) {
              setDbSyncStatus('success');
              setTimeout(() => setDbSyncStatus('idle'), 2000);
          } else {
              setTimeout(() => setDbSyncStatus('idle'), 500);
          }
      } catch (err) {
          console.error("Erro ao salvar:", err);
          setDbSyncStatus('error');
      }
  }, [missingConfig]);

  const handleManualSave = () => {
      handleSaveToCloud(appState, true);
  };

  // 5. AUTO-SAVE (Background Debounce)
  useEffect(() => {
    if (missingConfig) return;

    // Se a atualização veio do servidor, não disparamos o save de volta imediatamente
    if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
    }

    const handler = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        handleSaveToCloud(appState, false); 
    }, 1000); // 1 segundo de debounce para auto-save
    
    return () => clearTimeout(handler);
  }, [appState, handleSaveToCloud, missingConfig]);


  // --- STATE ACTIONS ---
  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => {
        return { 
            ...prev, 
            ...updates,
            lastUpdated: Date.now()
        };
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
    handleManualSave(); 
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
                  handleManualSave(); // Salva imediatamente no cloud ao importar
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
        onManualSave={handleManualSave}
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
