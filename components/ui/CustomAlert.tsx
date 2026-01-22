
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
        if (type === 'confirm' && onConfirm) {
          onConfirm();
          onClose();
        } else {
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, type, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-black border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
        <div className="p-6 border-b-2 border-white/20 flex items-center justify-between bg-[#111]">
          <div className="flex items-center gap-3">
            {type === 'confirm' ? <AlertOctagon className="text-[#ffd700]" /> : <CheckCircle2 className="text-[#00e676]" />}
            <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-6">
          <p className="text-xs font-mono text-neutral-300 leading-relaxed mb-8">{message}</p>
          <div className="flex gap-4">
            {type === 'confirm' ? (
              <>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 border-2 border-white/20 text-white font-black uppercase text-[10px] hover:bg-white/10 transition-colors"
                >
                  Cancelar (ESC)
                </button>
                <button 
                  onClick={() => { onConfirm?.(); onClose(); }}
                  className="flex-1 py-3 bg-[#00e676] text-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_white] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                >
                  Confirmar (ENTER)
                </button>
              </>
            ) : (
              <button 
                onClick={onClose}
                className="w-full py-3 bg-white text-black font-black uppercase text-[10px] shadow-[4px_4px_0px_0px_#888] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
              >
                Entendido (ENTER)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
