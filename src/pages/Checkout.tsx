import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PaymentForm } from '../components/PaymentForm';
import { api, ApiError, formatMoney } from '../api/client';
import { HoldSummary } from '../types';

export const Checkout = () => {
  const navigate = useNavigate();
  const [hold] = useState<HoldSummary | null>(() => {
    try {
      const raw = sessionStorage.getItem('movietix.hold');
      return raw ? (JSON.parse(raw) as HoldSummary) : null;
    } catch {
      return null;
    }
  });
  const [promo, setPromo] = useState('');
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const discount = applied && hold ? Math.round(hold.subtotalMinor * 0.1) : 0;
  const total = hold ? hold.subtotalMinor + hold.feeMinor - discount : 0;

  const applyPromo = () => {
    if (promo.trim().toUpperCase() === 'BOOKNOW10') {
      setApplied(true);
      setError(null);
    } else {
      setApplied(false);
      setError('Invalid promo. Try BOOKNOW10.');
    }
  };

  const pay = async () => {
    if (!hold) return;
    try {
      await api('/checkout', {
        method: 'POST',
        body: JSON.stringify({ holdId: hold.holdId, promoCode: applied ? 'BOOKNOW10' : undefined }),
      });
      sessionStorage.removeItem('movietix.hold');
      setSuccess(true);
      window.setTimeout(() => navigate('/my-tickets'), 1400);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Payment could not be completed');
    }
  };

  const remaining = useMemo(() => {
    if (!hold) return 0;
    return Math.max(0, new Date(hold.expiresAt).getTime() - Date.now());
  }, [hold]);

  if (!hold) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">Your seats were released</h1>
        <p className="mt-2 text-zinc-400">Holds expire after a few minutes so inventory stays fair.</p>
        <Link to="/" className="btn-primary mt-6">Browse movies</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 text-3xl font-bold">Checkout</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Seat hold expires {new Date(hold.expiresAt).toLocaleTimeString()} ({Math.ceil(remaining / 60000)} min)
      </p>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card-surface p-6">
          <div className="flex gap-4">
            <img src={hold.movie.imageUrl} alt="" className="h-28 w-20 rounded-lg object-cover" />
            <div>
              <p className="font-bold">{hold.movie.title}</p>
              <p className="text-sm text-zinc-400">{hold.cinema.name}, {hold.cinema.mall}</p>
              <p className="text-sm text-zinc-400">{new Date(hold.startsAt).toLocaleString()}</p>
              <p className="mt-1 text-sm">Seats: {hold.seats.map((s) => `${s.row}${s.number}`).join(', ')}</p>
            </div>
          </div>
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between"><span>Tickets</span><span>{formatMoney(hold.subtotalMinor, hold.currency)}</span></div>
            <div className="flex justify-between"><span>Convenience fee</span><span>{formatMoney(hold.feeMinor, hold.currency)}</span></div>
            {applied && (
              <div className="flex justify-between text-emerald-400">
                <span>Promo BOOKNOW10</span>
                <span>-{formatMoney(discount, hold.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-cinema-border pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatMoney(total, hold.currency)}</span>
            </div>
          </div>
          <div className="mt-5 flex gap-2">
            <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Promo code" className="input-field" />
            <button type="button" onClick={applyPromo} className="btn-ghost shrink-0">Apply</button>
          </div>
        </div>
        <div className="card-surface p-6">
          {success ? (
            <div className="rounded-xl bg-emerald-500/10 p-6 text-emerald-300">Booking confirmed. Opening your M-Tickets…</div>
          ) : (
            <>
              {error && <p className="mb-3 text-sm text-rose-300">{error}</p>}
              <PaymentForm amountLabel={formatMoney(total, hold.currency)} onSuccess={pay} onError={setError} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};
