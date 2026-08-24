import { vi } from 'vitest';

// Env vars required by controllers
process.env.JWT_SECRET = 'test-secret-key-long-enough-for-hs256';
process.env.JWT_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';

// Mock express-validator so validationResult() always returns no errors in unit tests
vi.mock('express-validator', async (importOriginal) => {
  const actual = await importOriginal<typeof import('express-validator')>();
  return {
    ...actual,
    validationResult: vi.fn(() => ({ isEmpty: () => true, array: () => [] })),
  };
});

// Auto-mock Prisma so no real DB is needed in unit tests
vi.mock('../config/database.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    contact: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));
