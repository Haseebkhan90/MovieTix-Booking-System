import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon } from 'lucide-react';
import { useTicketContext } from '../context/TicketContext';
import { TicketDetails } from '../components/TicketDetails';
import { Ticket } from '../types';
import { getMovieById } from '../data/movies';
import { getCinemaById } from '../data/cinemas';
import { formatINR, formatShowDate } from '../utils/booking';

export const MyTickets = () => {
  const { tickets } = useTicketContext();
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">My Tickets</h1>
      {tickets.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <TicketIcon className="mx-auto mb-4 h-14 w-14 text-zinc-600" />
          <p className="text-lg font-semibold">No bookings yet</p>
          <p className="mt-2 text-zinc-400">Pick a film, choose a show, and your M-Tickets will land here.</p>
          <Link to="/" className="btn-primary mt-6">
            Browse movies
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => {
            const movie = getMovieById(ticket.movieId);
            const cinema = getCinemaById(ticket.cinemaId);
            if (!movie) return null;
            return (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedTicket(ticket)}
                className="card-surface flex w-full overflow-hidden text-left transition hover:border-cinema-accent/50"
              >
                <img src={movie.imageUrl} alt="" className="h-40 w-28 object-cover sm:w-36" />
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cinema-accent">M-Ticket</p>
                      <h2 className="text-xl font-bold">{movie.title}</h2>
                      <p className="text-sm text-zinc-400">
                        {cinema?.name} • {cinema?.mall}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {formatShowDate(ticket.showDate)} • {ticket.showtime}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ticket.seats.map((seat) => (
                          <span key={seat.id} className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                            {seat.row}
                            {seat.number}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xl font-bold text-emerald-400">{formatINR(ticket.totalAmount)}</p>
                  </div>
                  <p className="mt-3 text-xs text-zinc-500">Tap to view QR ticket</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedTicket && (
        <TicketDetails ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
};
