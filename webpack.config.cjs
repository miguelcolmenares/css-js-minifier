//@ts-check

'use strict';

const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/**
 * Builds the extension bundle configuration.
 *
 * @param {{ coverage?: boolean }} [env] - Webpack `--env` flags. `--env coverage` is set only by `npm run test:coverage`.
 * @returns {WebpackConfig}
 */
const createExtensionConfig = (env = {}) => ({
	target: 'node', // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

	entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
	output: {
		// the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2',
		// Coverage only: map the bundle back to the absolute paths of `src/**` so c8 can read
		// the sources. Webpack's default `webpack://<name>/./src/...` paths resolve to nothing,
		// which makes c8 report every file at a bogus 100% or 0%. Left unset otherwise, so
		// regular builds and the shipped source maps never carry machine-specific paths.
		...(env.coverage && { devtoolModuleFilenameTemplate: '[absolute-resource-path]' }),
	},
	externals: {
		vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
		lightningcss: 'commonjs lightningcss', // native module with Rust bindings - cannot be bundled by webpack
		'oxc-minify': 'commonjs oxc-minify', // native module with Rust bindings - cannot be bundled by webpack
		// modules added here also need to be added in the .vscodeignore file
	},
	resolve: {
		// support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
		extensions: ['.ts', '.js'],
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'@/lib': path.resolve(__dirname, 'src/lib'),
			'@/types': path.resolve(__dirname, 'src/types'),
			'@/utils': path.resolve(__dirname, 'src/utils'),
			'@/services': path.resolve(__dirname, 'src/services'),
			'@/commands': path.resolve(__dirname, 'src/commands'),
		},
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader',
					},
				],
			},
		],
	},
	devtool: 'nosources-source-map',
	infrastructureLogging: {
		level: 'log', // enables logging required for problem matchers
	},
});

/** @param {{ coverage?: boolean }} [env] */
module.exports = (env) => [createExtensionConfig(env)];
