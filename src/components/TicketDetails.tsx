import type { FC } from 'react';
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react';
import { Ticket } from '../types';
import { formatMoney } from '../api/client';

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
}

export const TicketDetails: FC<TicketDetailsProps> = ({ ticket, onClose }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    ticket.qrPayload || ticket.code || ticket.id
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="card-surface relative max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <img src={ticket.movie.backdropUrl} alt="" className="h-40 w-full object-cover" />
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white" aria-label="Close ticket">
          <X className="h-5 w-5" />
        </button>
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_180px]">
          <div>
            <p className="text-xs uppercase tracking-widest text-cinema-accent">M-Ticket</p>
            <h2 className="mt-1 text-2xl font-bold">{ticket.movie.title}</h2>
            <p className="text-sm text-zinc-400">{ticket.movie.certification} · {ticket.movie.language} · {ticket.movie.duration}</p>
            <div className="mt-5 space-y-4 text-sm">
              <div className="flex gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-cinema-accent" />
                <div>
                  <p className="font-medium">Show</p>
                  <p className="text-zinc-400">{new Date(ticket.showDate).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-cinema-accent" />
                <div>
                  <p className="font-medium">{ticket.cinema.name}</p>
                  <p className="text-zinc-400">{ticket.cinema.mall}, {ticket.cinema.city}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="mt-0.5 h-4 w-4 text-cinema-accent" />
                <div>
                  <p className="font-medium">Seats</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {ticket.seats.map((seat) => (
                      <span key={seat.id} className="rounded-full bg-cinema-accent/15 px-3 py-1 text-cinema-accent">
                        {seat.row}{seat.number}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 text-cinema-accent" />
                <div>
                  <p className="font-medium">Booked on</p>
                  <p className="text-zinc-400">{new Date(ticket.purchaseDate).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-4 text-center text-zinc-900">
            <img src={qrUrl} alt="Ticket QR code" className="h-36 w-36" />
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide">Scan at gate</p>
            <p className="mt-1 text-[10px] text-zinc-500">{ticket.code}</p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-cinema-border px-6 py-4">
          <div>
            <p className="text-xs text-zinc-500">Amount paid</p>
            <p className="text-2xl font-bold text-emerald-400">{formatMoney(ticket.totalAmount, ticket.currency)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
