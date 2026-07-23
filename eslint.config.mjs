import js from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tsdoc from 'eslint-plugin-tsdoc';

export default [
	js.configs.recommended,
	prettierConfig,
	{
		ignores: ['out/**', 'dist/**', '**/*.d.ts'],
	},
	{
		files: ['*.cjs', '*.mjs'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'script',
			globals: {
				__dirname: 'readonly',
				__filename: 'readonly',
				module: 'readonly',
				require: 'readonly',
				exports: 'readonly',
				process: 'readonly',
				console: 'readonly',
			},
		},
		rules: {
			'prettier/prettier': 'error',
		},
		plugins: {
			prettier: prettier,
		},
	},
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
			},
			globals: {
				__dirname: 'readonly',
				fetch: 'readonly',
				URLSearchParams: 'readonly',
				TextEncoder: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tsEslint,
			prettier: prettier,
			tsdoc: tsdoc,
		},
		rules: {
			...tsEslint.configs.recommended.rules,
			'prettier/prettier': 'error',
			'tsdoc/syntax': 'error',
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'import',
					format: ['camelCase', 'PascalCase'],
				},
			],
			curly: 'warn',
			eqeqeq: 'warn',
			'no-throw-literal': 'warn',
		},
	},
	{
		files: ['src/test/**/*.ts'],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: 'module',
			},
			globals: {
				__dirname: 'readonly',
				suite: 'readonly',
				test: 'readonly',
				suiteSetup: 'readonly',
				suiteTeardown: 'readonly',
				setup: 'readonly',
				teardown: 'readonly',
			},
		},
		plugins: {
			'@typescript-eslint': tsEslint,
			prettier: prettier,
			tsdoc: tsdoc,
		},
		rules: {
			...tsEslint.configs.recommended.rules,
			'prettier/prettier': 'error',
			'tsdoc/syntax': 'off',
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'import',
					format: ['camelCase', 'PascalCase'],
				},
			],
			curly: 'warn',
			eqeqeq: 'warn',
			'no-throw-literal': 'warn',
		},
	},
];
