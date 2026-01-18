
import React from 'react';
import { formatCurrencyInput, formatCurrencyDisplay } from '../../utils/format';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
  prefix?: string;
  actionButton?: React.RefObject<HTMLButtonElement> | React.ReactNode;
  variant?: 'default' | 'danger' | 'success' | 'warning';
  mask?: 'currency';
  decimals?: number;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  suffix, 
  prefix, 
  actionButton, 
  className = '', 
  variant = 'default',
  mask,
  decimals = 2,
  onChange,
  value,
  ...props 
}) => {
  const styles = {
    default: {
      focus: 'focus:border-[#FF6F00] focus:bg-[#FF6F00]/10',
      border: 'border-white/20',
      text: 'text-white'
    },
    danger: {
      focus: 'focus:border-[#ff4444] focus:bg-[#ff4444]/10',
      border: 'border-[#ff4444]/50',
      text: 'text-white'
    },
    success: {
      focus: 'focus:border-[#00e676] focus:bg-[#00e676]/10',
      border: 'border-[#00e676]/50',
      text: 'text-white'
    },
    warning: {
      focus: 'focus:border-[#ffd700] focus:bg-[#ffd700]/10',
      border: 'border-[#ffd700]/50',
      text: 'text-white'
    }
  }[variant];
    
  const isCurrency = mask === 'currency';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCurrency) {
        const formatted = formatCurrencyInput(e.target.value, decimals);
        e.target.value = formatted;
        onChange?.(e);
    } else {
        onChange?.(e);
    }
  };

  let displayValue = value;
  if (isCurrency && value !== undefined && value !== '') {
      if (typeof value === 'number') {
          displayValue = formatCurrencyDisplay(value, decimals);
      } else {
          displayValue = value;
      }
  }

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {label && <label className="text-[10px] md:text-xs uppercase font-black text-white/70 mb-1.5 ml-0 font-mono tracking-widest">{label}</label>}
      <div className="relative flex items-center group w-full">
        {prefix && <span className="absolute left-3 text-neutral-500 font-bold text-xs md:text-sm font-mono pointer-events-none">{prefix}</span>}
        <input
          {...props}
          type={isCurrency ? "tel" : props.type}
          value={displayValue}
          onChange={handleChange}
          className={`
            w-full bg-black border-2 rounded-none py-3 md:py-3.5 font-mono font-bold text-sm md:text-base
            placeholder-neutral-800 transition-all outline-none
            ${styles.border} ${styles.text} ${styles.focus}
            ${prefix ? 'pl-9 md:pl-10' : 'pl-4'}
            ${suffix ? 'pr-12' : 'pr-4'}
            ${actionButton ? 'pr-14' : ''}
          `}
        />
        {suffix && !actionButton && <span className="absolute right-3 text-neutral-600 text-[10px] font-bold font-mono">{suffix}</span>}
        {actionButton && (
          <div className="absolute right-1 top-1 bottom-1 flex items-center">
            {actionButton as React.ReactNode}
          </div>
        )}
      </div>
    </div>
  );
};
