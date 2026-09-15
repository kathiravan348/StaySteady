// ESLint — kept minimal for a personal project (decision 13): recommended presets only.
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['**/dist/**', '**/node_modules/**', 'Docs/**'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  { files: ['**/*.tsx'], ...jsxA11y.flatConfigs.recommended },
  { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: globals.node } },
  // Must stay last: turns off stylistic rules that Prettier owns.
  eslintConfigPrettier,
);
