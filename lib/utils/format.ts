const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export const formatNumber = (value: number | null | undefined): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return numberFormatter.format(value);
};

export const formatCurrency = (value: number | null | undefined): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return currencyFormatter.format(value);
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatMonthKey = (monthKey: string | null | undefined): string => {
  if (!monthKey) return '—';
  const [year, month] = monthKey.split('-').map((part) => parseInt(part, 10));
  if (!year || !month) return monthKey;
  return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};