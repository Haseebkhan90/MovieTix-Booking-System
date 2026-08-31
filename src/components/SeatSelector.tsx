import React from 'react';

export type HallSeat = {
  id: string;
  row: string;
  number: number;
  category: string;
  status: 'available' | 'sold' | 'held' | 'mine';
};

interface SeatSelectorProps {
  seats: HallSeat[];
  selected: string[];
  onToggle: (seat: HallSeat) => void;
}

const ROW_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;

const seatTone = (seat: HallSeat, selected: boolean) => {
  if (seat.status === 'sold' || seat.status === 'held') return 'border-transparent bg-zinc-800 text-transparent';
  if (selected || seat.status === 'mine') return 'border-cinema-accent bg-cinema-accent text-white';
  if (seat.category === 'recliner') return 'border-amber-400 bg-transparent text-amber-100 hover:bg-amber-400/25';
  if (seat.category === 'premium') return 'border-sky-400 bg-transparent text-sky-100 hover:bg-sky-400/25';
  return 'border-zinc-300 bg-transparent text-zinc-200 hover:bg-white/10';
};

export const SeatSelector: React.FC<SeatSelectorProps> = ({ seats, selected, onToggle }) => {
  const byRow = ROW_ORDER.map((row) => ({
    row,
    category: seats.find((s) => s.row === row)?.category ?? 'regular',
    seats: seats.filter((s) => s.row === row),
  }));

  const renderCluster = (rowSeats: HallSeat[], start: number, end: number) =>
    rowSeats.slice(start, end).map((seat) => {
      const isSelected = selected.includes(seat.id);
      const disabled = seat.status === 'sold' || seat.status === 'held';
      return (
        <button
          key={seat.id}
          type="button"
          disabled={disabled}
          onClick={() => onToggle(seat)}
          className={`seat-btn ${seatTone(seat, isSelected)}`}
          aria-label={`Seat ${seat.row}${seat.number}`}
        >
          {seat.number}
        </button>
      );
    });

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
                {cat === 'regular' ? 'Classic' : cat === 'premium' ? 'Prime' : 'Recliner'}
              </p>
              <div className="space-y-2">
                {byRow
                  .filter((r) => r.category === cat)
                  .map(({ row, seats: rowSeats }) => (
                    <div key={row} className="flex items-center justify-center gap-3">
                      <span className="w-5 text-xs font-semibold text-zinc-500">{row}</span>
                      <div className="flex gap-1.5">{renderCluster(rowSeats, 0, 3)}</div>
                      <div className="w-6" />
                      <div className="flex gap-1.5">{renderCluster(rowSeats, 3, 9)}</div>
                      <div className="w-6" />
                      <div className="flex gap-1.5">{renderCluster(rowSeats, 9, SEATS_PER_ROW)}</div>
                      <span className="w-5 text-xs font-semibold text-zinc-500">{row}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-400">
          <span className="flex items-center gap-2"><span className="seat-btn border-zinc-300 bg-transparent" /> Available</span>
          <span className="flex items-center gap-2"><span className="seat-btn border-cinema-accent bg-cinema-accent" /> Selected</span>
          <span className="flex items-center gap-2"><span className="seat-btn border-transparent bg-zinc-800" /> Sold</span>
        </div>
      </div>
    </div>
  );
};
