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
export const HALL_CAPACITY = ROW_CONFIG.length * SEATS_PER_ROW;
export const HOLD_MINUTES = 8;

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

export const convenienceFee = (subtotalMinor: number, bps: number, flatMinor: number) =>
  Math.round((subtotalMinor * bps) / 10000) + flatMinor;

export const bookingCode = () => {
  const n = Math.random().toString(36).slice(2, 8).toUpperCase();
  const t = Date.now().toString(36).slice(-4).toUpperCase();
  return `MT-${t}${n}`;
};

/** Deterministic ~20% occupancy so empty halls still look like a live cinema. */
export const demoSold = (showId: string, key: string) => {
  let hash = 0;
  const s = `${showId}:${key}`;
  for (let i = 0; i < s.length; i += 1) hash = (hash << 5) - hash + s.charCodeAt(i);
  return Math.abs(hash) % 10 < 2;
};
