import { send, safeEqual } from './_lib/http.js';
import { db } from './_lib/supabase.js';

function authorized(req) {
  const expected = process.env.CLIPPER_ADMIN_SECRET || '';
  const supplied = req.headers['x-admin-secret'] || '';
  return Boolean(expected) && safeEqual(supplied, expected);
}

function dateValue(value) {
  const today = new Date().toISOString().slice(0, 10);
  const date = String(value || today).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? date : today;
}

function normalizeRow(row = {}) {
  return {
    provider: String(row.platform || 'unknown').slice(0, 80),
    metric_date: dateValue(row.date),
    metrics: {
      source: 'csv',
      account: String(row.account || '').slice(0, 160),
      content: String(row.content || '').slice(0, 500),
      views: Math.max(0, Number(row.views) || 0),
      likes: Math.max(0, Number(row.likes) || 0),
      comments: Math.max(0, Number(row.comments) || 0),
      shares: Math.max(0, Number(row.shares) || 0),
      followers: Math.max(0, Number(row.followers) || 0)
    }
  };
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return send(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return send(res, 401, { error: 'Admin Secret tidak valid.' });

  try {
    if (req.method === 'GET') {
      const rows = await db('analytics_snapshots?select=id,provider,metric_date,metrics,created_at&order=metric_date.desc,created_at.desc&limit=1000') || [];
      return send(res, 200, { rows: rows.map(item => ({ id: item.id, date: item.metric_date, platform: item.provider, ...(item.metrics || {}) })) });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const input = Array.isArray(body?.rows) ? body.rows : [];
    if (!input.length) return send(res, 400, { error: 'rows harus berupa array berisi data CSV.' });
    if (input.length > 2000) return send(res, 413, { error: 'Maksimal 2.000 baris per import.' });

    const inserted = await db('analytics_snapshots', { method: 'POST', body: input.map(normalizeRow), prefer: 'return=representation' });
    return send(res, 201, { ok: true, inserted: Array.isArray(inserted) ? inserted.length : input.length });
  } catch (err) {
    console.error('[analytics API]', err);
    return send(res, 503, { error: err.message || 'Analytics backend error' });
  }
}
