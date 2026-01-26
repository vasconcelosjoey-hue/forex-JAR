
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
              progress_jm: { ...baseDrafts.progress_jm, ...(remoteDrafts.progress_jm || {}) },
              progress_j200: { ...baseDrafts.progress_j200, ...(remoteDrafts.progress_j200 || {}) },
          },
      };
  };

  useEffect(() => {
    setIsLoaded(true);

    if (!db) {
        setMissingConfig(true);
        return;
    }
    
    const unsubscribe = subscribeToDashboardState((newState) => {
        const sanitized = sanitizeState(newState);
        
        setAppState(currentState => {
            const currentStr = JSON.stringify({ ...currentState, lastUpdated: 0 });
            const newStr = JSON.stringify({ ...sanitized, lastUpdated: 0 });
            
            if (currentStr === newStr) {
                setDbSyncStatus('idle');
                return currentState;
            }

            isRemoteUpdate.current = true; 
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            setDbSyncStatus('idle');
            return sanitized;
        });
    });

    return () => unsubscribe();
  }, []);

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


  const handleSaveToCloud = useCallback(async (state: AppState, isManual: boolean = false) => {
      if (missingConfig || !db) return;
      
      setDbSyncStatus('syncing');
      try {
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

  useEffect(() => {
    if (missingConfig) return;

    if (isRemoteUpdate.current) {
        isRemoteUpdate.current = false;
        return;
    }

    const handler = setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
        handleSaveToCloud(appState, false); 
    }, 1000); 
    
    return () => clearTimeout(handler);
  }, [appState, handleSaveToCloud, missingConfig]);


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
    handleSaveToCloud(newState, true); 
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
                  handleSaveToCloud(mergedState, true);
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
        onManualSave={() => handleSaveToCloud(appState, true)}
        lastRateUpdate={lastRateUpdate}
        isDbConnected={true} 
        dbSyncStatus={dbSyncStatus}
        >
        {activeTab === Tab.APORTES_JAR && (
            <Roadmap 
            state={appState} 
            addTransaction={addTransaction} 
            deleteTransaction={deleteTransaction}
            updateState={updateState}
            />
        )}
        {activeTab === Tab.PROGRESSO && (
            <Progress 
                title="JOEY | ALEX | RUBINHO"
                dollarRate={appState.dollarRate}
                startDate={appState.startDate}
                startDepositUsd={appState.startDepositUsd}
                currentDate={appState.currentDate}
                currentBalanceUsd={appState.currentBalanceUsd}
                dailyHistory={appState.dailyHistory}
                valuationBaseBrl={appState.valuationBaseBrl}
                additionalDepositDraft={appState.drafts.progress.additionalDeposit}
                onUpdate={(upds) => {
                    const mapped: any = { ...upds };
                    if (upds.additionalDeposit !== undefined) {
                        updateState({
                            ...mapped,
                            drafts: {
                                ...appState.drafts,
                                progress: { ...appState.drafts.progress, additionalDeposit: upds.additionalDeposit }
                            }
                        });
                    } else {
                        updateState(mapped);
                    }
                }}
            />
        )}
        {activeTab === Tab.PROGRESSO_10K && (
            <Progress 
                title="PROGRESSO 10K"
                dollarRate={appState.dollarRate}
                startDate={appState.startDate_jm}
                startDepositUsd={appState.startDepositUsd_jm}
                currentDate={appState.currentDate_jm}
                currentBalanceUsd={appState.currentBalanceUsd_jm}
                dailyHistory={appState.dailyHistory_jm}
                valuationBaseBrl={appState.valuationBaseBrl_jm}
                additionalDepositDraft={appState.drafts.progress_jm.additionalDeposit}
                onUpdate={(upds) => {
                    const mapped: any = {};
                    if (upds.startDate) mapped.startDate_jm = upds.startDate;
                    if (upds.startDepositUsd !== undefined) mapped.startDepositUsd_jm = upds.startDepositUsd;
                    if (upds.currentDate) mapped.currentDate_jm = upds.currentDate;
                    if (upds.currentBalanceUsd !== undefined) mapped.currentBalanceUsd_jm = upds.currentBalanceUsd;
                    if (upds.dailyHistory) mapped.dailyHistory_jm = upds.dailyHistory;
                    if (upds.valuationBaseBrl !== undefined) mapped.valuationBaseBrl_jm = upds.valuationBaseBrl;
                    
                    if (upds.additionalDeposit !== undefined) {
                        updateState({
                            ...mapped,
                            drafts: {
                                ...appState.drafts,
                                progress_jm: { ...appState.drafts.progress_jm, additionalDeposit: upds.additionalDeposit }
                            }
                        });
                    } else {
                        updateState(mapped);
                    }
                }}
            />
        )}
        {activeTab === Tab.PROGRESSO_200USD && (
            <Progress 
                title="PROGRESSO JOEY MT5"
                dollarRate={appState.dollarRate}
                startDate={appState.startDate_j200}
                startDepositUsd={appState.startDepositUsd_j200}
                currentDate={appState.currentDate_j200}
                currentBalanceUsd={appState.currentBalanceUsd_j200}
                dailyHistory={appState.dailyHistory_j200}
                valuationBaseBrl={appState.valuationBaseBrl_j200}
                additionalDepositDraft={appState.drafts.progress_j200.additionalDeposit}
                onUpdate={(upds) => {
                    const mapped: any = {};
                    if (upds.startDate) mapped.startDate_j200 = upds.startDate;
                    if (upds.startDepositUsd !== undefined) mapped.startDepositUsd_j200 = upds.startDepositUsd;
                    if (upds.currentDate) mapped.currentDate_j200 = upds.currentDate;
                    if (upds.currentBalanceUsd !== undefined) mapped.currentBalanceUsd_j200 = upds.currentBalanceUsd;
                    if (upds.dailyHistory) mapped.dailyHistory_j200 = upds.dailyHistory;
                    if (upds.valuationBaseBrl !== undefined) mapped.valuationBaseBrl_j200 = upds.valuationBaseBrl;
                    
                    if (upds.additionalDeposit !== undefined) {
                        updateState({
                            ...mapped,
                            drafts: {
                                ...appState.drafts,
                                progress_j200: { ...appState.drafts.progress_j200, additionalDeposit: upds.additionalDeposit }
                            }
                        });
                    } else {
                        updateState(mapped);
                    }
                }}
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
