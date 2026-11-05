# SEO Manager — Night Launch Checklist

## Implemented on this branch
- Bounded same-origin crawler (page cap, concurrency, timeout, HTML cap).
- Crawl POST path in `api/seo/data.js`: validates registered site/domain, records `seo_crawl_runs`, persists audit findings in `seo_audits`.
- Crawl GET history by site.
- Admin secret gate inherited from SEO data API.

## Required before production
1. Set `CLIPPER_ADMIN_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel (never in source).
2. Confirm Google OAuth app: authorized redirect URI, consent screen, client ID/secret. OAuth tokens must be encrypted at rest and refresh handled server-side.
3. Implement Google Search Console OAuth callback/token storage and GSC property sync. Do not expose refresh/access tokens to browser.
4. Add a scheduled runner/queue. Vercel request crawl currently runs synchronously and is capped at 250 pages; it is not a durable background worker.
5. Run tests and verify crawl against a staging site, then inspect persisted run + audit records.
6. Resolve Vercel Hobby serverless function cap (previous deployment exceeded 12 functions) before production deploy.
7. Confirm branch review and merge only after checks. Clipper Hub workflows are out of scope and untouched.

## Manual smoke test (after env setup)
- POST `/api/seo/data?kind=crawl` with header `x-clipper-secret` and JSON `{ "site_id": "<registered UUID>", "max_pages": 20 }`.
- GET `/api/seo/data?kind=crawl&site_id=<UUID>`.
- Confirm `seo_crawl_runs.status=completed`, result contains pages/audit, and `seo_audits` has a row.
- Invalid domain, missing secret, and unknown site must reject.

## Launch status
Not production-ready until OAuth, scheduler, CI, credentials, and deployment cap are resolved. Never mark these as complete based on code commits alone.
