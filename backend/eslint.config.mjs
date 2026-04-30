import {defineConfig, globalIgnores} from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import {googleStyleRulesFrom} from '../eslint/google-rules.mjs';

const googleStyleRules = googleStyleRulesFrom(import.meta.url);

/**
 * Express (CommonJS): ESLint recommended + Google JS rules (ESLint 9–safe).
 * Project overrides. Mirrors frontend (`defineConfig`, `globalIgnores`).
 */
export default defineConfig([
  js.configs.recommended,
  {
    rules: googleStyleRules,
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': [
        'error',
        {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
      ],
      'no-console': ['warn', {allow: ['warn', 'error']}],
    },
  },
  globalIgnores(['node_modules/**']),
]);
