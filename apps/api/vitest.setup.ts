// Vitest setup for API tests
import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
beforeAll(() => {
  dotenv.config({ path: '.env.test' });

  // Set test environment
  process.env.NODE_ENV = 'test';

  // Set test secrets
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only-do-not-use-in-production';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-testing-only';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';

  // Set test database URL (use separate test database)
  if (!process.env.TEST_DATABASE_URL && !process.env.DATABASE_URL) {
    console.warn('⚠️  Warning: No TEST_DATABASE_URL set. Tests may affect development database!');
  }

  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
});

afterAll(async () => {
  // Cleanup after all tests
  // Close database connections, clear caches, etc.
});
