import React from 'react';
import { AppState, DailyRecord } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Calendar, Target, Plus, ArrowUpRight, Save, Trash2, Flag } from 'lucide-react';
import { parseCurrency } from '../utils/format';

interface ProgressProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export const Progress: React.FC<ProgressProps> = ({ state, updateState }) => {
  // Calculations
  const start = new Date(state.startDate);
  const current = new Date(state.currentDate);
  const diffTime = Math.abs(current.getTime() - start.getTime());
  const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; 

  const totalGrowthUsd = state.currentBalanceUsd - state.startDepositUsd;
  const growthPercentage = state.startDepositUsd > 0 
    ? (totalGrowthUsd / state.startDepositUsd) * 100 
    : 0;
  
  const standardUsd = totalGrowthUsd;
  const standardBrl = standardUsd * state.dollarRate;
  
  // Formula for Cents BRL: ((CurrentBalance - StartDeposit) / 100) * Rate
  const calculateCentsBrl = (balanceUsd: number, rate: number) => {
    const profitRaw = balanceUsd - state.startDepositUsd;
    const valRealUsd = profitRaw / 100;
    return valRealUsd * rate;
  };

  const currentCentsBrl = calculateCentsBrl(state.currentBalanceUsd, state.dollarRate);
  const profitCentsRaw = totalGrowthUsd; // For display stats only

  const dailyAvgBrl = currentCentsBrl / daysElapsed;

  const goal = 1000000;
  const goalProgress = Math.min((state.currentBalanceUsd / goal) * 100, 100);
  const remaining = goal - state.currentBalanceUsd;
  const isGoalReached = state.currentBalanceUsd >= goal;

  const handleAddToStartDeposit = () => {
    const amountToAdd = parseCurrency(state.drafts.progress?.additionalDeposit || '0');
    if (!isNaN(amountToAdd) && amountToAdd > 0) {
        updateState({
            startDepositUsd: state.startDepositUsd + amountToAdd,
            currentBalanceUsd: state.currentBalanceUsd + amountToAdd, 
            drafts: {
                ...state.drafts,
                progress: {
                    ...state.drafts.progress,
                    additionalDeposit: '' 
                }
            }
        });
    }
  };

  // Helper to format date string YYYY-MM-DD to DD/MM/YYYY locally without timezone shift
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '---';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // --- LÓGICA INTELIGENTE DE SNAPSHOT ---
  const handleRegisterDay = () => {
      // 1. Captura os dados EXATOS do input de hoje
      const dateToRegister = state.currentDate; // Input value is YYYY-MM-DD
      const balanceSnapshot = state.currentBalanceUsd;
      const rateSnapshot = state.dollarRate;
      
      // Recalcula o score (Cents BRL) para garantir precisão no momento do clique
      const scoreSnapshot = calculateCentsBrl(balanceSnapshot, rateSnapshot);

      const newRecord: DailyRecord = {
          date: dateToRegister,
          balanceUsd: balanceSnapshot,
          rate: rateSnapshot,
          centsBrl: scoreSnapshot
      };

      // 2. Manipulação Inteligente do Histórico
      const existingIndex = (state.dailyHistory || []).findIndex(r => r.date === dateToRegister);
      let newHistory = [...(state.dailyHistory || [])];

      if (existingIndex >= 0) {
          if (!window.confirm(`Já existe um registro para a data ${formatDateDisplay(dateToRegister)}. Atualizar com valores de hoje?`)) return;
          newHistory[existingIndex] = newRecord; // Sobrescreve
      } else {
          newHistory.push(newRecord); // Adiciona novo
      }

      // 3. Reordenação Automática (Garante que o cálculo de diferença funcione mesmo inserindo datas passadas)
      newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      updateState({ dailyHistory: newHistory });
  };

  const deleteRecord = (dateToDelete: string) => {
      // Using confirm dialog to prevent accidental deletion
      const confirmed = window.confirm("CONFIRMAR: Apagar este snapshot e recalcular histórico?");
      if (!confirmed) return;
      
      const currentHistory = state.dailyHistory || [];
      // Robust filtering
      const newHistory = currentHistory.filter(r => r.date !== dateToDelete);
      
      // Re-sort to maintain integrity
      newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      updateState({ dailyHistory: newHistory });
  };

  return (
    <div className="flex flex-col gap-6 max-w-full font-mono">
       
       {/* 1. Control Bar & Daily Action */}
       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           <Card className="lg:col-span-10 p-6" color="success">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 items-end">
                    <Input 
                        label="Data Início" 
                        type="date" 
                        variant="success"
                        value={state.startDate}
                        onChange={(e) => updateState({ startDate: e.target.value })}
                        className="w-full"
                    />
                    
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                        <Input 
                            label="Aporte (USD)" 
                            mask="currency" 
                            prefix="$"
                            variant="success"
                            value={state.startDepositUsd}
                            onChange={(e) => updateState({ startDepositUsd: parseCurrency(e.target.value) })}
                        />
                        <Input 
                            label="Add (+)" 
                            mask="currency"
                            prefix="$"
                            placeholder="0,00"
                            variant="success"
                            value={state.drafts.progress?.additionalDeposit || ''}
                            onChange={(e) => updateState({
                                drafts: {
                                    ...state.drafts,
                                    progress: { ...state.drafts.progress, additionalDeposit: e.target.value }
                                }
                            })}
                            actionButton={
                                <button 
                                    onClick={handleAddToStartDeposit}
                                    className="bg-[#111] hover:bg-[#00e676] hover:text-black border-l-2 border-[#00e676]/50 text-neutral-400 h-full px-4 transition-colors flex items-center justify-center rounded-none"
                                >
                                    <Plus size={16} />
                                </button>
                            }
                        />
                    </div>

                    <Input 
                        label="Data Hoje" 
                        type="date" 
                        variant="success"
                        value={state.currentDate}
                        onChange={(e) => updateState({ currentDate: e.target.value })}
                    />
                    <Input 
                        label="Saldo (USD)" 
                        mask="currency"
                        prefix="$"
                        variant="success"
                        className="text-[#00e676]"
                        value={state.currentBalanceUsd}
                        onChange={(e) => updateState({ currentBalanceUsd: parseCurrency(e.target.value) })}
                    />
                </div>
           </Card>

           {/* Save Button Card */}
           <button 
                onClick={handleRegisterDay}
                className="lg:col-span-2 bg-[#00e676] hover:bg-white text-black font-black uppercase tracking-widest border-2 border-transparent hover:border-[#00e676] shadow-[4px_4px_0px_0px_white] hover:shadow-[4px_4px_0px_0px_#00e676] transition-all flex flex-col items-center justify-center gap-2 p-4 active:translate-y-1 active:shadow-none"
           >
               <Save size={24} />
               <span>REGISTRAR</span>
               <span className="text-[10px] font-mono bg-black/10 px-2 py-0.5">SNAPSHOT</span>
           </button>
       </div>

       {/* 2. Brutalist Goal Banner */}
       <div className="relative border-4 border-white bg-black p-8 flex flex-col justify-center shadow-[8px_8px_0px_0px_#00e676]">
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Left: Big Number */}
                <div className="flex-shrink-0 text-center md:text-left border-b-2 md:border-b-0 md:border-r-2 border-white/20 pb-4 md:pb-0 md:pr-8">
                     <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Target size={14} className="text-[#00e676]" />
                        Target: 1M
                     </div>
                     <div className="text-4xl md:text-6xl font-black text-white tracking-tighter font-sans">
                        <span className="text-[#00e676] text-3xl align-top mr-2 font-mono">$</span>
                        {state.currentBalanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </div>
                </div>

                {/* Right: Progress Bar */}
                <div className="flex-1 w-full">
                    <div className="flex justify-between items-end mb-3">
                        <span className={`text-4xl font-black text-[#00e676] font-sans`}>
                            {goalProgress.toFixed(1)}%
                        </span>
                        {!isGoalReached ? (
                             <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider bg-white/10 px-2 py-1">
                                Missing <span className="text-white">$ {remaining.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                             </span>
                        ) : (
                            <span className="text-xs font-bold bg-[#ffd700] text-black px-2 py-1 uppercase">GOAL REACHED</span>
                        )}
                    </div>
                    {/* Blocky Progress Bar */}
                    <div className="h-6 bg-[#111] border-2 border-white relative">
                        <div 
                            className="h-full bg-[#00e676] border-r-2 border-black"
                            style={{ width: `${goalProgress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
       </div>

       {/* 3. Brutalist Stats Grid */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatsCard label="Dias" value={daysElapsed.toString()} icon={<Calendar size={16} />} color="success" />
            
            <StatsCard 
                label="Variação" 
                value={`${growthPercentage.toFixed(2)}%`} 
                color={growthPercentage >= 0 ? 'success' : 'danger'}
                icon={<ArrowUpRight size={16} />}
            />
            
            <StatsCard 
                label="Lucro (USD)" 
                value={`$ ${standardUsd.toLocaleString('en-US', { minimumFractionDigits: 0 })}`} 
                color={standardUsd >= 0 ? 'success' : 'danger'}
                compact
            />
            
            <StatsCard 
                label="Lucro (BRL)" 
                value={`R$ ${standardBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} 
                color={standardBrl >= 0 ? 'success' : 'danger'}
                compact
            />

            <StatsCard 
                label="Cents (USD)" 
                value={`${Math.floor(profitCentsRaw).toLocaleString('pt-BR')}`} 
                subValue="c"
                color="success"
            />
            
            <StatsCard 
                label="Cents (BRL)" 
                value={`R$ ${currentCentsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                color="success"
            />
            
            <StatsCard 
                label="Média Diária (BRL)" 
                value={`R$ ${dailyAvgBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
                color="gold"
                className="col-span-2 md:col-span-2 bg-[#111] border-white/40"
            />
       </div>

       {/* 4. EVOLUÇÃO DIÁRIA (TABLE) */}
       <Card title="EVOLUÇÃO DIÁRIA (SNAPSHOTS)" color="success" className="p-0 overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                   <thead className="bg-[#111] text-[10px] uppercase text-neutral-500 font-bold border-b-2 border-white/10">
                       <tr>
                           <th className="py-3 px-6 whitespace-nowrap">Data</th>
                           <th className="py-3 px-6 whitespace-nowrap">Saldo (USD)</th>
                           <th className="py-3 px-6 whitespace-nowrap">Rate</th>
                           <th className="py-3 px-6 whitespace-nowrap text-right text-[#00e676]">Score (Cents BRL)</th>
                           <th className="py-3 px-6 whitespace-nowrap text-right">Resultado Dia</th>
                           <th className="py-3 px-4 text-center w-10">...</th>
                       </tr>
                   </thead>
                   <tbody className="text-sm font-mono text-neutral-300">
                       {(state.dailyHistory || []).map((record, index, arr) => {
                           // LÓGICA DE EXIBIÇÃO INTELIGENTE
                           
                           // O array está ordenado do MAIS NOVO [0] para o MAIS VELHO [length-1]
                           // prevRecord é o registro imediatamente anterior cronologicamente (que está no index + 1)
                           const prevRecord = arr[index + 1];
                           const isFirstRecord = index === arr.length - 1;

                           // Lógica de cálculo:
                           // Se for o PRIMEIRO dia (isFirstRecord), não subtraímos nada. O resultado do dia é o próprio lucro acumulado.
                           // Se for um dia subsequente, subtraímos o centsBrl do dia anterior.
                           const dayResult = isFirstRecord 
                                ? record.centsBrl 
                                : record.centsBrl - (prevRecord?.centsBrl || 0);

                           return (
                               <tr key={record.date} className="border-b border-white/5 hover:bg-[#00e676] hover:text-black transition-colors group">
                                   <td className="py-3 px-6 border-r border-white/5 group-hover:border-black/10">
                                       {formatDateDisplay(record.date)}
                                   </td>
                                   <td className="py-3 px-6 border-r border-white/5 group-hover:border-black/10">
                                       $ {record.balanceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                   </td>
                                   <td className="py-3 px-6 border-r border-white/5 group-hover:border-black/10">
                                       {record.rate.toFixed(4)}
                                   </td>
                                   <td className="py-3 px-6 text-right font-bold border-r border-white/5 group-hover:border-black/10">
                                       R$ {record.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                   </td>
                                   <td className={`py-3 px-6 text-right font-black group-hover:text-black ${dayResult >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                                        {isFirstRecord ? (
                                            <div className="flex items-center justify-end gap-2 opacity-80">
                                                <Flag size={12} fill="currentColor" />
                                                <span className="text-xs font-bold uppercase tracking-wider">START</span>
                                                <span>R$ {dayResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        ) : (
                                            <>
                                                {dayResult > 0 ? '+' : ''}{dayResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </>
                                        )}
                                   </td>
                                   <td className="py-3 px-4 text-center">
                                       <button 
                                          type="button"
                                          onClick={(e) => {
                                              e.stopPropagation(); // Only stop prop, default is usually fine for button
                                              deleteRecord(record.date);
                                          }}
                                          className="text-neutral-500 hover:text-[#ff4444] transition-colors p-2 hover:bg-white/10 rounded-md z-10 relative cursor-pointer"
                                          title="Apagar"
                                       >
                                           <Trash2 size={16} className="pointer-events-none" />
                                       </button>
                                   </td>
                               </tr>
                           );
                       })}
                       {(state.dailyHistory || []).length === 0 && (
                           <tr>
                               <td colSpan={6} className="py-8 text-center text-neutral-600 text-xs uppercase">
                                   Nenhum dia registrado. Clique em "REGISTRAR" acima.
                               </td>
                           </tr>
                       )}
                   </tbody>
               </table>
           </div>
       </Card>
    </div>
  );
};

const StatsCard = ({ label, value, subValue, icon, color = 'default', className = '', compact = false }: any) => {
    const colors: any = {
        default: 'text-white',
        success: 'text-[#00e676]',
        danger: 'text-[#ff4444]',
        purple: 'text-[#d500f9]',
        gold: 'text-[#ffd700]'
    };

    return (
        <Card className={`flex flex-col justify-center p-6 ${className}`}>
            <div className="flex items-center justify-between mb-2 opacity-60">
                <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
                {icon}
            </div>
            <div className={`${compact ? 'text-2xl' : 'text-3xl'} font-black ${colors[color]} leading-none tracking-tight font-sans`}>
                {value} <span className="text-sm opacity-70 font-bold font-mono text-white">{subValue}</span>
            </div>
        </Card>
    );
};