import React, { useState, useEffect, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Roadmap } from './views/Roadmap';
import { Progress } from './views/Progress';
import { Withdrawals } from './views/Withdrawals';
import { Dashboard } from './views/Dashboard';
import { DatabaseModal } from './components/DatabaseModal';
import { Tab, AppState, Transaction, DatabaseConfig } from './types';
import { INITIAL_STATE } from './constants';
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
    url: '',
    key: '',
    connected: false
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  
  const [lastRateUpdate, setLastRateUpdate] = useState<number | null>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      const savedConfig = localStorage.getItem(DB_CONFIG_KEY);

      if (savedState) {
        setAppState({ ...INITIAL_STATE, ...JSON.parse(savedState) });
      }

      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setDbConfig(config);
        if (config.connected && config.url && config.key) {
            try {
                const client = createClient(config.url, config.key);
                setSupabaseClient(client);
                // Trigger initial fetch
                fetchFromCloud(client, JSON.parse(savedState || 'null'));
            } catch (err) {
                console.error("Failed to initialize Supabase client", err);
                setDbSyncStatus('error');
            }
        }
      }
    } catch (e) {
      console.error("Failed to load persistence", e);
    } finally {
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
              // Simple Conflict Resolution: Last Updated Wins
              if (!localState || (cloudState.lastUpdated > (localState.lastUpdated || 0))) {
                  console.log("Cloud state is newer, updating local.");
                  setAppState(cloudState);
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudState));
              }
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

  // Database Configuration Handlers
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
                  // Ensure drafts exists in imported state
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
        />
    </>
  );
};

export default App;