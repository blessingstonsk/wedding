/**
 * Local test backend for guest wishes — used ONLY by `npm run dev`.
 *
 * It answers the same /api/wishes and /api/admin requests as the real Netlify
 * Functions, with the same validation, but stores wishes in a local JSON file
 * (.dev-data/wishes.json) instead of Supabase. This lets you try the whole
 * flow — send a wish, approve it at /admin, see it on the page — before any
 * accounts are set up. It is never included in the built site.
 */
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import {
  adminConfigured,
  clearLoginFailures,
  clearSessionCookie,
  hasValidSession,
  loginBlocked,
  recordLoginFailure,
  sessionCookie,
  verifyLogin,
} from '../netlify/lib/auth';
import { cleanText, isUuid } from '../netlify/lib/shared';

interface StoredWish {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  created_at: string;
}

const DATA_DIR = join(process.cwd(), '.dev-data');
const DATA_FILE = join(DATA_DIR, 'wishes.json');

const load = (): StoredWish[] => {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8')) as StoredWish[];
  } catch {
    return [];
  }
};

const save = (wishes: StoredWish[]) => {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(wishes, null, 2));
};

const send = (res: ServerResponse, status: number, body: unknown) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
};

const readBody = (req: IncomingMessage) =>
  new Promise<Record<string, unknown>>((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
  });

/** Same limit as production: 5 wishes per 10 minutes from one address. */
const recent = new Map<string, number[]>();
function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.set(ip, hits);
  if (hits.length >= 5) return true;
  hits.push(now);
  return false;
}

export function mockApi(admin: { username?: string; password?: string }, autoApprove: boolean): Plugin {
  return {
    name: 'wedding-mock-api',
    apply: 'serve',
    configureServer(server) {
      // The shared sign-in code reads these, exactly as on Netlify.
      if (admin.username) process.env.ADMIN_USERNAME = admin.username;
      if (admin.password) process.env.ADMIN_PASSWORD = admin.password;
      // Local testing only: allow short passwords (the live site still requires 8+).
      process.env.ADMIN_LOCAL_TESTING = '1';
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        if (!url.pathname.startsWith('/api/')) return next();

        if (url.pathname === '/api/wishes') {
          if (req.method === 'GET') {
            const wishes = load()
              .filter((w) => w.approved)
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .map(({ id, name, message, created_at }) => ({ id, name, message, created_at }));
            return send(res, 200, { wishes });
          }
          if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
          const body = await readBody(req);
          if (typeof body.website === 'string' && body.website.length > 0) return send(res, 200, { ok: true, approved: false });
          const name = cleanText(body.name, 60);
          const message = cleanText(body.message, 500);
          if (name.length < 2 || message.length < 3 || !isUuid(body.deviceId)) return send(res, 400, { error: 'Invalid wish' });
          if (/https?:\/\/|www\./i.test(message)) return send(res, 400, { error: 'Links are not allowed' });
          if (rateLimited(req.socket.remoteAddress ?? 'local')) return send(res, 429, { error: 'Too many requests' });
          const wishes = load();
          wishes.push({ id: randomUUID(), name, message, approved: autoApprove, created_at: new Date().toISOString() });
          save(wishes);
          return send(res, 200, { ok: true, approved: autoApprove });
        }

        if (url.pathname === '/api/admin/login' && req.method === 'POST') {
          if (!adminConfigured()) return send(res, 503, { error: 'Admin login is not set up' });
          const key = req.socket.remoteAddress ?? 'local';
          if (loginBlocked(key)) return send(res, 429, { error: 'Too many attempts' });
          const body = await readBody(req);
          if (!verifyLogin(body.username, body.password)) {
            recordLoginFailure(key);
            return send(res, 401, { error: 'Incorrect username or password' });
          }
          clearLoginFailures(key);
          res.setHeader('Set-Cookie', sessionCookie(false));
          return send(res, 200, { ok: true });
        }
        if (url.pathname === '/api/admin/logout' && req.method === 'POST') {
          res.setHeader('Set-Cookie', clearSessionCookie(false));
          return send(res, 200, { ok: true });
        }
        const signedIn = hasValidSession(req.headers.cookie);
        if (url.pathname === '/api/admin/session') return send(res, 200, { signedIn });

        if (url.pathname === '/api/admin') {
          if (!signedIn) return send(res, 401, { error: 'Unauthorized' });
          if (req.method === 'GET') {
            if (url.searchParams.get('resource') !== 'wishes') return send(res, 400, { error: 'Unknown resource' });
            const wishes = load().sort(
              (a, b) => Number(a.approved) - Number(b.approved) || b.created_at.localeCompare(a.created_at),
            );
            return send(res, 200, { wishes });
          }
          if (req.method === 'POST') {
            const body = await readBody(req);
            if (body.resource !== 'wishes' || !isUuid(body.id)) return send(res, 400, { error: 'Invalid request' });
            const wishes = load();
            const i = wishes.findIndex((w) => w.id === body.id);
            if (i === -1) return send(res, 404, { error: 'Not found' });
            if (body.action === 'approve') wishes[i].approved = true;
            else if (body.action === 'delete') wishes.splice(i, 1);
            else return send(res, 400, { error: 'Unknown action' });
            save(wishes);
            return send(res, 200, { ok: true });
          }
          return send(res, 405, { error: 'Method not allowed' });
        }

        return send(res, 404, { error: 'Not found' });
      });
    },
  };
}
