
import React, { border } from 'react';
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
  // Focus Styles Map
  const styles = {
    default: {
      focus: 'focus:border-[#FF6F00] focus:bg-[#FF6F00]/10 focus:shadow-[4px_4px_0px_0px_#FF6F00]',
      border: 'border-white/20',
      text: 'text-white'
    },
    danger: {
      focus: 'focus:border-[#ff4444] focus:bg-[#ff4444]/10 focus:shadow-[4px_4px_0px_0px_#ff4444]',
      border: 'border-[#ff4444]/50',
      text: 'text-white'
    },
    success: {
      focus: 'focus:border-[#00e676] focus:bg-[#00e676]/10 focus:shadow-[4px_4px_0px_0px_#00e676]',
      border: 'border-[#00e676]/50',
      text: 'text-white'
    },
    warning: {
      focus: 'focus:border-[#ffd700] focus:bg-[#ffd700]/10 focus:shadow-[4px_4px_0px_0px_#ffd700]',
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
      } else if (typeof value === 'string') {
          displayValue = value;
      }
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {label && <label className="text-xs uppercase font-black text-white mb-2 ml-0 font-mono tracking-widest">{label}</label>}
      <div className="relative flex items-center group">
        {prefix && <span className="absolute left-3 text-neutral-500 font-bold text-sm font-mono">{prefix}</span>}
        <input
          {...props}
          type={isCurrency ? "tel" : props.type}
          value={displayValue}
          onChange={handleChange}
          className={`
            w-full bg-black border-2 rounded-none py-3 font-mono font-bold
            placeholder-neutral-800 transition-all duration-150 outline-none
            ${styles.border} ${styles.text} ${styles.focus}
            ${prefix ? 'pl-10' : 'pl-4'}
            ${suffix ? 'pr-12' : 'pr-4'}
            ${actionButton ? 'pr-14' : ''}
          `}
        />
        {suffix && !actionButton && <span className="absolute right-3 text-neutral-600 text-xs font-bold font-mono">{suffix}</span>}
        {actionButton && (
          <div className="absolute right-1 top-1 bottom-1">
            {actionButton as React.ReactNode}
          </div>
        )}
      </div>
    </div>
  );
};
