import React, { useState, useMemo } from 'react';
import { AppState, PartnerName } from '../types';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Calendar, MousePointer2, Activity, Target } from 'lucide-react';

interface DashboardProps {
  state: AppState;
}

const NEON_COLORS = {
  purple: '#d500f9',
  cyan: '#00e5ff',
  lime: '#76ff03',
  hotpink: '#ff4081'
};

const TIMEFRAMES = {
  '7D': 7,
  '30D': 30,
  '1Y': 365
};

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const [activeNeon, setActiveNeon] = useState<keyof typeof NEON_COLORS>('purple');
  const [timeframe, setTimeframe] = useState<keyof typeof TIMEFRAMES>('30D');
  const neonHex = NEON_COLORS[activeNeon];

  // --- 1. Data Prep for Evolution Chart ---
  const chartData = useMemo(() => {
    const history = [...state.dailyHistory];
    const sorted = history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - TIMEFRAMES[timeframe]);
    
    return sorted
      .filter(item => new Date(item.date) >= cutoff)
      .map(item => ({
        date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        fullDate: item.date,
        value: item.centsBrl,
        balance: item.balanceUsd
      }));
  }, [state.dailyHistory, timeframe]);

  // --- 2. Data Prep for Roadmap (Gauge) ---
  const roadmapGoal = 55000;
  const totalDeposited = useMemo(() => {
     return state.transactions
        .filter(t => t.type === 'DEPOSIT' && t.partner !== 'TAX')
        .reduce((acc, t) => acc + t.amountBrl, 0);
  }, [state.transactions]);

  // Gauge Logic
  const gaugeData = [
      { name: 'Progress', value: Math.min(totalDeposited, roadmapGoal) },
      { name: 'Remaining', value: Math.max(0, roadmapGoal - totalDeposited) }
  ];
  
  const progressPercent = Math.min((totalDeposited / roadmapGoal) * 100, 100);

  // --- 3. Data Prep for Partners Bar Chart ---
  const partnerData = useMemo(() => {
    const partners: PartnerName[] = ['JOEY', 'ALEX', 'RUBINHO'];
    return partners.map(p => {
        const total = state.transactions
            .filter(t => t.type === 'DEPOSIT' && t.partner === p)
            .reduce((acc, t) => acc + t.amountBrl, 0);
        return { name: p, value: total };
    });
  }, [state.transactions]);


  return (
    <div className="text-black space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b-4 border-black pb-4">
          <div>
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-2 flex items-center gap-3">
                <Activity className={`text-[${neonHex}]`} size={48} style={{ color: neonHex }} />
                J.A.R.<span className="text-neutral-400"> DASH</span>
              </h2>
              <p className="font-mono font-bold text-xs bg-black text-white inline-block px-2 py-1 uppercase">
                Premium Analytics Module
              </p>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0">
             {Object.entries(NEON_COLORS).map(([name, color]) => (
                 <button
                    key={name}
                    onClick={() => setActiveNeon(name as any)}
                    className={`w-6 h-6 border-2 border-black transition-transform hover:scale-110 ${activeNeon === name ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                    style={{ backgroundColor: color }}
                    title={name}
                 />
             ))}
          </div>
      </div>

      {/* MAIN CHART SECTION */}
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-6 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="text-xl font-black uppercase tracking-wide">Evolução Diária (Cents BRL)</h3>
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-neutral-500 mt-1">
                      <Calendar size={12} />
                      <span>START DATE: {new Date(state.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
              </div>
              
              <div className="flex bg-neutral-100 border-2 border-black">
                  {Object.keys(TIMEFRAMES).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf as any)}
                        className={`px-4 py-2 font-bold text-sm transition-colors ${timeframe === tf ? 'bg-black text-white' : 'text-neutral-500 hover:text-black'}`}
                      >
                          {tf}
                      </button>
                  ))}
              </div>
          </div>

          <div className="h-[400px] w-full relative z-10">
            {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={neonHex} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={neonHex} stopOpacity={0}/>
                            </linearGradient>
                            <filter id="neonGlow" height="200%">
                                <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
                                <feOffset in="blur" dx="0" dy="0" result="offsetBlur"/>
                                <feFlood floodColor={neonHex} floodOpacity="0.6" result="offsetColor"/>
                                <feComposite in="offsetColor" in2="offsetBlur" operator="in" result="offsetBlur"/>
                                <feMerge>
                                    <feMergeNode in="offsetBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                        <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#000', fontSize: 10, fontFamily: 'Space Mono' }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#000', fontSize: 10, fontFamily: 'Space Mono' }}
                            tickFormatter={(val) => `R$${val}`}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#000', 
                                border: `2px solid ${neonHex}`, 
                                borderRadius: 0,
                                boxShadow: `4px 4px 0px 0px ${neonHex}`
                            }}
                            itemStyle={{ color: '#fff', fontFamily: 'Space Mono' }}
                            labelStyle={{ color: neonHex, fontWeight: 'bold', marginBottom: '0.5rem' }}
                        />
                        <ReferenceLine x={new Date(state.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} stroke="black" strokeDasharray="3 3" label="START" />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke={neonHex} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorValue)" 
                            filter="url(#neonGlow)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-neutral-400 border-2 border-dashed border-neutral-300 bg-neutral-50">
                    <MousePointer2 size={48} className="mb-4 text-neutral-300" />
                    <p className="font-bold uppercase tracking-widest">Aguardando dados...</p>
                    <p className="text-xs mt-2">Registre dias na aba Progresso para visualizar.</p>
                </div>
            )}
          </div>
      </div>

      {/* SECONDARY CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 1. ROADMAP GAUGE (PREMIUM) */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-6 flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between border-b-2 border-black pb-2 mb-4">
                  <h3 className="text-lg font-black uppercase">Meta Roadmap</h3>
                  <Target size={20} style={{ color: neonHex }} />
              </div>
              
              <div className="relative w-full h-[250px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                            data={gaugeData}
                            cx="50%"
                            cy="80%" // Moved down to create half-circle effect
                            startAngle={180}
                            endAngle={0}
                            innerRadius="70%"
                            outerRadius="100%"
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                        >
                            <Cell key="progress" fill={neonHex} />
                            <Cell key="remaining" fill="#f3f3f3" />
                        </Pie>
                      </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Custom Gauge Content */}
                  <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center text-center">
                      <span className="text-6xl font-black leading-none tracking-tighter" style={{ color: neonHex }}>
                          {progressPercent.toFixed(1)}%
                      </span>
                      <div className="flex items-center gap-2 mt-2 bg-black text-white px-3 py-1 font-mono text-sm font-bold uppercase">
                          <span>R$ {totalDeposited.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                          <span className="text-neutral-500">/</span>
                          <span>{roadmapGoal / 1000}k</span>
                      </div>
                  </div>

                  {/* Labels */}
                  <div className="absolute bottom-10 left-4 text-xs font-bold font-mono text-neutral-400">0%</div>
                  <div className="absolute bottom-10 right-4 text-xs font-bold font-mono text-neutral-400">100%</div>
              </div>
          </div>

          {/* 2. PARTNER SHARE */}
          <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000000] p-6">
              <h3 className="w-full text-left text-lg font-black uppercase border-b-2 border-black pb-2 mb-4">Contribuição Sócios</h3>
              <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={partnerData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={80} 
                            tick={{ fill: '#000', fontWeight: 'bold', fontSize: 10, fontFamily: 'Space Mono' }} 
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            cursor={{fill: 'transparent'}}
                            contentStyle={{ backgroundColor: '#000', border: 'none', color: '#fff' }} 
                            itemStyle={{ color: neonHex }}
                          />
                          <Bar dataKey="value" fill={neonHex} barSize={30} radius={[0, 0, 0, 0]}>
                            {partnerData.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={index === 0 ? neonHex : index === 1 ? '#000' : '#888'} 
                                    stroke="black"
                                    strokeWidth={2}
                                />
                            ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>
    </div>
  );
};