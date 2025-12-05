import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Roadmap } from './views/Roadmap';
import { Progress } from './views/Progress';
import { Withdrawals } from './views/Withdrawals';
import { Dashboard } from './views/Dashboard';
import { DatabaseModal } from './components/DatabaseModal';
import { Tab, AppState, Transaction, DatabaseConfig } from './types';
import { INITIAL_STATE, SHARED_DB_CONFIG } from './constants';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'JAR_DASHBOARD_V1';
const DB_CONFIG_KEY = 'JAR_DB_CONFIG';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.ROADMAP);
  const [appState, setAppState] = useState<AppState>({
    ...INITIAL_STATE,
    lastUpdated: Date.now()
  });
  
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>({
    url: SHARED_DB_CONFIG.url || '',
    key: SHARED_DB_CONFIG.key || '',
    connected: !!(SHARED_DB_CONFIG.url && SHARED_DB_CONFIG.key)
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  
  const [lastRateUpdate, setLastRateUpdate] = useState<number | null>(null);

  // Initialize App Data and Database Connection
  useEffect(() => {
    const initApp = async () => {
        try {
            // 1. Try to load local preferences for Dollar Rate/Tabs (optional)
            const savedStateStr = localStorage.getItem(STORAGE_KEY);
            let localState = savedStateStr ? JSON.parse(savedStateStr) : null;
            
            // If we have local state, use it initially to prevent flicker
            if (localState) {
                setAppState(prev => ({ ...prev, ...localState }));
            }

            // 2. Setup Database Connection
            // Priority: Shared Config (Code) > LocalStorage Config
            const savedConfigStr = localStorage.getItem(DB_CONFIG_KEY);
            const savedConfig = savedConfigStr ? JSON.parse(savedConfigStr) : null;

            // Determine effective config
            const effectiveUrl = SHARED_DB_CONFIG.url || savedConfig?.url || '';
            const effectiveKey = SHARED_DB_CONFIG.key || savedConfig?.key || '';
            const isConnected = !!(effectiveUrl && effectiveKey);

            setDbConfig({
                url: effectiveUrl,
                key: effectiveKey,
                connected: isConnected,
                lastSync: savedConfig?.lastSync
            });

            if (isConnected) {
                try {
                    const client = createClient(effectiveUrl, effectiveKey);
                    setSupabaseClient(client);
                    // Fetch latest data from cloud immediately
                    await fetchFromCloud(client, localState);
                } catch (err) {
                    console.error("Failed to initialize Supabase client", err);
                    setDbSyncStatus('error');
                }
            }
        } catch (e) {
            console.error("Failed to load app initialization", e);
        } finally {
            setIsLoaded(true);
        }
    };

    initApp();
  }, []);

  // Fetch Dollar Rate
  const fetchDollarRate = useCallback(async () => {
    try {
        const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        const data = await response.json();
        const bid = parseFloat(data.USDBRL.bid);
        
        if (!isNaN(bid)) {
            setAppState(prev => ({ ...prev, dollarRate: bid }));
            setLastRateUpdate(Date.now());
        }
    } catch (error) {
        console.error("Failed to fetch dollar rate", error);
    }
  }, []);

  // Auto-Update Dollar Rate
  useEffect(() => {
    fetchDollarRate();
    const interval = setInterval(fetchDollarRate, 60000); // Update every 60s
    return () => clearInterval(interval);
  }, [fetchDollarRate]);


  // Sync Function: Fetch from Cloud
  const fetchFromCloud = async (client: SupabaseClient, localState: AppState | null) => {
      setDbSyncStatus('syncing');
      try {
          const { data, error } = await client
            .from('jar_data')
            .select('*')
            .eq('id', 'global_state')
            .single();

          if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

          if (data && data.content) {
              const cloudState = data.content as AppState;
              // Simple Conflict Resolution: Cloud usually wins on initial load or if newer
              // If we want "everyone sees the same", we should trust Cloud on load.
              console.log("Cloud state loaded.");
              setAppState(cloudState);
              // Update local storage to match cloud
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
          }
          setDbSyncStatus('idle');
      } catch (err) {
          console.error("Error fetching from cloud", err);
          setDbSyncStatus('error');
      }
  };

  // Sync Function: Save to Cloud
  const saveToCloud = useCallback(async (state: AppState) => {
      if (!supabaseClient) return;
      
      console.log('Saving to cloud...');
      setDbSyncStatus('syncing');
      try {
          const { error } = await supabaseClient
            .from('jar_data')
            .upsert({ 
                id: 'global_state', 
                content: state, 
                updated_at: new Date().toISOString() 
            });
          
          if (error) throw error;
          console.log('Cloud sync success');
          setDbSyncStatus('idle');
          setDbConfig(prev => ({ ...prev, lastSync: new Date().toISOString() }));
      } catch (err) {
          console.error("Error saving to cloud", err);
          setDbSyncStatus('error');
      }
  }, [supabaseClient]);

  // Debounced Auto-Save
  useEffect(() => {
    if (!isLoaded) return;

    // 1. Save Local
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));

    // 2. Save Cloud (Debounced)
    // Only save if WE initiated the change (logic implicitly handled by React state updates triggered by user)
    if (dbConfig.connected && supabaseClient) {
        const handler = setTimeout(() => {
            saveToCloud(appState);
        }, 1000); // 1 second debounce for faster typing sync

        return () => clearTimeout(handler);
    }
  }, [appState, isLoaded, dbConfig.connected, supabaseClient, saveToCloud]);


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

  // Database Configuration Handlers (Manual Override)
  const handleSaveConfig = (newConfig: DatabaseConfig) => {
      setDbConfig(newConfig);
      localStorage.setItem(DB_CONFIG_KEY, JSON.stringify(newConfig));
      
      if (newConfig.connected && newConfig.url && newConfig.key) {
          try {
              const client = createClient(newConfig.url, newConfig.key);
              setSupabaseClient(client);
              fetchFromCloud(client, appState);
          } catch (err) {
              console.error("Failed to initialize client with new config", err);
              alert("Erro ao conectar com Supabase. Verifique URL/Key.");
          }
      } else {
          setSupabaseClient(null);
      }
  };

  const handleClearData = () => {
    // Reset to initial state but keep current dollar rate if available
    const newState = {
        ...INITIAL_STATE,
        dollarRate: appState.dollarRate || INITIAL_STATE.dollarRate,
        lastUpdated: Date.now()
    };
    setAppState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
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

  if (!isLoaded) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-[#FF6F00] font-black animate-pulse">LOADING J.A.R...</div>;

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
        isDbConnected={dbConfig.connected}
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
            config={dbConfig}
            onSaveConfig={handleSaveConfig}
            onExport={handleExport}
            onImport={handleImport}
            onReset={handleClearData}
        />
    </>
  );
};

export default App;