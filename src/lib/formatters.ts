export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '--';
  
  const absValue = Math.abs(value);
  if (absValue >= 1e7) {
    return `₹${(value / 1e7).toFixed(2)} Cr`;
  } else if (absValue >= 1e5) {
    return `₹${(value / 1e5).toFixed(2)} L`;
  } else {
    return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || isNaN(value)) return '--';
  return value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function getGainLossClass(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'text-gray-500';
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-500';
}

export function getGainLossBgClass(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return 'bg-gray-100';
  if (value > 0) return 'bg-green-50';
  if (value < 0) return 'bg-red-50';
  return 'bg-gray-100';
}