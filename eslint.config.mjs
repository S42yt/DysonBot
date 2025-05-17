import { Linter } from 'eslint';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import eslintPluginPrettier from 'eslint-plugin-prettier';

export default /** @type {Linter.Config[]} */ ([
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      semi: ['error', 'always'],
      quotes: ['error', 'double'],
    },
    ignores: ['dist/**'],
  },
  {
    files: ['**/*.js'],
    rules: {
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
    },
    ignores: ['dist/**'],
  },
]);
