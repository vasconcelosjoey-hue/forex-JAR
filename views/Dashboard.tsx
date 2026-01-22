
import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { Activity, TrendingUp, Calendar, Target, DollarSign, Wallet, Users, BarChart3 } from 'lucide-react';
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

  const evolutionData = useMemo(() => {
      // Usando JAR como curva principal de patrimônio
      const sortedHistory = [...(state.dailyHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return sortedHistory.map(item => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          centsBrl: item.centsBrl,
      }));
  }, [state.dailyHistory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-white/10 pb-4 bg-[#0a0a0a] p-6 shadow-[4px_4px_0px_0px_white]">
          <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1 text-white flex items-center gap-3">
                <Activity size={32} style={{ color: neonHex }} />
                DASHBOARD GERAL
              </h2>
              <p className="font-mono text-[10px] text-white/50 font-black uppercase tracking-widest">
                Consolidado de todas as contas vinculadas
              </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
             {Object.entries(NEON_COLORS).map(([name, color]) => (
                 <button
                    key={name}
                    onClick={() => setActiveNeon(name as any)}
                    className={`w-6 h-6 border-2 border-white transition-all ${activeNeon === name ? 'scale-110 shadow-[0px_0px_10px_white]' : 'opacity-40 hover:opacity-100'}`}
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
             icon={<Wallet size={20} />}
             color={activeNeon}
             neonColor={neonHex}
          />
          <KpiCard 
             label="Melhor Média Diária" 
             value={`R$ ${Math.max(jarStats.dailyAvgBrl, jmStats.dailyAvgBrl, j200Stats.dailyAvgBrl).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
             subValue="Performance de Pico"
             icon={<TrendingUp size={20} />}
             color="white"
             neonColor={neonHex}
          />
          <KpiCard 
             label="Dias de Registro" 
             value={(state.dailyHistory.length + state.dailyHistory_jm.length + state.dailyHistory_j200.length).toString()}
             subValue="Total Snapshots"
             icon={<Calendar size={20} />}
             color="white"
             neonColor={neonHex}
          />
          <KpiCard 
             label="ROI Consolidado" 
             value={`${((jarStats.roi + jmStats.roi + j200Stats.roi) / 3).toFixed(2)}%`}
             subValue="Média entre as Contas"
             icon={<Target size={20} />}
             color={activeNeon}
             neonColor={neonHex}
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="CONTA: J.A.R. (JOEY/ALEX/RUB)" color="success">
              <AccountSummary stats={jarStats} icon={<Users size={16} />} color={neonHex} history={state.dailyHistory} />
          </Card>
          <Card title="CONTA: J.M. (JOEY/MICAEL)" color="success">
              <AccountSummary stats={jmStats} icon={<Users size={16} />} color="#d500f9" history={state.dailyHistory_jm} />
          </Card>
          <Card title="CONTA: J200 USD" color="success">
              <AccountSummary stats={j200Stats} icon={<BarChart3 size={16} />} color="#00e5ff" history={state.dailyHistory_j200} />
          </Card>
      </div>

      <Card className="p-6 bg-[#000] border-white/20" title="CURVA DE CRESCIMENTO (CENTS BRL - JAR)">
          <div className="h-[350px] w-full">
            {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={neonHex} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={neonHex} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10, fontFamily: 'Space Mono' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10, fontFamily: 'Space Mono' }} tickFormatter={(val) => `R$${val/1000}k`} />
                        <Tooltip contentStyle={{ backgroundColor: '#000', border: `2px solid ${neonHex}`, borderRadius: 0 }} itemStyle={{ color: '#fff', fontFamily: 'Space Mono' }} labelStyle={{ color: neonHex, fontWeight: 'black' }} />
                        <Area type="monotone" dataKey="centsBrl" stroke={neonHex} strokeWidth={4} fillOpacity={1} fill="url(#colorGradient)" />
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

const AccountSummary = ({ stats, icon, color, history }: any) => (
    <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 border border-white/10 p-3">
                <p className="text-[9px] text-white/40 uppercase font-black mb-1">Lucro BRL</p>
                <p className="text-xl font-black" style={{ color }}>R$ {stats.profitBrl.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            </div>
            <div className="bg-black/40 border border-white/10 p-3">
                <p className="text-[9px] text-white/40 uppercase font-black mb-1">ROI %</p>
                <p className="text-xl font-black text-white">{stats.roi.toFixed(1)}%</p>
            </div>
        </div>
        
        <div className="border-t border-white/10 pt-4">
            <h4 className="text-[10px] uppercase font-black text-white/60 mb-3 flex items-center gap-2">
                {icon} ÚLTIMOS REGISTROS
            </h4>
            <div className="space-y-2">
                {history.slice(0, 5).map((h: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-[10px] font-mono border-b border-white/5 pb-2 last:border-0">
                        <span className="text-white/40">{new Date(h.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                        <span className="font-bold text-white">$ {h.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <span className="font-black" style={{ color: color }}>R$ {h.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                    </div>
                ))}
                {history.length === 0 && <p className="text-[9px] text-white/20 uppercase py-4 text-center">SEM REGISTROS</p>}
            </div>
        </div>
    </div>
);

const KpiCard = ({ label, value, subValue, icon, color, neonColor }: any) => {
    const isNeon = color === neonColor;
    return (
        <div className="p-6 bg-[#000] border-2 border-white/10 relative group hover:border-white transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.05)]" style={{ borderColor: isNeon ? neonColor : '' }}>
            <div className="flex justify-between items-start mb-4 opacity-80 group-hover:opacity-100">
                <span className="text-[11px] uppercase font-black tracking-widest text-white/70">{label}</span>
                <div style={{ color: isNeon ? neonColor : 'white' }}>{icon}</div>
            </div>
            <div className="text-3xl font-black tracking-tight mb-1 font-sans" style={{ color: isNeon ? neonColor : 'white' }}>
                {value}
            </div>
            <div className="text-xs font-mono font-black text-white/50 border-l-2 border-white/10 pl-2">
                {subValue}
            </div>
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 bg-[#050505] p-8 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest">{message}</p>
    </div>
);
