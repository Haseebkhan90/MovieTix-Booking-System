import { FormEvent, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { hasFirebaseConfig, usingEmulators } from '../lib/firebase';

export const Login = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('guest@movietix.app');
  const [password, setPassword] = useState('Ticket@123');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const next = useMemo(() => new URLSearchParams(location.search).get('next') || '/', [location.search]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === 'register') await register(name, email, password);
      else await login(email, password);
      navigate(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[80vh] max-w-5xl items-center gap-10 px-4 py-12 md:grid-cols-2">
      <div>
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xl font-extrabold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cinema-accent">
            <Film className="h-5 w-5" />
          </span>
          MovieTix
        </Link>
        <h1 className="text-4xl font-extrabold">Your seat is waiting.</h1>
        <p className="mt-3 text-zinc-400">
          One account for Mumbai, Dubai, London, and New York. Demo password for every seeded user is{' '}
          <span className="text-white">Ticket@123</span>.
        </p>
      </div>
      <form onSubmit={onSubmit} className="card-surface p-6">
        <div className="mb-5 flex rounded-xl bg-cinema-elevated p-1">
          {(['login', 'register'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`flex-1 rounded-lg py-2 text-sm capitalize ${mode === item ? 'bg-cinema-accent text-white' : 'text-zinc-400'}`}
            >
              {item === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>
        {mode === 'register' && (
          <label className="mb-3 block text-sm">
            Name
            <input className="input-field mt-1" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label className="mb-3 block text-sm">
          Email
          <input className="input-field mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="mb-4 block text-sm">
          Password
          <input className="input-field mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </label>
        {error && <p className="mb-3 text-sm text-rose-300">{error}</p>}
        {!hasFirebaseConfig && (
          <p className="mb-3 text-sm text-amber-200">
            Live Firebase key nahi mili. Local ke liye <span className="text-white">npm run dev</span> chalao.
            Hosted site ke liye Firebase console se 6 <span className="text-white">VITE_FIREBASE_*</span> values chahiye.
          </p>
        )}
        {usingEmulators && (
          <p className="mb-3 text-xs text-zinc-500">Auth emulator: 127.0.0.1:9099</p>
        )}
        <button className="btn-primary w-full" disabled={busy} type="submit">
          {busy ? 'Please wait…' : mode === 'login' ? 'Continue' : 'Create account'}
        </button>
        <p className="mt-4 text-xs text-zinc-500">
          Cinema staff: admin@movietix.app · Platform: platform@movietix.app
        </p>
      </form>
    </div>
  );
};
