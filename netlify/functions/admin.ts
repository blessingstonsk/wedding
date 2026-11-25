import type { Config, Context } from '@netlify/functions';
import {
  adminConfigured,
  clearLoginFailures,
  clearSessionCookie,
  hasValidSession,
  loginBlocked,
  recordLoginFailure,
  sessionCookie,
  verifyLogin,
} from '../lib/auth';
import { db, ipHash, isUuid, json, sameOrigin } from '../lib/shared';

/**
 * Family-only endpoints. Sign in with ADMIN_USERNAME / ADMIN_PASSWORD
 * (Netlify environment variables); a 30-day session cookie does the rest.
 *
 * POST /api/admin/login   { username, password }
 * POST /api/admin/logout
 * GET  /api/admin/session → { signedIn }
 * GET  /api/admin?resource=wishes
 * POST /api/admin         { resource: 'wishes', action: 'approve' | 'delete', id }
 */
export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const secure = url.protocol === 'https:';
  const route = url.pathname.replace(/\/+$/, '');

  if (req.method === 'POST' && !sameOrigin(req)) return json(403, { error: 'Forbidden' });

  if (route === '/api/admin/login' && req.method === 'POST') {
    if (!adminConfigured()) return json(503, { error: 'Admin login is not set up' });
    const key = ipHash(req, context);
    if (loginBlocked(key)) return json(429, { error: 'Too many attempts' });
    const body = (await req.json().catch(() => ({}))) as { username?: unknown; password?: unknown };
    if (!verifyLogin(body.username, body.password)) {
      recordLoginFailure(key);
      return json(401, { error: 'Incorrect username or password' });
    }
    clearLoginFailures(key);
    return json(200, { ok: true }, { 'Set-Cookie': sessionCookie(secure) });
  }

  if (route === '/api/admin/logout' && req.method === 'POST') {
    return json(200, { ok: true }, { 'Set-Cookie': clearSessionCookie(secure) });
  }

  const signedIn = hasValidSession(req.headers.get('cookie'));
  if (route === '/api/admin/session') return json(200, { signedIn });
  if (!signedIn) return json(401, { error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      if (url.searchParams.get('resource') === 'wishes') {
        const { data, error } = await db()
          .from('wishes')
          .select('id, name, message, approved, created_at')
          .order('approved', { ascending: true })
          .order('created_at', { ascending: false });
        if (error) throw error;
        return json(200, { wishes: data });
      }
      return json(400, { error: 'Unknown resource' });
    }

    if (req.method === 'POST') {
      const body = (await req.json().catch(() => ({}))) as { resource?: string; action?: string; id?: unknown };
      if (body.resource !== 'wishes' || !isUuid(body.id)) return json(400, { error: 'Invalid request' });
      if (body.action === 'approve') {
        const { error } = await db().from('wishes').update({ approved: true }).eq('id', body.id);
        if (error) throw error;
      } else if (body.action === 'delete') {
        const { error } = await db().from('wishes').delete().eq('id', body.id);
        if (error) throw error;
      } else {
        return json(400, { error: 'Unknown action' });
      }
      return json(200, { ok: true });
    }

    return json(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error('admin error', err);
    return json(500, { error: 'Something went wrong' });
  }
};

export const config: Config = { path: ['/api/admin', '/api/admin/*'] };
