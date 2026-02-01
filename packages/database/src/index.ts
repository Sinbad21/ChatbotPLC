import { PrismaClient } from '@prisma/client';

// Prevent multiple Prisma Client instances in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Export all Prisma types
export * from '@prisma/client';

// Export addon codes and utilities
export * from './addon-codes';

// Export Stripe price ID mappings
export * from './stripe-mapping';
