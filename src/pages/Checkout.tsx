import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PaymentForm } from '../components/PaymentForm';
import { PAYMENT_STATUS } from '../config/stripe';
import { useTicketContext } from '../context/TicketContext';
import { useSeatContext } from '../context/SeatContext';
import { useCity } from '../context/CityContext';
import { getMovieById } from '../data/movies';
import { getCinemaById } from '../data/cinemas';
import { convenienceFee, formatINR, formatShowDate } from '../utils/booking';
import { clearDraft, loadDraft } from '../utils/draft';

const PROMO = 'BOOKNOW10';

export const Checkout = () => {
  const navigate = useNavigate();
  const draft = loadDraft();
  const { addTicket } = useTicketContext();
  const { markSeatsBooked } = useSeatContext();
  const { city } = useCity();
  const [paymentStatus, setPaymentStatus] = useState<(typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState(false);

  const movie = draft ? getMovieById(draft.movieId) : undefined;
  const cinema = draft ? getCinemaById(draft.cinemaId) : undefined;

  const fee = draft ? convenienceFee(draft.subtotal) : 0;
  const discount = applied && draft ? Math.round(draft.subtotal * 0.1) : 0;
  const total = draft ? draft.subtotal + fee - discount : 0;

  const applyPromo = () => {
    if (promo.trim().toUpperCase() === PROMO) {
      setApplied(true);
      setError(null);
    } else {
      setApplied(false);
      setError('Invalid promo code. Try BOOKNOW10.');
    }
  };

  const handlePaymentSuccess = () => {
    if (!draft) return;
    setPaymentStatus(PAYMENT_STATUS.SUCCESS);
    const ticket = {
      id: crypto.randomUUID(),
      movieId: draft.movieId,
      cinemaId: draft.cinemaId,
      seats: draft.seats,
      showDate: draft.showDate,
      showtime: draft.showtime,
      subtotal: draft.subtotal,
      convenienceFee: fee,
      discount,
      totalAmount: total,
      purchaseDate: new Date().toISOString(),
      city,
    };
    addTicket(ticket);
    markSeatsBooked(draft.seats);
    clearDraft();
    window.setTimeout(() => navigate('/my-tickets'), 1600);
  };

  const summary = useMemo(() => {
    if (!draft || !movie || !cinema) return null;
    return { draft, movie, cinema };
  }, [draft, movie, cinema]);

  if (!summary) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Your checkout session expired</h1>
        <p className="mt-2 text-zinc-400">Select seats again to continue booking.</p>
        <Link to="/" className="btn-primary mt-6">
          Browse movies
        </Link>
      </div>
    );
  }

  const { movie: m, cinema: c, draft: d } = summary;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-3xl font-bold">Checkout</h1>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">Order summary</h2>
          <div className="flex gap-4">
            <img src={m.imageUrl} alt={m.title} className="h-28 w-20 rounded-lg object-cover" />
            <div>
              <p className="font-bold">{m.title}</p>
              <p className="text-sm text-zinc-400">
                {c.name}, {c.mall}
              </p>
              <p className="text-sm text-zinc-400">
                {formatShowDate(d.showDate)} • {d.showtime}
              </p>
              <p className="mt-1 text-sm">
                Seats: {d.seats.map((s) => `${s.row}${s.number}`).join(', ')}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-300">
              <span>Tickets</span>
              <span>{formatINR(d.subtotal)}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Convenience fee</span>
              <span>{formatINR(fee)}</span>
            </div>
            {applied && (
              <div className="flex justify-between text-emerald-400">
                <span>Promo BOOKNOW10</span>
                <span>-{formatINR(discount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-cinema-border pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <input
              value={promo}
              onChange={(e) => setPromo(e.target.value)}
              placeholder="Promo code"
              className="input-field"
            />
            <button type="button" onClick={applyPromo} className="btn-ghost shrink-0">
              Apply
            </button>
          </div>
        </div>

        <div className="card-surface p-6">
          {paymentStatus === PAYMENT_STATUS.SUCCESS ? (
            <div className="rounded-xl bg-emerald-500/10 p-6 text-emerald-300">
              Payment successful. Taking you to your tickets…
            </div>
          ) : (
            <>
              <h2 className="mb-4 text-lg font-semibold">Payment</h2>
              {error && <p className="mb-3 text-sm text-rose-300">{error}</p>}
              <PaymentForm
                amount={total}
                onSuccess={handlePaymentSuccess}
                onError={(message) => {
                  setPaymentStatus(PAYMENT_STATUS.FAILED);
                  setError(message);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
