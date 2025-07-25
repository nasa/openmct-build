module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json'],
    testMatch: ['**/src/**/*.spec.ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    collectCoverageFrom: [
      '**/*.{ts,js}',
      '!**/node_modules/**',
      '!**/scripts/**',
      '!**/coverage/**',
      '!**/jest.config.js'
    ],
    collectCoverage: true
};