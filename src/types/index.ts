export type SeatCategory = 'regular' | 'premium' | 'recliner';
export type SeatStatus = 'available' | 'sold' | 'held' | 'mine' | 'selected';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string | null;
  phone?: string | null;
};

export type CityInfo = {
  city: string;
  country: string;
  countryCode: string;
  currency: string;
};

export interface Movie {
  id: string;
  movieId?: string;
  title: string;
  imageUrl: string;
  backdropUrl: string;
  description: string;
  duration: string;
  durationMin?: number;
  genre: string[];
  rating: number;
  priceMinor?: number;
  currency?: string;
  language: string;
  certification: string;
  formats: string[];
  cast: string[];
  director: string;
  status: string;
  releaseDate: string;
  featured: boolean;
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  category: SeatCategory;
  label?: string;
  priceMinor?: number;
  status?: SeatStatus;
  isBooked?: boolean;
  isSelected?: boolean;
}

export interface Ticket {
  id: string;
  code?: string;
  movie: Movie;
  cinema: { name: string; mall: string; city: string; country?: string };
  showDate: string;
  seats: Seat[];
  subtotalMinor?: number;
  convenienceFee: number;
  discount: number;
  totalAmount: number;
  currency: string;
  purchaseDate: string;
  qrPayload?: string;
  city?: string;
}

export type HoldSummary = {
  holdId: string;
  expiresAt: string;
  showId: string;
  movie: Movie;
  cinema: { name: string; mall: string; city: string };
  startsAt: string;
  seats: Array<Seat & { priceMinor: number; category: string }>;
  subtotalMinor: number;
  feeMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: string;
};
