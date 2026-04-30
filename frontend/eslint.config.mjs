import {defineConfig, globalIgnores} from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tseslint from 'typescript-eslint';
import {googleStyleRules} from '../eslint/google-rules.mjs';

/**
 * Next.js + TypeScript + Google style rules (ESLint 9–safe). TS-only disables
 * where core rules conflict with TypeScript (`camelcase`, `indent`,
 * `no-unused-vars`).
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.recommended,
  {
    rules: googleStyleRules,
  },
  {
    rules: {
      'no-console': ['warn', {allow: ['warn', 'error']}],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.{ts,tsx,mts}'],
    rules: {
      'camelcase': 'off',
      'indent': 'off',
      'no-unused-vars': 'off',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);
