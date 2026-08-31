export type MovieStatus = 'now-showing' | 'coming-soon';
export type SeatCategory = 'regular' | 'premium' | 'recliner';
export type Certification = 'U' | 'UA' | 'A';

export interface Movie {
  id: number;
  title: string;
  imageUrl: string;
  backdropUrl: string;
  description: string;
  duration: string;
  genre: string[];
  rating: number;
  price: number;
  language: string;
  certification: Certification;
  formats: string[];
  cast: string[];
  director: string;
  status: MovieStatus;
  releaseDate: string;
  featured: boolean;
}

export interface Cinema {
  id: string;
  name: string;
  mall: string;
  city: string;
  amenities: string[];
}

export interface Seat {
  id: string;
  row: string;
  number: number;
  category: SeatCategory;
  isBooked: boolean;
  isSelected: boolean;
}

export interface Ticket {
  id: string;
  movieId: number;
  cinemaId: string;
  seats: Seat[];
  showDate: string;
  showtime: string;
  subtotal: number;
  convenienceFee: number;
  discount: number;
  totalAmount: number;
  purchaseDate: string;
  city: string;
}

export interface BookingDraft {
  movieId: number;
  cinemaId: string;
  showDate: string;
  showtime: string;
  seats: Seat[];
  subtotal: number;
}
