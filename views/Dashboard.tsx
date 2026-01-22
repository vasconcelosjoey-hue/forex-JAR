
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, TrendingUp, Calendar, Target, Wallet, Users, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 font-mono">
      
      <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-white/10 pb-6 bg-[#0a0a0a] p-8 shadow-[8px_8px_0px_0px_white]">
          <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2 text-white flex items-center gap-4">
                <Activity size={48} style={{ color: neonHex }} />
                DASHBOARD GERAL
              </h2>
              <p className="font-mono text-[11px] md:text-xs text-white/50 font-black uppercase tracking-[0.3em]">
                Consolidado de todas as contas vinculadas
              </p>
          </div>
          
          <div className="flex gap-3 mt-6 md:mt-0">
             {Object.entries(NEON_COLORS).map(([name, color]) => (
                 <button
                    key={name}
                    onClick={() => setActiveNeon(name as any)}
                    className={`w-8 h-8 border-4 border-white transition-all ${activeNeon === name ? 'scale-110 shadow-[0px_0px_15px_white]' : 'opacity-40 hover:opacity-100'}`}
                    style={{ backgroundColor: color }}
                 />
             ))}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
             label="Lucro Total Acumulado" 
             value={`R$ ${totalProfitBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
             subValue="Soma JAR + JM + J200"
             icon={<Wallet size={24} />}
             color={activeNeon}
             neonColor={neonHex}
          />
          <KpiCard 
             label="Melhor Média Diária" 
             value={`R$ ${Math.max(jarStats.dailyAvgBrl, jmStats.dailyAvgBrl, j200Stats.dailyAvgBrl).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
             subValue="Performance de Pico"
             icon={<TrendingUp size={24} />}
             color="white"
             neonColor={neonHex}
          />
          <KpiCard 
             label="Dias de Registro" 
             value={(state.dailyHistory.length + state.dailyHistory_jm.length + state.dailyHistory_j200.length).toString()}
             subValue="Total Snapshots"
             icon={<Calendar size={24} />}
             color="white"
             neonColor={neonHex}
          />
          <KpiCard 
             label="ROI Consolidado" 
             value={`${((jarStats.roi + jmStats.roi + j200Stats.roi) / 3).toFixed(2)}%`}
             subValue="Média entre as Contas"
             icon={<Target size={24} />}
             color={activeNeon}
             neonColor={neonHex}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card title="CONTA: J.A.R." color="success">
              <AccountSummary 
                  stats={jarStats} 
                  icon={<Users size={20} />} 
                  color={neonHex} 
                  history={state.dailyHistory} 
                  isOpen={openTables.jar} 
                  onToggle={() => toggleTable('jar')}
              />
          </Card>
          <Card title="CONTA: J.M." color="success">
              <AccountSummary 
                  stats={jmStats} 
                  icon={<Users size={20} />} 
                  color="#d500f9" 
                  history={state.dailyHistory_jm} 
                  isOpen={openTables.jm} 
                  onToggle={() => toggleTable('jm')}
              />
          </Card>
          <Card title="CONTA: J200" color="success">
              <AccountSummary 
                  stats={j200Stats} 
                  icon={<BarChart3 size={20} />} 
                  color="#00e5ff" 
                  history={state.dailyHistory_j200} 
                  isOpen={openTables.j200} 
                  onToggle={() => toggleTable('j200')}
              />
          </Card>
      </div>

      <Card className="p-8 bg-[#000] border-white/20" title="CURVA DE CRESCIMENTO (CENTS BRL - JAR)">
          <div className="h-[400px] w-full">
            {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={neonHex} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={neonHex} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11, fontFamily: 'Space Mono', fontWeight: 'bold' }} dy={15} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 11, fontFamily: 'Space Mono', fontWeight: 'bold' }} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: `4px solid ${neonHex}`, borderRadius: 0, padding: '12px' }} itemStyle={{ color: '#fff', fontFamily: 'Space Mono', fontWeight: 'black' }} labelStyle={{ color: neonHex, fontWeight: 'black', marginBottom: '8px', fontSize: '14px' }} />
                        <Area type="monotone" dataKey="centsBrl" stroke={neonHex} strokeWidth={5} fillOpacity={1} fill="url(#colorGradient)" animationDuration={1500} />
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
    <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 border-2 border-white/10 p-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                <p className="text-[10px] text-white/40 uppercase font-black mb-1 tracking-widest">Lucro BRL</p>
                <p className="text-2xl font-black" style={{ color }}>R$ {stats.profitBrl.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-black/40 border-2 border-white/10 p-4 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]">
                <p className="text-[10px] text-white/40 uppercase font-black mb-1 tracking-widest">ROI %</p>
                <p className="text-2xl font-black text-white">{stats.roi.toFixed(1)}%</p>
            </div>
        </div>
        
        <div className="border-t-2 border-white/10 pt-6">
            <button 
                onClick={onToggle}
                className="w-full flex items-center justify-between text-xs uppercase font-black text-white/70 mb-4 bg-white/5 p-4 border-2 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:translate-y-1"
            >
                <div className="flex items-center gap-3">{icon} LISTA NUMÉRICA</div>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {isOpen && (
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-3 custom-scrollbar">
                    <table className="w-full text-[11px] md:text-xs font-mono">
                        <thead className="text-white/40 border-b-2 border-white/10 uppercase">
                            <tr>
                                <th className="text-left pb-3 font-black">Data</th>
                                <th className="text-right pb-3 font-black">Saldo USD</th>
                                <th className="text-right pb-3 font-black">Lucro BRL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((h: any, i: number) => (
                                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                                    <td className="py-3 text-white/60">{new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}</td>
                                    <td className="py-3 text-right font-bold text-white">$ {h.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                    <td className="py-3 text-right font-black" style={{ color: color }}>R$ {h.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {history.length === 0 && <p className="text-xs text-white/20 uppercase py-10 text-center border-4 border-dashed border-white/5">SEM REGISTROS</p>}
                </div>
            )}

            {!isOpen && history.length > 0 && (
                <div className="space-y-3">
                    {history.slice(0, 4).map((h: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-xs font-mono border-b border-white/5 pb-3 last:border-0">
                            <span className="text-white/40 font-bold">{new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                            <span className="font-bold text-white">$ {h.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            <span className="font-black text-sm" style={{ color: color }}>R$ {h.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                        </div>
                    ))}
                    <p className="text-[10px] text-white/20 uppercase text-center pt-2 italic">Exibindo últimos 4 registros</p>
                </div>
            )}
            {history.length === 0 && !isOpen && <p className="text-xs text-white/20 uppercase py-6 text-center">SEM REGISTROS</p>}
        </div>
    </div>
);

const KpiCard = ({ label, value, subValue, icon, color, neonColor }: any) => {
    const isNeon = color === neonColor;
    return (
        <div className="p-8 bg-[#000] border-4 border-white/10 relative group hover:border-white transition-all shadow-[6px_6px_0px_0px_rgba(255,255,255,0.05)] active:translate-x-1 active:translate-y-1 active:shadow-none" style={{ borderColor: isNeon ? neonColor : '' }}>
            <div className="flex justify-between items-start mb-6 opacity-80 group-hover:opacity-100">
                <span className="text-xs md:text-sm uppercase font-black tracking-[0.2em] text-white/70">{label}</span>
                <div style={{ color: isNeon ? neonColor : 'white' }}>{icon}</div>
            </div>
            <div className="text-4xl font-black tracking-tight mb-2 font-sans" style={{ color: isNeon ? neonColor : 'white' }}>
                {value}
            </div>
            <div className="text-[11px] md:text-xs font-mono font-black text-white/50 border-l-4 border-white/10 pl-3 uppercase">
                {subValue}
            </div>
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-white/20 border-4 border-dashed border-white/5 bg-[#050505] p-10 text-center">
        <p className="text-sm font-black uppercase tracking-widest">{message}</p>
    </div>
);
