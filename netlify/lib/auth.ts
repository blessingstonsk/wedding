import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Family dashboard sign-in.
 *
 * The username and password live only in server environment variables
 * (ADMIN_USERNAME / ADMIN_PASSWORD). After a correct sign-in the browser gets
 * a signed, HttpOnly cookie that keeps the family signed in for 30 days —
 * page scripts cannot read it, and changing the password signs everyone out.
 */

export const SESSION_COOKIE = 'invite_admin';
const SESSION_DAYS = 30;

const sha256 = (s: string) => createHash('sha256').update(s).digest();

/** Compare two strings without leaking timing information. */
const safeEqual = (a: string, b: string) => timingSafeEqual(sha256(a), sha256(b));

function credentials() {
  const username = process.env.ADMIN_USERNAME ?? '';
  const password = process.env.ADMIN_PASSWORD ?? '';
  // The live site requires 8+ characters; local `npm run dev` testing allows anything.
  const minLength = process.env.ADMIN_LOCAL_TESTING === '1' ? 1 : 8;
  return username && password.length >= minLength ? { username, password } : null;
}

/** Signing key — derived from the password, so a password change invalidates old sessions. */
function signingKey(password: string) {
  return sha256(`invite-session:${password}:${process.env.ADMIN_SESSION_SECRET ?? ''}`);
}

const sign = (payload: string, password: string) =>
  createHmac('sha256', signingKey(password)).update(payload).digest('base64url');

export function verifyLogin(username: unknown, password: unknown) {
  const creds = credentials();
  if (!creds || typeof username !== 'string' || typeof password !== 'string') return false;
  // Evaluate both checks so a wrong username takes as long as a wrong password.
  const userOk = safeEqual(username.trim().toLowerCase(), creds.username.toLowerCase());
  const passOk = safeEqual(password, creds.password);
  return userOk && passOk;
}

/** Set-Cookie value for a fresh 30-day session. */
export function sessionCookie(secure: boolean) {
  const creds = credentials();
  if (!creds) throw new Error('Admin credentials are not configured');
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_DAYS * 86_400_000 })).toString('base64url');
  const value = `${payload}.${sign(payload, creds.password)}`;
  return [
    `${SESSION_COOKIE}=${value}`,
    'Path=/api/admin',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${SESSION_DAYS * 86_400}`,
    secure ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearSessionCookie(secure: boolean) {
  return [`${SESSION_COOKIE}=`, 'Path=/api/admin', 'HttpOnly', 'SameSite=Strict', 'Max-Age=0', secure ? 'Secure' : '']
    .filter(Boolean)
    .join('; ');
}

/** True when the request carries a valid, unexpired session cookie. */
export function hasValidSession(cookieHeader: string | null | undefined) {
  const creds = credentials();
  if (!creds || !cookieHeader) return false;
  const raw = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  if (!raw) return false;
  const [payload, signature] = raw.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload, creds.password))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { exp: number };
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/** Slow down password guessing: 5 failed attempts per 10 minutes from one address. */
const failures = new Map<string, number[]>();
export function loginBlocked(key: string) {
  const now = Date.now();
  const recent = (failures.get(key) ?? []).filter((t) => now - t < 10 * 60_000);
  failures.set(key, recent);
  return recent.length >= 5;
}
export function recordLoginFailure(key: string) {
  failures.set(key, [...(failures.get(key) ?? []), Date.now()]);
}
export function clearLoginFailures(key: string) {
  failures.delete(key);
}

export const adminConfigured = () => credentials() !== null;
