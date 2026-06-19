module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Only run our own logic tests; do not transform native modules we don't unit-test.
  testMatch: ['**/src/**/__tests__/**/*.test.{ts,tsx}'],
};
