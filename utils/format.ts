export const parseCurrency = (value: string): number => {
  if (!value) return 0;
  // Remove thousands separator (.) and replace decimal separator (,) with (.)
  const clean = value.replace(/\./g, '').replace(',', '.');
  const floatVal = parseFloat(clean);
  return isNaN(floatVal) ? 0 : floatVal;
};

export const formatCurrencyInput = (value: string, decimals: number = 2): string => {
    // This helper is for the input mask logic (digits -> currency)
    const rawValue = value.replace(/\D/g, '');
    if (!rawValue) return '';
    const valueNumber = Number(rawValue) / Math.pow(10, decimals);
    return valueNumber.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

export const formatCurrencyDisplay = (value: number | string, decimals: number = 2): string => {
    if (value === '' || value === undefined || value === null) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '';
    return num.toLocaleString('pt-BR', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });
};