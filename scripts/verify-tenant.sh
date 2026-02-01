#!/bin/bash

# Database URL
DB_URL='postgresql://neondb_owner:npg_qn5AHM7BGxfW@ep-rough-art-aggq8j1i-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require'

echo "🔍 Verifying multi-tenant consistency..."
echo ""

# Check 1: Users without organization membership
echo "📊 Checking users without organization membership..."
psql "$DB_URL" -c "
SELECT u.id, u.email, u.name
FROM users u
LEFT JOIN organization_members om ON u.id = om.\"userId\"
WHERE om.id IS NULL;
" -t

echo ""

# Check 2: Bots without organizationId
echo "📊 Checking bots without organizationId..."
psql "$DB_URL" -c "
SELECT b.id, b.name, u.email as creator_email
FROM bots b
JOIN users u ON b.\"userId\" = u.id
WHERE b.\"organizationId\" IS NULL OR b.\"organizationId\" = '';
" -t

echo ""

# Check 3: Organization mismatches between users and their bots
echo "📊 Checking for organization mismatches..."
psql "$DB_URL" -c "
SELECT
    b.id as bot_id,
    b.name as bot_name,
    b.\"organizationId\" as bot_org,
    u.email as user_email,
    om.\"organizationId\" as user_org
FROM bots b
JOIN users u ON b.\"userId\" = u.id
LEFT JOIN organization_members om ON u.id = om.\"userId\"
WHERE b.\"organizationId\" IS NOT NULL
  AND (om.\"organizationId\" IS NULL OR b.\"organizationId\" != om.\"organizationId\");
" -t

echo ""
echo "✅ Verification complete!"
