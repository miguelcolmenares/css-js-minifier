import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
	files: 'out/test/**/*.test.js',
	version: process.env.VSCODE_VERSION || '1.90.0',
});
