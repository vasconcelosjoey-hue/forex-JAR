import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { DatabaseConfig } from '../types';
import { Database, Save, Upload, Download, X, CheckCircle2, Trash2, AlertOctagon, Cloud } from 'lucide-react';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DatabaseConfig;
  onSaveConfig: (config: DatabaseConfig) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onExport,
  onImport,
  onReset
}) => {
  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (confirm("Importar este arquivo substituirá TODOS os dados atuais no Firebase. Deseja continuar?")) {
        onImport(file);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-none animate-in fade-in duration-100 font-mono">
      <div className="w-full max-w-2xl bg-[#000] border-4 border-white shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] overflow-hidden rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-white/20 bg-[#111]">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[#FF6F00] border-2 border-black">
                <Database className="text-black" size={20} />
            </div>
            <div>
                <h2 className="text-xl font-black uppercase text-white tracking-wide">DATA_MANAGER</h2>
                <p className="text-[10px] text-neutral-400 font-bold uppercase">SYNC_AND_BACKUP</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white hover:text-black rounded-none border border-transparent hover:border-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
          
          {/* Cloud Connection Status */}
          <section className="bg-[#111] border-2 border-white/20 p-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                   <Cloud className="text-[#00e676]" size={24} />
                   <div>
                       <h3 className="text-sm font-bold text-white uppercase tracking-widest">FIREBASE CLOUD</h3>
                       <p className="text-[10px] text-neutral-500">REALTIME SYNC ACTIVE</p>
                   </div>
               </div>
               <span className="text-[10px] bg-[#00e676] text-black px-3 py-1 font-black uppercase tracking-wider">
                   CONNECTED
               </span>
            </div>
          </section>

          {/* Local Backup */}
          <section>
             <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                 <div className="w-2 h-2 bg-neutral-600"></div>
                 LOCAL JSON
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                    onClick={onExport}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-[#111] border-2 border-white/20 hover:border-[#FF6F00] hover:bg-[#FF6F00]/10 transition-all group rounded-none"
                >
                    <Download className="text-neutral-500 group-hover:text-[#FF6F00]" size={24} />
                    <div className="text-center">
                        <span className="block font-bold text-white mb-1 group-hover:text-[#FF6F00]">EXPORT</span>
                        <span className="text-[10px] text-neutral-500 uppercase">DOWNLOAD .JSON</span>
                    </div>
                </button>

                <label className="cursor-pointer flex flex-col items-center justify-center gap-3 p-6 bg-[#111] border-2 border-white/20 hover:border-[#00e676] hover:bg-[#00e676]/10 transition-all group rounded-none relative">
                    <input 
                        type="file" 
                        accept=".json" 
                        className="hidden" 
                        onChange={handleFileChange}
                    />
                    <Upload className="text-neutral-500 group-hover:text-[#00e676]" size={24} />
                    <div className="text-center">
                        <span className="block font-bold text-white mb-1 group-hover:text-[#00e676]">IMPORT</span>
                        <span className="text-[10px] text-neutral-500 uppercase">UPLOAD .JSON</span>
                    </div>
                </label>
             </div>
          </section>

          {/* Danger Zone */}
          <section className="pt-4 border-t-2 border-[#ff4444]/20">
             <div className="bg-[#ff4444]/5 border-2 border-[#ff4444]/20 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-3">
                     <AlertOctagon className="text-[#ff4444]" size={32} />
                     <div>
                         <h3 className="text-[#ff4444] font-black uppercase text-sm">DANGER ZONE</h3>
                         <p className="text-[10px] text-neutral-500">Isso apagará todos os dados no Firebase.</p>
                     </div>
                 </div>
                 <button 
                    onClick={() => {
                        if(confirm("ATENÇÃO: Isso apagará TODOS os registros no servidor. Tem certeza?")) {
                            onReset();
                            onClose();
                        }
                    }}
                    className="w-full md:w-auto bg-[#ff4444] text-black hover:bg-white px-6 py-3 font-bold uppercase text-xs flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] border-2 border-transparent hover:border-[#ff4444]"
                 >
                    <Trash2 size={14} />
                    RESETAR DADOS
                 </button>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};