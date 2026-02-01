# Database Scripts

This directory contains utility scripts for database maintenance and migrations.

## Backfill Organizations

**File:** `backfillOrganizations.ts`

### Purpose

This script creates organizations for users that were created before the multi-tenant architecture was implemented. It ensures data integrity by:

1. Creating a personal organization for each user without one
2. Assigning the user as OWNER of their organization
3. Updating all their bots to belong to that organization

### When to Run

Run this script **once** after deploying the multi-tenant architecture updates if you have existing users in the database.

### Prerequisites

1. Install tsx if not already installed:
   ```bash
   npm install -D tsx
   ```

2. Ensure `DATABASE_URL` is set in your environment

### How to Run

From the repository root:

```bash
# Set DATABASE_URL environment variable
export DATABASE_URL="your-database-connection-string"

# Run the script
npx tsx packages/database/scripts/backfillOrganizations.ts
```

### What It Does

The script will:
- ✅ Find all users in the database
- ✅ Skip users who already have an organization
- ✅ For users without an organization:
  - Create a personal workspace (e.g., "John's Workspace")
  - Generate a unique slug (e.g., "john-workspace")
  - Assign the user as OWNER
  - Update all their bots to belong to this organization
- ✅ Run all operations in a transaction (all-or-nothing)

### Safety

- **Idempotent:** Safe to run multiple times (skips users who already have organizations)
- **Transactional:** Each user is processed in a transaction, ensuring data consistency
- **Non-destructive:** Only creates new records and updates bot references, never deletes data

### Output Example

```
🚀 Starting organization backfill...

📊 Found 5 total users

🔧 Processing user: john@example.com
   ✅ Created organization: John's Workspace (john-workspace)
   ✅ Assigned user as OWNER
   ✅ Assigned 3 bot(s) to organization
   ✅ Successfully processed user john@example.com

✅ User jane@example.com already has an organization - skipping

🎉 Backfill completed!
   📊 Processed: 4 users
   ⏭️  Skipped: 1 users (already had organization)
```

### Troubleshooting

If the script fails:
1. Check that `DATABASE_URL` is correctly set
2. Ensure database is accessible
3. Verify Prisma client is generated: `npx prisma generate`
4. Check error messages in the output

For assistance, check the logs or contact the development team.
