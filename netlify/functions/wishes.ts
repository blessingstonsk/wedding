import type { Config, Context } from '@netlify/functions';
import { cleanText, db, ipHash, isUuid, json, rateLimited, sameOrigin } from '../lib/shared';

const AUTO_APPROVE = process.env.WISHES_AUTO_APPROVE === 'true';

/**
 * GET  /api/wishes → approved wishes only (name, message, date — nothing else).
 * POST /api/wishes → new wish, held for moderation unless WISHES_AUTO_APPROVE=true.
 */
export default async (req: Request, context: Context) => {
  try {
    if (req.method === 'GET') {
      const { data, error } = await db()
        .from('wishes')
        .select('id, name, message, created_at')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return json(200, { wishes: data }, { 'Cache-Control': 'public, max-age=30' });
    }

    if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });
    if (!sameOrigin(req)) return json(403, { error: 'Forbidden' });

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }
    if (typeof body.website === 'string' && body.website.length > 0) return json(200, { ok: true, approved: false });

    const name = cleanText(body.name, 60);
    const message = cleanText(body.message, 500);
    if (name.length < 2 || message.length < 3 || !isUuid(body.deviceId)) return json(400, { error: 'Invalid wish' });
    // Links are a spam magnet; wishes never need them.
    if (/https?:\/\/|www\./i.test(message)) return json(400, { error: 'Links are not allowed' });

    const hash = ipHash(req, context);
    if (await rateLimited('wishes', hash, 5, 10)) return json(429, { error: 'Too many requests' });

    const { error } = await db()
      .from('wishes')
      .insert({ name, message, device_id: body.deviceId, ip_hash: hash, approved: AUTO_APPROVE });
    if (error) throw error;
    return json(200, { ok: true, approved: AUTO_APPROVE });
  } catch (err) {
    console.error('wishes error', err);
    return json(500, { error: 'Something went wrong' });
  }
};

export const config: Config = { path: '/api/wishes' };
