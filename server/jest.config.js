/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  maxWorkers: 1,
  testTimeout: 15000,
  verbose: true,
  testPathIgnorePatterns: ['/node_modules/'],
  restoreMocks: true
};
