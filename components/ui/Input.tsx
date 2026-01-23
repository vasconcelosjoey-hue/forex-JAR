
import React from 'react';
import { formatCurrencyInput, formatCurrencyDisplay } from '../../utils/format';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  suffix?: string;
  prefix?: string;
  actionButton?: React.ReactNode;
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
      {label && <label className="text-xs md:text-sm uppercase font-black text-white/70 mb-2 ml-0 font-mono tracking-widest">{label}</label>}
      <div className="relative flex items-center group w-full">
        {prefix && <span className="absolute left-4 text-neutral-500 font-bold text-sm md:text-base font-mono pointer-events-none">{prefix}</span>}
        <input
          {...props}
          type={isCurrency ? "tel" : props.type}
          value={displayValue}
          onChange={handleChange}
          className={`
            w-full bg-black border-2 rounded-none py-4 md:py-5 font-mono font-black text-base md:text-lg
            placeholder-neutral-800 transition-all outline-none
            ${styles.border} ${styles.text} ${styles.focus}
            ${prefix ? 'pl-10 md:pl-12' : 'pl-5'}
            ${suffix ? 'pr-14' : 'pr-5'}
            ${actionButton ? 'pr-16' : ''}
          `}
        />
        {suffix && !actionButton && <span className="absolute right-4 text-neutral-600 text-xs font-bold font-mono">{suffix}</span>}
        {actionButton && (
          <div className="absolute right-1 top-1 bottom-1 flex items-center">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};
