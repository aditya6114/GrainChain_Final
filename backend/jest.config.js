/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  clearMocks: true,
  verbose: true,

  // Runs before any test file is loaded — sets fake env vars
  // so Zod validation doesn't crash during module import
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],

  // Force Jest to exit after all tests complete — prevents hanging
  // from background connections (Redis, BullMQ) that get created at import time
  forceExit: true,
}
