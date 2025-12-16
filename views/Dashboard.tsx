import React, { useState, useMemo } from 'react';
import { AppState } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Activity, TrendingUp, Calendar, Target, DollarSign, Zap } from 'lucide-react';
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

  // --- 1. CÁLCULOS INTELIGENTES (KPIs) ---
  const stats = useMemo(() => {
      const startBalance = state.startDepositUsd || 1; // Evita divisão por zero
      const currentBalance = state.currentBalanceUsd;
      const profitUsd = currentBalance - state.startDepositUsd;
      const profitBrl = profitUsd * state.dollarRate;
      const roi = (profitUsd / startBalance) * 100;

      // Dias corridos
      const start = new Date(state.startDate);
      const now = new Date(state.currentDate);
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

      const dailyAvgUsd = profitUsd / daysElapsed;
      const dailyAvgBrl = profitBrl / daysElapsed;

      // Projeção (30 dias)
      const projectedUsd = currentBalance + (dailyAvgUsd * 30);
      const projectedProfitBrl = dailyAvgBrl * 30;

      return {
          profitUsd,
          profitBrl,
          roi,
          dailyAvgBrl,
          projectedProfitBrl,
          daysElapsed
      };
  }, [state]);

  // --- 2. PREPARAÇÃO DE DADOS DO GRÁFICO (EVOLUÇÃO) ---
  const evolutionData = useMemo(() => {
      // Pega o histórico, ordena por data
      const sortedHistory = [...(state.dailyHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Mapeia para o formato do gráfico
      return sortedHistory.map(item => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          fullDate: item.date,
          balance: item.balanceUsd,
          centsBrl: item.centsBrl, // Usaremos o score em BRL para visualização
          rate: item.rate
      }));
  }, [state.dailyHistory]);

  // --- 3. ANÁLISE MENSAL (AGRUPAMENTO) ---
  const monthlyData = useMemo(() => {
      const history = [...(state.dailyHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const months: Record<string, number> = {};

      // Lógica: Calcula a diferença de centsBrl entre o último registro de um mês e o último do mês anterior
      // Para simplificar neste MVP: Vamos somar o "Resultado Dia" calculado
      
      let previousCents = 0;

      history.forEach((record, index) => {
          const date = new Date(record.date);
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
          
          // Se for o primeiro registro global, o lucro é ele mesmo. Se não, é a diferença.
          const dayProfit = index === 0 ? record.centsBrl : record.centsBrl - previousCents;
          previousCents = record.centsBrl;

          if (!months[monthKey]) months[monthKey] = 0;
          months[monthKey] += dayProfit;
      });

      return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [state.dailyHistory]);

  // --- 4. WIN RATE (DIAS VERDES VS VERMELHOS) ---
  const winRateData = useMemo(() => {
      const history = [...(state.dailyHistory || [])].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let wins = 0;
      let loss = 0;
      let prev = 0;

      history.forEach((h, i) => {
          const val = h.centsBrl;
          const diff = i === 0 ? val : val - prev;
          if (diff >= 0) wins++;
          else loss++;
          prev = val;
      });

      return [
          { name: 'GAIN', value: wins },
          { name: 'LOSS', value: loss }
      ];
  }, [state.dailyHistory]);
  
  const totalDaysRegistered = winRateData[0].value + winRateData[1].value;
  const winPercent = totalDaysRegistered > 0 ? (winRateData[0].value / totalDaysRegistered) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER & THEME SELECTOR */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-2 border-white/20 pb-4 bg-[#111] p-6 shadow-[4px_4px_0px_0px_white]">
          <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1 text-white flex items-center gap-3">
                <Activity size={32} style={{ color: neonHex }} />
                DASHBOARD
              </h2>
              <p className="font-mono text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                Inteligência de Mercado • J.A.R. System
              </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
             {Object.entries(NEON_COLORS).map(([name, color]) => (
                 <button
                    key={name}
                    onClick={() => setActiveNeon(name as any)}
                    className={`w-6 h-6 border-2 border-white transition-all ${activeNeon === name ? 'scale-110 shadow-[0px_0px_10px_white]' : 'opacity-40 hover:opacity-100'}`}
                    style={{ backgroundColor: color }}
                    title={name}
                 />
             ))}
          </div>
      </div>

      {/* KPI GRID - "BIG NUMBERS" */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard 
             label="Lucro Líquido (R$)" 
             value={`R$ ${stats.profitBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
             subValue={`${stats.roi.toFixed(2)}% ROI`}
             icon={<DollarSign size={20} />}
             color={stats.profitBrl >= 0 ? activeNeon : 'red'}
             neonColor={neonHex}
          />
          <KpiCard 
             label="Média Diária (R$)" 
             value={`R$ ${stats.dailyAvgBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
             subValue="Performance Real"
             icon={<TrendingUp size={20} />}
             color={activeNeon}
             neonColor={neonHex}
          />
          <KpiCard 
             label="Projeção (30 Dias)" 
             value={`+ R$ ${stats.projectedProfitBrl.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
             subValue="Se mantiver a média"
             icon={<Target size={20} />}
             color="white"
             neonColor={neonHex}
          />
          <KpiCard 
             label="Win Rate (Dias)" 
             value={`${winPercent.toFixed(0)}%`}
             subValue={`${winRateData[0].value} Gains / ${winRateData[1].value} Loss`}
             icon={<Zap size={20} />}
             color={winPercent > 50 ? activeNeon : 'red'}
             neonColor={neonHex}
          />
      </div>

      {/* MAIN CHART: CURVA DE EQUITY */}
      <Card className="p-6 bg-[#000] border-white/20" title="CURVA DE PATRIMÔNIO (CENTS BRL)">
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#666', fontSize: 10, fontFamily: 'Space Mono' }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#666', fontSize: 10, fontFamily: 'Space Mono' }}
                            tickFormatter={(val) => `R$${val/1000}k`}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#000', 
                                border: `1px solid ${neonHex}`, 
                                borderRadius: 0
                            }}
                            itemStyle={{ color: '#fff', fontFamily: 'Space Mono' }}
                            labelStyle={{ color: neonHex, fontWeight: 'bold', marginBottom: '0.5rem' }}
                            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Cents BRL']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="centsBrl" 
                            stroke={neonHex} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorGradient)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <EmptyState message="Sem dados suficientes no histórico." />
            )}
          </div>
      </Card>

      {/* SECONDARY GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* MONTHLY PERFORMANCE */}
          <Card className="lg:col-span-2 p-6 bg-[#000] border-white/20" title="PERFORMANCE MENSAL">
              <div className="h-[250px] w-full">
                {monthlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                             <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10, fontFamily: 'Space Mono' }} />
                             <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                contentStyle={{ backgroundColor: '#000', border: '1px solid white', color: '#fff' }} 
                                formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Lucro']}
                             />
                             <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                {monthlyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? neonHex : '#ff4444'} />
                                ))}
                             </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <EmptyState message="Registre mais meses para ver a análise." />
                )}
              </div>
          </Card>

          {/* CONSISTENCY (WIN RATE) */}
          <Card className="p-6 bg-[#000] border-white/20" title="CONSISTÊNCIA">
               <div className="h-[250px] w-full relative flex items-center justify-center">
                    {winRateData.some(d => d.value > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={winRateData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    <Cell fill={neonHex} />
                                    <Cell fill="#ff4444" />
                                </Pie>
                                <Tooltip 
                                   contentStyle={{ backgroundColor: '#000', border: '1px solid white' }}
                                   itemStyle={{ color: 'white' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState message="Sem dados." />
                    )}
                    
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-white">{winPercent.toFixed(0)}%</span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-500">Win Rate</span>
                    </div>
               </div>
               <div className="grid grid-cols-2 gap-2 mt-4">
                   <div className="text-center p-2 bg-[#111] border border-white/10">
                       <span className="block text-[10px] text-neutral-500 uppercase">Dias Positivos</span>
                       <span className="font-bold text-white" style={{ color: neonHex }}>{winRateData[0].value}</span>
                   </div>
                   <div className="text-center p-2 bg-[#111] border border-white/10">
                       <span className="block text-[10px] text-neutral-500 uppercase">Dias Negativos</span>
                       <span className="font-bold text-[#ff4444]">{winRateData[1].value}</span>
                   </div>
               </div>
          </Card>

      </div>

    </div>
  );
};

// --- SUB-COMPONENTS ---

const KpiCard = ({ label, value, subValue, icon, color, neonColor }: any) => {
    const isNeon = color === neonColor;
    return (
        <div 
            className="p-6 bg-[#000] border-2 border-white/20 relative group hover:border-white transition-colors"
            style={{ borderColor: isNeon ? neonColor : '' }}
        >
            <div className="flex justify-between items-start mb-4 opacity-50 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white">{label}</span>
                <div style={{ color: isNeon ? neonColor : 'white' }}>{icon}</div>
            </div>
            <div 
                className="text-2xl lg:text-3xl font-black tracking-tight mb-1 font-sans"
                style={{ color: isNeon ? neonColor : color === 'red' ? '#ff4444' : 'white' }}
            >
                {value}
            </div>
            <div className="text-xs font-mono font-bold text-neutral-500 border-l-2 border-neutral-800 pl-2">
                {subValue}
            </div>
            
            {/* Hover Glow Effect */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-5 pointer-events-none transition-opacity"
                style={{ backgroundColor: neonColor }}
            ></div>
        </div>
    );
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="h-full flex flex-col items-center justify-center text-neutral-600 border-2 border-dashed border-white/10 bg-[#050505]">
        <Calendar size={32} className="mb-2 opacity-50" />
        <p className="text-xs font-bold uppercase tracking-widest">{message}</p>
    </div>
);