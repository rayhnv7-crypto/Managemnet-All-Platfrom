# SEO Engineering Track (isolated)

Branch: `seo-engineering-night`

## Safety boundary
- Work only in `api/seo/**`, `db/migrations/*seo*`, and SEO-specific tests/docs.
- Do not edit Clipper screens, data tables, or its workflows.
- No automatic publishing or destructive website changes. Recommendations remain approval-gated.
- Existing `api/seo/data.js` remains the CRUD boundary; crawler/analysis are pure SEO modules.

## Added engines
- `api/seo/_lib/crawler.js`: bounded same-origin crawl, fetch timeout, max page cap, basic page metadata, issue audit.
- `api/seo/_lib/analysis.js`: deterministic issue scoring and summary generation.
- `tests/seo-engine.test.mjs`: smoke assertions for audit and prioritization.

## Next implementation sequence
1. Validate these modules in CI (Node runtime, fetch available).
2. Add crawl-run lifecycle and persistence: queued -> running -> completed/failed, timestamps, counters, errors.
3. Implement worker/scheduler outside request lifecycle; do not crawl synchronously from dashboard.
4. Google Search Console OAuth/token storage and sync job; GA4 OAuth and sync job.
5. Rank provider integration (licensed/approved data source; avoid scraping Google SERPs).
6. Backlink provider integration (requires provider credentials/plan).
7. AI insights endpoint consumes persisted SEO facts; outputs suggestions only.
8. Dashboard reads aggregated rows and job statuses.

## Deployment note
Vercel Hobby has a 12 Serverless Function limit in this repository's previous deploy. Do not add one endpoint per engine. Consolidate SEO actions behind existing SEO API/router or reduce function count before deployment. Deploy only after tests and route-count check.
