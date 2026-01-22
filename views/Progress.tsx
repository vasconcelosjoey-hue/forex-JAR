
import React, { useState, useRef } from 'react';
import { DailyRecord } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { CustomAlert } from '../components/ui/CustomAlert';
import { Calendar, Target, Plus, ArrowUpRight, Save, Trash2, Flag, Percent, Wallet, ArrowRight, ChevronDown, ChevronUp, Camera, Share2, Copy, Check, Loader2 } from 'lucide-react';
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Sempre fechado por padrão conforme solicitado
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

  const handleCopyAsImage = async (ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current || copyStatus === 'copying') return;
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
            setTimeout(() => setCopyStatus('idle'), 3000);
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
              type: 'success'
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
    <div className="flex flex-col gap-8 md:gap-10 max-w-full font-mono pb-12 overflow-x-hidden">
       
       <CustomAlert 
          isOpen={alertConfig.isOpen} 
          onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
          onConfirm={alertConfig.onConfirm}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
       />

       <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-b-4 border-white/10 pb-8">
           <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-[#00e676] shadow-[4px_4px_0px_0px_white]"></div>
               <div className="flex flex-col">
                    <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">Painel de Progresso</h2>
                    <span className="text-sm md:text-base text-[#00e676] font-black uppercase mt-1 tracking-[0.2em]">{title}</span>
               </div>
           </div>
           
           <div className="flex gap-4 w-full sm:w-auto">
               <button 
                    onClick={() => handleCopyAsImage(snapshotRef)}
                    disabled={copyStatus === 'copying'}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-5 border-4 text-[14px] font-black uppercase tracking-widest transition-all shadow-[8px_8px_0px_0px_#00e676] active:translate-x-1 active:translate-y-1 active:shadow-none
                        ${copyStatus === 'success' ? 'bg-[#00e676] text-black border-[#00e676]' : 'bg-black text-[#00e676] border-[#00e676]'}
                    `}
               >
                   {copyStatus === 'copying' ? <Loader2 size={20} className="animate-spin" /> : (copyStatus === 'success' ? <Check size={20} /> : <Camera size={20} />)}
                   {copyStatus === 'success' ? 'COPIADO!' : 'TABELA'}
               </button>
               <button 
                    onClick={() => handleCopyAsImage(fullReportRef)}
                    disabled={copyStatus === 'copying'}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-5 border-4 text-[14px] font-black uppercase tracking-widest transition-all shadow-[8px_8px_0px_0px_white] active:translate-x-1 active:translate-y-1 active:shadow-none
                        ${copyStatus === 'success' ? 'bg-white text-black border-white' : 'bg-[#00e676] text-black border-[#00e676]'}
                    `}
               >
                   {copyStatus === 'copying' ? <Loader2 size={20} className="animate-spin" /> : (copyStatus === 'success' ? <Check size={20} /> : <Share2 size={20} />)}
                   {copyStatus === 'success' ? 'COPIADO!' : 'RELATÓRIO'}
               </button>
           </div>
       </div>

       <div ref={fullReportRef} className="flex flex-col gap-8 md:gap-10 bg-[#050505] md:p-2">
           <Card className="p-8 md:p-12" color="success">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10 items-end">
                    <Input label="Data Início" type="date" variant="success" value={startDate} onChange={(e) => onUpdate({ startDate: e.target.value })} />
                    <Input label="Capital Total (USD)" mask="currency" prefix="$" variant="success" value={startDepositUsd} onChange={(e) => onUpdate({ startDepositUsd: parseCurrency(e.target.value) })} />
                    <Input label="Novo Aporte" mask="currency" prefix="$" placeholder="0,00" variant="success" value={additionalDepositDraft || ''} onChange={(e) => onUpdate({ additionalDeposit: e.target.value })} actionButton={
                        <button onClick={handleAddToStartDeposit} className="bg-[#111] hover:bg-[#00e676] text-[#00e676] hover:text-black h-full px-6 transition-colors border-l-2 border-white/20"><Plus size={24} /></button>
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
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRegisterDay();
                            }
                        }}
                    />
                </div>
           </Card>

           <button onClick={handleRegisterDay} className="w-full bg-[#00e676] text-black font-black uppercase py-8 text-2xl shadow-[10px_10px_0px_0px_white] active:translate-x-1 active:translate-y-1 active:shadow-none flex items-center justify-center gap-6 transition-all hover:bg-white border-4 border-black group">
               <Save size={36} className="group-hover:scale-110 transition-transform" /> REGISTRAR SNAPSHOT (ENTER)
           </button>

           <div className="relative border-4 border-white bg-black p-12 md:p-16 flex flex-col justify-center shadow-[16px_16px_0px_0px_#00e676]">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-14 md:gap-20">
                    <div className="flex-shrink-0 text-center md:text-left border-b-8 md:border-b-0 md:border-r-8 border-white/20 pb-12 md:pb-0 md:pr-20 w-full md:w-auto">
                         <div className="text-xl md:text-3xl uppercase font-black text-white tracking-[0.4em] mb-8 md:mb-10 flex items-center justify-center md:justify-start gap-6">
                            <Target size={36} className="text-[#00e676]" />
                            OBJETIVO FINAL: 1 MILHÃO
                         </div>
                         <div className="text-6xl md:text-9xl font-black text-white tracking-tighter font-sans break-all leading-none">
                            <span className="text-[#00e676] text-4xl md:text-7xl align-top mr-4 md:mr-6 font-mono">$</span>
                            {currentBalanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </div>
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-10 mb-10">
                            <span className="text-7xl md:text-[10rem] font-black text-[#00e676] font-sans leading-none">{goalProgress.toFixed(1)}%</span>
                            <div className="bg-white/10 px-8 py-6 border-4 border-white/20 text-center sm:text-right shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)]">
                                <p className="text-[14px] font-black text-white/60 uppercase tracking-[0.3em] mb-2">Objetivo Restante</p>
                                <p className="text-2xl md:text-4xl font-black text-[#00e676] uppercase tracking-wider">$ {remaining.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                        <div className="h-12 md:h-16 bg-[#111] border-4 border-white relative shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] overflow-hidden">
                            <div className="h-full bg-[#00e676] transition-all duration-1000 shadow-[inset_-10px_0px_10px_rgba(0,0,0,0.2)]" style={{ width: `${goalProgress}%` }}></div>
                        </div>
                    </div>
                </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
                <StatsCard label="Dias Operação" value={daysElapsed.toString()} icon={<Calendar size={32} />} color="success" />
                <StatsCard label="Patrimônio %" value={`${growthPercentage.toFixed(2)}%`} color={growthPercentage >= 0 ? 'success' : 'danger'} icon={<ArrowUpRight size={32} />} />
                <StatsCard label="Média Diária %" value={`${dailyYieldPercent.toFixed(2)}%`} color="gold" icon={<Percent size={32} />} />
                <StatsCard label="LUCRO USD" value={`$ ${standardUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color={standardUsd >= 0 ? 'success' : 'danger'} />
                <StatsCard label="LUCRO BRL STANDARD" value={`R$ ${standardBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="black" variant="highlight" />
                <StatsCard label="Cents Totais" value={`${profitCentsRaw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subValue="c" color="success" />
                <StatsCard label="LUCRO CENT BRL" value={`R$ ${currentCentsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="black" variant="highlight" />
                <StatsCard label="Média BRL" value={`R$ ${dailyAvgBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} color="purple" />
           </div>
       </div>

       <div ref={snapshotRef} className="border-8 border-[#00e676] bg-[#000] mt-16">
           <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex items-center justify-between px-10 py-10 bg-[#111] transition-colors hover:bg-white/5 border-b-8 border-[#00e676]/20 group">
               <div className="flex flex-col items-start gap-4">
                   <h3 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter group-hover:text-[#00e676] transition-colors">EVOLUÇÃO DIÁRIA</h3>
                   <span className="text-[16px] text-[#00e676] font-black uppercase bg-[#00e676]/10 px-6 py-2 border-2 border-[#00e676]/30">{dailyHistory?.length || 0} REGISTROS CONECTADOS</span>
               </div>
               <div className="text-[#00e676]">{isHistoryOpen ? <ChevronUp size={64} /> : <ChevronDown size={64} />}</div>
           </button>

           {isHistoryOpen && (
               <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse min-w-[1000px]">
                       <thead className="bg-[#050505] text-[16px] md:text-lg uppercase text-white font-black border-b-8 border-white/10">
                           <tr>
                               <th className="py-10 px-10">Data</th>
                               <th className="py-10 px-10">Saldo (USD)</th>
                               <th className="py-10 px-10">Rate</th>
                               <th className="py-10 px-10 text-right text-[#00e676]">LUCRO CENT BRL</th>
                               <th className="py-10 px-10 text-right">Resultado</th>
                               <th className="py-10 px-8 w-24 text-center">Ação</th>
                           </tr>
                       </thead>
                       <tbody className="text-[16px] md:text-lg font-mono text-white">
                           {(dailyHistory || []).map((record, index, arr) => {
                               const prevRecord = arr[index + 1];
                               const isFirstRecord = index === arr.length - 1;
                               const dayResult = isFirstRecord ? record.centsBrl : record.centsBrl - (prevRecord?.centsBrl || 0);

                               return (
                                   <tr key={record.date} className="border-b-4 border-white/5 hover:bg-[#111] transition-colors">
                                       <td className="py-10 px-10 font-black">{formatDateDisplay(record.date)}</td>
                                       <td className="py-10 px-10 font-black text-xl">$ {record.balanceUsd.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                       <td className="py-10 px-10 opacity-60 font-black tracking-widest">{record.rate.toFixed(4)}</td>
                                       <td className="py-10 px-10 text-right font-black text-[#00e676] text-2xl">R$ {record.centsBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                       <td className={`py-10 px-10 text-right font-black text-2xl ${dayResult >= 0 ? 'text-[#00e676]' : 'text-[#ff4444]'}`}>
                                            {dayResult > 0 ? '+' : ''}{dayResult.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                       </td>
                                       <td className="py-10 px-8 text-center">
                                           <button onClick={() => deleteRecord(record.date)} className="text-white/20 hover:text-[#ff4444] transition-all p-4 hover:bg-[#ff4444]/10 border-2 border-transparent hover:border-[#ff4444]"><Trash2 size={32} /></button>
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
            <Card className="flex flex-col justify-center min-h-[200px] !bg-[#00e676] !border-[#00e676] shadow-[12px_12px_0px_0px_white] transition-all hover:scale-[1.03] border-4">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-lg md:text-2xl uppercase font-black tracking-[0.2em] text-black leading-tight border-b-4 border-black/20 pb-2">{label}</span>
                    <div className="text-black/40">{icon}</div>
                </div>
                <div className="text-4xl md:text-6xl font-black tracking-tighter leading-none break-all text-black">
                    {value} <span className="text-[18px] opacity-70 text-black ml-2 font-mono font-bold tracking-widest">{subValue}</span>
                </div>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col justify-center min-h-[200px] border-8 border-white/10 hover:border-white/30 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-6">
                <span className="text-lg md:text-2xl uppercase font-black tracking-[0.2em] text-white/60 leading-tight border-b-4 border-white/10 pb-2">{label}</span>
                <div className="text-white/20">{icon}</div>
            </div>
            <div className="text-4xl md:text-6xl font-black tracking-tighter leading-none break-all" style={{ color: colors[color] || '#fff' }}>
                {value} <span className="text-[18px] opacity-40 text-white ml-2 font-mono font-bold tracking-widest">{subValue}</span>
            </div>
        </Card>
    );
};
