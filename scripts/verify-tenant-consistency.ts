/**
 * Verify Multi-Tenant Consistency
 *
 * This script checks for organizationId mismatches between Users and their Bots.
 * Run this BEFORE trying to create documents to ensure everything is aligned.
 *
 * Run with: npm run db:verify-tenant
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Issue {
  type: 'user_no_org' | 'bot_no_org' | 'bot_org_mismatch';
  userId?: string;
  userEmail?: string;
  botId?: string;
  botName?: string;
  userOrg?: string | null;
  botOrg?: string | null;
}

async function main() {
  console.log('🔍 Verifying multi-tenant consistency...\n');

  const issues: Issue[] = [];

  // Check 1: Users without organization membership
  console.log('📊 Checking users without organization membership...');
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

  for (const user of usersWithoutOrg) {
    issues.push({
      type: 'user_no_org',
      userId: user.id,
      userEmail: user.email,
    });
  }

  console.log(`   Found ${usersWithoutOrg.length} user(s) without organization\n`);

  // Check 2: Bots without organizationId
  console.log('📊 Checking bots without organizationId...');
  const botsWithoutOrg = await prisma.bot.findMany({
    where: {
      OR: [
        { organizationId: null },
        { organizationId: '' },
      ]
    },
    include: {
      creator: {
        select: {
          email: true,
        }
      }
    }
  });

  for (const bot of botsWithoutOrg) {
    issues.push({
      type: 'bot_no_org',
      botId: bot.id,
      botName: bot.name,
      userEmail: bot.creator.email,
    });
  }

  console.log(`   Found ${botsWithoutOrg.length} bot(s) without organizationId\n`);

  // Check 3: Bots where organizationId doesn't match creator's organization
  console.log('📊 Checking for organization mismatches between users and their bots...');
  const allBots = await prisma.bot.findMany({
    where: {
      organizationId: {
        not: null,
      }
    },
    include: {
      creator: {
        include: {
          organizations: {
            select: {
              organizationId: true,
            }
          }
        }
      }
    }
  });

  for (const bot of allBots) {
    const userOrgIds = bot.creator.organizations.map(m => m.organizationId);

    if (userOrgIds.length === 0) {
      issues.push({
        type: 'user_no_org',
        userId: bot.creator.id,
        userEmail: bot.creator.email,
        botId: bot.id,
        botName: bot.name,
        botOrg: bot.organizationId,
      });
    } else if (!userOrgIds.includes(bot.organizationId!)) {
      issues.push({
        type: 'bot_org_mismatch',
        userId: bot.creator.id,
        userEmail: bot.creator.email,
        botId: bot.id,
        botName: bot.name,
        userOrg: userOrgIds[0],
        botOrg: bot.organizationId,
      });
    }
  }

  const mismatchCount = issues.filter(i => i.type === 'bot_org_mismatch').length;
  console.log(`   Found ${mismatchCount} organization mismatch(es)\n`);

  // Report results
  console.log('='.repeat(70));
  console.log('📋 VERIFICATION REPORT');
  console.log('='.repeat(70));

  if (issues.length === 0) {
    console.log('\n✅ All checks passed! Multi-tenant structure is consistent.\n');
    console.log('You can safely create documents now.\n');
  } else {
    console.log(`\n❌ Found ${issues.length} issue(s) that need to be fixed:\n`);

    // Group by type
    const userNoOrgIssues = issues.filter(i => i.type === 'user_no_org');
    const botNoOrgIssues = issues.filter(i => i.type === 'bot_no_org');
    const mismatchIssues = issues.filter(i => i.type === 'bot_org_mismatch');

    if (userNoOrgIssues.length > 0) {
      console.log(`\n1️⃣  Users without organization (${userNoOrgIssues.length}):`);
      userNoOrgIssues.slice(0, 5).forEach(issue => {
        console.log(`   ❌ ${issue.userEmail} (${issue.userId})`);
      });
      if (userNoOrgIssues.length > 5) {
        console.log(`   ... and ${userNoOrgIssues.length - 5} more`);
      }
    }

    if (botNoOrgIssues.length > 0) {
      console.log(`\n2️⃣  Bots without organizationId (${botNoOrgIssues.length}):`);
      botNoOrgIssues.slice(0, 5).forEach(issue => {
        console.log(`   ❌ "${issue.botName}" owned by ${issue.userEmail}`);
      });
      if (botNoOrgIssues.length > 5) {
        console.log(`   ... and ${botNoOrgIssues.length - 5} more`);
      }
    }

    if (mismatchIssues.length > 0) {
      console.log(`\n3️⃣  Organization mismatches (${mismatchIssues.length}):`);
      mismatchIssues.slice(0, 5).forEach(issue => {
        console.log(`   ❌ Bot "${issue.botName}" (org: ${issue.botOrg})`);
        console.log(`      owned by ${issue.userEmail} (org: ${issue.userOrg})`);
      });
      if (mismatchIssues.length > 5) {
        console.log(`   ... and ${mismatchIssues.length - 5} more`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('💡 RECOMMENDED ACTIONS:');
    console.log('='.repeat(70));
    console.log('\nRun the fix script to resolve these issues:');
    console.log('\n   npm run db:fix-multi-tenant\n');
    console.log('This will:');
    console.log('  • Create default organizations for users without one');
    console.log('  • Link all bots to their creator\'s organization');
    console.log('  • Ensure all organizationIds are properly aligned\n');
  }

  console.log('='.repeat(70) + '\n');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
