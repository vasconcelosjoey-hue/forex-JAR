
import React from 'react';

interface CardProps {
  children: React.RefObject<HTMLDivElement> | React.ReactNode;
  className?: string;
  title?: string;
  color?: 'default' | 'danger' | 'success' | 'warning';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, color = 'default' }) => {
  const styles = {
    default: 'border-white/20 bg-[#111]',
    danger: 'border-[#ff4444] bg-[#ff4444]/5',
    success: 'border-[#00e676] bg-[#00e676]/5',
    warning: 'border-[#ffd700] bg-[#ffd700]/5',
  }[color];

  const titleColors = {
    default: 'text-neutral-400',
    danger: 'text-[#ff4444]',
    success: 'text-[#00e676]',
    warning: 'text-[#ffd700]',
  }[color];

  return (
    <div className={`border-2 rounded-none p-3 md:p-4 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.1)] ${styles} ${className}`}>
      {title && (
        <h3 className={`text-[11px] md:text-xs font-black uppercase tracking-[0.2em] mb-3 border-b border-white/10 pb-2 flex justify-between items-center ${titleColors}`}>
          {title}
          <div className="w-1.5 h-1.5 bg-current opacity-50"></div>
        </h3>
      )}
      {children}
    </div>
  );
};
