# ChatBot Studio - Claude Session Context

This file provides context for Claude Code sessions working on this project.

## Project Overview

**ChatBot Studio** is a TypeScript/Node.js SaaS platform for creating AI-powered chatbots with multi-tenant support.

**Current Status:** ~52% complete (Beta)
**Live URLs:**
- Frontend: https://chatbotstudio-web.gabrypiritore.workers.dev
- API: https://chatbotstudio.gabrypiritore.workers.dev

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **UI:** React 18.2 + Tailwind CSS + shadcn/ui
- **State:** Zustand
- **Deployment:** Cloudflare Workers (OpenNext)

### Backend
- **API Worker:** Hono framework on Cloudflare Workers
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Prisma 5.7
- **Auth:** JWT (access + refresh tokens)

### AI
- **Model:** OpenAI GPT-4o-mini
- **Integration:** Direct OpenAI API (no LangChain)

---

## Project Structure

```
Chatbot/
├── apps/
│   ├── api-worker/          # Main API (Cloudflare Workers + Hono)
│   │   ├── src/
│   │   │   ├── index.ts     # Main entry, all routes registered here
│   │   │   ├── routes/      # API route handlers
│   │   │   └── services/    # Business logic (calendar, email, etc.)
│   │   └── wrangler.toml    # Cloudflare config
│   │
│   ├── web/                 # Frontend (Next.js)
│   │   ├── src/app/         # App Router pages
│   │   ├── src/components/  # React components
│   │   └── wrangler.toml    # Cloudflare config for OpenNext
│   │
│   └── api/                 # Legacy Express API (not in production)
│
├── packages/
│   ├── database/            # Prisma schema and migrations
│   │   └── prisma/schema.prisma
│   ├── multi-channel/       # WhatsApp, Telegram, Slack adapters
│   └── auth/                # Auth utilities
│
└── docs/                    # Documentation
```

---

## Deployment

### API Worker (chatbotstudio)
```bash
cd apps/api-worker
npm run build  # prisma generate + wrangler deploy
```

### Frontend Worker (chatbotstudio-web)
```bash
cd apps/web
npm run pages:deploy  # OpenNext build + wrangler deploy
```

### Cloudflare Workers Build Config
For `chatbotstudio-web`:
- **Build command:** `npm install && cd apps/web && npm run pages:build && npx wrangler deploy`
- **Deploy command:** (leave empty)

---

## Environment Variables & Secrets

### API Worker Secrets (Cloudflare)
```
DATABASE_URL           # Neon PostgreSQL connection string
JWT_SECRET             # JWT signing secret
JWT_REFRESH_SECRET     # Refresh token secret
OPENAI_API_KEY         # OpenAI API key
GOOGLE_CLIENT_ID       # Google OAuth client ID
GOOGLE_CLIENT_SECRET   # Google OAuth client secret
RESEND_API_KEY         # Email service
```

### Frontend Environment
Set in `wrangler.toml`:
```toml
[vars]
NEXT_PUBLIC_API_URL = "https://chatbotstudio.gabrypiritore.workers.dev"
```

---

## Database

### Connection
- **Provider:** Neon serverless PostgreSQL
- **Dashboard:** https://console.neon.tech

### Key Tables
- `users` - User accounts
- `organizations` - Multi-tenant organizations
- `organization_members` - User-org relationships
- `bots` - Chatbot configurations
- `conversations` / `messages` - Chat history
- `documents` - Uploaded documents
- `calendar_connections` - Google Calendar OAuth
- `calendar_events` - Bookings

### Schema Changes
When adding new fields/tables:
1. Update `packages/database/prisma/schema.prisma`
2. Execute SQL directly on Neon (no local prisma db push without .env)
3. Redeploy API worker to regenerate Prisma client

---

## Common Issues & Solutions

### 1. Prisma "table does not exist" Error
**Cause:** Schema has tables that weren't created in production DB
**Solution:** Execute CREATE TABLE SQL on Neon dashboard

### 2. TypeScript implicit 'any' errors
**Cause:** Strict mode enabled
**Solution:** Add explicit types: `(item: any)` or `(item: { field: type })`

### 3. Cloudflare "Missing entry-point" Error
**Cause:** wrangler deploy running from wrong directory
**Solution:** Ensure build command includes `cd apps/web` or `cd apps/api-worker`

### 4. Google OAuth "redirect_uri_mismatch"
**Cause:** Redirect URI not configured in Google Cloud Console
**Solution:** Add exact URI in Google Console → Credentials → OAuth Client → Authorized redirect URIs:
```
https://chatbotstudio.gabrypiritore.workers.dev/calendar/callback/google
```

### 5. Google OAuth "access_denied" (app not verified)
**Cause:** App in testing mode
**Solution:** Add user email in Google Console → OAuth consent screen → Test users

### 6. "Invalid state token" on OAuth callback
**Cause:** Multiple OAuth attempts, old state token
**Solution:** Clear metadata: `UPDATE organizations SET metadata = '{}' WHERE id = '...'`

---

## Features Status

### Working (90%+)
- User authentication (login, register, JWT)
- Bot creation and management
- Document upload and processing
- Google Calendar integration (OAuth, bookings)
- Multi-tenant isolation
- Session timeout (30 min)

### Partially Working (50-80%)
- Analytics dashboard (real data, some features limited)
- Internationalization (EN, IT)
- Chat with AI (basic RAG, no vector search)

### Not Implemented (<30%)
- Stripe billing
- Multi-channel (WhatsApp, Telegram, Slack) - code exists but not connected
- Vector embeddings / semantic search
- Test coverage (0%)

---

## Important Notes

### Organization ID
Currently hardcoded in calendar/bookings pages:
```typescript
const organizationId = 'cmi4xuoi80001hs74layh08yz';
```
**TODO:** Get from auth context after login

### Plan Restrictions
Calendar requires `advanced`, `custom`, or `enterprise` plan:
```typescript
const allowedPlans = ['advanced', 'custom', 'enterprise'];
```
Update organization plan in DB: `UPDATE organizations SET plan = 'advanced' WHERE id = '...'`

---

## Recent Session Summary (Nov 19, 2025)

### What Was Done
1. Fixed Prisma schema errors in calendar routes
2. Added `metadata` field to Organization model
3. Created `calendar_connections` and `calendar_events` tables
4. Fixed TypeScript build errors in multiple packages
5. Fixed Cloudflare Workers build configuration
6. Configured Google Cloud Console for OAuth
7. Successfully tested complete Google Calendar OAuth flow

### What Needs Attention Next
1. Implement organization ID from auth context
2. Add Stripe billing integration
3. Implement vector embeddings for RAG
4. Add test coverage
5. Fix remaining hardcoded values

---

## Quick Commands

```bash
# Deploy API
cd apps/api-worker && npm run build

# Deploy Frontend
cd apps/web && npm run pages:deploy

# View API logs
cd apps/api-worker && npx wrangler tail

# List secrets
cd apps/api-worker && npx wrangler secret list

# Add secret
npx wrangler secret put SECRET_NAME
```

---

**Last Updated:** November 19, 2025
