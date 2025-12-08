import React, { useState } from 'react';
import { Tab } from '../types';
import { Settings, RotateCcw, LayoutDashboard, TrendingUp, ArrowDownCircle, PieChart, Menu, X, Save, Cloud } from 'lucide-react';

interface LayoutProps {
  currentTab: Tab;
  setTab: (tab: Tab) => void;
  dollarRate: number;
  setDollarRate: (rate: number) => void;
  onOpenSettings: () => void;
  onRefreshRate: () => void;
  onManualSave: () => void; // Nova prop
  lastRateUpdate: number | null;
  isDbConnected: boolean;
  dbSyncStatus: 'idle' | 'syncing' | 'error' | 'success'; // Adicionado status success
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  setTab,
  dollarRate,
  setDollarRate,
  onOpenSettings,
  onRefreshRate,
  onManualSave,
  lastRateUpdate,
  isDbConnected,
  dbSyncStatus,
  children
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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

  const handleTabClick = (tab: Tab) => {
      setTab(tab);
      setIsMobileMenuOpen(false); // Close menu on mobile when clicking a link
  };

  // Botão de salvar com feedback visual
  const SaveButton = () => (
    <button 
        onClick={() => { onManualSave(); setIsMobileMenuOpen(false); }}
        disabled={dbSyncStatus === 'syncing'}
        className={`
            w-full flex items-center justify-center gap-2 p-4 border-2 transition-all duration-150 uppercase mb-4 font-black tracking-widest
            ${dbSyncStatus === 'success' 
                ? 'bg-[#00e676] border-[#00e676] text-black shadow-[0px_0px_10px_#00e676]' 
                : 'bg-[#111] border-[#00e676] text-[#00e676] hover:bg-[#00e676] hover:text-black shadow-[4px_4px_0px_0px_#00e676]'
            }
            active:translate-y-1 active:shadow-none
        `}
    >
        {dbSyncStatus === 'syncing' ? (
             <RotateCcw size={18} className="animate-spin" />
        ) : dbSyncStatus === 'success' ? (
             <Cloud size={18} />
        ) : (
             <Save size={18} />
        )}
        <span>
            {dbSyncStatus === 'syncing' ? 'ENVIANDO...' : dbSyncStatus === 'success' ? 'SALVO!' : 'SALVAR DADOS'}
        </span>
    </button>
  );

  return (
    <div className={`flex min-h-screen ${mainBgClass} text-white font-mono transition-colors duration-500 relative`}>
      
      {/* MOBILE HEADER */}
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

      {/* OVERLAY for Mobile */}
      {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
      )}

      {/* SIDEBAR (Responsive) */}
      <aside className={`
        w-72 fixed inset-y-0 left-0 bg-[#000] border-r-2 border-white/20 flex flex-col z-50 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Logo Section (Desktop) */}
        <div className="p-8 pb-6 border-b-2 border-white/20 hidden lg:block">
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

        {/* Mobile Menu Header (only visible inside drawer on mobile) */}
        <div className="p-6 border-b-2 border-white/20 lg:hidden flex justify-between items-center">
             <span className="text-sm font-bold text-neutral-500">MENU</span>
             <button onClick={() => setIsMobileMenuOpen(false)}><X size={20} /></button>
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
        <nav className="flex-1 p-6 space-y-4 overflow-y-auto">
            {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
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
            
            {/* BOTÃO MANUAL DE SALVAR */}
            <SaveButton />

             {/* Sync Status Indicator */}
            <div className="flex items-center justify-between gap-2 mb-4 text-[10px] font-mono border border-dashed border-white/20 p-2">
                <span className="text-neutral-500">SERVER:</span>
                {dbSyncStatus === 'syncing' && <span className={`${brandColor} animate-pulse font-bold`}>ENVIANDO...</span>}
                {dbSyncStatus === 'error' && <span className="text-[#ff4444] font-bold">ERRO</span>}
                {dbSyncStatus === 'success' && <span className="text-[#00e676] font-bold">SALVO</span>}
                {isDbConnected && dbSyncStatus === 'idle' && <span className="text-[#00e676] font-bold">ONLINE</span>}
                {!isDbConnected && <span className="text-neutral-600">OFFLINE</span>}
            </div>

            <button 
                onClick={() => { onOpenSettings(); setIsMobileMenuOpen(false); }}
                className={`
                    w-full flex items-center justify-center gap-2 p-3 border-2 transition-all duration-150 uppercase
                    ${isDbConnected 
                        ? 'bg-black border-white/20 text-neutral-400 hover:text-black hover:bg-white' 
                        : 'bg-[#ff4444]/10 border-[#ff4444] text-[#ff4444] hover:bg-[#ff4444] hover:text-black'}
                `}
            >
                <Settings size={16} />
                <span className="text-xs font-bold">{isDbConnected ? 'Configurações' : 'Conectar'}</span>
            </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 lg:ml-72 p-4 lg:p-8 pt-20 lg:pt-8 animate-in fade-in duration-300 max-w-[1600px] w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};