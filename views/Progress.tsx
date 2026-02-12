import React, { useState, useRef, useMemo } from 'react';
import { DailyRecord } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CustomAlert } from '../components/ui/CustomAlert';
import { Target, Plus, Save, Trash2, ChevronDown, ChevronUp, Camera, Share2, Loader2 } from 'lucide-react';
import { parseCurrency, formatCurrencyInput, formatCurrencyDisplay } from '../utils/format';
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
  valuationBaseBrl: number;
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
  valuationBaseBrl,
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

  const parseDateToUtc = (value: string) => {
    if (!value) return null;

    const normalized = value.trim();
    const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, year, month, day] = isoMatch;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }

    const brMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
    if (brMatch) {
      const [, day, month, yearRaw] = brMatch;
      const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
      return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    }

    return null;
  };

  const businessDays = useMemo(() => {
    if (!startDate || !currentDate) return 1;
    const start = parseDateToUtc(startDate);
    const end = parseDateToUtc(currentDate);
    if (!start || !end) return 1;
    if (start > end) return 1;
    
    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getUTCDay();
      if (day !== 0 && day !== 6) count++; 
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return count || 1;
  }, [startDate, currentDate]);

  const totalGrowthUsd = currentBalanceUsd - startDepositUsd;
  const growthPercentage = startDepositUsd > 0 ? (totalGrowthUsd / startDepositUsd) * 100 : 0;
  const dailyYieldPercent = growthPercentage / businessDays;
  
  const calculateCentsBrl = (balanceUsd: number, rate: number) => {
    const profitRaw = balanceUsd - startDepositUsd;
    return (profitRaw / 100) * rate;
  };

  const currentCentsBrl = calculateCentsBrl(currentBalanceUsd, dollarRate);
  const standardProfitBrl = totalGrowthUsd * dollarRate;
  
  const isJoeyMt5 = title.includes('JOEY MT5');
  
  const dailyAvgBrl = isJoeyMt5 
    ? standardProfitBrl / businessDays 
    : currentCentsBrl / businessDays;

  const profitForValuation = isJoeyMt5 ? standardProfitBrl : currentCentsBrl;
  const valuation = (valuationBaseBrl || 0) + profitForValuation;

  const goalValue = isJoeyMt5 ? 10000 : 1000000;
  const goalProgress = Math.min((currentBalanceUsd / goalValue) * 100, 100);
  const remaining = goalValue - currentBalanceUsd;

  const handleCopyAsImage = async () => {
    if (!captureRef.current || copyStatus === 'copying') return;
    setCopyStatus('copying');
    try {
        const blob = await toBlob(captureRef.current, { 
            backgroundColor: '#050505', 
            quality: 1, 
            pixelRatio: 3
        });
        if (blob) {
            const data = [new ClipboardItem({ 'image/png': blob })];
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
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year.slice(2)}`;
  };

  const handleRegisterDay = () => {
      const existingIndex = (dailyHistory || []).findIndex(r => r.date === currentDate);
      const proceed = () => {
          const profitToRecord = isJoeyMt5 ? standardProfitBrl : calculateCentsBrl(currentBalanceUsd, dollarRate);
          const newRecord: DailyRecord = {
              date: currentDate,
              balanceUsd: currentBalanceUsd,
              rate: dollarRate,
              centsBrl: profitToRecord, 
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

  const handleValuationBaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value, 2);
    onUpdate({ valuationBaseBrl: parseCurrency(formatted) });
  };

  const formatBRL = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatUSD = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
           <div className="flex flex-col md:flex-row items-center justify-between border-b-4 border-white/10 pb-4 gap-4">
               <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                   <div className="flex items-center gap-3">
                       <div className="w-5 h-5 bg-[#00e676] shadow-[2px_2px_0px_0px_white]"></div>
                       <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter whitespace-nowrap">{title}</h2>
                   </div>
                   
                   <div className="flex items-center gap-4 border-l-0 md:border-l-2 border-white/20 pl-0 md:pl-4 py-1 w-full md:w-auto overflow-x-auto md:overflow-visible">
                       <div className="flex flex-col min-w-max">
                           <span className="text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">CAPITAL BRL</span>
                           <div className="relative group">
                               <span className="absolute left-0 top-1/2 -translate-y-1/2 text-xs text-neutral-600 font-bold pointer-events-none">R$</span>
                               <input 
                                  type="tel"
                                  className="bg-transparent border-b-2 border-[#00e676] pl-6 pr-2 py-1 text-base md:text-xl font-black text-[#00e676] focus:outline-none transition-all w-full max-w-[200px]"
                                  placeholder="0,00"
                                  value={valuationBaseBrl === 0 ? '' : formatCurrencyDisplay(valuationBaseBrl, 2)}
                                  onChange={handleValuationBaseChange}
                               />
                           </div>
                       </div>
                       <div className="h-10 w-[2px] bg-white/10 mx-2 flex-shrink-0"></div>
                       <div className="min-w-max">
                           <span className="block text-[10px] text-white/50 uppercase font-black tracking-widest mb-1">VALUATION</span>
                           <span className="text-xl md:text-2xl font-black text-[#00e676]">R$ {formatBRL(valuation)}</span>
                       </div>
                   </div>
               </div>
               
               <div className="flex gap-2 flex-shrink-0">
                   <button onClick={handleCopyAsImage} className="p-2 border-2 border-[#00e676] text-[#00e676] hover:bg-[#00e676] hover:text-black transition-all">
                       {copyStatus === 'copying' ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                   </button>
                   <button onClick={handleCopyAsImage} className="p-2 border-2 border-white/30 text-white/50 hover:bg-white hover:text-black transition-all">
                       <Share2 size={16} />
                   </button>
               </div>
           </div>

           <Card className="!p-4" color="success">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
                    <Input label="Início" type="date" variant="success" value={startDate} onChange={(e) => onUpdate({ startDate: e.target.value })} />
                    <Input label="Cap. (USD)" mask="currency" prefix="$" variant="success" value={startDepositUsd} onChange={(e) => onUpdate({ startDepositUsd: parseCurrency(e.target.value) })} />
                    <Input label="Aporte" mask="currency" prefix="$" variant="success" value={additionalDepositDraft || ''} onChange={(e) => onUpdate({ additionalDeposit: e.target.value })} actionButton={
                        <button onClick={handleAddToStartDeposit} className="h-full px-4 text-[#00e676] border-l-2 border-white/10 hover:bg-[#00e676]/10 transition-colors"><Plus size={18} /></button>
                    }/>
                    <Input label="Hoje" type="date" variant="success" value={currentDate} onChange={(e) => onUpdate({ currentDate: e.target.value })} />
                    <Input label="Saldo (USD)" mask="currency" prefix="$" variant="success" className="text-[#00e676]" value={currentBalanceUsd} onChange={(e) => onUpdate({ currentBalanceUsd: parseCurrency(e.target.value) })} onKeyDown={(e) => e.key === 'Enter' && handleRegisterDay()} />
                    <button onClick={handleRegisterDay} className="h-[52px] lg:h-[64px] bg-[#00e676] text-black font-black uppercase text-[11px] flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_white] active:translate-y-1 active:shadow-none transition-all border-none">
                        <Save size={18} /> REGISTRAR DIA
                    </button>
                </div>
           </Card>

           <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-5 relative border-4 border-white bg-black p-4 md:p-5 flex flex-col justify-center shadow-[6px_6px_0px_0px_#00e676] overflow-hidden">
                    <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                        <div className="text-center md:text-left w-full overflow-hidden">
                             <div className="text-[9px] uppercase font-black text-white tracking-[0.3em] mb-1 flex items-center justify-center md:justify-start gap-2">
                                <Target size={14} className="text-[#00e676]" /> SALDO ATUAL
                             </div>
                             <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none break-all sm:break-normal">
                                <span className="text-[#00e676] text-sm align-top mr-1 font-mono opacity-80">$</span>
                                {formatUSD(currentBalanceUsd)}
                             </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-1 flex-shrink-0">
                            <span className="text-lg md:text-2xl font-black text-[#00e676]">{goalProgress.toFixed(2)}%</span>
                            <div className="w-32 md:w-40 h-1.5 bg-[#111] border border-white/20 overflow-hidden">
                                <div className="h-full bg-[#00e676] transition-all duration-700" style={{ width: `${goalProgress}%` }}></div>
                            </div>
                            <span className="text-[10px] md:text-[12px] text-white/50 uppercase font-bold tracking-[0.1em] mt-1 leading-none text-center md:text-right w-full">Restam $ {formatUSD(remaining)}</span>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7 grid grid-cols-2 gap-3">
                    <StatsCard label="Dias Úteis" value={businessDays.toString()} color="success" />
                    <StatsCard label="Aumento Patrimonial" value={`${growthPercentage.toFixed(2)}%`} color={growthPercentage >= 0 ? 'success' : 'danger'} />
                    <StatsCard label="Média Diária %" value={`${dailyYieldPercent.toFixed(2)}%`} color="gold" labelColor="gold" />
                    <StatsCard label="Lucro USD" value={`$ ${formatUSD(totalGrowthUsd)}`} color="white" />
                </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <StatsCard label="Lucro Standard" value={`R$ ${formatBRL(standardProfitBrl)}`} color="black" variant="highlight" />
                <StatsCard label="Lucro BRL Real" value={`R$ ${formatBRL(currentCentsBrl)}`} color="black" variant="highlight" />
                <StatsCard label="BRL Diário" value={`R$ ${formatBRL(dailyAvgBrl)}`} color="purple" labelColor="purple" />
           </div>
       </div>

       <div className="border-4 border-[#00e676] bg-black mt-4 mx-1">
            <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between px-6 py-3 bg-[#111] border-b-2 border-[#00e676]/20 hover:bg-[#151515] transition-colors">
                <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Snapshots Arquivados ({dailyHistory.length})</span>
                <div className="text-[#00e676]">{isHistoryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
            </button>
            {isHistoryOpen && (
                <div className="overflow-x-auto max-h-52 overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-[#050505] text-[10px] uppercase text-white font-black border-b border-white/10">
                            <tr>
                                <th className="py-3 px-6">Data</th>
                                <th className="py-3 px-6">USD Balance</th>
                                <th className="py-3 px-6 text-right text-[#00e676]">{isJoeyMt5 ? 'STANDARD BRL' : 'BRL TOTAL'}</th>
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
                                        <td className="py-3 px-6 font-black text-white">$ {formatUSD(record.balanceUsd)}</td>
                                        <td className="py-3 px-6 text-right font-black text-[#00e676]">R$ {formatBRL(record.centsBrl)}</td>
                                        <td className={`py-3 px-6 text-right font-black ${diff >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                                             {diff > 0 ? '+' : ''}{formatBRL(diff)}
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
    const colors: Record<string, string> = { 
        default: 'text-white', 
        success: 'text-[#00e676]', 
        danger: 'text-[#ff4444]', 
        purple: 'text-[#d500f9]', 
        gold: 'text-[#ffd700]', 
        white: 'text-white', 
        black: 'text-black' 
    };

    const labelColors: Record<string, string> = {
        white: 'text-white',
        gold: 'text-[#ffd700]',
        purple: 'text-[#d500f9]',
        black: 'text-black'
    };
    
    if (variant === 'highlight') return (
        <div className="flex flex-col justify-center min-h-[90px] bg-[#00e676] border-2 border-white/20 p-4 md:p-5 shadow-[5px_5px_0px_0px_white] overflow-hidden">
            <span className={`text-[10px] sm:text-[12px] uppercase font-black ${labelColors['black'] || 'text-black'} leading-tight mb-1 tracking-wider`}>{label}</span>
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-black leading-none break-all">{value}</div>
        </div>
    );
    
    return (
        <div className="flex flex-col justify-center min-h-[90px] bg-[#111] border-2 border-white/10 p-4 md:p-5 shadow-[5px_5px_0px_0px_rgba(255,255,255,0.05)] overflow-hidden">
            <span className={`text-[10px] sm:text-[12px] uppercase font-black ${labelColors[labelColor] || 'text-white'} leading-tight mb-1 tracking-wider`}>{label}</span>
            <div className={`text-xl sm:text-2xl md:text-3xl font-black leading-none break-all ${colors[color] || 'text-white'}`}>{value}</div>
        </div>
    );
};
