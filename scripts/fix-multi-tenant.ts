/**
 * Fix Multi-Tenant Structure for Existing Users
 *
 * This script ensures that all existing users have:
 * 1. An organization membership
 * 2. All their bots linked to their organization
 *
 * Run with: npx tsx scripts/fix-multi-tenant.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Starting multi-tenant fix...\n');

  // Step 1: Find users without organization membership
  const usersWithoutOrg = await prisma.user.findMany({
    where: {
      organizations: {
        none: {}
      }
    },
    select: {
      id: true,
      email: true,
      name: true,
    }
  });

  console.log(`📊 Found ${usersWithoutOrg.length} users without organization\n`);

  let fixed = 0;
  let errors = 0;

  for (const user of usersWithoutOrg) {
    try {
      console.log(`👤 Processing user: ${user.email}`);

      // Create organization slug
      const slugBase = `${user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-workspace`;
      let slug = slugBase;
      let counter = 1;

      // Ensure slug is unique
      while (await prisma.organization.findUnique({ where: { slug } })) {
        slug = `${slugBase}-${counter}`;
        counter++;
      }

      // Create organization + membership in transaction
      await prisma.$transaction(async (tx) => {
        // 1. Create organization
        const organization = await tx.organization.create({
          data: {
            name: `${user.name}'s Workspace`,
            slug,
            plan: 'free',
          },
        });

        console.log(`   ✅ Created organization: ${organization.name} (${organization.id})`);

        // 2. Create membership
        await tx.organizationMember.create({
          data: {
            organizationId: organization.id,
            userId: user.id,
            role: 'OWNER',
          },
        });

        console.log(`   ✅ Created membership with OWNER role`);

        // 3. Update all user's bots to belong to this organization
        const updatedBots = await tx.bot.updateMany({
          where: { userId: user.id },
          data: { organizationId: organization.id },
        });

        console.log(`   ✅ Updated ${updatedBots.count} bot(s) to organization\n`);
      });

      fixed++;
    } catch (error: any) {
      console.error(`   ❌ Error processing user ${user.email}:`, error.message);
      errors++;
    }
  }

  // Step 2: Find bots without organizationId
  const orphanBots = await prisma.bot.findMany({
    where: {
      OR: [
        { organizationId: null },
        { organizationId: '' },
      ]
    },
    include: {
      creator: {
        include: {
          organizations: {
            take: 1,
            select: {
              organizationId: true,
            }
          }
        }
      }
    }
  });

  console.log(`\n📊 Found ${orphanBots.length} bot(s) without organization\n`);

  for (const bot of orphanBots) {
    try {
      const userOrgId = bot.creator.organizations[0]?.organizationId;

      if (!userOrgId) {
        console.log(`   ⚠️  Bot "${bot.name}" owner has no organization, skipping...`);
        continue;
      }

      await prisma.bot.update({
        where: { id: bot.id },
        data: { organizationId: userOrgId },
      });

      console.log(`   ✅ Fixed bot "${bot.name}" -> organization ${userOrgId}`);
      fixed++;
    } catch (error: any) {
      console.error(`   ❌ Error fixing bot ${bot.name}:`, error.message);
      errors++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✨ Multi-tenant fix complete!');
  console.log('='.repeat(50));
  console.log(`✅ Fixed: ${fixed}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('='.repeat(50) + '\n');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
