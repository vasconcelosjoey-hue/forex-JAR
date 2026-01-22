
import React, { useState, useRef } from 'react';
import { DailyRecord } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CustomAlert } from '../components/ui/CustomAlert';
import { Calendar, Target, Plus, ArrowUpRight, Save, Trash2, Flag, Percent, Wallet, ArrowRight, ChevronDown, ChevronUp, Camera, Share2, Copy, Check } from 'lucide-react';
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Fechado por padrão
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success'>('idle');
  const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean; title: string; message: string; type: 'confirm' | 'alert'; onConfirm?: () => void }>({
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
  const growthPercentage = startDepositUsd > 0 
    ? (totalGrowthUsd / startDepositUsd) * 100 
    : 0;
  
  const dailyYieldPercent = growthPercentage / mathDays;
  const standardUsd = totalGrowthUsd;
  const standardBrl = standardUsd * dollarRate;
  
  const calculateCentsBrl = (balanceUsd: number, rate: number) => {
    const profitRaw = balanceUsd - startDepositUsd;
    const valRealUsd = profitRaw / 100;
    return valRealUsd * rate;
  };

  const currentCentsBrl = calculateCentsBrl(currentBalanceUsd, dollarRate);
  const profitCentsRaw = totalGrowthUsd; 
  const dailyAvgBrl = currentCentsBrl / mathDays;

  const goal = 1000000;
  const goalProgress = Math.min((currentBalanceUsd / goal) * 100, 100);
  const remaining = goal - currentBalanceUsd;

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
    return `${day}/${month}/${year}`;
  };

  const handleRegisterDay = () => {
      const existingIndex = (dailyHistory || []).findIndex(r => r.date === currentDate);
      
      const proceed = () => {
          const balanceSnapshot = currentBalanceUsd;
          const rateSnapshot = dollarRate;
          const investedSnapshot = startDepositUsd;
          const scoreSnapshot = calculateCentsBrl(balanceSnapshot, rateSnapshot);

          const newRecord: DailyRecord = {
              date: currentDate,
              balanceUsd: balanceSnapshot,
              rate: rateSnapshot,
              centsBrl: scoreSnapshot,
              investedUsd: investedSnapshot
          };

          let newHistory = [...(dailyHistory || [])];
          if (existingIndex >= 0) {
              newHistory[existingIndex] = newRecord;
          } else {
              newHistory.push(newRecord);
          }

          newHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          onUpdate({ dailyHistory: newHistory });
          
          setAlertConfig({
              isOpen: true,
              title: "SUCESSO",
              message: "Snapshot registrado com sucesso.",
              type: 'alert'
          });
      };

      if (existingIndex >= 0) {
          setAlertConfig({
              isOpen: true,
              title: "CONFIRMAÇÃO",
              message: `Já existe um registro para a data ${formatDateDisplay(currentDate)}. Deseja substituir os dados atuais?`,
              type: 'confirm',
              onConfirm: proceed
          });
      } else {
          proceed();
      }
  };

  const deleteRecord = (dateToDelete: string) => {
      setAlertConfig({
          isOpen: true,
          title: "APAGAR REGISTRO",
          message: "Tem certeza que deseja remover este snapshot permanentemente?",
          type: 'confirm',
          onConfirm: () => {
              const currentHistory = dailyHistory || [];
              const newHistory = currentHistory.filter(r => r.date !== dateToDelete);
              onUpdate({ dailyHistory: newHistory });
          }
      });
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 max-w-full font-mono pb-12 overflow-x-hidden">
       
       <CustomAlert 
          isOpen={alertConfig.isOpen} 
          onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={alertConfig.onConfirm}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
       />

       <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b-2 border-white/10 pb-4">
           <div className="flex items-center gap-2">
               <div className="w-5 h-5 bg-[#00e676]"></div>
               <div className="flex flex-col">
                    <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-widest leading-none">Painel de Progresso</h2>
                    <span className="text-[11px] text-[#00e676] font-black uppercase mt-1 tracking-widest">{title}</span>
               </div>
           </div>
           
           <div className="flex gap-2 w-full sm:w-auto">
               <button 
                    onClick={() => handleCopyAsImage(snapshotRef, 'snapshot')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-3 border-2 text-[10px] font-black uppercase tracking-tighter transition-all bg-black text-[#00e676] border-[#00e676] shadow-[4px_4px_0px_0px_#00e676] active:translate-x-1 active:translate-y-1 active:shadow-none"
               >
                   {copyStatus === 'success' ? <Check size={12} /> : <Camera size={12} />}
                   TABELA
               </button>
               <button 
                    onClick={() => handleCopyAsImage(fullReportRef, 'report')}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-3 border-2 text-[10px] font-black uppercase tracking-tighter transition-all bg-[#00e676] text-black border-[#00e676] shadow-[4px_4px_0px_0px_white] active:translate-x-1 active:translate-y-1 active:shadow-none"
               >
                   <Share2 size={12} />
                   RELATÓRIO
               </button>
           </div>
       </div>

       <div ref={fullReportRef} className="flex flex-col gap-4 md:gap-6 bg-[#050505] md:p-2">
           <Card className="p-4 md:p-6" color="success">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 items-end">
                    <Input label="Data Início" type="date" variant="success" value={startDate} onChange={(e) => onUpdate({ startDate: e.target.value })} />
                    <Input label="Capital Total (USD)" mask="currency" prefix="$" variant="success" value={startDepositUsd} onChange={(e) => onUpdate({ startDepositUsd: parseCurrency(e.target.value) })} />
                    <Input label="Novo Aporte" mask="currency" prefix="$" placeholder="0,00" variant="success" value={additionalDepositDraft || ''} onChange={(e) => onUpdate({ additionalDeposit: e.target.value })} actionButton={
                        <button onClick={handleAddToStartDeposit} className="bg-[#111] hover:bg-[#00e676] text-[#00e676] hover:text-black h-full px-4 transition-colors"><Plus size={16} /></button>
                    }/>
                    <Input label="Data Hoje" type="date" variant="success" value={currentDate} onChange={(e) => onUpdate({ currentDate: e.target.value })} />
                    <Input 
                        label="Saldo Hoje (USD)" 
                        mask="currency" 
                        prefix="$" 
                        variant="success" 
                        className="text-[#00e676]" 
                        value={currentBalanceUsd} 
                        onChange={(e) => onUpdate({ currentBalanceUsd: parseCurrency(e.target.value) })} 
                        onKeyDown={(e) => e.key === 'Enter' && handleRegisterDay()}
                    />
                </div>
           </Card>

           <button onClick={handleRegisterDay} className="w-full bg-[#00e676] text-black font-black uppercase py-4 shadow-[4px_4px_0px_0px_white] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-3 transition-all">
               <Save size={20} /> REGISTRAR SNAPSHOT
           </button>

           <div className="relative border-4 border-white bg-black p-6 md:p-10 flex flex-col justify-center shadow-[8px_8px_0px_0px_#00e676]">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="flex-shrink-0 text-center md:text-left border-b-2 md:border-b-0 md:border-r-2 border-white/20 pb-6 md:pb-0 md:pr-12 w-full md:w-auto">
                         <div className="text-xs md:text-lg uppercase font-black text-white tracking-[0.2em] mb-2 md:mb-4 flex items-center justify-center md:justify-start gap-3">
                            <Target size={18} className="text-[#00e676]" />
                            OBJETIVO FINAL: 1 MILHÃO
                         </div>
                         <div className="text-3xl md:text-7xl font-black text-white tracking-tighter font-sans break-all">
                            <span className="text-[#00e676] text-xl md:text-4xl align-top mr-1 md:mr-3 font-mono">$</span>
                            {currentBalanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 mb-4">
                            <span className="text-4xl md:text-6xl font-black text-[#00e676] font-sans">{goalProgress.toFixed(1)}%</span>
                            <div className="bg-white/10 px-3 py-2 border border-white/20 text-center sm:text-right">
                                <p className="text-[10px] font-black text-white/60 uppercase">Objetivo Restante</p>
                                <p className="text-xs md:text-sm font-black text-[#00e676] uppercase tracking-wider">$ {remaining.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                        <div className="h-6 md:h-8 bg-[#111] border-2 border-white relative">
                            <div className="h-full bg-[#00e676] transition-all duration-1000" style={{ width: `${goalProgress}%` }}></div>
                        </div>
                    </div>
                </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatsCard label="Dias Operação" value={daysElapsed.toString()} icon={<Calendar size={18} />} color="success" />
                <StatsCard label="Patrimônio %" value={`${growthPercentage.toFixed(2)}%`} color={growthPercentage >= 0 ? 'success' : 'danger'} icon={<ArrowUpRight size={18} />} />
                <StatsCard label="Média Diária %" value={`${dailyYieldPercent.toFixed(2)}%`} color="gold" icon={<Percent size={18} />} />
                <StatsCard label="LUCRO USD" value={`$ ${standardUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color={standardUsd >= 0 ? 'success' : 'danger'} />
                <StatsCard label="LUCRO BRL STANDARD" value={`R$ ${standardBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="black" variant="highlight" />
                <StatsCard label="Cents Totais" value={`${profitCentsRaw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subValue="c" color="success" />
                <StatsCard label="LUCRO CENT BRL" value={`R$ ${currentCentsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="black" variant="highlight" />
                <StatsCard label="Média BRL" value={`R$ ${dailyAvgBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="purple" />
           </div>
       </div>

       <div ref={snapshotRef} className="border-2 border-[#00e676] bg-[#000] mt-4">
           <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between px-4 py-4 bg-[#111] transition-colors hover:bg-white/5">
               <div className="flex flex-col items-start gap-1">
                   <h3 className="text-sm md:text-base font-black text-white uppercase tracking-widest">EVOLUÇÃO DIÁRIA</h3>
                   <span className="text-[10px] text-[#00e676] font-black uppercase bg-[#00e676]/10 px-2 py-0.5">{dailyHistory?.length || 0} REGISTROS</span>
               </div>
               <div className="text-[#00e676]">{isHistoryOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
           </button>

           {isHistoryOpen && (
               <div className="overflow-x-auto border-t-2 border-[#00e676]/20">
                   <table className="w-full text-left border-collapse min-w-[600px]">
                       <thead className="bg-[#050505] text-[10px] md:text-xs uppercase text-white font-black border-b-2 border-white/10">
                           <tr>
                               <th className="py-4 px-4">Data</th>
                               <th className="py-4 px-4">Saldo (USD)</th>
                               <th className="py-4 px-4">Rate</th>
                               <th className="py-4 px-4 text-right text-[#00e676]">LUCRO CENT BRL</th>
                               <th className="py-4 px-4 text-right">Resultado</th>
                               <th className="py-4 px-2 w-10"></th>
                           </tr>
                       </thead>
                       <tbody className="text-[10px] md:text-xs font-mono text-white">
                           {(dailyHistory || []).map((record, index, arr) => {
                               const prevRecord = arr[index + 1];
                               const isFirstRecord = index === arr.length - 1;
                               const dayResult = isFirstRecord ? record.centsBrl : record.centsBrl - (prevRecord?.centsBrl || 0);

                               return (
                                   <tr key={record.date} className="border-b border-white/5 hover:bg-[#111]">
                                       <td className="py-4 px-4 font-black">{formatDateDisplay(record.date)}</td>
                                       <td className="py-4 px-4">$ {record.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                       <td className="py-4 px-4 opacity-60">{record.rate.toFixed(2)}</td>
                                       <td className="py-4 px-4 text-right font-black text-[#00e676]">R$ {record.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                       <td className={`py-4 px-4 text-right font-black ${dayResult >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                                            {dayResult > 0 ? '+' : ''}{dayResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                       </td>
                                       <td className="py-4 px-2">
                                           <button onClick={() => deleteRecord(record.date)} className="text-white/20 hover:text-white"><Trash2 size={14} /></button>
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

const StatsCard = ({ label, value, subValue, icon, color = 'default', variant = 'default' }: any) => {
    const colors: any = { default: 'text-white', success: 'text-[#00e676]', danger: 'text-[#ff4444]', purple: 'text-[#d500f9]', gold: 'text-[#ffd700]', white: 'text-white', black: 'text-black' };
    
    if (variant === 'highlight') {
        return (
            <Card className="flex flex-col justify-center min-h-[110px] !bg-[#00e676] !border-[#00e676] shadow-[4px_4px_0px_0px_white] transition-all hover:scale-[1.02]">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] md:text-sm uppercase font-black tracking-widest text-black/90 leading-tight">{label}</span>
                    <div className="text-black/30">{icon}</div>
                </div>
                <div className="text-2xl md:text-3xl font-black tracking-tighter leading-none break-all text-black">
                    {value} <span className="text-[10px] opacity-60 text-black ml-1">{subValue}</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col justify-center min-h-[110px]">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] md:text-sm uppercase font-black tracking-widest text-white/60 leading-tight">{label}</span>
                <div className="text-white/20">{icon}</div>
            </div>
            <div className="text-2xl md:text-3xl font-black tracking-tighter leading-none break-all" style={{ color: colors[color] || '#fff' }}>
                {value} <span className="text-[10px] opacity-40 text-white ml-1">{subValue}</span>
            </div>
        </Card>
    );
};
