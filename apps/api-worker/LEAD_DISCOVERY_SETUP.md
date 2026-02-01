# Lead Discovery Setup Guide

Il modulo Lead Discovery utilizza API esterne per lo scraping real-time di business data.

## Environment Variables Richieste

Aggiungi queste variabili d'ambiente al tuo Cloudflare Worker:

```bash
# Google Places API
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# Yelp Fusion API
YELP_API_KEY=your_yelp_api_key_here

# OpenAI (già configurato)
OPENAI_API_KEY=your_openai_api_key_here
```

## Come ottenere le API Keys

### 1. Google Places API

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita le seguenti API:
   - Geocoding API
   - Places API
   - Place Details API
4. Vai su "Credentials" → "Create Credentials" → "API Key"
5. Copia la chiave e aggiungi restrizioni (opzionale ma consigliato):
   - Application restrictions: HTTP referrers or IP addresses
   - API restrictions: Limita a Geocoding API, Places API

**Costi**: Google offre $200 di crediti mensili gratuiti. Dopo quello:
- Geocoding: $5 per 1000 richieste
- Places Nearby Search: $32 per 1000 richieste
- Place Details: $17 per 1000 richieste

### 2. Yelp Fusion API

1. Vai su [Yelp Fusion](https://www.yelp.com/developers)
2. Crea un account Yelp Developers
3. Crea una nuova app in "Manage App"
4. Copia l'API Key dalla dashboard

**Costi**:
- **GRATUITO** fino a 5000 chiamate al giorno
- Nessun costo aggiuntivo oltre il limite gratuito (semplicemente limitato)

## Configurazione Cloudflare Worker

### Via Wrangler CLI

```bash
cd apps/api-worker

# Aggiungi secrets (produzione)
npx wrangler secret put GOOGLE_PLACES_API_KEY
npx wrangler secret put YELP_API_KEY
```

### Via Dashboard Cloudflare

1. Vai su Cloudflare Dashboard → Workers
2. Seleziona il tuo worker
3. Vai su "Settings" → "Variables"
4. Aggiungi le variabili come "Environment Variables" (encrypted)

## Test delle API

### Test Google Places

```bash
curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=41.9028,12.4964&radius=5000&keyword=restaurant&key=YOUR_API_KEY"
```

### Test Yelp

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" "https://api.yelp.com/v3/businesses/search?location=Milan,Italy&term=restaurant"
```

## Funzionamento del Sistema

1. **User Input**: L'utente inserisce obiettivo di ricerca (es. "ristoranti senza booking online")
2. **Multi-Source Scraping**:
   - Google Places API cerca business nella location specificata
   - Yelp API cerca business correlati
   - I risultati vengono combinati e de-duplicati
3. **Website Analysis**: Per ogni business con website, controlla presenza di sistema booking
4. **AI Analysis** (GPT-5-mini): Analizza ogni lead e genera score 0-100
5. **Email Generation** (GPT-5-mini): Genera email personalizzata per outreach

## Data Sources Supportate

- ✅ **Google Maps** (via Places API) - REAL DATA
- ✅ **Yelp** (via Fusion API) - REAL DATA
- 🚧 **Facebook Places** - TODO (richiede Graph API)
- 🚧 **Yellow Pages** - TODO (richiede web scraping custom)

## Limiti e Rate Limits

### Google Places
- 5000 richieste/giorno (gratis)
- Ogni search richiede: 1 geocode + 1 search + N details (uno per business)
- Esempio: 10 business = ~12 API calls

### Yelp
- 5000 richieste/giorno (gratis)
- 1 richiesta = 1 search (fino a 20 business)

### Raccomandazioni
- Per 100 discovery searches/giorno con 10-20 results: sei ampiamente sotto i limiti
- Implementare caching dei risultati per location comuni
- Monitorare usage tramite dashboard API providers

## Troubleshooting

### "Error searching Google Places"
- Verifica che GOOGLE_PLACES_API_KEY sia configurato correttamente
- Controlla che le API siano abilitate su Google Cloud Console
- Verifica billing account attivo (anche per tier gratuito)

### "Error searching Yelp"
- Verifica che YELP_API_KEY sia configurato correttamente
- Controlla di non aver superato il limite di 5000 richieste/giorno
- Verifica che la location sia valida (Yelp supporta US, CA, UK, IE, AU, NZ, molti paesi EU)

### "Location not found"
- Google Geocoding non ha trovato la location
- Prova con formato più specifico: "Milan, Italy" invece di "Milano"
- Verifica spelling e formato location

## Alternative (Se non vuoi usare API a pagamento)

Se vuoi evitare Google Places (dopo i crediti gratuiti):

1. **OpenStreetMap Nominatim** (geocoding gratuito)
2. **Overpass API** (POI data gratuito)
3. **Web Scraping diretto** (più complesso, rischio legal/blocking)

Contattami se vuoi implementare alternative gratuite!
