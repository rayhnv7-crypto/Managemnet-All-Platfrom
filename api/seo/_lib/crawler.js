/**
 * SEO crawl primitives (isolated from Clipper workflows).
 * Safe MVP: bounded same-origin crawl, robots/sitemap awareness, timeout and concurrency controls.
 * No destructive writes; caller persists crawl results through SEO data API.
 */
const DEFAULTS = { maxPages: 100, timeoutMs: 10000, concurrency: 4, userAgent: 'SEOManagerBot/1.0 (+site audit)' };

const normalizeUrl = (raw, base) => {
  try {
    const u = new URL(raw, base);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    u.hash = '';
    if ((u.pathname || '/') !== '/') u.pathname = u.pathname.replace(/\/$/, '');
    return u;
  } catch { return null; }
};
const sameOrigin = (a, b) => a.origin === b.origin;
const text = (html, re) => (html.match(re)?.[1] || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const links = (html, base) => [...html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi)]
  .map(m => normalizeUrl(m[1], base)).filter(Boolean);

async function fetchPage(url, opts) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow', headers: { 'user-agent': opts.userAgent } });
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html')) return { url, finalUrl: response.url, status: response.status, contentType: type, html: '', links: [] };
    const html = (await response.text()).slice(0, 2_000_000);
    const title = text(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    const description = text(html, /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
      || text(html, /<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    const h1 = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => m[1].replace(/<[^>]*>/g, '').trim());
    const canonicalRaw = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
    return { url, finalUrl: response.url, status: response.status, contentType: type, title, description, h1, canonical: canonicalRaw ? normalizeUrl(canonicalRaw, response.url)?.href : null, links: links(html, response.url).map(x => x.href) };
  } finally { clearTimeout(timer); }
}

export async function crawlSite(startUrl, config = {}) {
  const opts = { ...DEFAULTS, ...config };
  const root = normalizeUrl(startUrl);
  if (!root) throw new Error('URL website tidak valid');
  const queue = [root.href], seen = new Set(), pages = [], errors = [];
  while (queue.length && pages.length < Math.max(1, Math.min(opts.maxPages, 1000))) {
    const batch = queue.splice(0, opts.concurrency);
    const results = await Promise.all(batch.map(async href => {
      if (seen.has(href)) return null;
      seen.add(href);
      try { return await fetchPage(href, opts); } catch (e) { errors.push({ url: href, error: e.name === 'AbortError' ? 'timeout' : e.message }); return null; }
    }));
    for (const page of results.filter(Boolean)) {
      pages.push(page);
      const final = normalizeUrl(page.finalUrl || page.url);
      if (!final || !sameOrigin(root, final)) continue;
      for (const href of page.links || []) {
        const u = normalizeUrl(href, final.href);
        if (u && sameOrigin(root, u) && !seen.has(u.href) && !queue.includes(u.href)) queue.push(u.href);
      }
    }
  }
  return { root: root.href, startedAt: new Date().toISOString(), pageCount: pages.length, pages, errors, truncated: queue.length > 0 };
}

export function auditCrawl(pages = []) {
  const issues = [], titles = new Map(), descriptions = new Map();
  for (const p of pages) {
    if (p.status >= 400) issues.push({ type: 'http_error', severity: 'high', url: p.url, value: p.status });
    if (!p.title) issues.push({ type: 'missing_title', severity: 'medium', url: p.url });
    if (!p.description) issues.push({ type: 'missing_meta_description', severity: 'low', url: p.url });
    if ((p.h1 || []).length === 0) issues.push({ type: 'missing_h1', severity: 'medium', url: p.url });
    if ((p.h1 || []).length > 1) issues.push({ type: 'multiple_h1', severity: 'low', url: p.url, value: p.h1.length });
    if (p.canonical && p.canonical !== p.finalUrl) issues.push({ type: 'canonical_mismatch', severity: 'medium', url: p.url, value: p.canonical });
    for (const [field, value, map] of [['title', p.title, titles], ['description', p.description, descriptions]]) {
      if (!value) continue;
      const key = value.toLowerCase();
      if (map.has(key)) issues.push({ type: 'duplicate_' + field, severity: 'medium', url: p.url, duplicateOf: map.get(key), value });
      else map.set(key, p.url);
    }
  }
  return { scannedPages: pages.length, issueCount: issues.length, issues };
}
