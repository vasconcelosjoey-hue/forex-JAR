
import React, { useMemo } from 'react';
import { AppState, Transaction, PartnerName } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Trash2, Plus, DollarSign } from 'lucide-react';
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

  const totalAportes = useMemo(() => {
    return state.transactions
      .filter(t => t.type === 'DEPOSIT')
      .reduce((acc, t) => acc + t.amountBrl, 0);
  }, [state.transactions]);

  return (
    <div className="flex flex-col gap-6 w-full font-mono pb-12 max-w-full overflow-hidden animate-in fade-in duration-300">
      
      <div className="flex items-center gap-4 border-b-4 border-white/10 pb-5 mb-2">
        <div className="w-6 h-6 bg-[#FF6F00] shadow-[3px_3px_0px_0px_white]"></div>
        <h2 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">APORTES J.A.R.</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card title="TOTAL ACUMULADO" color="warning" className="flex flex-col justify-center">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-[#FF6F00] text-black rounded-none">
                    <DollarSign size={24} />
                </div>
                <div>
                    <p className="text-xl md:text-2xl font-black text-white leading-none">
                        R$ {totalAportes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-neutral-500 uppercase font-black tracking-[0.2em] mt-2">Volume Total Bruto</p>
                </div>
            </div>
        </Card>

        {(['JOEY', 'ALEX', 'RUBINHO'] as RoadmapPartner[]).map(partner => (
          <Card key={partner} title={`Registro: ${partner}`} color="default">
            <div className="space-y-4">
              <Input
                label="Data do Aporte"
                type="date"
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
                    className="bg-[#111] hover:bg-[#FF6F00] hover:text-black border-l-2 border-white/20 text-[#FF6F00] h-full px-5 transition-all flex items-center justify-center active:bg-[#FF6F00] active:text-black"
                  >
                    <Plus size={20} />
                  </button>
                }
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="flex flex-col p-0 border-white/20 bg-[#000]" title="Log de Transações">
         <div className="w-full overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[600px]">
                 <thead className="bg-[#111] text-[11px] uppercase text-white/40 font-black border-b-2 border-white/10">
                     <tr>
                         <th className="py-4 px-6">Data Registro</th>
                         <th className="py-4 px-6">Sócio</th>
                         <th className="py-4 px-6 text-right">Montante BRL</th>
                         <th className="py-4 px-6 text-right">Crédito Cents</th>
                         <th className="py-4 px-6 text-center w-12">...</th>
                     </tr>
                 </thead>
                 <tbody className="text-xs md:text-sm font-bold text-white font-mono">
                     {state.transactions
                        .filter(t => t.type === 'DEPOSIT')
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (
                         <tr key={t.id} className="border-b border-white/5 hover:bg-white hover:text-black transition-colors group">
                             <td className="py-4 px-6 opacity-40 group-hover:opacity-100 font-bold">
                                {new Date(t.date).toLocaleDateString('pt-BR')}
                             </td>
                             <td className="py-4 px-6 uppercase font-black">{t.partner}</td>
                             <td className="py-4 px-6 text-right text-[#FF6F00] group-hover:text-black font-black">R$ {t.amountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                             <td className="py-4 px-6 text-right opacity-40 group-hover:opacity-100 font-bold">{Math.floor(t.amountCents).toLocaleString('pt-BR')} c</td>
                             <td className="py-4 px-6 text-center">
                                 <button onClick={() => { if(confirm("Apagar registro?")) deleteTransaction(t.id); }} className="text-white/10 hover:text-[#ff4444] transition-colors p-2">
                                     <Trash2 size={16} />
                                 </button>
                             </td>
                         </tr>
                     ))}
                     {state.transactions.filter(t => t.type === 'DEPOSIT').length === 0 && (
                         <tr>
                             <td colSpan={5} className="py-12 text-center text-white/10 uppercase text-xs font-black tracking-widest italic">Sem aportes logados no sistema</td>
                         </tr>
                     )}
                 </tbody>
             </table>
         </div>
      </Card>
    </div>
  );
};
