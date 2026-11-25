import { Check, Eye, EyeOff, Loader2, LogOut, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { adminLogin, adminLogout, adminRequest, adminSession, ApiError, backendEnabled } from '../../lib/api';

interface AdminWish {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  created_at: string;
}

/**
 * Family-only dashboard at /admin. Sign in once with the family username and
 * password; the server then keeps this browser signed in for 30 days.
 */
export default function AdminPanel() {
  const [status, setStatus] = useState<'checking' | 'signedOut' | 'signedIn'>('checking');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [wishes, setWishes] = useState<AdminWish[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const w = await adminRequest<{ wishes: AdminWish[] }>('?resource=wishes');
      setWishes(w.wishes);
      setStatus('signedIn');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setStatus('signedOut');
      else setError('Could not load wishes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Already signed in on this device? Go straight to the wishes.
  useEffect(() => {
    if (!backendEnabled) return;
    adminSession()
      .then((s) => (s.signedIn ? load() : setStatus('signedOut')))
      .catch(() => setStatus('signedOut'));
  }, [load]);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return setError('Please enter your username and password.');
    setLoading(true);
    setError('');
    try {
      await adminLogin(username.trim(), password);
      setPassword('');
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 429
          ? 'Too many attempts. Please wait 10 minutes and try again.'
          : err instanceof ApiError && err.status === 401
            ? 'Incorrect username or password.'
            : 'Sign-in is not available right now.',
      );
      setLoading(false);
    }
  };

  const signOut = async () => {
    await adminLogout().catch(() => undefined);
    setWishes([]);
    setStatus('signedOut');
  };

  const moderate = async (id: string, action: 'approve' | 'delete') => {
    if (action === 'delete' && !confirm('Delete this wish permanently?')) return;
    try {
      await adminRequest('', { method: 'POST', body: JSON.stringify({ resource: 'wishes', action, id }) });
      setWishes((ws) => (action === 'delete' ? ws.filter((w) => w.id !== id) : ws.map((w) => (w.id === id ? { ...w, approved: true } : w))));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setStatus('signedOut');
      else setError('That did not work. Please try again.');
    }
  };

  if (!backendEnabled) {
    return (
      <main className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-display text-4xl text-gold-soft">Family Dashboard</h1>
        <p className="mt-4 text-cream/70">The backend is not connected yet. Follow “Guest wishes backend” in README.md, then set VITE_BACKEND_ENABLED=true.</p>
      </main>
    );
  }

  if (status === 'checking') {
    return (
      <main className="grid min-h-screen place-items-center text-gold" role="status">
        <Loader2 className="animate-spin" aria-label="Loading" />
      </main>
    );
  }

  if (status === 'signedOut') {
    return (
      <main className="mx-auto max-w-sm px-4 py-24">
        <h1 className="text-center font-display text-4xl text-gold-soft">Family Dashboard</h1>
        <p className="mt-2 text-center text-sm text-cream/60">Sign in to approve guest wishes</p>
        <form onSubmit={signIn} className="card mt-8 space-y-5 p-6" noValidate>
          <div>
            <label htmlFor="admin-username" className="label">
              Username
            </label>
            <input
              id="admin-username"
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="label">
              Password
            </label>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                className="field pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gold/80 hover:text-gold"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-blush" role="alert">
              {error}
            </p>
          )}
          <button className="btn-gold w-full" disabled={loading}>
            {loading && <Loader2 size={15} className="animate-spin" />} Sign in
          </button>
          <p className="text-center text-xs text-cream/45">You’ll stay signed in on this device for 30 days.</p>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-gold-soft">Family Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <button className="btn-outline" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn-outline" onClick={signOut}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>
      {error && <p className="mt-4 text-blush">{error}</p>}

      <h2 className="mt-10 font-display text-2xl text-gold-soft">Wishes awaiting approval ({wishes.filter((w) => !w.approved).length})</h2>
      {wishes.length === 0 && <p className="mt-4 text-cream/60">No wishes yet.</p>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {wishes.map((w) => (
          <div key={w.id} className={`card p-5 ${w.approved ? 'opacity-60' : ''}`}>
            <p className="whitespace-pre-line text-cream/90">{w.message}</p>
            <p className="mt-2 text-xs text-gold-soft">— {w.name}</p>
            <div className="mt-4 flex gap-2">
              {!w.approved && (
                <button className="btn-gold px-3" onClick={() => moderate(w.id, 'approve')}>
                  <Check size={14} /> Approve
                </button>
              )}
              <button className="btn-outline px-3" onClick={() => moderate(w.id, 'delete')}>
                <Trash2 size={14} /> Delete
              </button>
              {w.approved && <span className="self-center text-xs text-cream/60">Published</span>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
