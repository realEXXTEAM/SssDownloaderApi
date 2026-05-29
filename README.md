# SSS Downloader Backend

Backend Node.js untuk SSS Universal Downloader.

## Deploy ke Railway

1. Push repo ini ke GitHub
2. Buka [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Pilih repo ini → Railway otomatis detect Node.js
4. Selesai! Copy URL backend-nya (contoh: `https://sss-backend.up.railway.app`)
5. Update `BACKEND_URL` di file HTML Netlify lo

## Endpoints

| Endpoint | Platform |
|---|---|
| GET /api/tiktok?url=LINK | TikTok |
| GET /api/instagram?url=LINK | Instagram |
| GET /api/facebook?url=LINK | Facebook |
| GET /api/twitter?url=LINK | Twitter/X |
| GET /api/youtube?url=LINK | YouTube |
