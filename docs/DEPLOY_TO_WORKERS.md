# 🚀 Deploy Frontend Next.js su Cloudflare Workers

## Architettura

```
┌─────────────────────────────────────┐
│ Cloudflare Workers                  │
├─────────────────────────────────────┤
│                                     │
│ Worker 1: chatbot-studio-web        │
│ - Next.js frontend (OpenNext)       │
│ - Route: /*.                        │
│ - SSR + Static assets               │
│                                     │
│ Worker 2: api-worker (esistente)    │
│ - Backend API                       │
│ - Route: /api/*                     │
│                                     │
└─────────────────────────────────────┘
```

## Step 1: Login Wrangler

```bash
cd C:\Users\Gabri\Chatbot\apps\web
npx wrangler login
```

Questo aprirà il browser per autenticarti.

## Step 2: Verifica Build

```bash
# Assicurati che il build sia aggiornato
npm run clean
npm run build
npm run pages:build
```

**Verifica output:**
```bash
ls -la .open-next/worker.js
ls -la .open-next/assets/
```

Devono esistere entrambi.

## Step 3: Deploy

```bash
npx wrangler deploy
```

**Output atteso:**
```
✨ Successfully published your Worker
   https://chatbot-studio-web.<account>.workers.dev
```

## Step 4: Test

Apri l'URL che ti viene dato e verifica:
- ✅ Homepage carica
- ✅ Route dinamiche funzionano
- ✅ Middleware autentica

## Troubleshooting

### Errore: "No wrangler.toml found"

```bash
# Assicurati di essere in apps/web
cd C:\Users\Gabri\Chatbot\apps\web
npx wrangler deploy
```

### Errore: Assets binding non trovato

Verifica `wrangler.toml`:
```toml
[assets]
directory = ".open-next/assets"
binding = "ASSETS"
```

### 404 dopo deploy

```bash
# Controlla i logs live
npx wrangler tail chatbot-studio-web
```

Poi apri il sito e guarda cosa viene loggato.

## Variabili d'Ambiente

Se hai variabili d'ambiente:

```bash
# Aggiungi secrets
npx wrangler secret put NEXT_PUBLIC_API_URL
# Incolla: https://api-worker.xxx.workers.dev

npx wrangler secret put API_URL
# Incolla: https://api-worker.xxx.workers.dev
```

## Collegamento con API Worker

Il frontend chiamerà il Worker API. Assicurati che:

1. **CORS è configurato** nell'api-worker per accettare requests dal frontend Worker
2. **URL API** è impostato correttamente nel frontend

**Esempio CORS in `apps/api-worker`:**
```typescript
app.use('/*', cors({
  origin: [
    'https://chatbot-studio-web.xxx.workers.dev',
    'http://localhost:3000'
  ],
  credentials: true,
}));
```

## Custom Domain (Opzionale)

Dopo che funziona, puoi aggiungere un dominio custom:

```bash
npx wrangler domains add chatbot.tuodominio.com
```

---

**Tutto pronto!** Esegui il deploy e fammi sapere l'URL che ottieni.
