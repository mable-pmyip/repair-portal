# Repair Portal - Monorepo

A full-stack repair request management system with Firebase authentication and multi-language support.

## 📁 Structure

```
repair-portal/
├── frontend/          # React + Vite (Cloudflare Pages)
├── api/              # Cloudflare Worker API
└── .github/          # CI/CD workflows
```

## 🚀 Deployment

### Frontend (Cloudflare Pages)

**Auto-deploy (Recommended):**
1. Connect GitHub repo to Cloudflare Pages
2. Set build configuration:
   - **Root directory:** `frontend/`
   - **Build command:** `npm run build`
   - **Build output:** `dist`
   - **Production branch:** `main`

**Manual deploy:**
```bash
cd frontend
npm run build
npx wrangler pages deploy dist
```

### API (Cloudflare Worker)

**Auto-deploy (via GitHub Actions):**
1. Get Cloudflare API Token from [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Add to GitHub repo secrets: `CLOUDFLARE_API_TOKEN`
3. Push to `main` branch - API auto-deploys when `api/` changes

**Manual deploy:**
```bash
cd api
npx wrangler deploy
```

## 🛠️ Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### API
```bash
cd api
npm install
npx wrangler dev
```

## 🔑 Environment Variables

### Frontend (.env in frontend/)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_API_WORKER_URL=https://repair-portal-api.your-account.workers.dev
```

### API (Cloudflare Dashboard - Worker Settings)
```
FIREBASE_WEB_API_KEY=...
```

## 📝 Notes

- Frontend deployed as **Cloudflare Pages** (static hosting)
- API deployed as **Cloudflare Worker** (serverless functions)
- Both auto-deploy on push to `main` branch
- Frontend connects to Firebase for authentication
- API handles user management operations
