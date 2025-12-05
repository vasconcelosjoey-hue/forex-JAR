import React from 'react';
import { AppState, Transaction, PartnerName } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Check, Trash2, Square } from 'lucide-react';
import { CHECKPOINTS } from '../constants';
import { parseCurrency } from '../utils/format';

interface RoadmapProps {
  state: AppState;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  deleteTransaction: (id: string) => void;
  updateState: (updates: Partial<AppState>) => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ state, addTransaction, deleteTransaction, updateState }) => {
  
  const handleInputChange = (partner: string, value: string) => {
    updateState({
        drafts: {
            ...state.drafts,
            roadmap: {
                ...state.drafts.roadmap,
                [partner]: value
            }
        }
    });
  };

  const handleDeposit = (partner: PartnerName) => {
    const amountBrl = parseCurrency(state.drafts.roadmap[partner]);
    if (!amountBrl || isNaN(amountBrl) || amountBrl <= 0) return;

    const amountCents = (amountBrl / state.dollarRate) * 100;

    addTransaction({
      type: 'DEPOSIT',
      partner,
      amountBrl,
      amountCents,
      rateSnapshot: state.dollarRate,
      date: new Date().toISOString()
    });

    handleInputChange(partner, '');
  };

  const handleKeyDown = (e: React.KeyboardEvent, partner: PartnerName) => {
    if (e.key === 'Enter') handleDeposit(partner);
  };

  const totalBrlDeposited = state.transactions
    .filter(t => t.type === 'DEPOSIT' && t.partner !== 'TAX')
    .reduce((acc, t) => acc + t.amountBrl, 0);

  const getPartnerTotals = (partner: PartnerName) => {
    const deposits = state.transactions.filter(t => t.partner === partner && t.type === 'DEPOSIT');
    const cents = deposits.reduce((acc, t) => acc + t.amountCents, 0);
    const brl = deposits.reduce((acc, t) => acc + t.amountBrl, 0);
    return { cents, brl };
  };

  const finalGoal = 55000;
  const progressPercentage = Math.min((totalBrlDeposited / finalGoal) * 100, 100);
  const themeColor = '#FF6F00'; // Orange Theme

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-5rem)] overflow-hidden font-mono">
      
      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-shrink-0">
          
          {/* Total Stat */}
          <Card className="lg:col-span-4 relative flex flex-col justify-center bg-[#000] border-[#FF6F00]">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase text-neutral-500 font-bold tracking-widest">Total Aportado</span>
                  
                  <div className="flex items-center gap-2 border border-[#FF6F00] px-2 py-0.5 bg-[#FF6F00]/10">
                      <span className={`text-xs font-bold text-[#FF6F00]`}>
                        {progressPercentage.toFixed(2)}%
                      </span>
                  </div>
              </div>
               <div className="text-4xl lg:text-5xl font-black text-white tracking-tighter">
                  <span className="text-lg text-neutral-600 mr-2">R$</span>
                  {totalBrlDeposited.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="mt-4 pt-2 border-t border-dashed border-white/20 text-right text-[10px] font-bold text-neutral-500 uppercase">
                  Meta: R$ 55.000,00
              </div>
          </Card>

          {/* Quick Input */}
          <Card className="lg:col-span-8 flex flex-col justify-center">
            <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-[#FF6F00]"></div>
                Registrar Aporte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(['JOEY', 'ALEX', 'RUBINHO'] as PartnerName[]).map(partner => (
                <Input
                  key={partner}
                  label={partner}
                  prefix="R$"
                  mask="currency"
                  variant="default" // Orange Default
                  value={state.drafts.roadmap[partner]}
                  onChange={(e) => handleInputChange(partner, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, partner)}
                  placeholder="0,00"
                  className="w-full"
                  actionButton={
                    <button 
                      onClick={() => handleDeposit(partner)}
                      className="bg-[#111] hover:bg-[#FF6F00] hover:text-black border-l-2 border-white/20 text-neutral-400 h-full px-4 transition-colors flex items-center justify-center rounded-none"
                    >
                      <Check size={16} />
                    </button>
                  }
                />
              ))}
            </div>
          </Card>
      </div>

      {/* Timeline Section */}
      <div className="bg-[#000] border-2 border-white/20 p-8 flex-shrink-0 shadow-[4px_4px_0px_0px_white]">
        <div className="relative w-full h-16 flex items-center">
          <div className="absolute top-1/2 left-0 right-0 h-4 bg-[#111] -translate-y-1/2 border border-white/10"></div>
          
          <div 
            className="absolute top-1/2 left-0 h-4 bg-[#FF6F00] -translate-y-1/2 transition-all duration-1000 border-r-2 border-white"
            style={{ width: `${progressPercentage}%` }}
          ></div>

          <div className="absolute top-0 left-0 right-0 flex justify-between h-full w-full pointer-events-none">
            {CHECKPOINTS.map((cp, idx) => {
               const reached = totalBrlDeposited >= cp.value;
               const isFinal = cp.value === finalGoal;
               return (
                <div key={cp.label} className="flex flex-col items-center justify-center relative z-10 w-10">
                    <div 
                        className={`
                            w-4 h-4 border-2 transition-all duration-0 mb-8 transform rotate-45
                            ${reached 
                                ? (isFinal ? 'bg-white border-white' : 'bg-[#FF6F00] border-white') 
                                : 'bg-[#000] border-neutral-700'
                            }
                        `}
                    ></div>
                    <span className={`absolute bottom-0 text-[10px] font-bold bg-black px-1 border border-white/10 ${reached ? 'text-[#FF6F00]' : 'text-neutral-600'}`}>
                        {cp.label}
                    </span>
                </div>
               );
            })}
          </div>
        </div>
      </div>

      {/* Partner Mini Stats */}
      <div className="grid grid-cols-3 gap-6 flex-shrink-0">
         {(['JOEY', 'ALEX', 'RUBINHO'] as PartnerName[]).map(partner => {
             const { brl } = getPartnerTotals(partner);
             return (
                 <div key={partner} className="bg-[#000] border-2 border-white/20 p-4 relative group hover:border-[#FF6F00] transition-colors">
                     <div className="absolute top-0 left-0 w-2 h-full bg-[#FF6F00] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                     <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 pl-2">{partner}</h3>
                     <p className="text-xl md:text-2xl font-black text-white pl-2">R$ {brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                 </div>
             )
         })}
      </div>

      {/* History */}
      <Card className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden border-white/20 bg-[#000]" title="">
         <div className="px-6 py-4 border-b-2 border-white/20 bg-[#111] flex justify-between items-center">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Square size={10} className="fill-[#FF6F00] stroke-none" />
                Histórico
            </h3>
            <span className="text-[10px] text-black bg-white px-2 py-1 font-bold uppercase">Scroll Down</span>
         </div>
         <div className="flex-1 overflow-y-auto">
             <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-[#000] text-[10px] uppercase text-neutral-500 font-bold z-10 border-b-2 border-white/20">
                     <tr>
                         <th className="py-3 px-6 border-r border-white/10">Data</th>
                         <th className="py-3 px-6 border-r border-white/10">Sócio</th>
                         <th className="py-3 px-6 text-right border-r border-white/10">Valor R$</th>
                         <th className="py-3 px-4 text-center w-10">...</th>
                     </tr>
                 </thead>
                 <tbody className="text-sm font-medium text-neutral-300 font-mono">
                     {state.transactions
                        .filter(t => t.type === 'DEPOSIT')
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (
                         <tr key={t.id} className="border-b border-white/10 hover:bg-white hover:text-black transition-colors group">
                             <td className="py-3 px-6 text-xs text-neutral-500 group-hover:text-black border-r border-white/10 group-hover:border-black/10">
                                 {new Date(t.date).toLocaleDateString('pt-BR')}
                             </td>
                             <td className="py-3 px-6 font-bold text-xs border-r border-white/10 group-hover:border-black/10">{t.partner}</td>
                             <td className="py-3 px-6 text-right text-[#FF6F00] group-hover:text-black font-bold border-r border-white/10 group-hover:border-black/10">R$ {t.amountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                             <td className="py-3 px-4 text-center">
                                 <button 
                                    onClick={() => deleteTransaction(t.id)}
                                    className="text-neutral-600 hover:text-[#ff4444] transition-colors p-1"
                                 >
                                     <Trash2 size={14} />
                                 </button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
         </div>
      </Card>
    </div>
  );
};