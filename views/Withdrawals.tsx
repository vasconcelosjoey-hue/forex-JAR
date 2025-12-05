import React from 'react';
import { AppState, Transaction, PartnerName } from '../types';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ArrowDownCircle, Trash2, AlertTriangle } from 'lucide-react';
import { parseCurrency } from '../utils/format';

interface WithdrawalsProps {
  state: AppState;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;
  deleteTransaction: (id: string) => void;
  updateState: (updates: Partial<AppState>) => void;
}

export const Withdrawals: React.FC<WithdrawalsProps> = ({ state, addTransaction, deleteTransaction, updateState }) => {
  const updateWithdrawalDraft = (field: keyof AppState['drafts']['withdrawals'], value: string) => {
      updateState({
          drafts: {
              ...state.drafts,
              withdrawals: {
                  ...state.drafts.withdrawals,
                  [field]: value
              }
          }
      });
  };

  const { calcAmount, calcIrpf, calcPeople, regJoey, regAlex, regRubinho, regTax } = state.drafts.withdrawals;

  const amountVal = parseCurrency(calcAmount);
  const irpfVal = parseFloat(calcIrpf) || 0;
  const peopleVal = parseInt(calcPeople) || 1;

  const taxAmount = (amountVal * irpfVal) / 100;
  const netAmount = amountVal - taxAmount;
  const perPerson = peopleVal > 0 ? netAmount / peopleVal : 0;
  
  const centsToDebit = (amountVal / state.dollarRate) * 100;

  const handleRegisterWithdrawal = () => {
    const payload = [
        { name: 'JOEY', val: parseCurrency(regJoey) },
        { name: 'ALEX', val: parseCurrency(regAlex) },
        { name: 'RUBINHO', val: parseCurrency(regRubinho) },
        { name: 'TAX', val: parseCurrency(regTax) }
    ];

    let hasEntry = false;

    payload.forEach(p => {
        if (p.val > 0) {
            hasEntry = true;
            const centsVal = (p.val / state.dollarRate) * 100;
            addTransaction({
                type: 'WITHDRAWAL',
                partner: p.name as PartnerName,
                amountBrl: p.val,
                amountCents: centsVal,
                rateSnapshot: state.dollarRate,
                date: new Date().toISOString()
            });
        }
    });

    if (hasEntry) {
        updateState({
            drafts: {
                ...state.drafts,
                withdrawals: {
                    ...state.drafts.withdrawals,
                    regJoey: '',
                    regAlex: '',
                    regRubinho: '',
                    regTax: ''
                }
            }
        });
    }
  };

  const getPartnerWithdrawn = (partner: PartnerName) => {
      return state.transactions
        .filter(t => t.type === 'WITHDRAWAL' && t.partner === partner)
        .reduce((acc, t) => acc + t.amountBrl, 0);
  };

  const themeColor = '#ffd700'; // Yellow Theme

  return (
    <div className="space-y-8 font-mono">
      
      {/* Yellow Calculator Section */}
      <Card title="CALCULADORA DE RETIRADA" color="warning">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Input 
                label="Valor Bruto (R$)" 
                prefix="R$"
                mask="currency"
                value={calcAmount}
                onChange={(e) => updateWithdrawalDraft('calcAmount', e.target.value)}
                variant="warning"
            />
            <Input 
                label="IRPF (%)" 
                suffix="%"
                type="number"
                value={calcIrpf}
                onChange={(e) => updateWithdrawalDraft('calcIrpf', e.target.value)}
                variant="warning"
            />
             <Input 
                label="Pessoas" 
                type="number"
                value={calcPeople}
                onChange={(e) => updateWithdrawalDraft('calcPeople', e.target.value)}
                variant="warning"
            />
         </div>
         
         {/* Results */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-[#ffd700] bg-[#ffd700]/10">
             <div className="text-center p-4 border-r-2 border-[#ffd700]/50">
                 <p className="text-[10px] text-[#ffd700] uppercase font-bold mb-1">Imposto</p>
                 <p className="text-xl font-bold text-white">R$ {taxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
             </div>
             <div className="text-center p-4 border-r-2 border-[#ffd700]/50">
                 <p className="text-[10px] text-white uppercase font-bold mb-1">Líquido</p>
                 <p className="text-xl font-black text-white">R$ {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
             </div>
             <div className="text-center p-4 border-r-2 border-[#ffd700]/50">
                 <p className="text-[10px] text-[#ffd700] uppercase font-bold mb-1">Por Pessoa</p>
                 <p className="text-xl font-black text-white">R$ {perPerson.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
             </div>
             <div className="text-center p-4 bg-[#ffd700] text-black">
                 <p className="text-[10px] uppercase font-bold mb-1 border-b border-black/20 pb-1">Débito Wallet</p>
                 <p className="text-lg font-mono font-bold">-{Math.floor(centsToDebit).toLocaleString('pt-BR')} c</p>
             </div>
         </div>
      </Card>

      {/* Registration Section */}
      <Card title="REGISTRAR SAQUE">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {(['JOEY', 'ALEX', 'RUBINHO', 'TAX'] as PartnerName[]).map(partner => (
                 <div key={partner} className="flex flex-col">
                    <Input 
                        label={partner === 'TAX' ? 'IRPF / TAXAS' : `SAQUE ${partner}`}
                        prefix="R$"
                        mask="currency"
                        placeholder="0,00"
                        value={partner === 'JOEY' ? regJoey : partner === 'ALEX' ? regAlex : partner === 'RUBINHO' ? regRubinho : regTax}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (partner === 'JOEY') updateWithdrawalDraft('regJoey', val);
                            if (partner === 'ALEX') updateWithdrawalDraft('regAlex', val);
                            if (partner === 'RUBINHO') updateWithdrawalDraft('regRubinho', val);
                            if (partner === 'TAX') updateWithdrawalDraft('regTax', val);
                        }}
                        variant="warning"
                    />
                    <div className="mt-2 text-[10px] font-bold text-neutral-500 border-l-2 border-[#ffd700] pl-2 flex justify-between">
                        <span>TOTAL:</span>
                        <span className="text-[#ffd700]">R$ {getPartnerWithdrawn(partner).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                 </div>
             ))}
          </div>
          <button 
            onClick={handleRegisterWithdrawal}
            className="w-full mt-6 bg-[#ffd700] hover:bg-white hover:text-black hover:border-black border-2 border-transparent text-black py-4 font-black uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_#ffd700] flex items-center justify-center gap-3 rounded-none"
          >
            <AlertTriangle size={20} />
            CONFIRMAR DÉBITO
          </button>
      </Card>

      {/* History */}
       <Card title="HISTÓRICO">
         <div className="max-h-60 overflow-y-auto pr-2">
             <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-[#111] text-[10px] uppercase text-neutral-500 font-bold z-10 border-b-2 border-white/10">
                     <tr>
                         <th className="py-2">Data</th>
                         <th className="py-2">Destino</th>
                         <th className="py-2 text-right">Valor R$</th>
                         <th className="py-2 text-right">Débito Cents</th>
                         <th className="py-2 text-center w-10">X</th>
                     </tr>
                 </thead>
                 <tbody className="text-sm font-medium text-neutral-300">
                     {state.transactions
                        .filter(t => t.type === 'WITHDRAWAL')
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map(t => (
                         <tr key={t.id} className="border-b border-white/5 hover:bg-[#ffd700] hover:text-black transition-colors group">
                             <td className="py-3 text-xs text-neutral-500 group-hover:text-black">
                                 {new Date(t.date).toLocaleDateString('pt-BR')}
                             </td>
                             <td className="py-3 font-bold text-[#ffd700] group-hover:text-black">{t.partner}</td>
                             <td className="py-3 text-right group-hover:font-bold">R$ {t.amountBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                             <td className="py-3 text-right text-neutral-500 group-hover:text-black">-{Math.floor(t.amountCents).toLocaleString('pt-BR')}</td>
                             <td className="py-3 text-center">
                                 <button 
                                    onClick={() => deleteTransaction(t.id)}
                                    className="text-neutral-600 group-hover:text-black transition-colors p-1"
                                 >
                                     <Trash2 size={14} />
                                 </button>
                             </td>
                         </tr>
                     ))}
                      {state.transactions.filter(t => t.type === 'WITHDRAWAL').length === 0 && (
                         <tr>
                             <td colSpan={5} className="py-8 text-center text-neutral-600 text-xs uppercase">-- SEM REGISTROS --</td>
                         </tr>
                     )}
                 </tbody>
             </table>
         </div>
      </Card>
    </div>
  );
};