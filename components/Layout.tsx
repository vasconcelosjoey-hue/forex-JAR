import React from 'react';
import { Tab } from '../types';
import { Settings, RotateCcw, LayoutDashboard, TrendingUp, ArrowDownCircle, PieChart } from 'lucide-react';

interface LayoutProps {
  currentTab: Tab;
  setTab: (tab: Tab) => void;
  dollarRate: number;
  setDollarRate: (rate: number) => void;
  onOpenSettings: () => void;
  onRefreshRate: () => void;
  lastRateUpdate: number | null;
  isDbConnected: boolean;
  dbSyncStatus: 'idle' | 'syncing' | 'error';
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  setTab,
  dollarRate,
  setDollarRate,
  onOpenSettings,
  onRefreshRate,
  lastRateUpdate,
  isDbConnected,
  dbSyncStatus,
  children
}) => {
  
  // Theme Config per Tab
  const getThemeColor = (tab: Tab) => {
    switch(tab) {
        case Tab.PROGRESSO: return 'text-[#00e676]';
        case Tab.SAQUES: return 'text-[#ffd700]';
        case Tab.DASHBOARD: return 'text-white'; // White for dashboard tab in sidebar
        default: return 'text-[#FF6F00]';
    }
  };

  const getActiveStyle = (tab: Tab) => {
    switch(tab) {
        case Tab.PROGRESSO: return 'bg-[#00e676] border-[#00e676] text-black shadow-[4px_4px_0px_0px_#00e676]';
        case Tab.SAQUES: return 'bg-[#ffd700] border-[#ffd700] text-black shadow-[4px_4px_0px_0px_#ffd700]';
        case Tab.DASHBOARD: return 'bg-white border-white text-black shadow-[4px_4px_0px_0px_white]';
        default: return 'bg-[#FF6F00] border-[#FF6F00] text-black shadow-[4px_4px_0px_0px_#FF6F00]';
    }
  };

  const getHoverStyle = (tab: Tab) => {
    switch(tab) {
        case Tab.PROGRESSO: return 'hover:border-[#00e676] hover:text-[#00e676] hover:shadow-[4px_4px_0px_0px_#00e676]';
        case Tab.SAQUES: return 'hover:border-[#ffd700] hover:text-[#ffd700] hover:shadow-[4px_4px_0px_0px_#ffd700]';
        case Tab.DASHBOARD: return 'hover:border-white hover:text-white hover:shadow-[4px_4px_0px_0px_white]';
        default: return 'hover:border-[#FF6F00] hover:text-[#FF6F00] hover:shadow-[4px_4px_0px_0px_#FF6F00]';
    }
  };

  const navItems = [
    { id: Tab.ROADMAP, label: 'Roadmap', icon: <LayoutDashboard size={18} /> },
    { id: Tab.PROGRESSO, label: 'Progresso', icon: <TrendingUp size={18} /> },
    { id: Tab.SAQUES, label: 'Saques', icon: <ArrowDownCircle size={18} /> },
    { id: Tab.DASHBOARD, label: 'Dashboard', icon: <PieChart size={18} /> },
  ];

  const brandColor = getThemeColor(currentTab);
  
  // Background logic: If dashboard, main bg is white. Else black.
  const mainBgClass = currentTab === Tab.DASHBOARD ? 'bg-white' : 'bg-[#050505]';

  return (
    <div className={`flex min-h-screen ${mainBgClass} text-white font-mono transition-colors duration-500`}>
      
      {/* SIDEBAR FIXED (Always Dark) */}
      <aside className="w-72 fixed inset-y-0 left-0 bg-[#000] border-r-2 border-white/20 flex flex-col z-50 transition-colors duration-300">
        
        {/* Logo Section */}
        <div className="p-8 pb-6 border-b-2 border-white/20">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase relative leading-[0.8]">
                <span className={`block text-sm mb-1 not-italic font-mono tracking-widest transition-colors ${brandColor}`}>FOREX</span>
                J.A.R.
            </h1>
            <div className="mt-4 flex items-center gap-2">
                <div className={`w-3 h-3 ${brandColor.replace('text-', 'bg-')}`}></div>
                <p className="text-[10px] tracking-widest text-neutral-500 font-bold uppercase">
                    Brutalism_V1
                </p>
            </div>
        </div>

        {/* Dollar Rate Card */}
        <div className="p-6 border-b-2 border-white/20 bg-[#111]">
            <div className="relative group">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block">
                        USD / BRL
                    </label>
                    <button 
                        onClick={onRefreshRate}
                        className={`p-1 hover:text-black border border-white/20 transition-all text-neutral-500 ${brandColor.replace('text-', 'hover:bg-')}`}
                        title="Atualizar"
                    >
                        <RotateCcw size={12} className={lastRateUpdate && Date.now() - lastRateUpdate < 1000 ? 'animate-spin' : ''} />
                    </button>
                </div>
                
                <div className="flex items-baseline gap-2 border-2 border-white/20 bg-black p-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
                    <span className="text-neutral-500 font-bold text-sm">$</span>
                    <input
                        type="number"
                        step="0.0001"
                        value={dollarRate}
                        onChange={(e) => setDollarRate(parseFloat(e.target.value) || 0)}
                        className={`w-full bg-transparent text-2xl font-black focus:outline-none font-mono ${brandColor}`}
                    />
                </div>
                
                {lastRateUpdate && (
                     <div className="text-[9px] text-neutral-600 font-mono mt-2 text-right">
                         ATT: {new Date(lastRateUpdate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                     </div>
                 )}
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6 space-y-4">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`
                        w-full flex items-center gap-4 px-4 py-4 text-sm font-bold tracking-tight border-2 transition-all duration-150 uppercase
                        ${currentTab === item.id 
                            ? getActiveStyle(item.id)
                            : `bg-black border-white/20 text-neutral-400 ${getHoverStyle(item.id)}`
                        }
                    `}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </nav>

        {/* Footer / Settings */}
        <div className="p-6 border-t-2 border-white/20 bg-[#080808]">
             {/* Sync Status Indicator */}
            <div className="flex items-center justify-between gap-2 mb-4 text-[10px] font-mono border border-dashed border-white/20 p-2">
                <span className="text-neutral-500">STATUS:</span>
                {dbSyncStatus === 'syncing' && <span className={`${brandColor} animate-pulse font-bold`}>SYNCING...</span>}
                {dbSyncStatus === 'error' && <span className="text-[#ff4444] font-bold">ERROR</span>}
                {isDbConnected && dbSyncStatus === 'idle' && <span className="text-[#00e676] font-bold">ONLINE</span>}
                {!isDbConnected && <span className="text-neutral-600">OFFLINE</span>}
            </div>

            <button 
                onClick={onOpenSettings}
                className={`
                    w-full flex items-center justify-center gap-2 p-3 border-2 transition-all duration-150 uppercase
                    ${isDbConnected 
                        ? 'bg-black border-white/20 text-neutral-400 hover:text-black hover:bg-white' 
                        : 'bg-[#ff4444]/10 border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444] hover:text-black'}
                `}
            >
                <Settings size={16} />
                <span className="text-xs font-bold">{isDbConnected ? 'Config' : 'Connect'}</span>
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-72 p-8 animate-in fade-in duration-300 max-w-[1600px]">
        {children}
      </main>
    </div>
  );
};