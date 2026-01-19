
import React from 'react';

interface CardProps {
  children: React.ReactNode;
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
    <div className={`border-2 rounded-none p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] ${styles} ${className}`}>
      {title && (
        <h3 className={`text-xs md:text-base font-black uppercase tracking-widest mb-4 border-b-2 border-white/10 pb-2 flex justify-between items-center ${titleColors}`}>
          {title}
          <div className="w-2 h-2 bg-current"></div>
        </h3>
      )}
      {children}
    </div>
  );
};
