# Cloudflare Workers API

API convertita da Express a Hono per Cloudflare Workers.

## Setup

1. **Installa dipendenze:**
```bash
npm install
```

2. **Configura segreti:**
```bash
npx wrangler secret put DATABASE_URL
# Incolla la connection string di Neon PostgreSQL

npx wrangler secret put JWT_SECRET
# Incolla una stringa random sicura

npx wrangler secret put JWT_REFRESH_SECRET
# Incolla un'altra stringa random sicura
```

3. **Test locale:**
```bash
npm run dev
# API disponibile su http://localhost:8787
```

4. **Deploy su Cloudflare:**
```bash
npm run deploy
```

## Endpoints Implementati

- ✅ POST `/api/v1/auth/register` - Registrazione utente
- ✅ POST `/api/v1/auth/login` - Login
- ✅ GET `/api/v1/bots` - Lista bot
- ✅ POST `/api/v1/bots` - Crea bot
- ✅ GET `/api/v1/bots/:id` - Dettaglio bot
- ✅ POST `/api/v1/chat` - Chat pubblico
- ✅ GET `/api/v1/chat/:botId/config` - Config widget
- ✅ GET `/api/v1/analytics/overview` - Analytics

## Prossimi Step

Per implementare tutti gli endpoint dell'API Express originale:

1. Copia la logica da `apps/api/src/routes/*.ts`
2. Converti da Express a Hono (vedi esempi sopra)
3. Aggiungi route corrispondenti

## Differenze Express vs Hono

**Express:**
```typescript
app.get('/users/:id', (req, res) => {
  const id = req.params.id;
  res.json({ id });
});
```

**Hono:**
```typescript
app.get('/users/:id', (c) => {
  const id = c.req.param('id');
  return c.json({ id });
});
```

## Database

Usa Neon PostgreSQL con l'adapter Prisma:

```typescript
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });
```

## Performance

- Cold start: ~50-100ms
- Response time: ~20-50ms
- Scalabilità: Automatica
- Costo: FREE fino a 100k richieste/giorno
