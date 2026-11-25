/**
 * Talks to the Netlify Functions in /netlify/functions. Those functions hold
 * the Supabase service key server-side — nothing secret ships to the browser.
 * Set VITE_BACKEND_ENABLED=true once the functions and database are configured.
 */
export const backendEnabled = import.meta.env.VITE_BACKEND_ENABLED === 'true';

export interface Wish {
  id: string;
  name: string;
  message: string;
  created_at: string;
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
  if (res.headers.get('content-type')?.includes('text/csv')) {
    if (!res.ok) throw new ApiError('Request failed', res.status);
    return (await res.text()) as T;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(body.error ?? 'Request failed', res.status);
  return body as T;
}

export const fetchWishes = () => request<{ wishes: Wish[] }>('wishes');

export const submitWish = (p: { name: string; message: string; deviceId: string; website?: string }) =>
  request<{ ok: true; approved: boolean }>('wishes', { method: 'POST', body: JSON.stringify(p) });

/* Family dashboard — the browser sends the HttpOnly session cookie automatically. */
export const adminRequest = <T,>(path: string, init?: RequestInit) => request<T>(`admin${path}`, init);

export const adminSession = () => request<{ signedIn: boolean }>('admin/session');

export const adminLogin = (username: string, password: string) =>
  request<{ ok: true }>('admin/login', { method: 'POST', body: JSON.stringify({ username, password }) });

export const adminLogout = () => request<{ ok: true }>('admin/logout', { method: 'POST' });

/** Anonymous per-browser id sent with each wish. */
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
