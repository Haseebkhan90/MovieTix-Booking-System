import { Seat, SeatCategory } from '../types';

export const MAX_SEATS = 10;

export const ROW_CONFIG: { row: string; category: SeatCategory }[] = [
  { row: 'A', category: 'regular' },
  { row: 'B', category: 'regular' },
  { row: 'C', category: 'regular' },
  { row: 'D', category: 'premium' },
  { row: 'E', category: 'premium' },
  { row: 'F', category: 'premium' },
  { row: 'G', category: 'recliner' },
  { row: 'H', category: 'recliner' },
];

export const SEATS_PER_ROW = 12;

export const CATEGORY_LABEL: Record<SeatCategory, string> = {
  regular: 'Classic',
  premium: 'Prime',
  recliner: 'Recliner',
};

export const CATEGORY_MULTIPLIER: Record<SeatCategory, number> = {
  regular: 1,
  premium: 1.4,
  recliner: 1.9,
};

export const getSeatPrice = (basePrice: number, category: SeatCategory) =>
  Math.round(basePrice * CATEGORY_MULTIPLIER[category]);

export const seatId = (
  movieId: number,
  cinemaId: string,
  date: string,
  time: string,
  row: string,
  number: number
) => `${movieId}::${cinemaId}::${date}::${time}::${row}${number}`;

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

export const getDemoBookedIds = (
  movieId: number,
  cinemaId: string,
  date: string,
  time: string
) => {
  const booked = new Set<string>();
  ROW_CONFIG.forEach(({ row, category }) => {
    for (let n = 1; n <= SEATS_PER_ROW; n += 1) {
      const id = seatId(movieId, cinemaId, date, time, row, n);
      const seed = hashString(`${id}-${category}`);
      if (seed % 10 < 2) {
        booked.add(id);
      }
    }
  });
  return booked;
};

export const buildHall = (
  movieId: number,
  cinemaId: string,
  date: string,
  time: string,
  bookedIds: Set<string>,
  selectedIds: Set<string>
): Seat[] => {
  const seats: Seat[] = [];
  ROW_CONFIG.forEach(({ row, category }) => {
    for (let n = 1; n <= SEATS_PER_ROW; n += 1) {
      const id = seatId(movieId, cinemaId, date, time, row, n);
      seats.push({
        id,
        row,
        number: n,
        category,
        isBooked: bookedIds.has(id),
        isSelected: selectedIds.has(id),
      });
    }
  });
  return seats;
};

export const convenienceFee = (subtotal: number) =>
  Math.round(subtotal * 0.12 + 19);

export const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export const getShowDates = (count = 7) => {
  const dates: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
};

export const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatShowDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

export const isShowtimePast = (dateKey: string, time: string) => {
  const now = new Date();
  const today = toDateKey(now);
  if (dateKey > today) return false;
  if (dateKey < today) return true;
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return false;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const mer = match[3].toUpperCase();
  if (mer === 'PM' && hours !== 12) hours += 12;
  if (mer === 'AM' && hours === 12) hours = 0;
  const show = new Date();
  show.setHours(hours, minutes, 0, 0);
  return show.getTime() < now.getTime();
};
