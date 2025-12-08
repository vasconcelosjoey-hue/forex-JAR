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

// Mudei a chave para forçar uma "limpeza" suave no cache dos navegadores
const STORAGE_KEY = 'JAR_DASHBOARD_V2_SYNCED';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ROADMAP);
  
  // Inicializa com LocalStorage para exibir algo rápido enquanto carrega
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

  // Controle de origem da atualização
  const isRemoteUpdate = useRef(false);
  // Bloqueia salvamento até a primeira carga do servidor
  const hasInitialLoad = useRef(false);

  const saveLocalInstant = (state: AppState) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Comparação profunda simples para evitar loops
  const isStateDifferent = (local: AppState, remote: AppState) => {
      // Compara JSONs removendo timestamps que mudam sempre
      const cleanLocal = JSON.stringify({ ...local, lastUpdated: 0 });
      const cleanRemote = JSON.stringify({ ...remote, lastUpdated: 0 });
      return cleanLocal !== cleanRemote;
  };

  // 1. LISTENER DO FIREBASE (A Verdade Absoluta)
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
              const remoteData = docSnap.data() as AppState;
              
              setAppState(currentLocal => {
                  // Se os dados forem iguais, ignoramos para não renderizar à toa
                  if (!isStateDifferent(currentLocal, remoteData)) {
                      setDbSyncStatus('idle');
                      hasInitialLoad.current = true;
                      return currentLocal;
                  }

                  console.log("Recebendo atualização do servidor (Mestre)...");
                  
                  // MARCA QUE É UPDATE REMOTO para o useEffect de save não devolver pro servidor
                  isRemoteUpdate.current = true; 
                  hasInitialLoad.current = true;

                  // O Servidor manda. Sobrescrevemos o local.
                  // Mantemos apenas drafts se o servidor estiver vazio nessa parte,
                  // mas priorizamos o servidor para garantir sincronia.
                  const newState = {
                      ...remoteData,
                      lastUpdated: Date.now()
                  };

                  saveLocalInstant(newState);
                  setDbSyncStatus('idle');
                  return newState;
              });
              
            } else {
              // Se não existe nada no servidor (Banco Zerado), aí sim o Local manda
              console.log("Banco vazio. Criando registro inicial.");
              hasInitialLoad.current = true;
              setDbSyncStatus('idle');
              // O useEffect de save vai rodar em seguida e criar o doc
            }
          }, 
          (error) => {
            console.error("Erro Firebase:", error);
            setDbSyncStatus('error');
            hasInitialLoad.current = true; // Libera uso offline se der erro
          }
        );
        return () => unsubscribe();
    } catch (err) {
        setDbSyncStatus('error');
    }
  }, []);

  // 2. BUSCA COTAÇÃO DÓLAR
  const fetchDollarRate = useCallback(async () => {
    try {
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        const data = await response.json();
        const bid = parseFloat(data.USDBRL.bid);
        
        if (!isNaN(bid)) {
            setAppState(prev => {
                // Só atualiza se mudou
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


  // 3. FUNÇÃO DE SALVAR (Escrita)
  const saveToCloud = useCallback(async (state: AppState) => {
      if (missingConfig || !db) return;
      
      setDbSyncStatus('syncing');
      try {
          const stateToSave = { ...state, lastUpdated: Date.now() };
          await setDoc(doc(db, 'jar_state', 'global'), stateToSave);
          setTimeout(() => setDbSyncStatus('idle'), 500);
      } catch (err) {
          console.error("Erro ao salvar:", err);
          setDbSyncStatus('error');
      }
  }, [missingConfig]);

  // 4. TRIGGER DE AUTO-SAVE (Lógica Corrigida)
  useEffect(() => {
    if (missingConfig) return;

    // Se ainda não carregamos a versão inicial do servidor, PROIBIDO SALVAR.
    // Isso evita que o celular sobrescreva o servidor ao ligar.
    if (!hasInitialLoad.current) return;

    // Se a mudança veio do servidor (isRemoteUpdate), NÃO salvamos de volta.
    // Isso evita o loop infinito.
    if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false; // Reseta a flag e sai
        return;
    }

    // Se chegou aqui, foi o usuário que mexeu (input, botão, etc). Salva.
    const handler = setTimeout(() => {
        saveLocalInstant(appState); // Salva local
        saveToCloud(appState);      // Salva nuvem
    }, 1000); 
    
    return () => clearTimeout(handler);
  }, [appState, saveToCloud, missingConfig]);


  // ACTIONS
  const updateState = (updates: Partial<AppState>) => {
    setAppState(prev => {
        const newState = { 
            ...prev, 
            ...updates,
            lastUpdated: Date.now()
        };
        // Não salvamos instantaneamente aqui, deixamos o useEffect lidar com isso
        // para aproveitar o debounce e a lógica de proteção.
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
    // Reset total
    const newState = {
        ...INITIAL_STATE,
        dollarRate: appState.dollarRate || INITIAL_STATE.dollarRate,
        lastUpdated: Date.now()
    };
    setAppState(newState);
    // Aqui forçamos o save imediato
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
                  // Importação conta como ação de usuário, então deixamos o useEffect salvar
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