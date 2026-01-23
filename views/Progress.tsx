
import React, { useState, useRef } from 'react';
import { DailyRecord } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CustomAlert } from '../components/ui/CustomAlert';
import { Calendar, Target, Plus, ArrowUpRight, Save, Trash2, Percent, ChevronDown, ChevronUp, Camera, Share2, Check, Loader2 } from 'lucide-react';
import { parseCurrency } from '../utils/format';
import { toBlob } from 'html-to-image';

interface ProgressProps {
  title: string;
  dollarRate: number;
  startDate: string;
  startDepositUsd: number;
  currentDate: string;
  currentBalanceUsd: number;
  dailyHistory: DailyRecord[];
  additionalDepositDraft: string;
  onUpdate: (updates: any) => void;
}

export const Progress: React.FC<ProgressProps> = ({ 
  title,
  dollarRate,
  startDate,
  startDepositUsd,
  currentDate,
  currentBalanceUsd,
  dailyHistory,
  additionalDepositDraft,
  onUpdate 
}) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); 
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success'>('idle');
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'confirm' | 'alert' | 'success'; onConfirm?: () => void }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });
  
  const fullReportRef = useRef<HTMLDivElement>(null);
  const snapshotRef = useRef<HTMLDivElement>(null);

  const daysElapsed = dailyHistory?.length || 0;
  const mathDays = daysElapsed || 1; 

  const totalGrowthUsd = currentBalanceUsd - startDepositUsd;
  const growthPercentage = startDepositUsd > 0 ? (totalGrowthUsd / startDepositUsd) * 100 : 0;
  const dailyYieldPercent = growthPercentage / mathDays;
  const standardBrl = totalGrowthUsd * dollarRate;
  
  const calculateCentsBrl = (balanceUsd: number, rate: number) => {
    const profitRaw = balanceUsd - startDepositUsd;
    return (profitRaw / 100) * rate;
  };

  const currentCentsBrl = calculateCentsBrl(currentBalanceUsd, dollarRate);
  const dailyAvgBrl = currentCentsBrl / mathDays;

  const goal = 1000000;
  const goalProgress = Math.min((currentBalanceUsd / goal) * 100, 100);
  const remaining = goal - currentBalanceUsd;

  const handleCopyAsImage = async (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current || copyStatus === 'copying') return;
    setCopyStatus('copying');
    try {
        const blob = await toBlob(ref.current, { backgroundColor: '#050505', quality: 0.95, pixelRatio: 2 });
        if (blob) {
            const data = [new ClipboardItem({ 'image/png': blob })];
            await navigator.clipboard.write(data);
            setCopyStatus('success');
            setTimeout(() => setCopyStatus('idle'), 3000);
        }
    } catch (err) { setCopyStatus('idle'); }
  };

  const handleAddToStartDeposit = () => {
    const amountToAdd = parseCurrency(additionalDepositDraft || '0');
    if (!isNaN(amountToAdd) && amountToAdd > 0) {
        onUpdate({
            startDepositUsd: startDepositUsd + amountToAdd,
            currentBalanceUsd: currentBalanceUsd + amountToAdd, 
            additionalDeposit: '' 
        });
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '---';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year.slice(2)}`;
  };

  const handleRegisterDay = () => {
      const existingIndex = (dailyHistory || []).findIndex(r => r.date === currentDate);
      const proceed = () => {
          const newRecord: DailyRecord = {
              date: currentDate,
              balanceUsd: currentBalanceUsd,
              rate: dollarRate,
              centsBrl: calculateCentsBrl(currentBalanceUsd, dollarRate),
              investedUsd: startDepositUsd
          };
          let newHistory = [...(dailyHistory || [])];
          if (existingIndex >= 0) newHistory[existingIndex] = newRecord;
          else newHistory.push(newRecord);
          newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          onUpdate({ dailyHistory: newHistory });
          setAlertConfig({ isOpen: true, title: "SUCESSO", message: "Snapshot arquivado.", type: 'success' });
      };

      if (existingIndex >= 0) {
          setAlertConfig({
              isOpen: true,
              title: "SOBREPOR?",
              message: `Substituir registro de ${formatDateDisplay(currentDate)}?`,
              type: 'confirm',
              onConfirm: proceed
          });
      } else proceed();
  };

  return (
    <div className="flex flex-col gap-4 font-mono pb-6 overflow-x-hidden animate-in fade-in duration-300">
       <CustomAlert 
          isOpen={alertConfig.isOpen} 
          onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={alertConfig.onConfirm}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
       />

       <div className="flex items-center justify-between border-b-2 border-white/10 pb-3">
           <div className="flex items-center gap-2">
               <div className="w-4 h-4 bg-[#00e676] shadow-[2px_2px_0px_0px_white]"></div>
               <h2 className="text-base font-black text-white uppercase tracking-tighter">{title}</h2>
           </div>
           <div className="flex gap-2">
               <button onClick={() => handleCopyAsImage(snapshotRef)} className="p-2 border border-[#00e676] text-[#00e676] hover:bg-[#00e676] hover:text-black transition-all">
                   {copyStatus === 'copying' ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
               </button>
               <button onClick={() => handleCopyAsImage(fullReportRef)} className="p-2 border border-white/30 text-white/50 hover:bg-white hover:text-black transition-all">
                   <Share2 size={12} />
               </button>
           </div>
       </div>

       <div ref={fullReportRef} className="flex flex-col gap-4">
           <Card className="!p-3" color="success">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <Input label="Início" type="date" variant="success" value={startDate} onChange={(e) => onUpdate({ startDate: e.target.value })} className="!py-2" />
                    <Input label="Cap. (USD)" mask="currency" prefix="$" variant="success" value={startDepositUsd} onChange={(e) => onUpdate({ startDepositUsd: parseCurrency(e.target.value) })} />
                    <Input label="Aporte" mask="currency" prefix="$" variant="success" value={additionalDepositDraft || ''} onChange={(e) => onUpdate({ additionalDeposit: e.target.value })} actionButton={
                        <button onClick={handleAddToStartDeposit} className="h-full px-2 text-[#00e676] border-l border-white/10"><Plus size={14} /></button>
                    }/>
                    <Input label="Hoje" type="date" variant="success" value={currentDate} onChange={(e) => onUpdate({ currentDate: e.target.value })} />
                    <Input label="Saldo (USD)" mask="currency" prefix="$" variant="success" className="text-[#00e676]" value={currentBalanceUsd} onChange={(e) => onUpdate({ currentBalanceUsd: parseCurrency(e.target.value) })} onKeyDown={(e) => e.key === 'Enter' && handleRegisterDay()} />
                </div>
           </Card>

           <div className="relative border-2 border-white bg-black p-4 flex flex-col shadow-[6px_6px_0px_0px_#00e676]">
                <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                    <div className="text-center md:text-left">
                         <div className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-1 flex items-center justify-center md:justify-start gap-2">
                            <Target size={14} className="text-[#00e676]" /> SALDO ATUAL
                         </div>
                         <div className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
                            <span className="text-[#00e676] text-lg align-top mr-1">$</span>
                            {currentBalanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                         </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-2">
                        <span className="text-2xl md:text-4xl font-black text-[#00e676]">{goalProgress.toFixed(1)}%</span>
                        <div className="w-48 h-2 bg-[#111] border border-white/20 overflow-hidden">
                            <div className="h-full bg-[#00e676] transition-all duration-700" style={{ width: `${goalProgress}%` }}></div>
                        </div>
                        <span className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Restam $ {remaining.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                </div>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <StatsCard label="Dias" value={daysElapsed.toString()} color="success" />
                <StatsCard label="ROI %" value={`${growthPercentage.toFixed(2)}%`} color={growthPercentage >= 0 ? 'success' : 'danger'} />
                <StatsCard label="Média %" value={`${dailyYieldPercent.toFixed(2)}%`} color="gold" />
                <StatsCard label="Lucro USD" value={`$ ${totalGrowthUsd.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} color="white" />
                <StatsCard label="BRL Standard" value={`R$ ${standardBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} color="black" variant="highlight" />
                <StatsCard label="Lucro BRL" value={`R$ ${currentCentsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} color="black" variant="highlight" />
                <StatsCard label="Média BRL" value={`R$ ${dailyAvgBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} color="purple" />
                <button onClick={handleRegisterDay} className="bg-[#00e676] text-black font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_white] active:translate-y-0.5">
                    <Save size={14} /> REGISTRAR
                </button>
           </div>
       </div>

       <div ref={snapshotRef} className="border-2 border-[#00e676] bg-black mt-4">
           <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between px-4 py-3 bg-[#111] border-b-2 border-[#00e676]/20">
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Histórico de Snapshots ({dailyHistory.length})</span>
               <div className="text-[#00e676]">{isHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</div>
           </button>
           {isHistoryOpen && (
               <div className="overflow-x-auto max-h-60 overflow-y-auto">
                   <table className="w-full text-left border-collapse min-w-[500px]">
                       <thead className="bg-[#050505] text-[9px] uppercase text-white/40 font-black border-b border-white/10">
                           <tr>
                               <th className="py-2 px-4">Data</th>
                               <th className="py-2 px-4">USD</th>
                               <th className="py-2 px-4 text-right text-[#00e676]">BRL TOTAL</th>
                               <th className="py-2 px-4 text-right">Dia</th>
                               <th className="py-2 px-2 w-8"></th>
                           </tr>
                       </thead>
                       <tbody className="text-[10px] font-mono text-white">
                           {dailyHistory.map((record, index, arr) => {
                               const prev = arr[index + 1];
                               const diff = index === arr.length - 1 ? record.centsBrl : record.centsBrl - (prev?.centsBrl || 0);
                               return (
                                   <tr key={record.date} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                       <td className="py-2 px-4 opacity-50">{formatDateDisplay(record.date)}</td>
                                       <td className="py-2 px-4 font-bold text-white">$ {record.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                       <td className="py-2 px-4 text-right font-black text-[#00e676]">R$ {record.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                       <td className={`py-2 px-4 text-right font-bold ${diff >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                                            {diff > 0 ? '+' : ''}{diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                       </td>
                                       <td className="py-2 px-2 text-center">
                                           <button onClick={() => { if(confirm("Apagar?")) onUpdate({ dailyHistory: dailyHistory.filter(r => r.date !== record.date) }); }} className="text-white/10 hover:text-red-500"><Trash2 size={10} /></button>
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

const StatsCard = ({ label, value, color = 'default', variant = 'default' }: any) => {
    const colors: any = { default: 'text-white', success: 'text-[#00e676]', danger: 'text-[#ff4444]', purple: 'text-[#d500f9]', gold: 'text-[#ffd700]', white: 'text-white', black: 'text-black' };
    if (variant === 'highlight') return (
        <div className="flex flex-col justify-center min-h-[50px] bg-[#00e676] border border-white/20 p-2 shadow-[2px_2px_0px_0px_white]">
            <span className="text-[8px] uppercase font-black text-black/60 leading-tight mb-0.5">{label}</span>
            <div className="text-sm font-black text-black leading-none truncate">{value}</div>
        </div>
    );
    return (
        <div className="flex flex-col justify-center min-h-[50px] bg-[#111] border border-white/10 p-2">
            <span className="text-[8px] uppercase font-black text-white/40 leading-tight mb-0.5">{label}</span>
            <div className={`text-sm font-black leading-none truncate ${colors[color]}`}>{value}</div>
        </div>
    );
};
