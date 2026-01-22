
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

    // Use capture level to override global handlers
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, type, onConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-black border-4 border-white shadow-[12px_12px_0px_0px_rgba(255,255,255,0.2)]">
        <div className="p-6 border-b-4 border-white/20 flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-4">
            {type === 'confirm' ? <AlertOctagon className="text-[#ffd700]" size={32} /> : <CheckCircle2 className="text-[#00e676]" size={32} />}
            <h3 className="text-xl md:text-2xl font-black uppercase tracking-widest text-white leading-none">{title}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10"
          >
            <X size={28} />
          </button>
        </div>
        <div className="p-10">
          <p className="text-base md:text-lg font-mono text-neutral-300 leading-relaxed mb-12 border-l-4 border-white/10 pl-6 py-2">
            {message}
          </p>
          <div className="flex flex-col gap-4">
            {type === 'confirm' ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-5 border-4 border-white/20 text-white font-black uppercase text-[12px] tracking-[0.2em] hover:bg-white/10 transition-all active:translate-y-1"
                >
                  CANCELAR (ESC)
                </button>
                <button 
                  onClick={() => { onConfirm?.(); onClose(); }}
                  className="flex-1 py-5 bg-[#00e676] text-black font-black uppercase text-[12px] tracking-[0.2em] shadow-[6px_6px_0px_0px_white] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all border-2 border-black"
                >
                  CONFIRMAR (ENTER)
                </button>
              </div>
            ) : (
              <button 
                onClick={onClose}
                className="w-full py-5 bg-white text-black font-black uppercase text-[12px] tracking-[0.2em] shadow-[6px_6px_0px_0px_#444] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all border-2 border-black"
              >
                ENTENDIDO (ENTER)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
