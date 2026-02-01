# Environment Variables Documentation

Complete guide to all environment variables required for the Chatbot Studio booking widget system.

---

## 📧 Email Service (Resend)

### RESEND_API_KEY
- **Required:** Yes (for email notifications)
- **Type:** String
- **Description:** API key from Resend for sending booking confirmation and notification emails
- **How to get:**
  1. Sign up at [resend.com](https://resend.com)
  2. Create a new API key in the dashboard
  3. Verify your sending domain
- **Example:** `re_123abc456def789...`
- **Set with:** `wrangler secret put RESEND_API_KEY`

### EMAIL_FROM_ADDRESS
- **Required:** Yes (for email notifications)
- **Type:** Email address
- **Description:** Verified sender email address (must be verified in Resend dashboard)
- **Example:** `bookings@yourdomain.com`
- **Set in:** `wrangler.toml` [vars] section or as environment variable

---

## 🗄️ Database

### DATABASE_URL
- **Required:** Yes
- **Type:** PostgreSQL connection string
- **Description:** Connection string for Prisma to connect to your PostgreSQL database
- **Example:** `postgresql://user:password@host:5432/database?schema=public`
- **Set with:** `wrangler secret put DATABASE_URL` or in wrangler.toml [vars]

---

## ⚡ Cloudflare KV (Optional - for distributed rate limiting)

### RATE_LIMIT_KV
- **Required:** No (falls back to in-memory if not configured)
- **Type:** KV Namespace binding
- **Description:** Cloudflare KV namespace for distributed rate limiting across workers
- **Setup:**
  ```bash
  # 1. Create KV namespace
  wrangler kv:namespace create "RATE_LIMIT_KV"

  # 2. Add to wrangler.toml
  [[kv_namespaces]]
  binding = "RATE_LIMIT_KV"
  id = "your_namespace_id_here"
  ```

---

## 🔐 Google Calendar OAuth (If using calendar integration)

### GOOGLE_CLIENT_ID
- **Required:** Yes (for calendar features)
- **Type:** String
- **Description:** OAuth 2.0 client ID from Google Cloud Console
- **How to get:**
  1. Go to [Google Cloud Console](https://console.cloud.google.com)
  2. Create a new project (or select existing)
  3. Enable Google Calendar API
  4. Create OAuth 2.0 credentials
  5. Copy the Client ID
- **Example:** `123456789-abc123.apps.googleusercontent.com`
- **Set in:** `wrangler.toml` [vars] or as environment variable

### GOOGLE_CLIENT_SECRET
- **Required:** Yes (for calendar features)
- **Type:** String
- **Description:** OAuth 2.0 client secret from Google Cloud Console
- **Set with:** `wrangler secret put GOOGLE_CLIENT_SECRET`
- **Example:** `GOCSPX-abc123...`

### GOOGLE_REDIRECT_URI
- **Required:** Yes (for calendar features)
- **Type:** URL
- **Description:** OAuth callback URL (must match Google Cloud Console configuration)
- **Example:** `https://yourdomain.com/api/calendar/callback`
- **Set in:** `wrangler.toml` [vars]

---

## 🌍 Multi-Language Support

### DEFAULT_LOCALE
- **Required:** No
- **Type:** String (`it` or `en`)
- **Description:** Default language for the booking widget
- **Default:** `it` (Italian)
- **Example:** `en`
- **Set in:** `wrangler.toml` [vars]

---

## 🎨 Widget Customization (Optional overrides)

These can also be configured per-calendar in the dashboard:

### WIDGET_DEFAULT_TITLE
- **Type:** String
- **Default:** "Prenota un Appuntamento"
- **Description:** Default title for booking widgets

### WIDGET_DEFAULT_SUBTITLE
- **Type:** String
- **Default:** "Scegli una data e un orario che funzionano per te"
- **Description:** Default subtitle

### WIDGET_DEFAULT_CONFIRM_MESSAGE
- **Type:** String
- **Default:** "La tua prenotazione è stata confermata! Riceverai un'email di conferma."
- **Description:** Default confirmation message

---

## 🚀 Setting Up Environment Variables

### For Local Development

Create `.env` file in `apps/api-worker`:

```env
# Email
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM_ADDRESS=bookings@yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/chatbot

# Google Calendar
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/calendar/callback

# Optional
DEFAULT_LOCALE=it
```

### For Production (Cloudflare Workers)

#### 1. Set Secrets (sensitive data)

```bash
cd apps/api-worker

# Email API key
wrangler secret put RESEND_API_KEY

# Database URL
wrangler secret put DATABASE_URL

# Google OAuth secret
wrangler secret put GOOGLE_CLIENT_SECRET
```

#### 2. Set Public Variables in wrangler.toml

```toml
[vars]
EMAIL_FROM_ADDRESS = "bookings@yourdomain.com"
GOOGLE_CLIENT_ID = "your_client_id.apps.googleusercontent.com"
GOOGLE_REDIRECT_URI = "https://yourdomain.com/api/calendar/callback"
DEFAULT_LOCALE = "it"

# KV Namespace for rate limiting (optional)
[[kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your_kv_namespace_id"
```

---

## ✅ Verification Checklist

Before deploying to production, ensure:

- [  ] RESEND_API_KEY is set and valid
- [  ] EMAIL_FROM_ADDRESS is verified in Resend dashboard
- [  ] DATABASE_URL is set and database is accessible
- [  ] Google OAuth credentials are configured (if using calendar)
- [  ] KV namespace is created and bound (optional, for distributed workers)
- [  ] All secrets are set with `wrangler secret put`
- [  ] wrangler.toml has all public variables configured
- [  ] Domain is configured for email sending

---

## 🔍 Troubleshooting

### Email not sending
1. Check RESEND_API_KEY is set: `wrangler secret list`
2. Verify EMAIL_FROM_ADDRESS in Resend dashboard
3. Check logs: `wrangler tail`
4. Ensure domain is verified in Resend

### Rate limiting not working across workers
1. Verify KV namespace is bound correctly
2. Check wrangler.toml has correct binding name (`RATE_LIMIT_KV`)
3. Falls back to in-memory if KV not configured (works but not distributed)

### Database connection errors
1. Check DATABASE_URL format
2. Ensure database allows connections from Cloudflare IPs
3. Consider using connection pooling (PgBouncer)

### Google Calendar OAuth errors
1. Verify redirect URI matches exactly in Google Cloud Console
2. Check client ID and secret are correct
3. Ensure Google Calendar API is enabled

---

## 📚 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Cloudflare Workers KV](https://developers.cloudflare.com/kv/)
- [Google Calendar API](https://developers.google.com/calendar)
- [Prisma Database](https://www.prisma.io/docs)

---

**Last updated:** November 2025
**Version:** 2.0 (with optional enhancements)
