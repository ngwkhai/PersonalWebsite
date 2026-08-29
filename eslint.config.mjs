import coreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * eslint-config-next 16 ships flat configs directly, so no FlatCompat shim.
 */
const config = [
  {
    ignores: [
      '.next/**',
      '.velite/**',
      'legacy/**',
      'node_modules/**',
      'public/**',
      'lib/ai/knowledge.json',
    ],
  },
  ...coreWebVitals,
  ...nextTypescript,
  {
    // Pinned explicitly: eslint-plugin-react's version auto-detection calls an
    // ESLint 9 context API that ESLint 10 removed, and crashes the run.
    settings: { react: { version: '19.2' } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];

export default config;
