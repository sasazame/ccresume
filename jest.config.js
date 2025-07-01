export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          moduleResolution: 'node'
        }
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(ink-testing-library|ink|@inkjs|cli-cursor|cli-spinners|log-update|strip-ansi|ansi-regex|ansi-escapes|ansi-styles|chalk)/)'
  ],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/cli.tsx'
  ]
};