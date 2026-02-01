# Chatbot Studio - Setup & Deploy Guide

Complete guide for setting up and deploying Chatbot Studio locally and to production (Cloudflare).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Database Setup (Neon)](#database-setup-neon)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Production Deployment](#production-deployment)
- [Multi-Channel Setup](#multi-channel-setup)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 18+ and npm
- **Neon PostgreSQL** account (free tier available)
- **Cloudflare** account (for production)
- **OpenAI API key** (required for chat functionality)
- Optional: **Stripe**, **SendGrid**, **WhatsApp Business API**

---

## Local Development Setup

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/yourusername/Chatbot.git
cd Chatbot

# Install dependencies
npm install
```

### 2. Setup Neon Database

1. Create account at [neon.tech](https://neon.tech)
2. Create new project (select region closest to you)
3. Copy connection string from dashboard
4. Example: `postgresql://user:pass@ep-xxx.neon.tech/chatbot_studio?sslmode=require`

### 3. Configure Environment Variables

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
nano .env
```

**Minimum required variables for local dev:**

```bash
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-32-chars-min"
JWT_REFRESH_SECRET="your-refresh-secret-32-chars"
OPENAI_API_KEY="sk-..."
FRONTEND_URL="http://localhost:3000"
```

### 4. Initialize Database

```bash
# Generate Prisma client
cd packages/database
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed database
npx prisma db seed
```

### 5. Verify Setup

```bash
# Check Prisma connection
cd packages/database
npx prisma studio
# This opens a web UI at http://localhost:5555
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@...` |
| `JWT_SECRET` | Secret for access tokens (min 32 chars) | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `openssl rand -base64 32` |
| `OPENAI_API_KEY` | OpenAI API key for GPT models | `sk-...` |

### Optional but Recommended

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `SMTP_HOST` | SMTP server for emails | - |
| `STRIPE_SECRET_KEY` | Stripe for payments | - |
| `MAX_FILE_SIZE` | Max upload size (bytes) | `26214400` (25MB) |

See [.env.example](.env.example) for complete list.

---

## Running Locally

### Option 1: Run All Apps (Recommended)

```bash
# From root directory
npm run dev
```

This starts:
- **Frontend** (Next.js): http://localhost:3000
- **API Server** (Express): http://localhost:3001
- **Widget** (Vite): http://localhost:5173

### Option 2: Run Individual Apps

```bash
# Frontend only
cd apps/web
npm run dev

# API only
cd apps/api
npm run dev

# Widget only
cd apps/widget
npm run dev
```

### Access the App

1. Open http://localhost:3000
2. Register new account
3. Create your first bot
4. Test in the Test tab

---

## Production Deployment

### Cloudflare Pages (Frontend)

1. **Build the frontend:**

```bash
cd apps/web
npm ci
npm run build
```

2. **Deploy to Cloudflare Pages:**

```bash
# Using Wrangler CLI
npx wrangler pages deploy .next/standalone --project-name=chatbot-studio

# Or use Cloudflare Dashboard:
# 1. Go to Workers & Pages > Create > Pages > Upload
# 2. Upload .next/standalone folder
```

3. **Set environment variables in Cloudflare:**

Go to Pages > Settings > Environment variables:

```bash
NEXT_PUBLIC_WORKER_API_URL="https://chatbotstudio.YOUR_SUBDOMAIN.workers.dev"
```

### Cloudflare Workers (API)

1. **Configure wrangler.toml:**

```toml
# apps/api-worker/wrangler.toml
name = "chatbotstudio"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
NODE_ENV = "production"

# Add secrets via CLI (never commit!)
# wrangler secret put DATABASE_URL
# wrangler secret put JWT_SECRET
# wrangler secret put OPENAI_API_KEY
```

2. **Deploy Worker:**

```bash
cd apps/api-worker
npm install
npm run build
npx wrangler deploy
```

3. **Add secrets:**

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put JWT_REFRESH_SECRET
npx wrangler secret put OPENAI_API_KEY
```

### Database Migrations (Production)

```bash
# Run migrations against production DB
cd packages/database
npx prisma migrate deploy
```

⚠️ **IMPORTANT**: Always backup production database before migrations!

---

## Multi-Channel Setup

### WhatsApp Business API

1. **Create Meta Developer Account**: https://developers.facebook.com/
2. **Create App** > WhatsApp > Get Started
3. **Get credentials:**
   - Phone Number ID
   - API Key
   - Webhook Verify Token

4. **Configure webhook endpoint:**

```bash
# Your webhook URL
https://chatbotstudio.YOUR_SUBDOMAIN.workers.dev/api/v1/webhooks/whatsapp

# Set in Meta Developer Console:
# - Callback URL: [webhook URL]
# - Verify Token: [your token from .env]
# - Subscribe to: messages
```

5. **Add to .env:**

```bash
WHATSAPP_API_KEY="..."
WHATSAPP_PHONE_NUMBER_ID="..."
WHATSAPP_WEBHOOK_TOKEN="..."
```

### Telegram Bot

1. **Create bot**: Message @BotFather on Telegram
2. **Get token**: `/newbot` command
3. **Set webhook:**

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://chatbotstudio.YOUR_SUBDOMAIN.workers.dev/api/v1/webhooks/telegram"
  }'
```

4. **Add to .env:**

```bash
TELEGRAM_BOT_TOKEN="..."
```

### Slack App

1. **Create Slack App**: https://api.slack.com/apps
2. **Enable Socket Mode** OR **Set Request URL**
3. **OAuth Scopes**: `chat:write`, `im:history`, `app_mentions:read`
4. **Install to workspace**

```bash
SLACK_BOT_TOKEN="xoxb-..."
SLACK_SIGNING_SECRET="..."
```

### Discord Bot

1. **Create Application**: https://discord.com/developers/applications
2. **Add Bot** > Get Token
3. **Enable Intents**: Message Content Intent
4. **Invite to server**

```bash
DISCORD_BOT_TOKEN="..."
DISCORD_APPLICATION_ID="..."
```

---

## Testing

### Manual Testing Checklist

**Frontend (Dashboard):**
- [ ] User registration/login
- [ ] Create new bot
- [ ] Upload logo
- [ ] Select AI model (GPT-5, Claude, etc.)
- [ ] Edit system prompt
- [ ] Upload documents (PDF, TXT) <25MB
- [ ] Web scraping - find links via sitemap
- [ ] Test chat interface
- [ ] View conversations
- [ ] Train on reply (FAQ/Intent)
- [ ] Analytics graphs load
- [ ] Language selector works

**Widget:**
- [ ] Widget loads on page
- [ ] Send message with arrow up icon
- [ ] Author name shows above messages
- [ ] Typing indicator shows bot name
- [ ] Theme colors apply correctly

**API (using curl or Postman):**

```bash
# Health check
curl https://chatbotstudio.YOUR_SUBDOMAIN.workers.dev/

# Login
curl -X POST https://chatbotstudio.YOUR_SUBDOMAIN.workers.dev/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# Chat (public endpoint)
curl -X POST https://chatbotstudio.YOUR_SUBDOMAIN.workers.dev/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "botId": "YOUR_BOT_ID",
    "message": "Hello!",
    "sessionId": "test123"
  }'
```

### Automated Tests

```bash
# Run tests (if configured)
npm test

# Lint
npm run lint
```

---

## Troubleshooting

### Common Issues

**Issue: "Prisma Client not generated"**

```bash
cd packages/database
npx prisma generate
```

**Issue: "CORS error from API"**

- Check `FRONTEND_URL` in .env matches your frontend URL
- For Cloudflare, ensure `chatbot-5o5.pages.dev` is in allowed origins

**Issue: "OpenAI API error: unsupported_parameter"**

- Ensure using GPT-5 models with `max_completion_tokens`
- Check API key is valid
- Verify model name is correct (`gpt-5-mini`, not `gpt-5mini`)

**Issue: "Session timeout too fast"**

- Check `SESSION_TIMEOUT_MS` in .env (default 30min = 1800000ms)
- Verify `useSessionActivity` hook is active in dashboard layout

**Issue: "File upload fails"**

- Check `MAX_FILE_SIZE` env var (default 25MB)
- Verify `UPLOAD_DIR` has write permissions
- Cloudflare Workers: use `/tmp` directory

**Issue: "Database connection timeout"**

- Verify Neon database is active (free tier may suspend)
- Check connection string includes `?sslmode=require`
- Test connection: `npx prisma db pull`

**Issue: "Worker deployment fails"**

```bash
# Clear build cache
rm -rf dist/ .wrangler/

# Rebuild
npm run build

# Check wrangler.toml syntax
npx wrangler deploy --dry-run
```

### Debug Mode

Enable verbose logging:

```bash
DEBUG=true npm run dev
```

### Logs

**Local:**
- Check terminal output
- API logs: `apps/api/logs/`

**Production (Cloudflare):**
```bash
# Stream worker logs
npx wrangler tail
```

**Neon Database:**
- Dashboard > Operations > Query History
- Enable slow query logging

---

## Architecture Overview

```
Chatbot Studio
├── apps/
│   ├── web/              # Next.js 14 Frontend (Cloudflare Pages)
│   ├── api/              # Express API (optional, for local dev)
│   ├── api-worker/       # Cloudflare Workers API (production)
│   └── widget/           # Embeddable chat widget (Vite)
├── packages/
│   ├── database/         # Prisma ORM + Schema (23 tables)
│   ├── auth/             # JWT + Password hashing
│   ├── email/            # SMTP email service
│   ├── document-processor/ # PDF, TXT processing
│   ├── language-detector/  # Auto-detect user language
│   └── multi-channel/    # WhatsApp, Telegram, Slack, Discord adapters
└── scripts/              # Utility scripts
```

**Database**: Neon PostgreSQL (serverless)
**Hosting**: Cloudflare Pages + Workers
**AI**: OpenAI, Anthropic, Google AI

---

## Performance Optimization

### Frontend (Next.js)

- Use `next build` with static optimization
- Enable image optimization
- Lazy load components with `React.lazy()`

### API (Workers)

- Minimize cold starts: keep worker warm
- Use Prisma connection pooling (`@prisma/adapter-neon`)
- Cache frequently accessed data
- Rate limit public endpoints

### Database

- Create indexes on frequently queried fields
- Use `select` to limit returned fields
- Enable Neon connection pooling
- Monitor slow queries in dashboard

---

## Security Checklist

- [x] CORS configured for production domains
- [x] JWT tokens expire (15min access, 7d refresh)
- [x] Passwords hashed with bcrypt (10 rounds)
- [x] Session timeout after 30min inactivity
- [x] API keys masked in frontend
- [x] Rate limiting on public endpoints
- [x] SQL injection prevention (Prisma ORM)
- [x] XSS prevention (React escaping)
- [ ] Enable HTTPS only (Cloudflare auto)
- [ ] Add CSP headers
- [ ] Implement 2FA (optional)
- [ ] Setup audit logging
- [ ] Configure WAF rules (Cloudflare)

---

## Support & Resources

- **Documentation**: [docs/](./docs/)
- **API Reference**: [API.md](./API.md)
- **GitHub Issues**: https://github.com/yourusername/Chatbot/issues
- **Cloudflare Docs**: https://developers.cloudflare.com/
- **Prisma Docs**: https://www.prisma.io/docs
- **Neon Docs**: https://neon.tech/docs

---

## License

MIT License - see [LICENSE](./LICENSE)

---

**Last Updated**: November 2025
**Version**: 1.0.0
