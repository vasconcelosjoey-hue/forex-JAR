
import React, { useState, useRef } from 'react';
import { AppState, DailyRecord } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Calendar, Target, Plus, ArrowUpRight, Save, Trash2, Flag, Percent, Wallet, ArrowRight, ChevronDown, ChevronUp, Camera, Share2, Copy } from 'lucide-react';
import { parseCurrency } from '../utils/format';
import { toBlob } from 'html-to-image';

interface ProgressProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

export const Progress: React.FC<ProgressProps> = ({ state, updateState }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success'>('idle');
  
  // Refs para captura de imagem
  const fullReportRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<HTMLDivElement>(null);

  const daysElapsed = state.dailyHistory?.length || 0;
  const mathDays = daysElapsed || 1; 

  const totalGrowthUsd = state.currentBalanceUsd - state.startDepositUsd;
  const growthPercentage = state.startDepositUsd > 0 
    ? (totalGrowthUsd / state.startDepositUsd) * 100 
    : 0;
  
  const dailyYieldPercent = growthPercentage / mathDays;
  const standardUsd = totalGrowthUsd;
  const standardBrl = standardUsd * state.dollarRate;
  
  const calculateCentsBrl = (balanceUsd: number, rate: number) => {
    const profitRaw = balanceUsd - state.startDepositUsd;
    const valRealUsd = profitRaw / 100;
    return valRealUsd * rate;
  };

  const currentCentsBrl = calculateCentsBrl(state.currentBalanceUsd, state.dollarRate);
  const profitCentsRaw = totalGrowthUsd; 
  const dailyAvgBrl = currentCentsBrl / mathDays;

  const goal = 1000000;
  const goalProgress = Math.min((state.currentBalanceUsd / goal) * 100, 100);
  const remaining = goal - state.currentBalanceUsd;
  const isGoalReached = state.currentBalanceUsd >= goal;

  const handleCopyAsImage = async (ref: React.RefObject<HTMLDivElement>, statusKey: string) => {
    if (!ref.current) return;
    setCopyStatus('copying');
    
    try {
        const blob = await toBlob(ref.current, {
            backgroundColor: '#050505',
            quality: 1,
            pixelRatio: 2 
        });

        if (blob) {
            const data = [new ClipboardItem({ 'image/png': blob })];
            await navigator.clipboard.write(data);
            setCopyStatus('success');
            setTimeout(() => setCopyStatus('idle'), 2000);
        }
    } catch (err) {
        console.error("Erro ao copiar imagem:", err);
        setCopyStatus('idle');
        alert("Erro ao gerar imagem. Tente novamente.");
    }
  };

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

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '---';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleRegisterDay = () => {
      const dateToRegister = state.currentDate;
      const balanceSnapshot = state.currentBalanceUsd;
      const rateSnapshot = state.dollarRate;
      const investedSnapshot = state.startDepositUsd;
      const scoreSnapshot = calculateCentsBrl(balanceSnapshot, rateSnapshot);

      const newRecord: DailyRecord = {
          date: dateToRegister,
          balanceUsd: balanceSnapshot,
          rate: rateSnapshot,
          centsBrl: scoreSnapshot,
          investedUsd: investedSnapshot
      };

      const existingIndex = (state.dailyHistory || []).findIndex(r => r.date === dateToRegister);
      let newHistory = [...(state.dailyHistory || [])];

      if (existingIndex >= 0) {
          if (!window.confirm(`Já existe um registro para a data ${formatDateDisplay(dateToRegister)}. Atualizar com valores de hoje?`)) return;
          newHistory[existingIndex] = newRecord;
      } else {
          newHistory.push(newRecord);
      }

      newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      updateState({ dailyHistory: newHistory });
      setIsHistoryOpen(true);
  };

  const deleteRecord = (dateToDelete: string) => {
      const confirmed = window.confirm("CONFIRMAR: Apagar este snapshot e recalcular histórico?");
      if (!confirmed) return;
      const currentHistory = state.dailyHistory || [];
      const newHistory = currentHistory.filter(r => r.date !== dateToDelete);
      newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      updateState({ dailyHistory: newHistory });
  };

  return (
    <div className="flex flex-col gap-6 max-w-full font-mono pb-12">
       
       <div className="flex flex-wrap gap-4 items-center justify-between border-b-2 border-white/10 pb-4">
           <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-[#00e676]"></div>
               <h2 className="text-xl font-black text-white uppercase tracking-widest">Painel de Progresso</h2>
           </div>
           
           <div className="flex gap-2">
               <button 
                    onClick={() => handleCopyAsImage(snapshotRef, 'snapshot')}
                    disabled={copyStatus === 'copying'}
                    className={`flex items-center gap-2 px-4 py-2 border-2 text-[10px] font-black uppercase tracking-tighter transition-all shadow-[4px_4px_0px_0px_white] active:translate-y-1 active:shadow-none
                        ${copyStatus === 'success' ? 'bg-white text-black border-white' : 'bg-black text-[#00e676] border-[#00e676] hover:bg-[#00e676] hover:text-black'}
                        ${copyStatus === 'copying' ? 'opacity-50 cursor-wait' : ''}
                    `}
               >
                   {copyStatus === 'success' ? <Copy size={14} /> : <Camera size={14} />}
                   {copyStatus === 'success' ? 'SNAPSHOT COPIADO!' : 'COPIAR TABELA (IMG)'}
               </button>

               <button 
                    onClick={() => handleCopyAsImage(fullReportRef, 'report')}
                    disabled={copyStatus === 'copying'}
                    className={`flex items-center gap-2 px-4 py-2 border-2 text-[10px] font-black uppercase tracking-tighter transition-all shadow-[4px_4px_0px_0px_white] active:translate-y-1 active:shadow-none
                        ${copyStatus === 'success' ? 'bg-white text-black border-white' : 'bg-[#00e676] text-black border-[#00e676] hover:bg-white'}
                        ${copyStatus === 'copying' ? 'opacity-50 cursor-wait' : ''}
                    `}
               >
                   <Share2 size={14} />
                   {copyStatus === 'success' ? 'RELATÓRIO COPIADO!' : 'COPIAR RELATÓRIO FULL'}
               </button>
           </div>
       </div>

       <div ref={fullReportRef} className="flex flex-col gap-6 bg-[#050505] p-2">
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
               <Card className="lg:col-span-10 p-6" color="success">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                        <Input label="Data Início" type="date" variant="success" value={state.startDate} onChange={(e) => updateState({ startDate: e.target.value })} className="w-full" />
                        <div className="lg:col-span-2 grid grid-cols-2 gap-4 relative">
                            <div className="absolute top-1/2 left-[48%] -translate-y-1/2 text-white hidden md:block"><ArrowRight size={16} /></div>
                            <Input label="Total Aportado (USD)" mask="currency" prefix="$" variant="success" value={state.startDepositUsd} onChange={(e) => updateState({ startDepositUsd: parseCurrency(e.target.value) })} />
                            <Input label="Novo Aporte (+)" mask="currency" prefix="$" placeholder="0,00" variant="success" value={state.drafts.progress?.additionalDeposit || ''} onChange={(e) => updateState({ drafts: { ...state.drafts, progress: { ...state.drafts.progress, additionalDeposit: e.target.value } } })} actionButton={
                                    <button onClick={handleAddToStartDeposit} title="Adicionar ao Capital e Saldo" className="bg-[#111] hover:bg-[#00e676] hover:text-black border-l-2 border-[#00e676]/50 text-neutral-200 h-full px-4 transition-colors flex items-center justify-center rounded-none"><Plus size={16} /></button>
                                }
                            />
                        </div>
                        <Input label="Data Hoje" type="date" variant="success" value={state.currentDate} onChange={(e) => updateState({ currentDate: e.target.value })} />
                        <Input label="Saldo Total (USD)" mask="currency" prefix="$" variant="success" className="text-[#00e676]" value={state.currentBalanceUsd} onChange={(e) => updateState({ currentBalanceUsd: parseCurrency(e.target.value) })} />
                    </div>
               </Card>
               <button onClick={handleRegisterDay} className="lg:col-span-2 bg-[#00e676] hover:bg-white text-black font-black uppercase tracking-widest border-2 border-transparent hover:border-[#00e676] shadow-[4px_4px_0px_0px_white] hover:shadow-[4px_4px_0px_0px_#00e676] transition-all flex flex-col items-center justify-center gap-2 p-4 active:translate-y-1 active:shadow-none min-h-[80px]">
                   <Save size={24} />
                   <span>REGISTRAR</span>
                   <span className="text-[10px] font-mono bg-black/10 px-2 py-0.5">SNAPSHOT</span>
               </button>
           </div>

           <div className="relative border-4 border-white bg-black p-10 flex flex-col justify-center shadow-[12px_12px_0px_0px_#00e676]">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                    <div className="flex-shrink-0 text-center md:text-left border-b-2 md:border-b-0 md:border-r-2 border-white/20 pb-6 md:pb-0 md:pr-12 w-full md:w-auto">
                         <div className="text-base uppercase font-black text-white tracking-[0.2em] mb-4 flex items-center justify-center md:justify-start gap-3">
                            <Target size={20} className="text-[#00e676]" />
                            OBJETIVO FINAL: 1 MILHÃO
                         </div>
                         <div className="text-5xl md:text-7xl font-black text-white tracking-tighter font-sans">
                            <span className="text-[#00e676] text-4xl align-top mr-3 font-mono">$</span>
                            {state.currentBalanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex justify-between items-end mb-4">
                            <span className={`text-6xl font-black text-[#00e676] font-sans`}>{goalProgress.toFixed(1)}%</span>
                            {!isGoalReached ? (
                                 <span className="text-sm font-black text-white uppercase tracking-wider bg-white/10 px-3 py-1.5">OBJETIVO RESTANTE <span className="text-[#00e676] ml-2">$ {remaining.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span></span>
                            ) : (
                                <span className="text-sm font-black bg-[#ffd700] text-black px-3 py-1.5 uppercase">OBJETIVO ALCANÇADO</span>
                            )}
                        </div>
                        <div className="h-8 bg-[#111] border-2 border-white relative">
                            <div className="h-full bg-[#00e676] border-r-2 border-black" style={{ width: `${goalProgress}%` }}></div>
                        </div>
                    </div>
                </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatsCard label="Dias de Operação" value={daysElapsed.toString()} icon={<Calendar size={18} />} color="success" />
                <StatsCard label="Aumento de Patrimônio" value={`${growthPercentage.toFixed(2)}%`} color={growthPercentage >= 0 ? 'success' : 'danger'} icon={<ArrowUpRight size={18} />} />
                <StatsCard label="% Diária" value={`${dailyYieldPercent.toFixed(2)}%`} color="gold" icon={<Percent size={18} />} />
                <StatsCard label="Lucro em USD" value={`$ ${standardUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color={standardUsd >= 0 ? 'success' : 'danger'} compact />
                <StatsCard label="Lucro em BRL Standard" value={`R$ ${standardBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color={standardBrl >= 0 ? 'success' : 'danger'} compact />
                <StatsCard label="Cents Totais" value={`${profitCentsRaw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subValue="c" color="success" />
                <StatsCard label="Cents Convertidos em BRL" value={`R$ ${currentCentsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="success" />
                <StatsCard label="Média Diária" value={`R$ ${dailyAvgBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="purple" />
           </div>
       </div>

       <div ref={snapshotRef} className="border-2 border-[#00e676] bg-[#000] shadow-[6px_6px_0px_0px_#00e676]">
           <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between px-6 py-5 bg-[#111] hover:bg-[#00e676]/5 transition-colors group">
               <div className="flex items-center gap-3">
                   <div className="w-4 h-4 bg-[#00e676]"></div>
                   <h3 className="text-base font-black text-white uppercase tracking-widest">EVOLUÇÃO DIÁRIA (SNAPSHOTS)</h3>
                   <span className="ml-6 text-xs text-white font-black uppercase tracking-tighter bg-white/10 px-2 py-0.5">{state.dailyHistory?.length || 0} DIAS REGISTRADOS</span>
               </div>
               <div className="text-[#00e676] group-hover:scale-125 transition-transform">{isHistoryOpen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}</div>
           </button>

           {isHistoryOpen && (
               <div className="overflow-x-auto border-t-2 border-[#00e676]/20 animate-in slide-in-from-top-2 duration-200">
                   <table className="w-full text-left border-collapse">
                       <thead className="bg-[#050505] text-sm uppercase text-white font-black border-b-2 border-white/10">
                           <tr>
                               <th className="py-5 px-6 whitespace-nowrap">Data</th>
                               <th className="py-5 px-6 whitespace-nowrap">Saldo (USD)</th>
                               <th className="py-5 px-6 whitespace-nowrap">Rate</th>
                               <th className="py-5 px-6 whitespace-nowrap text-right text-[#00e676]">Score (Cents BRL)</th>
                               <th className="py-5 px-6 whitespace-nowrap text-right">Resultado Dia</th>
                               <th className="py-5 px-4 text-center w-10">...</th>
                           </tr>
                       </thead>
                       <tbody className="text-sm font-mono text-white font-bold">
                           {(state.dailyHistory || []).map((record, index, arr) => {
                               const prevRecord = arr[index + 1];
                               const isFirstRecord = index === arr.length - 1;
                               const dayResult = isFirstRecord ? record.centsBrl : record.centsBrl - (prevRecord?.centsBrl || 0);
                               const depositDiff = (record.investedUsd !== undefined && prevRecord?.investedUsd !== undefined) ? record.investedUsd - prevRecord.investedUsd : 0;

                               return (
                                   <tr key={record.date} className="border-b border-white/5 hover:bg-[#00e676] hover:text-black transition-colors group">
                                       <td className="py-4 px-6 border-r border-white/5 group-hover:border-black/10">{formatDateDisplay(record.date)}</td>
                                       <td className="py-4 px-6 border-r border-white/5 group-hover:border-black/10">
                                           <div className="flex flex-col">
                                               <span>$ {record.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                               {depositDiff > 1 && <span className="text-[10px] font-black text-cyan-400 group-hover:text-black flex items-center gap-1 mt-1 bg-cyan-400/10 group-hover:bg-black/10 px-1 w-fit uppercase"><Wallet size={12} />CAPITAL +{depositDiff.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>}
                                           </div>
                                       </td>
                                       <td className="py-4 px-6 border-r border-white/5 group-hover:border-black/10">{record.rate.toFixed(2)}</td>
                                       <td className="py-4 px-6 text-right font-black border-r border-white/5 group-hover:border-black/10">R$ {record.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                       <td className={`py-4 px-6 text-right font-black group-hover:text-black ${dayResult >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                                            {isFirstRecord ? (
                                                <div className="flex items-center justify-end gap-2 opacity-90"><Flag size={14} fill="currentColor" /><span className="text-xs font-black uppercase tracking-wider">INÍCIO</span><span>R$ {dayResult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                            ) : (
                                                <>{dayResult > 0 ? '+' : ''}{dayResult.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                                            )}
                                       </td>
                                       <td className="py-4 px-4 text-center">
                                           <button type="button" onClick={(e) => { e.stopPropagation(); deleteRecord(record.date); }} className="text-white/40 hover:text-white transition-colors p-2 hover:bg-[#ff4444] rounded-none z-10 relative cursor-pointer" title="Apagar"><Trash2 size={18} className="pointer-events-none" /></button>
                                       </td>
                                   </tr>
                               );
                           })}
                       </tbody>
                   </table>
               </div>
           )}
       </div>
    </div>
  );
};

const StatsCard = ({ label, value, subValue, icon, color = 'default', className = '', compact = false }: any) => {
    const colors: any = { default: 'text-white', success: 'text-[#00e676]', danger: 'text-[#ff4444]', purple: 'text-[#d500f9]', gold: 'text-[#ffd700]' };
    return (
        <Card className={`flex flex-col justify-center p-8 ${className}`}>
            <div className="flex items-center justify-between mb-3"><span className="text-sm uppercase font-black tracking-widest text-white">{label}</span><div className="text-white">{icon}</div></div>
            <div className={`${compact ? 'text-3xl' : 'text-4xl'} font-black ${colors[color]} leading-none tracking-tight font-sans`}>{value} <span className="text-sm opacity-80 font-black font-mono text-white">{subValue}</span></div>
        </Card>
    );
};
