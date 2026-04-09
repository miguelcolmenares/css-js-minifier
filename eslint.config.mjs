import js from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

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
		},
		rules: {
			...tsEslint.configs.recommended.rules,
			'prettier/prettier': 'error',
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
			},
		},
		plugins: {
			'@typescript-eslint': tsEslint,
			prettier: prettier,
		},
		rules: {
			...tsEslint.configs.recommended.rules,
			'prettier/prettier': 'error',
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
