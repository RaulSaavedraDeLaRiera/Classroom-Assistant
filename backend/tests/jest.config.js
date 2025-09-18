module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/api/**/*.test.js'],
  collectCoverageFrom: [
    '**/api/**/*.js',
    '!**/node_modules/**',
    '!**/coverage/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: [],
  testTimeout: 10000,
  verbose: true,
  
  // TypeScript support
  preset: 'ts-jest',
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strictPropertyInitialization: false, // Allow properties without initializers
      },
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};
