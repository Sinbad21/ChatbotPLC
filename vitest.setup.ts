// Vitest setup file - runs before all tests
import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup test environment
beforeAll(() => {
  // Load test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/chatbot_test';
});

// Clean up after each test
afterEach(() => {
  // Reset mocks if needed
});

// Clean up after all tests
afterAll(() => {
  // Close database connections, etc.
});
