/**
 * Wishes stored straight in Supabase from the browser — used when the site is
 * hosted on GitHub Pages, which has no server of its own.
 *
 * Only the project URL and the public "anon" key are used here. Those are
 * designed to be public; what guests may do is enforced by the database's
 * Row Level Security rules in supabase/wishes-direct.sql (guests can only add
 * unapproved wishes and read approved ones; only the admin email can moderate).
 */
import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const directMode = Boolean(url && anonKey);

let client: Promise<SupabaseClient> | null = null;

/** Loaded on first use so the opening animation never waits for it. */
export function supabase() {
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url!, anonKey!, {
      // Keeps the family signed in to /admin on this device until they sign out.
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'invite-admin-auth' },
    }),
  );
  return client;
}

export interface DirectError {
  status: number;
  message: string;
}

/** Turn a database error into the same status codes the rest of the site uses. */
export function toStatus(err: { message?: string; code?: string } | null): DirectError {
  const msg = err?.message ?? 'Request failed';
  if (/rate_limited/.test(msg)) return { status: 429, message: 'Too many requests' };
  if (err?.code === '23514' || /violates check constraint/.test(msg)) return { status: 400, message: 'Invalid wish' };
  if (err?.code === '42501' || /permission denied|row-level security/i.test(msg)) return { status: 401, message: 'Unauthorized' };
  return { status: 500, message: msg };
}
