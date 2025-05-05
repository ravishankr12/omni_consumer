import eslint from '@eslint/js';
import * as tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: '.',
      },
      globals: {
        console: true,
        window: true,
        document: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-unused-vars': 'off',
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
  prettier, // <- add this line to disable conflicting ESLint rules
  {
    ignores: [
      '**/*.config.js',
      '**/*.config.ts',
      '**/playwright-report/**',
      'node_modules',
      'dist',
      'coverage',
    ],
  },
];
