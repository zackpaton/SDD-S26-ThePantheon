import js from "@eslint/js";
import globals from "globals";

/**
 * ESLint flat config for the Express server: ESLint recommended plus rules aligned with the Google
 * JavaScript style guide (semicolons, single quotes, spacing). `eslint-config-google` is not used here
 * because it relies on removed ESLint 8 rules (e.g. valid-jsdoc) under ESLint 9.
 */
export default [
  { ignores: ["node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "comma-dangle": ["error", "always-multiline"],
      curly: ["error", "multi-line"],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "keyword-spacing": "error",
      "max-len": [
        "warn",
        {
          code: 100,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreComments: true,
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1 }],
      "no-trailing-spaces": "error",
      "object-curly-spacing": ["error", "always"],
      quotes: ["error", "single", { avoidEscape: true, allowTemplateLiterals: true }],
      semi: ["error", "always"],
      "space-before-blocks": "error",
    },
  },
];
