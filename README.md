# CLIPPER HUB

Personal workspace management app. Frontend is served from `index.html`; backend uses Vercel Functions under `api/`; persistent data uses Supabase Postgres.

## Deploy
1. Import this private GitHub repository into Vercel (root directory `.`; Node.js 20+).
2. In Supabase SQL Editor, run `db/migrations/001_initial.sql`.
3. Add Vercel Environment Variables from `.env.example`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY`, `OAUTH_REDIRECT_BASE`, and the provider credentials you actually configure.
4. Redeploy after adding environment variables.

## OAuth callback URLs
- `/api/oauth/callback/tiktok`
- `/api/oauth/callback/meta`
- `/api/oauth/callback/google`
- `/api/oauth/callback/linkedin`
- `/api/oauth/callback/x`

Register exact callback URLs in each provider's official developer console. Provider app review, product enablement, scopes, and account eligibility may be required.

## Important
- Never commit `.env` or provider secrets.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- OAuth tokens are encrypted at application level with `TOKEN_ENCRYPTION_KEY` before writing to Supabase.
- This is the backend foundation; post publishing, analytics sync, ad management, and inbox workflows still need provider-specific implementations and approvals.
