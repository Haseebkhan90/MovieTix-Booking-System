import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Seat } from '../types';
import { BOOKED_KEY, loadJson, saveJson } from '../utils/storage';
import { MAX_SEATS, getDemoBookedIds } from '../utils/booking';

export interface ShowKey {
  movieId: number;
  cinemaId: string;
  date: string;
  time: string;
}

interface SeatContextType {
  selectedSeats: Seat[];
  bookedIds: Set<string>;
  notice: string | null;
  currentShow: ShowKey | null;
  initializeSeats: (show: ShowKey) => void;
  toggleSeatSelection: (seat: Seat) => void;
  clearSelection: () => void;
  markSeatsBooked: (seats: Seat[]) => void;
}

const SeatContext = createContext<SeatContextType | undefined>(undefined);

export const useSeatContext = () => {
  const context = useContext(SeatContext);
  if (!context) {
    throw new Error('useSeatContext must be used within a SeatProvider');
  }
  return context;
};

const showStorageKey = (show: ShowKey) =>
  `${show.movieId}|${show.cinemaId}|${show.date}|${show.time}`;

export const SeatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [bookedIds, setBookedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [currentShow, setCurrentShow] = useState<ShowKey | null>(null);
  const currentShowRef = useRef<ShowKey | null>(null);

  const initializeSeats = useCallback((show: ShowKey) => {
    const purchased = loadJson<Record<string, string[]>>(BOOKED_KEY, {});
    const extra = purchased[showStorageKey(show)] ?? [];
    const demo = getDemoBookedIds(show.movieId, show.cinemaId, show.date, show.time);
    extra.forEach((id) => demo.add(id));
    currentShowRef.current = show;
    setCurrentShow(show);
    setBookedIds(demo);
    setSelectedSeats([]);
    setNotice(null);
  }, []);

  const toggleSeatSelection = useCallback((seat: Seat) => {
    if (seat.isBooked) return;
    setSelectedSeats((prev) => {
      const isSelected = prev.some((s) => s.id === seat.id);
      if (isSelected) {
        setNotice(null);
        return prev.filter((s) => s.id !== seat.id);
      }
      if (prev.length >= MAX_SEATS) {
        setNotice(`You can book a maximum of ${MAX_SEATS} seats.`);
        return prev;
      }
      setNotice(null);
      return [...prev, { ...seat, isSelected: true }];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
    setNotice(null);
  }, []);

  const markSeatsBooked = useCallback((seats: Seat[]) => {
    if (!seats.length) return;
    const parts = seats[0].id.split('::');
    const show =
      currentShowRef.current ??
      (parts.length >= 4
        ? {
            movieId: Number(parts[0]),
            cinemaId: parts[1],
            date: parts[2],
            time: parts[3],
          }
        : null);
    if (show) {
      const purchased = loadJson<Record<string, string[]>>(BOOKED_KEY, {});
      const key = showStorageKey(show);
      purchased[key] = Array.from(new Set([...(purchased[key] ?? []), ...seats.map((s) => s.id)]));
      saveJson(BOOKED_KEY, purchased);
    }
    setBookedIds((prev) => {
      const copy = new Set(prev);
      seats.forEach((s) => copy.add(s.id));
      return copy;
    });
    setSelectedSeats([]);
  }, []);

  const value = useMemo(
    () => ({
      selectedSeats,
      bookedIds,
      notice,
      currentShow,
      initializeSeats,
      toggleSeatSelection,
      clearSelection,
      markSeatsBooked,
    }),
    [
      selectedSeats,
      bookedIds,
      notice,
      currentShow,
      initializeSeats,
      toggleSeatSelection,
      clearSelection,
      markSeatsBooked,
    ]
  );

  return <SeatContext.Provider value={value}>{children}</SeatContext.Provider>;
};
