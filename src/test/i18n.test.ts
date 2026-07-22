/**
 * @fileoverview Internationalization (i18n) test suite for the CSS & JS Minifier extension.
 *
 * This test suite verifies that:
 * 1. All translation files exist and are properly formatted
 * 2. All translation keys are consistent across languages
 * 3. Message interpolation works correctly
 * 4. Language files load properly in VS Code
 *
 * @author Miguel Colmenares
 * @since 1.1.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { t } from '../utils/l10nHelper';

/**
 * Supported languages for the extension
 */
const SUPPORTED_LANGUAGES = [
	{ code: 'en', name: 'English', file: 'package.nls.json' },
	{ code: 'es', name: 'Spanish', file: 'package.nls.es.json' },
	{ code: 'fr', name: 'French', file: 'package.nls.fr.json' },
	{ code: 'de', name: 'German', file: 'package.nls.de.json' },
	{ code: 'pt-br', name: 'Brazilian Portuguese', file: 'package.nls.pt-br.json' },
	{ code: 'ja', name: 'Japanese', file: 'package.nls.ja.json' },
	{ code: 'zh-cn', name: 'Chinese Simplified', file: 'package.nls.zh-cn.json' },
];

/**
 * Runtime message bundle files
 */
const RUNTIME_BUNDLES = [
	{ code: 'en', name: 'English', file: 'bundle.l10n.json' },
	{ code: 'es', name: 'Spanish', file: 'bundle.l10n.es.json' },
	{ code: 'fr', name: 'French', file: 'bundle.l10n.fr.json' },
	{ code: 'de', name: 'German', file: 'bundle.l10n.de.json' },
	{ code: 'pt-br', name: 'Brazilian Portuguese', file: 'bundle.l10n.pt-br.json' },
	{ code: 'ja', name: 'Japanese', file: 'bundle.l10n.ja.json' },
	{ code: 'zh-cn', name: 'Chinese Simplified', file: 'bundle.l10n.zh-cn.json' },
];

/**
 * Expected translation keys in package.nls files
 */
const EXPECTED_PACKAGE_KEYS = [
	'commands.extension.minify.title',
	'commands.extension.minifyInNewFile.title',
	'configuration.title',
	'configuration.minifyOnSave',
	'configuration.minifyInNewFile',
	'configuration.minifiedNewFilePrefix',
	'configuration.minifiedNewFilePrefix.enumDescriptions.1',
	'configuration.minifiedNewFilePrefix.enumDescriptions.2',
	'configuration.minifiedNewFilePrefix.enumDescriptions.3',
	'configuration.minifiedNewFilePrefix.enumDescriptions.4',
	'configuration.minifiedNewFilePrefix.enumDescriptions.5',
	'configuration.minifiedNewFilePrefix.enumDescriptions.6',
	'configuration.autoOpenNewFile',
	'configuration.showSizeReduction',
];

/**
 * Expected translation keys in runtime bundle files.
 *
 * Starting in v1.3.3 the extension follows VS Code's canonical `vscode.l10n` pattern:
 * the English source string is passed to `t()` and is also used as the key in every
 * `bundle.l10n.<locale>.json` file (there is intentionally no `bundle.l10n.en.json` —
 * English works because `vscode.l10n.t(message)` returns `message` when no bundle
 * matches).
 */
const EXPECTED_BUNDLE_KEYS = [
	"File type '{0}' is not supported. Only CSS and JavaScript files can be minified.",
	'Cannot minify empty {0} file. Please add some content first.',
	'File successfully minified and saved as: {0}',
	'File successfully minified and saved as: {0} (Size reduced from {1} to {2}, {3}% reduction)',
	'{0} has been successfully minified.',
	'{0} has been successfully minified (Size reduced from {1} to {2}, {3}% reduction)',
	'Unsupported file type for minification: {0}',
	'CSS minification error: {0}',
	'JavaScript minification error: {0}',
	'CSS & JS Minifier failed to activate: {0}. Check the Output panel for details.',
	'Failed to open file: {0}',
	"Please save the file to disk before using 'Minify and Save as New File'. The new minified file needs an existing location to be created next to.",
];

suite('Internationalization (i18n) Test Suite', function () {
	const workspaceRoot = path.resolve(__dirname, '../../');

	suite('Package.nls Files (Configuration & Commands)', function () {
		test('All language files exist', function () {
			SUPPORTED_LANGUAGES.forEach((lang) => {
				const filePath = path.join(workspaceRoot, lang.file);
				assert.ok(
					fs.existsSync(filePath),
					`${lang.name} translation file (${lang.file}) does not exist at: ${filePath}`
				);
			});
		});

		test('All language files are valid JSON', function () {
			SUPPORTED_LANGUAGES.forEach((lang) => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = fs.readFileSync(filePath, 'utf8');

				try {
					JSON.parse(content);
				} catch (error) {
					assert.fail(`${lang.name} translation file (${lang.file}) contains invalid JSON: ${error}`);
				}
			});
		});

		test('All language files have the same keys', function () {
			// Load the English file as reference
			const englishPath = path.join(workspaceRoot, 'package.nls.json');
			const englishContent = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
			const englishKeys = Object.keys(englishContent).sort();

			// Compare all other languages
			SUPPORTED_LANGUAGES.slice(1).forEach((lang) => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				const keys = Object.keys(content).sort();

				assert.deepStrictEqual(keys, englishKeys, `${lang.name} translation file has different keys than English`);
			});
		});

		test('All expected configuration keys exist', function () {
			SUPPORTED_LANGUAGES.forEach((lang) => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				EXPECTED_PACKAGE_KEYS.forEach((key) => {
					assert.ok(key in content, `${lang.name} is missing key: ${key}`);
					assert.ok(content[key].trim().length > 0, `${lang.name} has empty value for key: ${key}`);
				});
			});
		});

		test('All translation values are non-empty strings', function () {
			SUPPORTED_LANGUAGES.forEach((lang) => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				Object.entries(content).forEach(([key, value]) => {
					assert.strictEqual(typeof value, 'string', `${lang.name} - Key '${key}' should be a string`);
					assert.ok((value as string).trim().length > 0, `${lang.name} - Key '${key}' should not be empty`);
				});
			});
		});
	});

	suite('Bundle.l10n Files (Runtime Messages)', function () {
		const l10nPath = path.join(workspaceRoot, 'l10n');

		test('L10n directory exists', function () {
			assert.ok(fs.existsSync(l10nPath), `L10n directory does not exist at: ${l10nPath}`);
		});

		test('All runtime bundle files exist', function () {
			RUNTIME_BUNDLES.forEach((bundle) => {
				const filePath = path.join(l10nPath, bundle.file);
				assert.ok(
					fs.existsSync(filePath),
					`${bundle.name} runtime bundle (${bundle.file}) does not exist at: ${filePath}`
				);
			});
		});

		test('All runtime bundle files are valid JSON', function () {
			RUNTIME_BUNDLES.forEach((bundle) => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = fs.readFileSync(filePath, 'utf8');

				try {
					JSON.parse(content);
				} catch (error) {
					assert.fail(`${bundle.name} runtime bundle (${bundle.file}) contains invalid JSON: ${error}`);
				}
			});
		});

		test('All runtime bundle files have the same keys', function () {
			// Load the English file as reference
			const englishPath = path.join(l10nPath, 'bundle.l10n.json');
			const englishContent = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
			const englishKeys = Object.keys(englishContent).sort();

			// Compare all other languages
			RUNTIME_BUNDLES.slice(1).forEach((bundle) => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				const keys = Object.keys(content).sort();

				assert.deepStrictEqual(keys, englishKeys, `${bundle.name} runtime bundle has different keys than English`);
			});
		});

		test('All expected runtime message keys exist', function () {
			RUNTIME_BUNDLES.forEach((bundle) => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				EXPECTED_BUNDLE_KEYS.forEach((key) => {
					assert.ok(key in content, `${bundle.name} is missing runtime key: ${key}`);
					assert.ok(content[key].trim().length > 0, `${bundle.name} has empty value for runtime key: ${key}`);
				});
			});
		});

		test('All runtime message values are non-empty strings', function () {
			RUNTIME_BUNDLES.forEach((bundle) => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				Object.entries(content).forEach(([key, value]) => {
					assert.strictEqual(typeof value, 'string', `${bundle.name} - Key '${key}' should be a string`);
					assert.ok((value as string).trim().length > 0, `${bundle.name} - Key '${key}' should not be empty`);
				});
			});
		});

		test('Runtime messages with placeholders use correct format', function () {
			RUNTIME_BUNDLES.forEach((bundle) => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				// Keys that should have placeholders (English source strings used as keys)
				const keysWithPlaceholders = [
					"File type '{0}' is not supported. Only CSS and JavaScript files can be minified.",
					'Cannot minify empty {0} file. Please add some content first.',
					'File successfully minified and saved as: {0}',
					'File successfully minified and saved as: {0} (Size reduced from {1} to {2}, {3}% reduction)',
					'{0} has been successfully minified.',
					'{0} has been successfully minified (Size reduced from {1} to {2}, {3}% reduction)',
					'Unsupported file type for minification: {0}',
					'CSS minification error: {0}',
					'JavaScript minification error: {0}',
					'Failed to open file: {0}',
				];

				keysWithPlaceholders.forEach((key) => {
					const message = content[key];
					assert.ok(message.includes('{0}'), `${bundle.name} - Key '${key}' should contain placeholder {0}`);
				});
			});
		});
	});

	suite('VS Code Integration', function () {
		test('Extension loads commands with localized titles', function () {
			// Read package.json directly from filesystem for reliable testing
			const packageJsonPath = path.join(workspaceRoot, 'package.json');
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

			assert.ok(packageJson.contributes, 'Package.json missing contributes section');
			assert.ok(packageJson.contributes.commands, 'Package.json missing commands');

			// Check that commands use i18n keys
			const commands = packageJson.contributes.commands;
			commands.forEach((cmd: { title: string }) => {
				assert.ok(
					cmd.title.startsWith('%') && cmd.title.endsWith('%'),
					`Command title '${cmd.title}' should use i18n key format (%key%)`
				);
			});
		});

		test('Extension configuration uses localized descriptions', function () {
			// Read package.json directly from filesystem for reliable testing
			const packageJsonPath = path.join(workspaceRoot, 'package.json');
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

			assert.ok(packageJson.contributes.configuration, 'Package.json missing configuration');
			const config = packageJson.contributes.configuration;

			// Check that configuration title uses i18n key
			assert.ok(
				config.title.startsWith('%') && config.title.endsWith('%'),
				'Configuration title should use i18n key format'
			);

			// Check that property descriptions use i18n keys
			Object.values(config.properties as Record<string, { description: string }>).forEach((prop) => {
				assert.ok(
					prop.description.startsWith('%') && prop.description.endsWith('%'),
					`Property description '${prop.description}' should use i18n key format`
				);
			});
		});
	});

	suite('Translation Quality', function () {
		test('No translations contain only English text for non-English languages', function () {
			// Common English-only patterns that shouldn't appear in translations
			const englishPatterns = [
				/\bMinify this File\b/,
				/\bMinify and Save as New File\b/,
				/\bJS & CSS Minifier Tool Configuration\b/,
				/\bMinify files automatically on save\b/,
			];

			SUPPORTED_LANGUAGES.slice(1).forEach((lang) => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				Object.entries(content).forEach(([key, value]) => {
					englishPatterns.forEach((pattern) => {
						assert.ok(
							!pattern.test(value as string),
							`${lang.name} - Key '${key}' appears to contain untranslated English text: '${value}'`
						);
					});
				});
			});
		});

		test('Translations preserve placeholder format', function () {
			// Load English bundle to get reference placeholders
			const englishPath = path.join(workspaceRoot, 'l10n', 'bundle.l10n.json');
			const englishContent = JSON.parse(fs.readFileSync(englishPath, 'utf8'));

			RUNTIME_BUNDLES.slice(1).forEach((bundle) => {
				const filePath = path.join(workspaceRoot, 'l10n', bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				Object.entries(englishContent).forEach(([key, englishValue]) => {
					const translatedValue = content[key];

					// Check if English has placeholders
					const placeholderMatches = (englishValue as string).match(/\{(\d+)\}/g);
					if (placeholderMatches) {
						placeholderMatches.forEach((placeholder) => {
							assert.ok(
								(translatedValue as string).includes(placeholder),
								`${bundle.name} - Key '${key}' is missing placeholder ${placeholder}`
							);
						});
					}
				});
			});
		});
	});

	suite('Runtime Localization (vscode.l10n)', function () {
		const englishBundlePath = path.join(workspaceRoot, 'l10n', 'bundle.l10n.json');
		const englishBundle = JSON.parse(fs.readFileSync(englishBundlePath, 'utf8')) as Record<string, string>;

		test('l10nHelper.t() returns the English source text under the default locale', function () {
			// Under VS Code's canonical l10n pattern the first argument to `t()` is the
			// English source string, and `vscode.l10n.t(message, ...args)` returns
			// `message` (with placeholders substituted) when no locale bundle matches.
			// Regression guard for issue #169: the previous helper served English strings
			// from an in-memory bundle regardless of the active locale, breaking every
			// non-English user.
			const source = "File type '{0}' is not supported. Only CSS and JavaScript files can be minified.";
			const resolved = t(source, 'txt');

			assert.ok(
				resolved.includes("File type 'txt' is not supported"),
				`t() should either return the interpolated English source or a translated equivalent (got: '${resolved}')`
			);
		});

		test('Placeholder interpolation covers every positional argument', function () {
			// The four-argument message used by `showInformationMessage` after saving a
			// minified copy exercises `{0}`, `{1}`, `{2}` and `{3}` simultaneously.
			const source = 'File successfully minified and saved as: {0} (Size reduced from {1} to {2}, {3}% reduction)';
			const resolved = t(source, 'style.min.css', '10.5 KB', '3.2 KB', '69.5');

			assert.ok(resolved.includes('style.min.css'), 'Should interpolate {0}');
			assert.ok(resolved.includes('10.5 KB'), 'Should interpolate {1}');
			assert.ok(resolved.includes('3.2 KB'), 'Should interpolate {2}');
			assert.ok(resolved.includes('69.5'), 'Should interpolate {3}');
		});

		test('vscode.l10n API is available at runtime', function () {
			// The `l10n` field in `package.json` must be honored by VS Code so
			// `vscode.l10n.t` exists as a function at runtime.
			assert.strictEqual(typeof vscode.l10n.t, 'function', 'vscode.l10n.t must be a function');
			assert.ok('bundle' in vscode.l10n, 'vscode.l10n.bundle property must exist');
		});

		test('vscode.env.language reports a valid locale string', function () {
			// Informational assertion: guarantees the test host actually exposes a locale so the
			// bundle-match test below can meaningfully compare against disk when a non-English
			// language pack is installed (`VSCODE_LOCALE=<lang> npm test`).
			const locale = vscode.env.language;
			assert.strictEqual(typeof locale, 'string', 'vscode.env.language should be a string');
			assert.ok(locale.length > 0, 'vscode.env.language should not be empty');
		});

		test('vscode.l10n.bundle matches the shipped bundle for non-English locales', function () {
			// When VS Code launches with `--locale=<lang>` AND the matching language pack is
			// installed, `vscode.l10n.bundle` should reflect the contents of
			// `l10n/bundle.l10n.<lang>.json`. For the default English locale
			// `vscode.l10n.bundle` is `undefined` because VS Code returns the source message.
			const locale = vscode.env.language;
			const bundle = vscode.l10n.bundle;

			if (locale === 'en' || !bundle) {
				// Default English path — no bundle is loaded; `t()` returns the source string.
				return;
			}

			const localeBundleFile = path.join(workspaceRoot, 'l10n', `bundle.l10n.${locale}.json`);
			if (!fs.existsSync(localeBundleFile)) {
				// Locale is not one we ship translations for — VS Code falls back to the source.
				return;
			}

			const diskBundle = JSON.parse(fs.readFileSync(localeBundleFile, 'utf8')) as Record<string, string>;
			Object.entries(diskBundle).forEach(([key, expectedValue]) => {
				assert.strictEqual(
					bundle[key],
					expectedValue,
					`vscode.l10n.bundle['${key}'] does not match shipped translation for locale '${locale}'`
				);
			});
		});

		test('Every non-English bundle differs from the English source for at least one key', function () {
			// Guard against a regression where a translation file is accidentally overwritten
			// with the English source. Independent of the current runtime locale.
			RUNTIME_BUNDLES.slice(1).forEach((bundle) => {
				const filePath = path.join(workspaceRoot, 'l10n', bundle.file);
				const localized = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, string>;

				const differing = Object.entries(englishBundle).filter(([key, englishValue]) => {
					return localized[key] !== undefined && localized[key] !== englishValue;
				});

				assert.ok(
					differing.length > 0,
					`${bundle.name} (${bundle.file}) is identical to English for every key — bundle appears untranslated.`
				);
			});
		});
	});
});
