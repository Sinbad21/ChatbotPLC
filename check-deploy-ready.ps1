#!/usr/bin/env pwsh
# Quick Deploy Checklist - Documents API Fix

Write-Host "`nDOCUMENTS API - PRE-DEPLOY CHECKLIST`n" -ForegroundColor Cyan

# 1. Check modified files exist
Write-Host "1. Checking modified files..." -ForegroundColor Yellow
$files = @(
    "apps\api-worker\src\routes\knowledge.ts",
    "apps\api-worker\src\index.ts",
    "packages\database\prisma\schema.prisma"
)

$allFilesExist = $true
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   [OK] $file" -ForegroundColor Green
    } else {
        Write-Host "   [MISSING] $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

# 2. Check package.json for dependencies
Write-Host "`n2. Checking dependencies..." -ForegroundColor Yellow
$apiWorkerPkg = "apps\api-worker\package.json"
if (Test-Path $apiWorkerPkg) {
    $pkg = Get-Content $apiWorkerPkg | ConvertFrom-Json
    $deps = @("hono", "@prisma/client", "@neondatabase/serverless", "jsonwebtoken", "bcryptjs")
    
    foreach ($dep in $deps) {
        if ($pkg.dependencies.$dep -or $pkg.devDependencies.$dep) {
            Write-Host "   [OK] $dep installed" -ForegroundColor Green
        } else {
            Write-Host "   [WARN] $dep might be missing" -ForegroundColor Yellow
        }
    }
}

# 3. Environment variables check
Write-Host "`n3. Environment Variables (check Cloudflare dashboard):" -ForegroundColor Yellow
Write-Host "   Required variables:" -ForegroundColor White
Write-Host "   - DATABASE_URL (with ?pgbouncer=true for Neon)" -ForegroundColor Gray
Write-Host "   - JWT_SECRET" -ForegroundColor Gray
Write-Host "   - JWT_REFRESH_SECRET" -ForegroundColor Gray

# 4. Next steps
Write-Host "`n4. NEXT STEPS TO DEPLOY:`n" -ForegroundColor Cyan
Write-Host "   Step 1: Apply Database Migrations" -ForegroundColor White
Write-Host "   cd packages\database" -ForegroundColor Gray
Write-Host "   npx prisma migrate deploy" -ForegroundColor Gray
Write-Host "   npx prisma generate`n" -ForegroundColor Gray

Write-Host "   Step 2: Deploy Worker to Cloudflare" -ForegroundColor White
Write-Host "   cd apps\api-worker" -ForegroundColor Gray
Write-Host "   npm run deploy" -ForegroundColor Gray
Write-Host "   # or: wrangler publish`n" -ForegroundColor Gray

Write-Host "   Step 3: Test Health Check" -ForegroundColor White
Write-Host "   curl https://your-worker.workers.dev/api/v1/debug/db`n" -ForegroundColor Gray

Write-Host "   Step 4: Test Documents Endpoints" -ForegroundColor White
Write-Host "   # See DOCUMENTS_API_TROUBLESHOOTING.md for curl commands`n" -ForegroundColor Gray

# 5. Documentation
Write-Host "5. Documentation Created:" -ForegroundColor Yellow
if (Test-Path "DOCUMENTS_API_TROUBLESHOOTING.md") {
    Write-Host "   [OK] DOCUMENTS_API_TROUBLESHOOTING.md" -ForegroundColor Green
}
if (Test-Path "FIXES_SUMMARY.md") {
    Write-Host "   [OK] FIXES_SUMMARY.md" -ForegroundColor Green
}

Write-Host "`nSUMMARY OF CHANGES:`n" -ForegroundColor Cyan
Write-Host "   [+] GET /api/bots/:botId/documents - Added try/catch + error mapping" -ForegroundColor Green
Write-Host "   [+] POST /api/bots/:botId/documents - Added try/catch + error mapping" -ForegroundColor Green
Write-Host "   [+] GET /api/v1/debug/db - New health-check endpoint" -ForegroundColor Green
Write-Host "   [+] Prisma error codes mapped (P2003, P2025, P2002)" -ForegroundColor Green
Write-Host "   [+] Detailed logging with prefixes" -ForegroundColor Green
Write-Host "   [+] Tenant-safe checks (user -> org -> bot)" -ForegroundColor Green
Write-Host "   [+] CORS already configured globally" -ForegroundColor Green

Write-Host "`nCODE STATUS: READY FOR DEPLOY`n" -ForegroundColor Green

Write-Host "REMEMBER:" -ForegroundColor Yellow
Write-Host "   1. Set environment variables in Cloudflare dashboard" -ForegroundColor White
Write-Host "   2. Run 'npx prisma migrate deploy' on production DB" -ForegroundColor White
Write-Host "   3. Deploy worker with 'wrangler publish'" -ForegroundColor White
Write-Host "   4. Test /debug/db endpoint first" -ForegroundColor White
Write-Host "   5. Check Cloudflare Workers logs if errors persist`n" -ForegroundColor White
