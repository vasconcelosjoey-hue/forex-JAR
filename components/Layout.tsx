
import React, { useState } from 'react';
import { Tab } from '../types';
import { Settings, RotateCcw, LayoutDashboard, TrendingUp, ArrowDownCircle, PieChart, Menu, X, Cloud, Users, BarChart3 } from 'lucide-react';

interface LayoutProps {
  currentTab: Tab;
  setTab: (tab: Tab) => void;
  dollarRate: number;
  setDollarRate: (rate: number) => void;
  onOpenSettings: () => void;
  onRefreshRate: () => void;
  onManualSave: () => void;
  lastRateUpdate: number | null;
  isDbConnected: boolean;
  dbSyncStatus: 'idle' | 'syncing' | 'error' | 'success';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const getThemeColor = (tab: Tab) => {
    switch(tab) {
        case Tab.PROGRESSO: 
        case Tab.PROGRESSO_JM: 
        case Tab.PROGRESSO_J200: return 'text-[#00e676]';
        case Tab.SAQUES: return 'text-[#ffd700]';
        case Tab.DASHBOARD: return 'text-white';
        default: return 'text-[#FF6F00]';
    }
  };

  const getActiveStyle = (tab: Tab) => {
    switch(tab) {
        case Tab.PROGRESSO:
        case Tab.PROGRESSO_JM:
        case Tab.PROGRESSO_J200: return 'bg-[#00e676] border-[#00e676] text-black shadow-[4px_4px_0px_0px_#00e676]';
        case Tab.SAQUES: return 'bg-[#ffd700] border-[#ffd700] text-black shadow-[4px_4px_0px_0px_#ffd700]';
        case Tab.DASHBOARD: return 'bg-white border-white text-black shadow-[4px_4px_0px_0px_white]';
        default: return 'bg-[#FF6F00] border-[#FF6F00] text-black shadow-[4px_4px_0px_0px_#FF6F00]';
    }
  };

  const getHoverStyle = (tab: Tab) => {
    switch(tab) {
        case Tab.PROGRESSO:
        case Tab.PROGRESSO_JM:
        case Tab.PROGRESSO_J200: return 'hover:border-[#00e676] hover:text-[#00e676] hover:shadow-[4px_4px_0px_0px_#00e676]';
        case Tab.SAQUES: return 'hover:border-[#ffd700] hover:text-[#ffd700] hover:shadow-[4px_4px_0px_0px_#ffd700]';
        case Tab.DASHBOARD: return 'hover:border-white hover:text-white hover:shadow-[4px_4px_0px_0px_white]';
        default: return 'hover:border-[#FF6F00] hover:text-[#FF6F00] hover:shadow-[4px_4px_0px_0px_#FF6F00]';
    }
  };

  const navItems = [
    { id: Tab.PROGRESSO, label: 'Progresso J.A.R.', icon: <TrendingUp size={16} /> },
    { id: Tab.PROGRESSO_JM, label: 'Progresso J.M.', icon: <Users size={16} /> },
    { id: Tab.PROGRESSO_J200, label: 'Progresso J200', icon: <BarChart3 size={16} /> },
    { id: Tab.ROADMAP, label: 'Roadmap', icon: <LayoutDashboard size={16} /> },
    { id: Tab.SAQUES, label: 'Saques', icon: <ArrowDownCircle size={16} /> },
    { id: Tab.DASHBOARD, label: 'Dashboard', icon: <PieChart size={16} /> },
  ];

  const brandColor = getThemeColor(currentTab);
  const mainBgClass = currentTab === Tab.DASHBOARD ? 'bg-white' : 'bg-[#050505]';

  const handleTabClick = (tab: Tab) => {
      setTab(tab);
      setIsMobileMenuOpen(false);
  };

  return (
    <div className={`flex min-h-screen ${mainBgClass} text-white font-mono transition-colors duration-500 relative`}>
      
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-black border-b-2 border-white/20 z-40 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
                <span className={`text-xs mr-1 not-italic font-mono ${brandColor}`}>FOREX</span>
                J.A.R.
            </h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`p-2 border-2 border-white/20 ${brandColor} active:bg-white/10`}
          >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
      </div>

      {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      <aside className={`
        w-64 fixed inset-y-0 left-0 bg-[#000] border-r-2 border-white/20 flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        <div className="p-6 pb-4 border-b-2 border-white/20 hidden lg:block">
            <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase relative leading-[0.8]">
                <span className={`block text-[10px] mb-1 not-italic font-mono tracking-widest transition-colors ${brandColor}`}>FOREX</span>
                J.A.R.
            </h1>
        </div>

        <div className="p-4 border-b-2 border-white/20 bg-[#111]">
            <div className="relative group">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest block">USD/BRL</label>
                    <button onClick={onRefreshRate} className={`p-1 hover:text-black transition-all text-neutral-500 ${brandColor.replace('text-', 'hover:bg-')}`}>
                        <RotateCcw size={10} className={lastRateUpdate && Date.now() - lastRateUpdate < 1000 ? 'animate-spin' : ''} />
                    </button>
                </div>
                <div className="flex items-baseline gap-2 border-2 border-white/20 bg-black p-1.5">
                    <span className="text-neutral-500 font-bold text-xs">$</span>
                    <input
                        type="number"
                        step="0.01"
                        value={dollarRate.toFixed(2)}
                        onChange={(e) => setDollarRate(parseFloat(e.target.value) || 0)}
                        className={`w-full bg-transparent text-xl font-black focus:outline-none font-mono ${brandColor}`}
                    />
                </div>
            </div>
        </div>

        <nav className="flex-1 p-4 space-y-3 overflow-y-auto">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`
                        w-full flex items-center gap-3 px-3 py-3 text-xs font-black tracking-tight border-2 transition-all duration-150 uppercase
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

        <div className="p-4 border-t-2 border-white/20 bg-[#080808]">
            <div className="flex items-center justify-between gap-2 mb-3 text-[9px] font-mono border border-dashed border-white/20 p-2">
                <span className="text-neutral-500">SERVER:</span>
                {dbSyncStatus === 'syncing' && <span className={`${brandColor} animate-pulse font-bold`}>SYNC...</span>}
                {dbSyncStatus === 'error' && <span className="text-[#ff4444] font-bold">ERRO</span>}
                {dbSyncStatus === 'success' && <span className="text-[#00e676] font-bold">OK</span>}
                {isDbConnected && dbSyncStatus === 'idle' && <span className="text-[#00e676] font-bold">ONLINE</span>}
                {!isDbConnected && <span className="text-neutral-600">OFFLINE</span>}
            </div>

            <button 
                onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
                className={`
                    w-full flex items-center justify-center gap-2 p-2.5 border-2 transition-all duration-150 uppercase
                    ${isDbConnected ? 'bg-black border-white/20 text-neutral-200 font-bold hover:text-black hover:bg-white' : 'bg-[#ff4444]/10 border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444] hover:text-black'}
                `}
            >
                <Settings size={14} />
                <span className="text-[10px] font-black">Configurações</span>
            </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8 animate-in fade-in duration-300 max-w-[1600px] w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};
