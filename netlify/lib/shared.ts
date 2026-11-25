import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

/**
 * Shared helpers for the serverless API. Secrets come from Netlify
 * environment variables and never reach the browser bundle.
 */

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured');
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });

/** One-way hash of the caller's IP — used only for rate limiting, never stored raw. */
export function ipHash(req: Request, context: { ip?: string }) {
  const ip = context.ip ?? req.headers.get('x-nf-client-connection-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown';
  const salt = process.env.RATE_LIMIT_SALT ?? 'wedding-invite';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/** Rejects requests from other sites (basic CSRF/spam guard). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host || process.env.ALLOWED_ORIGIN === origin;
  } catch {
    return false;
  }
}

/** Collapse whitespace, strip control characters and cap length. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFC')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export const isUuid = (v: unknown): v is string =>
  typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/**
 * Database-backed rate limit: at most `limit` writes per `windowMinutes`
 * from one hashed IP in `table`. Works across serverless instances.
 */
export async function rateLimited(table: 'wishes', hash: string, limit: number, windowMinutes: number) {
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count, error } = await db().from(table).select('id', { count: 'exact', head: true }).eq('ip_hash', hash).gte('created_at', since);
  if (error) throw error;
  return (count ?? 0) >= limit;
}
