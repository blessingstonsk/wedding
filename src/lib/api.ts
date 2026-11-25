/**
 * Guest wishes and the family dashboard, with two interchangeable backends:
 *
 *  • Supabase direct (GitHub Pages): set VITE_SUPABASE_URL and
 *    VITE_SUPABASE_ANON_KEY. The database's security rules do the checking.
 *  • Server functions (Netlify, or the local test backend in `npm run dev`):
 *    set VITE_BACKEND_ENABLED=true. Secrets stay on the server.
 *
 * With neither set, the wishes section shows "will open soon".
 */
import { directMode, supabase, toStatus } from './supabaseDirect';

const serverMode = !directMode && import.meta.env.VITE_BACKEND_ENABLED === 'true';

export const backendEnabled = directMode || serverMode;

/** What the dashboard asks for when signing in. */
export const adminLoginField: 'email' | 'username' = directMode ? 'email' : 'username';

export interface Wish {
  id: string;
  name: string;
  message: string;
  created_at: string;
}

export interface AdminWish extends Wish {
  approved: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? 'Request failed', res.status);
  return body as T;
}

/** Throw an ApiError for a Supabase error, so callers handle both backends alike. */
function check(error: { message?: string; code?: string } | null) {
  if (error) {
    const e = toStatus(error);
    throw new ApiError(e.message, e.status);
  }
}

/* ── Guests ───────────────────────────────────────────────────────────── */

export async function fetchWishes(): Promise<{ wishes: Wish[] }> {
  if (!directMode) return request('wishes');
  const db = await supabase();
  const { data, error } = await db.from('approved_wishes').select('id, name, message, created_at');
  check(error);
  return { wishes: (data ?? []) as Wish[] };
}

export async function submitWish(p: {
  name: string;
  message: string;
  deviceId: string;
  website?: string;
}): Promise<{ ok: true; approved: boolean }> {
  if (!directMode) return request('wishes', { method: 'POST', body: JSON.stringify(p) });
  // Honeypot filled → pretend it worked so bots learn nothing.
  if (p.website) return { ok: true, approved: false };
  const db = await supabase();
  const { error } = await db.from('wishes').insert({ name: p.name, message: p.message, device_id: p.deviceId });
  check(error);
  return { ok: true, approved: false };
}

/* ── Family dashboard ─────────────────────────────────────────────────── */

export async function adminSession(): Promise<{ signedIn: boolean }> {
  if (!directMode) return request('admin/session');
  const db = await supabase();
  const { data } = await db.auth.getSession();
  return { signedIn: Boolean(data.session) };
}

export async function adminLogin(user: string, password: string): Promise<{ ok: true }> {
  if (!directMode) return request('admin/login', { method: 'POST', body: JSON.stringify({ username: user, password }) });
  const db = await supabase();
  const { error } = await db.auth.signInWithPassword({ email: user, password });
  if (error) throw new ApiError(/rate|too many/i.test(error.message) ? 'Too many attempts' : 'Incorrect email or password', /rate|too many/i.test(error.message) ? 429 : 401);
  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  if (!directMode) {
    await request('admin/logout', { method: 'POST' });
    return;
  }
  const db = await supabase();
  await db.auth.signOut();
}

export async function adminListWishes(): Promise<AdminWish[]> {
  if (!directMode) return (await request<{ wishes: AdminWish[] }>('admin?resource=wishes')).wishes;
  const db = await supabase();
  const { data: s } = await db.auth.getSession();
  if (!s.session) throw new ApiError('Unauthorized', 401);
  const { data, error } = await db
    .from('wishes')
    .select('id, name, message, approved, created_at')
    .order('approved', { ascending: true })
    .order('created_at', { ascending: false });
  check(error);
  return (data ?? []) as AdminWish[];
}

export async function adminModerate(id: string, action: 'approve' | 'delete'): Promise<void> {
  if (!directMode) {
    await request('admin', { method: 'POST', body: JSON.stringify({ resource: 'wishes', action, id }) });
    return;
  }
  const db = await supabase();
  // `count` tells us whether the database actually allowed the change.
  const { error, count } =
    action === 'approve'
      ? await db.from('wishes').update({ approved: true }, { count: 'exact' }).eq('id', id)
      : await db.from('wishes').delete({ count: 'exact' }).eq('id', id);
  check(error);
  if (!count) throw new ApiError('Unauthorized', 401);
}

/** Anonymous per-browser id sent with each wish (used for the rate limit). */
export function deviceId(): string {
  const key = 'invite-device-id';
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
