// Script per verificare un utente - da eseguire con: npx ts-node scripts/check-user.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          organization: {
            include: {
              subscriptions: {
                where: { status: 'active' },
                include: { plan: true },
              },
              _count: { select: { bots: true } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.log(' Utente non trovato:', email);
    return;
  }

  console.log('\n=== UTENTE ===');
  console.log('ID:', user.id);
  console.log('Nome:', user.name);
  console.log('Email:', user.email);
  console.log('Ruolo:', user.role);
  console.log('Creato:', user.createdAt);

  for (const membership of user.memberships) {
    console.log('\n=== ORGANIZZAZIONE ===');
    console.log('ID:', membership.organization.id);
    console.log('Nome:', membership.organization.name);
    console.log('Piano (campo):', membership.organization.plan);
    console.log('Ruolo membro:', membership.role);
    console.log('Bot creati:', membership.organization._count.bots);

    if (membership.organization.subscriptions.length > 0) {
      const sub = membership.organization.subscriptions[0];
      console.log('\n=== SUBSCRIPTION ATTIVA ===');
      console.log('Piano:', sub.plan?.name);
      console.log('Max Bots:', sub.plan?.maxBots);
      console.log('Max Conversazioni:', sub.plan?.maxConversations);
      console.log('Status:', sub.status);
      console.log('Scade:', sub.currentPeriodEnd);
    } else {
      console.log('\n  NESSUNA SUBSCRIPTION ATTIVA - Trattato come FREE');
      console.log('Limiti applicati: 1 bot, 1000 conv/mese, 3 docs/bot');
    }
  }

  await prisma.$disconnect();
}

checkUser('reater811@gmail.it');
