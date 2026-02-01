# Review Bot - Documentazione Tecnica

## Panoramica

Il Review Bot è un sistema per raccogliere automaticamente recensioni Google dopo ogni acquisto. Si integra con Stripe, WooCommerce e Shopify.

## Architettura
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Dashboard (/dashboard/review-bot)                               │
│  ├── page.tsx          → Dashboard principale + stats           │
│  ├── ReviewBotWizard   → Configurazione 4-step                  │
│  ├── ReviewBotSettings → Impostazioni modal                     │
│  └── WidgetSnippet     → Codice embed                           │
├─────────────────────────────────────────────────────────────────┤
│  Widget (/widget/review)                                         │
│  ├── page.tsx          → Widget iframe                          │
│  └── test/page.tsx     → Pagina test sviluppo                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API (Cloudflare Worker)                      │
├─────────────────────────────────────────────────────────────────┤
│  /api/review-bot                                                 │
│  ├── GET /              → Lista review bots                     │
│  ├── POST /             → Crea review bot                       │
│  ├── GET /:id           → Dettaglio + stats                     │
│  ├── PATCH /:id         → Aggiorna                              │
│  └── DELETE /:id        → Elimina                               │
├─────────────────────────────────────────────────────────────────┤
│  /api/review-widget (pubblico, CORS *)                          │
│  ├── GET /:widgetId           → Config widget                   │
│  ├── POST /:widgetId/respond  → Submit rating                   │
│  ├── POST /:widgetId/feedback → Submit feedback testo           │
│  ├── POST /:widgetId/google-click → Track click Google          │
│  └── GET /:widgetId/embed.js  → Script embeddabile              │
├─────────────────────────────────────────────────────────────────┤
│  /api/webhooks (eCommerce)                                       │
│  ├── POST /stripe/review      → Webhook Stripe                  │
│  ├── POST /woocommerce/review → Webhook WooCommerce             │
│  └── POST /shopify/review     → Webhook Shopify                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (PostgreSQL)                       │
├─────────────────────────────────────────────────────────────────┤
│  ReviewBot             → Configurazione bot                     │
│  EcommerceConnection   → Credenziali piattaforme                │
│  ReviewRequest         → Richieste inviate                      │
│  ReviewResponse        → Risposte ricevute                      │
└─────────────────────────────────────────────────────────────────┘
```

## Flow Completo
```
1. Cliente completa acquisto su eCommerce
                    │
                    ▼
2. Webhook arriva (Stripe/WooCommerce/Shopify)
   → Crea ReviewRequest con sessionId unico
                    │
                    ▼
3. Cliente viene redirectato a thank-you page
   URL: https://tuosito.com/grazie?review=true
                    │
                    ▼
4. Script embed rileva ?review=true
   → Carica widget iframe dopo delay (2s default)
                    │
                    ▼
5. Widget mostra survey (Emoji/Stars/NPS)
   → Cliente clicca rating
                    │
                    ▼
6. POST /api/review-widget/{widgetId}/respond
   → Salva ReviewResponse con rating
                    │
                    ├─── Rating >= 4 (positivo)
                    │    → Mostra CTA "Lascia recensione su Google"
                    │    → Click tracciato via /google-click
                    │    → Apre Google Review in new tab
                    │
                    └─── Rating < 4 (negativo)
                         → Mostra textarea feedback
                         → Submit via /feedback
                         → NO link Google Review
                    │
                    ▼
7. Messaggio completamento + auto-close (3s)
   → localStorage: rb_responded_{widgetId} = true
```

## Configurazione Webhook

### Stripe

1. Dashboard Stripe → Developers → Webhooks
2. Add endpoint: `https://api.chatbotstudio.io/api/webhooks/stripe/review`
3. Eventi da selezionare:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.succeeded`
4. Copia Webhook Secret → inserisci nel wizard

### WooCommerce

1. WooCommerce → Settings → Advanced → Webhooks
2. Add webhook:
   - Name: Review Bot
   - Status: Active
   - Topic: Order completed
   - Delivery URL: `https://api.chatbotstudio.io/api/webhooks/woocommerce/review`
   - Secret: genera e copia nel wizard

### Shopify

1. Settings → Notifications → Webhooks
2. Create webhook:
   - Event: Order paid
   - URL: `https://api.chatbotstudio.io/api/webhooks/shopify/review`
   - Format: JSON
3. Copia webhook secret nel wizard

## Embed Widget

### Script Base
```html
<script src="https://app.chatbotstudio.io/api/review-widget/{widgetId}/embed.js" async></script>
```

### Auto-trigger

Il widget si attiva automaticamente con questi URL params:
- `?review=true`
- `?rb=1`
- `?feedback=true`

### API JavaScript
```javascript
// Mostra widget
ReviewBot.show();

// Mostra anche se già risposto
ReviewBot.show({ force: true });

// Nascondi widget
ReviewBot.hide();

// Reset stato (testing)
ReviewBot.reset();

// Check se già risposto
ReviewBot.hasResponded(); // true/false
```

### Trigger Custom
```html
<button onclick="ReviewBot.show()">Lascia un feedback</button>
```

## Metriche Dashboard

| Metrica | Calcolo |
|---------|---------|
| Richieste Inviate | `COUNT(ReviewRequest)` |
| Risposte | `COUNT(ReviewResponse)` |
| Response Rate | `(Risposte / Richieste) * 100` |
| Feedback Positivi | `COUNT(rating >= threshold)` |
| Positive Rate | `(Positivi / Risposte) * 100` |
| Click Google | `COUNT(clickedGoogleReview = true)` |
| Google Click Rate | `(Click / Positivi) * 100` |

## Tipi Survey

### EMOJI (default)
```
😞  😕  😐  😊  😍
1   2   3   4   5
```

### STARS
```
☆  ☆  ☆  ☆  ☆
1  2  3  4  5
```

### NPS (Net Promoter Score)
```
0  1  2  3  4  5  6  7  8  9  10
Detractors | Passives | Promoters
```

## Soglia Positivo

- Default: 4
- Configurabile: 1-5
- Rating >= soglia → mostra Google Review CTA
- Rating < soglia → mostra textarea feedback (no Google)

## LocalStorage Keys

| Key | Valore | Uso |
|-----|--------|-----|
| `rb_session_{widgetId}` | Session ID | Identifica sessione utente |
| `rb_responded_{widgetId}` | `"true"` | Evita widget multipli |

## PostMessage Events

| Event | Direzione | Uso |
|-------|-----------|-----|
| `REVIEW_BOT_CLOSE` | Widget → Parent | Chiudi iframe |
| `REVIEW_BOT_RESPONDED` | Widget → Parent | Marca come risposto |
| `REVIEW_BOT_RESIZE` | Widget → Parent | Resize iframe (future) |

## Sicurezza

- **Webhook Signature**: Verificata per Stripe, WooCommerce, Shopify
- **CORS**: Widget endpoints aperti (`*`), API CRUD protette
- **Rate Limiting**: TODO - da implementare
- **Encryption**: TODO - credenziali eCommerce da cifrare at rest

## File Structure
```
apps/web/src/
├── app/
│   ├── dashboard/review-bot/
│   │   └── page.tsx
│   └── widget/review/
│       ├── page.tsx
│       └── test/page.tsx
├── components/
│   ├── dashboard/
│   │   ├── wizards/ReviewBotWizard.tsx
│   │   └── review-bot/
│   │       ├── ReviewBotSettings.tsx
│   │       ├── WidgetSnippet.tsx
│   │       └── index.ts
│   └── icons/
│       ├── BrandIcons.tsx
│       └── index.ts
├── hooks/
│   └── useReviewBot.ts
└── types/
    ├── review-bot.ts
    └── index.ts

apps/api-worker/src/routes/
├── review-bot.ts
├── review-widget.ts
└── webhooks-ecommerce.ts

packages/database/prisma/
├── schema.prisma (+ 9 nuovi modelli)
└── seed-products.ts
```

## TODO / Prossimi Step

- [ ] Connessione Prisma reale (sostituire mock)
- [ ] Test E2E widget flow
- [ ] Email notifications (recap settimanale)
- [ ] Encryption credenziali eCommerce
- [ ] Rate limiting endpoints
- [ ] Analytics grafici temporali
- [ ] Multi-language widget
- [ ] A/B testing survey types
