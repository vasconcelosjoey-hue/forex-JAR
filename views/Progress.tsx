
import React, { useState, useRef } from 'react';
import { DailyRecord } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CustomAlert } from '../components/ui/CustomAlert';
import { Target, Plus, Save, Trash2, ChevronDown, ChevronUp, Camera, Share2, Loader2 } from 'lucide-react';
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
  
  const captureRef = useRef<HTMLDivElement>(null);

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

  const valuation = 1500 + currentCentsBrl;

  const goal = 1000000;
  const goalProgress = Math.min((currentBalanceUsd / goal) * 100, 100);
  const remaining = goal - currentBalanceUsd;

  const handleCopyAsImage = async () => {
    if (!captureRef.current || copyStatus === 'copying') return;
    setCopyStatus('copying');
    try {
        const blob = await toBlob(captureRef.current, { 
            backgroundColor: '#050505', 
            quality: 1, 
            pixelRatio: 3,
            style: {
                transform: 'scale(1)',
            }
        });
        if (blob) {
            // @ts-ignore - ClipboardItem may not be defined in some TypeScript environments
            const data = [new ClipboardItem({ 'image/png': blob })];
            // Fix: Use 'write' instead of 'setItem' on navigator.clipboard as per modern Web API.
            // Using cast to 'any' to avoid potential missing type definitions for the Clipboard API.
            await (navigator.clipboard as any).write(data);
            setCopyStatus('success');
            setTimeout(() => setCopyStatus('idle'), 3000);
        }
    } catch (err) { 
        console.error(err);
        setCopyStatus('idle'); 
    }
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
    <div className="flex flex-col gap-4 font-mono pb-10 overflow-x-hidden animate-in fade-in duration-300">
       <CustomAlert 
          isOpen={alertConfig.isOpen} 
          onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={alertConfig.onConfirm}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
       />

       <div ref={captureRef} className="flex flex-col gap-4 p-1">
           {/* HEADER: NOMES + VALUATION */}
           <div className="flex flex-col md:flex-row items-center justify-between border-b-4 border-white/10 pb-4 gap-4">
               <div className="flex items-center gap-4">
                   <div className="flex items-center gap-3">
                       <div className="w-5 h-5 bg-[#00e676] shadow-[2px_2px_0px_0px_white]"></div>
                       <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">{title}</h2>
                   </div>
                   <div className="border-l-2 border-white/20 pl-4 py-1">
                       <span className="block text-[10px] text-white uppercase font-black tracking-widest">VALUATION</span>
                       <span className="text-xl font-black text-[#00e676]">R$ {valuation.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
               </div>
               
               <div className="flex gap-2">
                   <button onClick={handleCopyAsImage} className="p-2 border-2 border-[#00e676] text-[#00e676] hover:bg-[#00e676] hover:text-black transition-all">
                       {copyStatus === 'copying' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                   </button>
                   <button onClick={handleCopyAsImage} className="p-2 border-2 border-white/30 text-white/50 hover:bg-white hover:text-black transition-all">
                       <Share2 size={16} />
                   </button>
               </div>
           </div>

           {/* INPUTS ROW + REGISTRAR DIA */}
           <Card className="!p-4" color="success">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <Input label="Início" type="date" variant="success" value={startDate} onChange={(e) => onUpdate({ startDate: e.target.value })} />
                    <Input label="Cap. (USD)" mask="currency" prefix="$" variant="success" value={startDepositUsd} onChange={(e) => onUpdate({ startDepositUsd: parseCurrency(e.target.value) })} />
                    <Input label="Aporte" mask="currency" prefix="$" variant="success" value={additionalDepositDraft || ''} onChange={(e) => onUpdate({ additionalDeposit: e.target.value })} actionButton={
                        <button onClick={handleAddToStartDeposit} className="h-full px-4 text-[#00e676] border-l-2 border-white/10 hover:bg-[#00e676]/10 transition-colors"><Plus size={18} /></button>
                    }/>
                    <Input label="Hoje" type="date" variant="success" value={currentDate} onChange={(e) => onUpdate({ currentDate: e.target.value })} />
                    <Input label="Saldo (USD)" mask="currency" prefix="$" variant="success" className="text-[#00e676]" value={currentBalanceUsd} onChange={(e) => onUpdate({ currentBalanceUsd: parseCurrency(e.target.value) })} onKeyDown={(e) => e.key === 'Enter' && handleRegisterDay()} />
                    <button onClick={handleRegisterDay} className="h-[52px] md:h-[64px] bg-[#00e676] text-black font-black uppercase text-[11px] md:text-xs flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_white] active:translate-y-1 active:shadow-none transition-all border-none">
                        <Save size={18} /> REGISTRAR DIA
                    </button>
                </div>
           </Card>

           {/* MAIN METRICS INTEGRATED */}
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                {/* Left: Saldo Atual */}
                <div className="lg:col-span-5 relative border-4 border-white bg-black p-4 md:p-5 flex flex-col justify-center shadow-[6px_6px_0px_0px_#00e676]">
                    <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="text-center md:text-left">
                             <div className="text-[9px] uppercase font-black text-white tracking-[0.3em] mb-1 flex items-center justify-center md:justify-start gap-2">
                                <Target size={14} className="text-[#00e676]" /> SALDO ATUAL
                             </div>
                             <div className="text-2xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none">
                                <span className="text-[#00e676] text-sm align-top mr-1 font-mono opacity-80">$</span>
                                {currentBalanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                             </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-1">
                            <span className="text-lg md:text-2xl font-black text-[#00e676]">{goalProgress.toFixed(1)}%</span>
                            <div className="w-32 md:w-40 h-1.5 bg-[#111] border border-white/20 overflow-hidden">
                                <div className="h-full bg-[#00e676] transition-all duration-700" style={{ width: `${goalProgress}%` }}></div>
                            </div>
                            <span className="text-[12px] md:text-[13px] text-white/50 uppercase font-bold tracking-[0.1em] mt-1 leading-none text-center md:text-right w-full">Restam $ {remaining.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* Right: KPI Cards */}
                <div className="lg:col-span-7 grid grid-cols-2 gap-3">
                    <StatsCard label="Dias Corridos" value={daysElapsed.toString()} color="success" />
                    <StatsCard label="Aumento Patrimonial" value={`${growthPercentage.toFixed(2)}%`} color={growthPercentage >= 0 ? 'success' : 'danger'} />
                    <StatsCard label="Média Diária %" value={`${dailyYieldPercent.toFixed(2)}%`} color="gold" labelColor="gold" />
                    <StatsCard label="Lucro USD" value={`$ ${totalGrowthUsd.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} color="white" />
                </div>
           </div>

           {/* SECONDARY ROW (BRL Metrics) */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <StatsCard label="Lucro Standard" value={`R$ ${standardBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} color="black" variant="highlight" />
                <StatsCard label="Lucro BRL Real" value={`R$ ${currentCentsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} color="black" variant="highlight" />
                <StatsCard label="BRL Diário" value={`R$ ${dailyAvgBrl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} color="purple" labelColor="purple" />
           </div>
       </div>

       {/* SNAPSHOTS ARQUIVADOS (Fora da área de captura de foto rápida) */}
       <div className="border-4 border-[#00e676] bg-black mt-4 mx-1">
            <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between px-6 py-3 bg-[#111] border-b-2 border-[#00e676]/20 hover:bg-[#151515] transition-colors">
                <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Snapshots Arquivados ({dailyHistory.length})</span>
                <div className="text-[#00e676]">{isHistoryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
            </button>
            {isHistoryOpen && (
                <div className="overflow-x-auto max-h-52 overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-[#050505] text-[10px] uppercase text-white font-black border-b border-white/10">
                            <tr>
                                <th className="py-3 px-6">Data</th>
                                <th className="py-3 px-6">USD Balance</th>
                                <th className="py-3 px-6 text-right text-[#00e676]">BRL TOTAL</th>
                                <th className="py-3 px-6 text-right">Var. Dia</th>
                                <th className="py-3 px-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="text-xs font-mono text-white">
                            {dailyHistory.map((record, index, arr) => {
                                const prev = arr[index + 1];
                                const diff = index === arr.length - 1 ? record.centsBrl : record.centsBrl - (prev?.centsBrl || 0);
                                return (
                                    <tr key={record.date} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-6 opacity-50 font-bold">{formatDateDisplay(record.date)}</td>
                                        <td className="py-3 px-6 font-black text-white">$ {record.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-3 px-6 text-right font-black text-[#00e676]">R$ {record.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className={`py-3 px-6 text-right font-black ${diff >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                                             {diff > 0 ? '+' : ''}{diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-3 px-3 text-center">
                                            <button onClick={() => { if(confirm("Apagar?")) onUpdate({ dailyHistory: dailyHistory.filter(r => r.date !== record.date) }); }} className="text-white/20 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
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

const StatsCard = ({ label, value, color = 'default', variant = 'default', labelColor = 'white' }: any) => {
    const colors: any = { 
        default: 'text-white', 
        success: 'text-[#00e676]', 
        danger: 'text-[#ff4444]', 
        purple: 'text-[#d500f9]', 
        gold: 'text-[#ffd700]', 
        white: 'text-white', 
        black: 'text-black' 
    };

    const labelColors: any = {
        white: 'text-white',
        gold: 'text-[#ffd700]',
        purple: 'text-[#d500f9]',
        black: 'text-black'
    };
    
    if (variant === 'highlight') return (
        <div className="flex flex-col justify-center min-h-[90px] bg-[#00e676] border-2 border-white/20 p-5 shadow-[5px_5px_0px_0px_white]">
            <span className={`text-[12px] uppercase font-black ${labelColors['black']} leading-tight mb-1 tracking-wider`}>{label}</span>
            <div className="text-2xl md:text-3xl lg:text-4xl font-black text-black leading-none truncate">{value}</div>
        </div>
    );
    
    return (
        <div className="flex flex-col justify-center min-h-[90px] bg-[#111] border-2 border-white/10 p-5 shadow-[5px_5px_0px_0px_rgba(255,255,255,0.05)]">
            <span className={`text-[12px] uppercase font-black ${labelColors[labelColor] || 'text-white'} leading-tight mb-1 tracking-wider`}>{label}</span>
            <div className={`text-2xl md:text-3xl lg:text-4xl font-black leading-none truncate ${colors[color]}`}>{value}</div>
        </div>
    );
};
