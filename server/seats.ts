export const ROW_CONFIG = [
  { row: 'A', category: 'regular' },
  { row: 'B', category: 'regular' },
  { row: 'C', category: 'regular' },
  { row: 'D', category: 'premium' },
  { row: 'E', category: 'premium' },
  { row: 'F', category: 'premium' },
  { row: 'G', category: 'recliner' },
  { row: 'H', category: 'recliner' },
] as const;

export const SEATS_PER_ROW = 12;

export const CATEGORY_LABEL: Record<string, string> = {
  regular: 'Classic',
  premium: 'Prime',
  recliner: 'Recliner',
};

export const CATEGORY_MULTIPLIER: Record<string, number> = {
  regular: 1,
  premium: 1.4,
  recliner: 1.9,
};

export const seatKey = (row: string, number: number) => `${row}-${number}`;

export const getSeatPriceMinor = (basePriceMinor: number, category: string) =>
  Math.round(basePriceMinor * (CATEGORY_MULTIPLIER[category] ?? 1));

export const buildHall = () =>
  ROW_CONFIG.flatMap(({ row, category }) =>
    Array.from({ length: SEATS_PER_ROW }, (_, i) => ({
      seatKey: seatKey(row, i + 1),
      row,
      number: i + 1,
      category,
    }))
  );

export const formatMoney = (amountMinor: number, currency: string) =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);

export const convenienceFee = (subtotalMinor: number, bps: number, flatMinor: number) =>
  Math.round((subtotalMinor * bps) / 10000) + flatMinor;

export const bookingCode = () => {
  const n = Math.random().toString(36).slice(2, 8).toUpperCase();
  const t = Date.now().toString(36).slice(-4).toUpperCase();
  return `MT-${t}${n}`;
};
