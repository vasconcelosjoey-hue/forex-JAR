
import React, { useEffect } from 'react';
import { AlertOctagon, CheckCircle2, X } from 'lucide-react';

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'confirm' | 'alert' | 'success';
}

export const CustomAlert: React.FC<CustomAlertProps> = ({ isOpen, onClose, onConfirm, title, message, type = 'alert' }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'confirm' && onConfirm) {
          onConfirm();
          onClose();
        } else {
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, type, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-black border-2 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
        <div className="p-3 border-b-2 border-white/20 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            {type === 'confirm' ? <AlertOctagon className="text-[#ffd700]" size={16} /> : <CheckCircle2 className="text-[#00e676]" size={16} />}
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white leading-none">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">
          <p className="text-[11px] font-mono text-neutral-300 leading-relaxed mb-6 border-l-2 border-white/10 pl-3">
            {message}
          </p>
          <div className="flex flex-col gap-2">
            {type === 'confirm' ? (
              <div className="flex gap-2">
                <button 
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-white/20 text-white font-black uppercase text-[9px] tracking-widest hover:bg-white/5"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={() => { onConfirm?.(); onClose(); }}
                  className="flex-1 py-2.5 bg-[#00e676] text-black font-black uppercase text-[9px] tracking-widest shadow-[3px_3px_0px_0px_white] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
                >
                  CONFIRMAR
                </button>
              </div>
            ) : (
              <button 
                onClick={onClose}
                className="w-full py-2.5 bg-white text-black font-black uppercase text-[9px] tracking-widest shadow-[4px_4px_0px_0px_#444] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
              >
                ENTENDIDO
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
