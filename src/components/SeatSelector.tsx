import React from 'react';
import { useSeatContext } from '../context/SeatContext';
import { Seat } from '../types';
import {
  CATEGORY_LABEL,
  ROW_CONFIG,
  SEATS_PER_ROW,
  buildHall,
} from '../utils/booking';

interface SeatSelectorProps {
  movieId: number;
  cinemaId: string;
  date: string;
  time: string;
}

const seatTone = (seat: Seat) => {
  if (seat.isBooked) return 'border-zinc-700 bg-zinc-800 text-zinc-600';
  if (seat.isSelected) return 'border-cinema-accent bg-cinema-accent text-white';
  if (seat.category === 'recliner') return 'border-amber-400/40 bg-amber-500/20 text-amber-100 hover:bg-amber-400/40';
  if (seat.category === 'premium') return 'border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-400/30';
  return 'border-zinc-500 bg-zinc-700/40 text-zinc-200 hover:bg-zinc-500';
};

export const SeatSelector: React.FC<SeatSelectorProps> = ({ movieId, cinemaId, date, time }) => {
  const { selectedSeats, bookedIds, toggleSeatSelection } = useSeatContext();
  const selectedIds = new Set(selectedSeats.map((s) => s.id));
  const hall = buildHall(movieId, cinemaId, date, time, bookedIds, selectedIds);

  const rows = ROW_CONFIG.map(({ row, category }) => ({
    row,
    category,
    seats: hall.filter((s) => s.row === row),
  }));

  const renderCluster = (seats: Seat[], start: number, end: number) =>
    seats.slice(start, end).map((seat) => (
      <button
        key={seat.id}
        type="button"
        disabled={seat.isBooked}
        onClick={() => toggleSeatSelection(seat)}
        className={`seat-btn ${seatTone(seat)}`}
        aria-label={`Seat ${seat.row}${seat.number}${seat.isBooked ? ' booked' : ''}`}
      >
        {seat.number}
      </button>
    ));

  return (
    <div className="overflow-x-auto pb-4">
      <div className="mx-auto min-w-[640px] max-w-4xl px-4">
        <div className="mb-8">
          <div className="cinema-screen" />
          <p className="mt-2 text-center text-xs uppercase tracking-[0.4em] text-zinc-500">Screen this way</p>
        </div>

        <div className="space-y-6">
          {(['regular', 'premium', 'recliner'] as const).map((cat) => (
            <div key={cat}>
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
                {CATEGORY_LABEL[cat]}
              </p>
              <div className="space-y-2">
                {rows
                  .filter((r) => r.category === cat)
                  .map(({ row, seats }) => (
                    <div key={row} className="flex items-center justify-center gap-3">
                      <span className="w-5 text-xs font-semibold text-zinc-500">{row}</span>
                      <div className="flex gap-1.5">{renderCluster(seats, 0, 3)}</div>
                      <div className="w-6" />
                      <div className="flex gap-1.5">{renderCluster(seats, 3, 9)}</div>
                      <div className="w-6" />
                      <div className="flex gap-1.5">{renderCluster(seats, 9, SEATS_PER_ROW)}</div>
                      <span className="w-5 text-xs font-semibold text-zinc-500">{row}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-400">
          <span className="flex items-center gap-2">
            <span className="seat-btn border-zinc-500 bg-zinc-700/40" /> Available
          </span>
          <span className="flex items-center gap-2">
            <span className="seat-btn border-cinema-accent bg-cinema-accent" /> Selected
          </span>
          <span className="flex items-center gap-2">
            <span className="seat-btn border-zinc-700 bg-zinc-800" /> Sold
          </span>
          <span className="flex items-center gap-2">
            <span className="seat-btn border-sky-400/40 bg-sky-500/15" /> Prime
          </span>
          <span className="flex items-center gap-2">
            <span className="seat-btn border-amber-400/40 bg-amber-500/20" /> Recliner
          </span>
        </div>
      </div>
    </div>
  );
};
