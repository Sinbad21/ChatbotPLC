/**
 * Backfill Script: Create Organizations for existing Users
 *
 * This script fixes data created before the multi-tenant architecture.
 * It creates a personal organization for each user without one,
 * and assigns all their bots to that organization.
 *
 * Run once with: npx tsx packages/database/scripts/backfillOrganizations.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting organization backfill...\n');

  // Get all users
  const allUsers = await prisma.user.findMany({
    include: {
      organizations: true, // OrganizationMember records
      bots: true,
    },
  });

  console.log(`📊 Found ${allUsers.length} total users`);

  let processedCount = 0;
  let skippedCount = 0;

  for (const user of allUsers) {
    // Check if user already has an organization
    if (user.organizations.length > 0) {
      console.log(`✅ User ${user.email} already has an organization - skipping`);
      skippedCount++;
      continue;
    }

    console.log(`\n🔧 Processing user: ${user.email}`);

    // Create slug for organization
    const slugBase = `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-workspace`;
    let slug = slugBase;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${counter}`;
      counter++;
    }

    try {
      // Create organization + membership + update bots in transaction
      await prisma.$transaction(async (tx) => {
        // 1. Create personal organization
        const organization = await tx.organization.create({
          data: {
            name: `${user.name}'s Workspace`,
            slug,
            plan: 'free',
          },
        });

        console.log(`   ✅ Created organization: ${organization.name} (${organization.slug})`);

        // 2. Create organization membership with OWNER role
        await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: user.id,
            role: 'OWNER',
          },
        });

        console.log(`   ✅ Assigned user as OWNER`);

        // 3. Update all user's bots to belong to this organization
        if (user.bots.length > 0) {
          await tx.bot.updateMany({
            where: { userId: user.id },
            data: { organizationId: organization.id },
          });

          console.log(`   ✅ Assigned ${user.bots.length} bot(s) to organization`);
        }
      });

      processedCount++;
      console.log(`   ✅ Successfully processed user ${user.email}`);
    } catch (error: any) {
      console.error(`   ❌ Error processing user ${user.email}:`, error.message);
    }
  }

  console.log(`\n🎉 Backfill completed!`);
  console.log(`   📊 Processed: ${processedCount} users`);
  console.log(`   ⏭️  Skipped: ${skippedCount} users (already had organization)`);
}

main()
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
