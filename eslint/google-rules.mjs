/**
 * Loads `eslint-config-google` and drops rules that were removed from ESLint core in v9.
 * Frontend: import `googleStyleRules` (resolved via repo root `node_modules`).
 * Backend: use `googleStyleRulesFrom(import.meta.url)` so resolution starts next to
 * `backend/eslint.config.mjs` and picks up `backend/node_modules/eslint-config-google`.
 */
import {createRequire} from 'module';

/** @see https://eslint.org/docs/latest/use/migrate-to-9.0.0 */
const ESLINT_9_REMOVED_FROM_CORE = new Set(['valid-jsdoc', 'require-jsdoc']);

/**
 * @param {string} moduleUrl File URL used for Node resolution (e.g. `import.meta.url`
 *     of the eslint flat config file).
 * @return {Record<string, unknown>}
 */
export function googleStyleRulesFrom(moduleUrl) {
  const require = createRequire(moduleUrl);
  const google = require('eslint-config-google');
  return Object.fromEntries(
    Object.entries(google.rules).filter(
      ([name]) => !ESLINT_9_REMOVED_FROM_CORE.has(name),
    ),
  );
}

export const googleStyleRules = googleStyleRulesFrom(import.meta.url);
