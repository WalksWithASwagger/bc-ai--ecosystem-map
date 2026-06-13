/**
 * Vitest Setup File
 *
 * This file runs before all tests and sets up the test environment.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';

// Mock environment variables that tests might need
process.env.NOTION_TOKEN = 'test_token_12345';
process.env.NOTION_DATABASE_ID = 'test_database_id_12345';

// Global setup
beforeAll(() => {
  // Setup code that runs once before all tests
});

// Global teardown
afterAll(() => {
  // Cleanup code that runs once after all tests
});

// Cleanup after each test
afterEach(() => {
  // Reset mocks, clear timers, etc.
});

// Extend expect matchers if needed
// import { expect } from 'vitest';
// expect.extend({ ... });
