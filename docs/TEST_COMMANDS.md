# Test Commands - Documents API

## 🔧 Comandi Curl Pronti all'Uso

Sostituisci:
- `YOUR_WORKER_URL` con il tuo URL Cloudflare Worker (es: `https://api-worker.your-account.workers.dev`)
- `YOUR_ACCESS_TOKEN` con il token JWT ottenuto dal login
- `BOT_ID` con l'ID del bot da testare

---

## 1. Health Check - Database Connection

### Test connessione database
```bash
curl https://YOUR_WORKER_URL/api/v1/debug/db
```

**Expected Response (Success)**:
```json
{
  "ok": true,
  "database": "connected",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "counts": {
    "users": 5,
    "organizations": 3,
    "bots": 2,
    "documents": 10
  }
}
```

**Expected Response (Error)**:
```json
{
  "ok": false,
  "error": "Database connection failed",
  "code": "P2024",
  "message": "Connection timed out",
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

---

## 2. Authentication - Get Token

### Login
```bash
curl -X POST https://YOUR_WORKER_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

**Expected Response**:
```json
{
  "user": {
    "id": "clxxxxxx",
    "email": "your-email@example.com",
    "name": "Your Name",
    "role": "USER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Salva l'accessToken** per usarlo nei prossimi comandi!

---

## 3. Documents Endpoints

### 3.1 GET - Fetch All Documents for a Bot

```bash
curl https://YOUR_WORKER_URL/api/bots/BOT_ID/documents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (Success)**:
```json
{
  "documents": [
    {
      "id": "clxxxxxx",
      "title": "Product Documentation",
      "content": "This is the content...",
      "createdAt": "2025-11-01T10:00:00.000Z"
    },
    {
      "id": "clyyyyyy",
      "title": "FAQ Document",
      "content": "Frequently asked questions...",
      "createdAt": "2025-11-02T15:30:00.000Z"
    }
  ]
}
```

**Expected Response (Bot Not Found)**:
```json
{
  "error": "Bot not found"
}
```
Status: 404

**Expected Response (Database Error - P2025)**:
```json
{
  "error": "Resource not found",
  "code": "P2025",
  "message": "Record to update not found."
}
```
Status: 404

---

### 3.2 POST - Create New Document

```bash
curl -X POST https://YOUR_WORKER_URL/api/bots/BOT_ID/documents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Document Title",
    "content": "This is the content of my document. It can be very long text with markdown, code examples, etc."
  }'
```

**Expected Response (Success)**:
```json
{
  "id": "clzzzzzz",
  "botId": "clxxxxxx",
  "title": "New Document Title",
  "content": "This is the content of my document...",
  "createdAt": "2025-11-03T10:30:00.000Z"
}
```
Status: 201

**Expected Response (Validation Error)**:
```json
{
  "error": "title and content are required"
}
```
Status: 400

**Expected Response (FK Constraint - P2003)**:
```json
{
  "error": "Foreign key constraint failed",
  "details": "The bot does not exist or has been deleted",
  "code": "P2003"
}
```
Status: 409

---

### 3.3 DELETE - Delete Document

```bash
curl -X DELETE https://YOUR_WORKER_URL/api/documents/DOCUMENT_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response (Success)**:
```json
{
  "success": true
}
```

**Expected Response (Not Found)**:
```json
{
  "error": "Document not found"
}
```
Status: 404

---

## 4. Common Error Scenarios

### 4.1 Unauthorized (No Token)
```bash
curl https://YOUR_WORKER_URL/api/bots/BOT_ID/documents
```

**Response**:
```json
{
  "error": "Unauthorized"
}
```
Status: 401

### 4.2 Invalid Token
```bash
curl https://YOUR_WORKER_URL/api/bots/BOT_ID/documents \
  -H "Authorization: Bearer INVALID_TOKEN"
```

**Response**:
```json
{
  "error": "Invalid token"
}
```
Status: 401

### 4.3 User Without Organization
```json
{
  "error": "User has no organization assigned"
}
```
Status: 403

**Fix**: Assicurati che l'utente abbia un record in `organization_members`

### 4.4 Bot Not in User's Organization
```json
{
  "error": "Bot not found or access denied"
}
```
Status: 404

**Fix**: Verifica che `bot.organizationId` corrisponda all'organization dell'utente

---

## 5. PowerShell Examples (Windows)

### Health Check
```powershell
Invoke-RestMethod -Uri "https://YOUR_WORKER_URL/api/v1/debug/db" -Method GET
```

### Login & Save Token
```powershell
$response = Invoke-RestMethod -Uri "https://YOUR_WORKER_URL/api/v1/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"your@email.com","password":"password"}'

$token = $response.accessToken
Write-Host "Token saved: $token"
```

### GET Documents
```powershell
$headers = @{
  "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "https://YOUR_WORKER_URL/api/bots/BOT_ID/documents" `
  -Method GET `
  -Headers $headers
```

### POST Document
```powershell
$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type" = "application/json"
}

$body = @{
  title = "Test Document"
  content = "This is test content"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://YOUR_WORKER_URL/api/bots/BOT_ID/documents" `
  -Method POST `
  -Headers $headers `
  -Body $body
```

---

## 6. Quick Test Script (PowerShell)

Salva come `test-documents-api.ps1`:

```powershell
# Configuration
$baseUrl = "https://YOUR_WORKER_URL"
$email = "your@email.com"
$password = "your-password"
$botId = "YOUR_BOT_ID"

Write-Host "Testing Documents API..." -ForegroundColor Cyan

# 1. Test Health Check
Write-Host "`n1. Testing /debug/db..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/v1/debug/db" -Method GET
    if ($health.ok) {
        Write-Host "   [OK] Database connected" -ForegroundColor Green
        Write-Host "   Users: $($health.counts.users), Bots: $($health.counts.bots), Docs: $($health.counts.documents)" -ForegroundColor Gray
    } else {
        Write-Host "   [ERROR] Database not connected: $($health.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "   [ERROR] Health check failed: $_" -ForegroundColor Red
}

# 2. Login
Write-Host "`n2. Testing login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $email
        password = $password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginBody

    $token = $loginResponse.accessToken
    Write-Host "   [OK] Login successful" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.email)" -ForegroundColor Gray
} catch {
    Write-Host "   [ERROR] Login failed: $_" -ForegroundColor Red
    exit
}

# 3. GET Documents
Write-Host "`n3. Testing GET /documents..." -ForegroundColor Yellow
try {
    $headers = @{ "Authorization" = "Bearer $token" }
    $docs = Invoke-RestMethod -Uri "$baseUrl/api/bots/$botId/documents" `
        -Method GET `
        -Headers $headers

    Write-Host "   [OK] Retrieved $($docs.documents.Count) documents" -ForegroundColor Green
    foreach ($doc in $docs.documents) {
        Write-Host "   - $($doc.title) (ID: $($doc.id))" -ForegroundColor Gray
    }
} catch {
    Write-Host "   [ERROR] GET failed: $_" -ForegroundColor Red
}

# 4. POST Document
Write-Host "`n4. Testing POST /documents..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $docBody = @{
        title = "Test Document $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        content = "This is a test document created at $(Get-Date)"
    } | ConvertTo-Json

    $newDoc = Invoke-RestMethod -Uri "$baseUrl/api/bots/$botId/documents" `
        -Method POST `
        -Headers $headers `
        -Body $docBody

    Write-Host "   [OK] Document created" -ForegroundColor Green
    Write-Host "   ID: $($newDoc.id)" -ForegroundColor Gray
    Write-Host "   Title: $($newDoc.title)" -ForegroundColor Gray
} catch {
    Write-Host "   [ERROR] POST failed: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`nTests completed!`n" -ForegroundColor Cyan
```

**Esegui con**:
```powershell
.\test-documents-api.ps1
```

---

## 7. Debugging Tips

### Get Full Error Details (PowerShell)
```powershell
try {
    $result = Invoke-RestMethod -Uri "https://YOUR_WORKER_URL/api/bots/BOT_ID/documents" `
        -Method POST `
        -Headers @{"Authorization" = "Bearer $token"; "Content-Type" = "application/json"} `
        -Body '{"title":"Test","content":"Test"}'
} catch {
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
}
```

### Check Cloudflare Logs
1. Vai a Cloudflare Dashboard
2. Workers & Pages → api-worker
3. Logs → Real-time Logs
4. Cerca prefissi: `[GET /documents]`, `[POST /documents]`, `[DEBUG /db]`

---

## ✅ Success Criteria

Dopo deploy, verifica che:
1. ✅ `/api/v1/debug/db` → `ok: true`
2. ✅ Login restituisce `accessToken`
3. ✅ GET documents → array con status 200
4. ✅ POST document → nuovo doc con status 201
5. ✅ Nessun errore nei Cloudflare logs

---

**Pro Tip**: Usa [Postman](https://www.postman.com/) o [Insomnia](https://insomnia.rest/) per salvare queste richieste e testarle facilmente!
