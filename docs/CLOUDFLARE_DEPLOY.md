# Cloudflare Pages Deployment Guide

## Quick Deploy

### 1. Dashboard (Next.js) - Cloudflare Pages

```bash
cd apps/web
npm run build
npx wrangler pages deploy .next --project-name=chatbot-studio
```

### 2. Widget (React) - Cloudflare Pages

```bash
cd apps/widget
npm run build
npx wrangler pages deploy dist --project-name=chatbot-widget
```

### 3. Database - Neon PostgreSQL

1. Create account at https://neon.tech
2. Create project "chatbot-studio"
3. Copy connection string
4. Run migrations:
```bash
cd packages/database
export DATABASE_URL="your-neon-connection-string"
npx prisma db push
```

### 4. API - Option A: Cloudflare Workers

See `apps/api-worker/` for Hono-based implementation

```bash
cd apps/api-worker
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler deploy
```

### 4. API - Option B: Railway/Render

1. Go to https://railway.app
2. New Project > Deploy from GitHub
3. Select repository
4. Set environment variables:
   - DATABASE_URL
   - JWT_SECRET
   - FRONTEND_URL
5. Deploy!

## Environment Variables

### Frontend (Cloudflare Pages)

**Important**: The web app requires the API URL to be configured. Without it, authentication will not work.

#### For Local Development:
Create `apps/web/.env.local`:
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### For Production (Cloudflare Pages):
Set in Cloudflare Pages Dashboard > Settings > Environment Variables:
```
NEXT_PUBLIC_API_URL=https://your-api-worker.your-subdomain.workers.dev
```

Or if using Railway/Render for API:
```
NEXT_PUBLIC_API_URL=https://your-app.railway.app
```

**Note**: After adding environment variables in Cloudflare Pages, trigger a new deployment for changes to take effect.

### API (Workers or Railway)
```
DATABASE_URL=postgresql://user:pass@neon.tech/db
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
FRONTEND_URL=https://your-pages.pages.dev
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
```

## URLs After Deploy

- Dashboard: `https://chatbot-studio.pages.dev`
- Widget: `https://chatbot-widget.pages.dev`
- API: `https://chatbot-api.your-domain.workers.dev` (Workers)
- API: `https://your-app.railway.app` (Railway)

## Custom Domains

Add custom domains in Cloudflare Dashboard:
- `app.yoursite.com` → Dashboard
- `widget.yoursite.com` → Widget
- `api.yoursite.com` → API Worker

## Costs

- **Cloudflare Pages**: FREE (unlimited requests)
- **Cloudflare Workers**: FREE (100k requests/day)
- **Neon PostgreSQL**: FREE (3 projects, 3GB storage)
- **Railway**: $5/month (500 hours)

## Production Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Custom domains configured
- [ ] SSL/TLS enabled (automatic)
- [ ] Email service configured
- [ ] API rate limiting enabled
- [ ] Error monitoring setup (Sentry)
