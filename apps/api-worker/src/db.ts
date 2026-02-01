import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  OPENAI_API_KEY?: string;
};

function makePrisma(databaseUrl: string) {
  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

/**
 * Get or create Prisma client instance for Cloudflare Workers
 * Creates a NEW instance per request to comply with Workers limitations
 */
export function getPrisma(env: Bindings): PrismaClient {
  // Validate DATABASE_URL
  if (!env?.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from environment variables');
  }

  // Create a NEW Prisma instance for EACH request
  // This is required by Cloudflare Workers - cannot share I/O between requests
  return makePrisma(env.DATABASE_URL);
}
