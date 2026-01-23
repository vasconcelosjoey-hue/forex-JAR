
import React from 'react';
import { AppState, Transaction, PartnerName } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Trash2, Plus, Calendar } from 'lucide-react';
import { parseCurrency } from '../utils/format';

type RoadmapPartner = 'JOEY' | 'ALEX' | 'RUBINHO';

interface RoadmapProps {
  state: AppState;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  deleteTransaction: (id: string) => void;
  updateState: (updates: Partial<AppState>) => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ state, addTransaction, deleteTransaction, updateState }) => {
  
  const handleInputChange = (partner: RoadmapPartner, field: 'amount' | 'date', value: string) => {
    const draftKey = field === 'amount' ? partner : `${partner}_DATE`;
    updateState({
        drafts: {
            ...state.drafts,
            roadmap: {
                ...state.drafts.roadmap,
                [draftKey]: value
            }
        }
    });
  };

  const handleDeposit = (partner: RoadmapPartner) => {
    const amountBrl = parseCurrency(state.drafts.roadmap[partner]);
    const depositDate = state.drafts.roadmap[`${partner}_DATE` as keyof typeof state.drafts.roadmap] || new Date().toISOString().split('T')[0];
    
    if (!amountBrl || isNaN(amountBrl) || amountBrl <= 0) return;
    
    const amountCents = (amountBrl / state.dollarRate) * 100;
    
    addTransaction({
      type: 'DEPOSIT',
      partner,
      amountBrl,
      amountCents,
      rateSnapshot: state.dollarRate,
      date: depositDate
    });

    handleInputChange(partner, 'amount', '');
  };

  return (
    <div className="flex flex-col gap-4 w-full font-mono pb-8 max-w-full overflow-hidden animate-in fade-in duration-300">
      
      <div className="flex items-center gap-3 border-b-2 border-white/10 pb-3 mb-2">
        <div className="w-5 h-5 bg-[#FF6F00] shadow-[2px_2px_0px_0px_white]"></div>
        <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter">Roadmap de Aportes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['JOEY', 'ALEX', 'RUBINHO'] as RoadmapPartner[]).map(partner => (
          <Card key={partner} title={`Registro: ${partner}`} color="default">
            <div className="space-y-3">
              <Input
                label="Data do Aporte"
                type="date"
                className="text-[11px]"
                value={state.drafts.roadmap[`${partner}_DATE` as keyof typeof state.drafts.roadmap]}
                onChange={(e) => handleInputChange(partner, 'date', e.target.value)}
              />
              <Input
                label="Valor (R$)"
                prefix="R$"
                mask="currency"
                value={state.drafts.roadmap[partner]}
                onChange={(e) => handleInputChange(partner, 'amount', e.target.value)}
                placeholder="0,00"
                actionButton={
                  <button 
                    onClick={() => handleDeposit(partner)} 
                    className="bg-[#111] hover:bg-[#FF6F00] hover:text-black border-l border-white/20 text-[#FF6F00] h-full px-4 transition-colors flex items-center justify-center"
                  >
                    <Plus size={16} />
                  </button>
                }
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col p-0 border-white/20 bg-[#000]" title="Log de Transações">
         <div className="w-full overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[500px]">
                 <thead className="bg-[#111] text-[9px] uppercase text-white/40 font-black border-b border-white/10">
                     <tr>
                         <th className="py-2.5 px-4">Data</th>
                         <th className="py-2.5 px-4">Sócio</th>
                         <th className="py-2.5 px-4 text-right">Montante BRL</th>
                         <th className="py-2.5 px-4 text-right">Crédito Cents</th>
                         <th className="py-2.5 px-4 text-center w-10">...</th>
                     </tr>
                 </thead>
                 <tbody className="text-[10px] md:text-[11px] font-bold text-white font-mono">
                     {state.transactions
                        .filter(t => t.type === 'DEPOSIT')
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (
                         <tr key={t.id} className="border-b border-white/5 hover:bg-white hover:text-black transition-colors group">
                             <td className="py-2 px-4 opacity-40 group-hover:opacity-100">
                                {new Date(t.date).toLocaleDateString('pt-BR')}
                             </td>
                             <td className="py-2 px-4 uppercase">{t.partner}</td>
                             <td className="py-2 px-4 text-right text-[#FF6F00] group-hover:text-black">R$ {t.amountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                             <td className="py-2 px-4 text-right opacity-40 group-hover:opacity-100">{Math.floor(t.amountCents).toLocaleString('pt-BR')} c</td>
                             <td className="py-2 px-4 text-center">
                                 <button onClick={() => { if(confirm("Apagar registro?")) deleteTransaction(t.id); }} className="text-white/10 hover:text-[#ff4444] transition-colors">
                                     <Trash2 size={12} />
                                 </button>
                             </td>
                         </tr>
                     ))}
                     {state.transactions.filter(t => t.type === 'DEPOSIT').length === 0 && (
                         <tr>
                             <td colSpan={5} className="py-8 text-center text-white/10 uppercase text-[9px] font-black tracking-widest italic">Sem aportes logados</td>
                         </tr>
                     )}
                 </tbody>
             </table>
         </div>
      </Card>
    </div>
  );
};
