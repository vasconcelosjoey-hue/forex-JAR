
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, TrendingUp, Calendar, Target, Wallet, Users, BarChart3, ChevronDown, ChevronUp, Table } from 'lucide-react';
import { Card } from '../components/ui/Card';

interface DashboardProps {
  state: AppState;
}

const NEON_COLORS = {
  green: '#00e676',
  purple: '#d500f9',
  cyan: '#00e5ff',
  orange: '#FF6F00'
};

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const [activeNeon, setActiveNeon] = useState<keyof typeof NEON_COLORS>('green');
  const neonHex = NEON_COLORS[activeNeon];
  const [openTables, setOpenTables] = useState<Record<string, boolean>>({ jar: false, jm: false, j200: false });

  const getAccountStats = (history: any[], depositUsd: number, balanceUsd: number) => {
    const profitUsd = balanceUsd - depositUsd;
    const profitBrl = profitUsd * state.dollarRate;
    const days = history?.length || 1;
    return {
        profitUsd,
        profitBrl,
        dailyAvgBrl: profitBrl / days,
        roi: depositUsd > 0 ? (profitUsd / depositUsd) * 100 : 0,
        historyCount: history?.length || 0
    };
  };

  const jarStats = getAccountStats(state.dailyHistory, state.startDepositUsd, state.currentBalanceUsd);
  const jmStats = getAccountStats(state.dailyHistory_jm, state.startDepositUsd_jm, state.currentBalanceUsd_jm);
  const j200Stats = getAccountStats(state.dailyHistory_j200, state.startDepositUsd_j200, state.currentBalanceUsd_j200);

  const totalProfitBrl = jarStats.profitBrl + jmStats.profitBrl + j200Stats.profitBrl;

  const toggleTable = (key: string) => {
    setOpenTables(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const evolutionData = useMemo(() => {
      const sortedHistory = [...(state.dailyHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return sortedHistory.map(item => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          centsBrl: item.centsBrl,
      }));
  }, [state.dailyHistory]);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 font-mono">
      
      {/* Header Brutalista Gigante */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-8 border-white/10 pb-10 bg-[#0a0a0a] p-10 md:p-14 shadow-[12px_12px_0px_0px_white]">
          <div>
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4 text-white flex items-center gap-6">
                <Activity size={72} style={{ color: neonHex }} className="animate-pulse" />
                VISÃO GERAL
              </h2>
              <p className="font-mono text-[12px] md:text-sm text-white/50 font-black uppercase tracking-[0.5em] border-l-4 border-current pl-4">
                Consolidado de Performance: JAR | JM | J200
              </p>
          </div>
          
          <div className="flex gap-4 mt-10 md:mt-0 bg-white/5 p-4 border-2 border-white/10">
             {Object.entries(NEON_COLORS).map(([name, color]) => (
                 <button
                    key={name}
                    onClick={() => setActiveNeon(name as any)}
                    className={`w-10 h-10 border-4 border-white transition-all transform hover:rotate-12 ${activeNeon === name ? 'scale-125 shadow-[0px_0px_20px_white] z-10' : 'opacity-40 hover:opacity-100'}`}
                    style={{ backgroundColor: color }}
                 />
             ))}
          </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <KpiCard 
             label="Lucro Total Consolidado" 
             value={`R$ ${totalProfitBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
             subValue="Soma das 3 Carteiras"
             icon={<Wallet size={32} />}
             color={activeNeon}
             neonColor={neonHex}
          />
          <KpiCard 
             label="Melhor Média por Dia" 
             value={`R$ ${Math.max(jarStats.dailyAvgBrl, jmStats.dailyAvgBrl, j200Stats.dailyAvgBrl).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
             subValue="Pico de Eficiência"
             icon={<TrendingUp size={32} />}
             color="white"
             neonColor={neonHex}
          />
          <KpiCard 
             label="Snapshots Totais" 
             value={(state.dailyHistory.length + state.dailyHistory_jm.length + state.dailyHistory_j200.length).toString()}
             subValue="Registros na Nuvem"
             icon={<Calendar size={32} />}
             color="white"
             neonColor={neonHex}
          />
          <KpiCard 
             label="Retorno Médio (ROI)" 
             value={`${((jarStats.roi + jmStats.roi + j200Stats.roi) / 3).toFixed(2)}%`}
             subValue="Performance Combinada"
             icon={<Target size={32} />}
             color={activeNeon}
             neonColor={neonHex}
          />
      </div>

      {/* Account Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <Card title="CARTEIRA: J.A.R." color="success">
              <AccountSummary 
                  stats={jarStats} 
                  icon={<Users size={24} />} 
                  color={neonHex} 
                  history={state.dailyHistory} 
                  isOpen={openTables.jar} 
                  onToggle={() => toggleTable('jar')}
              />
          </Card>
          <Card title="CARTEIRA: J.M." color="success">
              <AccountSummary 
                  stats={jmStats} 
                  icon={<Users size={24} />} 
                  color="#d500f9" 
                  history={state.dailyHistory_jm} 
                  isOpen={openTables.jm} 
                  onToggle={() => toggleTable('jm')}
              />
          </Card>
          <Card title="CARTEIRA: J200" color="success">
              <AccountSummary 
                  stats={j200Stats} 
                  icon={<BarChart3 size={24} />} 
                  color="#00e5ff" 
                  history={state.dailyHistory_j200} 
                  isOpen={openTables.j200} 
                  onToggle={() => toggleTable('j200')}
              />
          </Card>
      </div>

      {/* Curva de Crescimento */}
      <Card className="p-10 bg-[#000] border-white/20" title="PROGRESSÃO PATRIMONIAL (JAR)">
          <div className="h-[500px] w-full">
            {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 30, right: 30, left: 0, bottom: 20 }}>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={neonHex} stopOpacity={0.5}/>
                                <stop offset="95%" stopColor={neonHex} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#222" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#aaa', fontSize: 13, fontFamily: 'Space Mono', fontWeight: '900' }} dy={20} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#aaa', fontSize: 13, fontFamily: 'Space Mono', fontWeight: '900' }} tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: `6px solid ${neonHex}`, borderRadius: 0, padding: '16px' }} itemStyle={{ color: '#fff', fontFamily: 'Space Mono', fontWeight: '900', fontSize: '16px' }} labelStyle={{ color: neonHex, fontWeight: '900', marginBottom: '12px', fontSize: '18px', textTransform: 'uppercase' }} />
                        <Area type="monotone" dataKey="centsBrl" stroke={neonHex} strokeWidth={8} fillOpacity={1} fill="url(#colorGradient)" animationDuration={2000} />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <EmptyState message="Aguardando registros para gerar gráfico..." />
            )}
          </div>
      </Card>
    </div>
  );
};

const AccountSummary = ({ stats, icon, color, history, isOpen, onToggle }: any) => (
    <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-black border-4 border-white/10 p-6 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] transition-all hover:border-white/30">
                <p className="text-[12px] text-white/40 uppercase font-black mb-2 tracking-[0.2em] border-b border-white/10 pb-1">LUCRO BRL</p>
                <p className="text-3xl font-black leading-none" style={{ color }}>R$ {stats.profitBrl.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-black border-4 border-white/10 p-6 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] transition-all hover:border-white/30">
                <p className="text-[12px] text-white/40 uppercase font-black mb-2 tracking-[0.2em] border-b border-white/10 pb-1">RETORNO ROI</p>
                <p className="text-3xl font-black text-white leading-none">{stats.roi.toFixed(1)}%</p>
            </div>
        </div>
        
        <div className="border-t-4 border-white/10 pt-8">
            <button 
                onClick={onToggle}
                className="w-full flex items-center justify-between text-sm md:text-base uppercase font-black text-white/80 mb-6 bg-white/5 p-5 border-4 border-white/10 hover:bg-white/10 hover:border-white/40 transition-all active:translate-y-1 active:shadow-none shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] group"
            >
                <div className="flex items-center gap-4 group-hover:text-white transition-colors">{icon} EVOLUÇÃO NUMÉRICA</div>
                {isOpen ? <ChevronUp size={28} /> : <ChevronDown size={28} />}
            </button>
            
            {isOpen && (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar border-l-2 border-white/10 pl-4">
                    <table className="w-full text-[13px] md:text-sm font-mono border-collapse">
                        <thead className="text-white/40 border-b-4 border-white/10 uppercase">
                            <tr>
                                <th className="text-left pb-4 font-black tracking-widest">DATA</th>
                                <th className="text-right pb-4 font-black tracking-widest">SALDO USD</th>
                                <th className="text-right pb-4 font-black tracking-widest">LUCRO BRL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h: any, i: number) => (
                                <tr key={i} className="border-b-2 border-white/5 last:border-0 hover:bg-white/10 transition-colors">
                                    <td className="py-4 text-white/60 font-bold">{new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                                    <td className="py-4 text-right font-black text-white">$ {h.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-4 text-right font-black text-lg" style={{ color: color }}>R$ {h.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {history.length === 0 && <p className="text-sm text-white/20 uppercase py-16 text-center border-4 border-dashed border-white/5 font-black">NENHUM DADO REGISTRADO</p>}
                </div>
            )}

            {!isOpen && history.length > 0 && (
                <div className="space-y-4">
                    {history.slice(0, 5).map((h: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm font-mono border-b-2 border-white/5 pb-4 last:border-0 hover:pl-2 transition-all">
                            <span className="text-white/40 font-black tracking-wider uppercase">{new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                            <span className="font-black text-white">$ {h.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="font-black text-xl" style={{ color: color }}>R$ {h.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                        </div>
                    ))}
                    <div className="text-[11px] text-white/20 uppercase text-center pt-4 tracking-widest font-black italic flex items-center justify-center gap-2">
                        <div className="w-10 h-[1px] bg-white/10"></div>
                        ÚLTIMOS 5 REGISTROS
                        <div className="w-10 h-[1px] bg-white/10"></div>
                    </div>
                </div>
            )}
            {history.length === 0 && !isOpen && <p className="text-sm text-white/20 uppercase py-8 text-center font-black tracking-widest">AGUARDANDO INPUTS</p>}
        </div>
    </div>
);

const KpiCard = ({ label, value, subValue, icon, color, neonColor }: any) => {
    const isNeon = color === neonColor;
    return (
        <div className="p-10 bg-[#000] border-4 border-white/10 relative group hover:border-white transition-all shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] active:translate-x-1 active:translate-y-1 active:shadow-none" style={{ borderColor: isNeon ? neonColor : '' }}>
            <div className="flex justify-between items-start mb-8 opacity-80 group-hover:opacity-100">
                <span className="text-xs md:text-base uppercase font-black tracking-[0.3em] text-white/70 leading-tight">{label}</span>
                <div style={{ color: isNeon ? neonColor : 'white' }} className="transition-transform group-hover:scale-125">{icon}</div>
            </div>
            <div className="text-4xl md:text-5xl font-black tracking-tighter mb-4 font-sans leading-none" style={{ color: isNeon ? neonColor : 'white' }}>
                {value}
            </div>
            <div className="text-[12px] md:text-sm font-mono font-black text-white/40 border-l-4 border-white/20 pl-4 uppercase tracking-widest">
                {subValue}
            </div>
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-white/20 border-8 border-dashed border-white/5 bg-[#050505] p-16 text-center">
        <p className="text-xl font-black uppercase tracking-[0.5em]">{message}</p>
    </div>
);
