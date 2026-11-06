# CLIPPER HUB — OAuth Provider Setup

Dokumen ini adalah checklist konfigurasi OAuth untuk deployment Production.

## Production callback URLs

Gunakan callback persis berikut pada Developer Portal provider:

- Google / YouTube / Analytics: `https://managemnet-all-platfrom.vercel.app/api/oauth/callback/google`
- Meta / Facebook / Instagram: `https://managemnet-all-platfrom.vercel.app/api/oauth/callback/meta`
- TikTok: `https://managemnet-all-platfrom.vercel.app/api/oauth/callback/tiktok`
- LinkedIn: `https://managemnet-all-platfrom.vercel.app/api/oauth/callback/linkedin`
- X: `https://managemnet-all-platfrom.vercel.app/api/oauth/callback/x`

Set `OAUTH_REDIRECT_BASE=https://managemnet-all-platfrom.vercel.app` agar callback tidak bergantung pada host request.

## Vercel Production Environment Variables

Tambahkan di Project → Settings → Environment Variables, target **Production**, lalu redeploy:

| Provider | Client ID / Key | Client Secret |
|---|---|---|
| Google | `GOOGLE_CLIENT_ID` | `GOOGLE_CLIENT_SECRET` |
| TikTok | `TIKTOK_CLIENT_KEY` | `TIKTOK_CLIENT_SECRET` |
| Meta | `META_APP_ID` | `META_APP_SECRET` |
| LinkedIn | `LINKEDIN_CLIENT_ID` | `LINKEDIN_CLIENT_SECRET` |
| X | `X_CLIENT_ID` | `X_CLIENT_SECRET` |

Alias yang juga dibaca kode: Google `YOUTUBE_CLIENT_ID/SECRET`; TikTok `TIKTOK_CLIENT_ID`; Meta `META_CLIENT_ID/SECRET`, `FACEBOOK_APP_ID/SECRET`, `INSTAGRAM_APP_ID/SECRET`.

Wajib tersedia:
- `TOKEN_ENCRYPTION_KEY`: tepat 64 karakter hexadecimal (32 byte) untuk AES-256-GCM. Generate dengan `openssl rand -hex 32`. Jangan kirim atau commit key ini.
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Setup per provider

### Google
- Authorized redirect URI: callback Google di atas.
- OAuth consent screen harus disiapkan; gunakan akun test jika aplikasi masih Testing.
- Aktifkan API yang diperlukan: YouTube Data API v3 dan Google Analytics Data API.
- Scope yang diminta aplikasi: OpenID, email, profile, YouTube readonly, Analytics readonly.

### TikTok
- Redirect URI: callback TikTok di atas.
- Tambahkan produk Login Kit dan izin yang dibutuhkan (user.info.basic, video.list).
- Gunakan Client Key sebagai `TIKTOK_CLIENT_KEY`.

### Meta
- Redirect URI: callback Meta di atas.
- Siapkan Meta App, produk Facebook Login, dan permission sesuai kebutuhan (public_profile, pages_show_list, instagram_basic, instagram_manage_insights, ads_read).
- Akses data Pages/Instagram/Ads dapat memerlukan App Review, Business verification, dan role/tester yang sesuai.

### LinkedIn
- Redirect URI: callback LinkedIn di atas.
- Aktifkan produk Sign In with LinkedIn using OpenID Connect dan izin yang sesuai.
- Scope yang diminta: openid, profile, w_member_social.

### X
- Callback URL: callback X di atas.
- Aktifkan OAuth 2.0 Authorization Code with PKCE.
- Scope yang diminta: tweet.read, users.read, offline.access.

## Verifikasi setelah konfigurasi

1. Buka `/api/oauth/status`: provider yang lengkap harus tampil `configured: true`.
2. Klik koneksi provider dari UI atau buka `/api/oauth/start/{provider}`; harus redirect ke consent/login provider (bukan 409).
3. Selesaikan consent; callback mengonsumsi state satu kali dan menukar authorization code.
4. Pastikan tabel `connections` memiliki row provider berstatus Connected dan `token_encrypted` berupa ciphertext AES-GCM (bukan access token plaintext).
5. Uji pemanggilan API provider dengan token terdekripsi di server. Jangan tampilkan token di browser, log, atau response API.
6. Pastikan akun yang benar dan data provider dapat dibaca; token refresh perlu diuji saat access token kedaluwarsa.

## Catatan status implementasi

Routing OAuth start/callback sudah aktif. Penyimpanan token terenkripsi telah ada. Kredensial provider, consent/App Review, identitas akun provider, refresh token lifecycle, dan pengambilan data akun nyata harus diuji setelah masing-masing app credential tersedia. Status `Connected` saat ini belum dengan sendirinya membuktikan seluruh integrasi data provider sudah siap.
