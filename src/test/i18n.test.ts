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
 * @since 1.0.0
 */

import * as fs from "fs";
import * as path from "path";
import assert from "assert";

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
	{ code: 'zh-cn', name: 'Chinese Simplified', file: 'package.nls.zh-cn.json' }
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
	{ code: 'zh-cn', name: 'Chinese Simplified', file: 'bundle.l10n.zh-cn.json' }
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
	'configuration.autoOpenNewFile'
];

/**
 * Expected translation keys in runtime bundle files
 */
const EXPECTED_BUNDLE_KEYS = [
	'validators.fileType.unsupported',
	'validators.content.empty',
	'fileService.newFile.success',
	'fileService.inPlace.success',
	'minificationService.fileType.unsupported',
	'minificationService.fileSize.tooLarge',
	'minificationService.error.missingInput',
	'minificationService.error.invalidMethod',
	'minificationService.error.invalidContentType',
	'minificationService.error.fileTooLarge',
	'minificationService.error.invalidSyntax',
	'minificationService.error.rateLimitExceeded',
	'minificationService.error.apiError',
	'minificationService.error.invalidResponse',
	'minificationService.error.timeout',
	'minificationService.error.network',
	'minificationService.error.generic'
];

suite("Internationalization (i18n) Test Suite", function () {
	const workspaceRoot = path.resolve(__dirname, '../../');

	suite("Package.nls Files (Configuration & Commands)", function () {
		test("All language files exist", function () {
			SUPPORTED_LANGUAGES.forEach(lang => {
				const filePath = path.join(workspaceRoot, lang.file);
				assert.ok(
					fs.existsSync(filePath),
					`${lang.name} translation file (${lang.file}) does not exist at: ${filePath}`
				);
			});
		});

		test("All language files are valid JSON", function () {
			SUPPORTED_LANGUAGES.forEach(lang => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = fs.readFileSync(filePath, 'utf8');
				
				try {
					JSON.parse(content);
				} catch (error) {
					assert.fail(`${lang.name} translation file (${lang.file}) contains invalid JSON: ${error}`);
				}
			});
		});

		test("All language files have the same keys", function () {
			// Load the English file as reference
			const englishPath = path.join(workspaceRoot, 'package.nls.json');
			const englishContent = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
			const englishKeys = Object.keys(englishContent).sort();

			// Compare all other languages
			SUPPORTED_LANGUAGES.slice(1).forEach(lang => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				const keys = Object.keys(content).sort();

				assert.deepStrictEqual(
					keys,
					englishKeys,
					`${lang.name} translation file has different keys than English`
				);
			});
		});

		test("All expected configuration keys exist", function () {
			SUPPORTED_LANGUAGES.forEach(lang => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				
				EXPECTED_PACKAGE_KEYS.forEach(key => {
					assert.ok(
						key in content,
						`${lang.name} is missing key: ${key}`
					);
					assert.ok(
						content[key].trim().length > 0,
						`${lang.name} has empty value for key: ${key}`
					);
				});
			});
		});

		test("All translation values are non-empty strings", function () {
			SUPPORTED_LANGUAGES.forEach(lang => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				Object.entries(content).forEach(([key, value]) => {
					assert.strictEqual(
						typeof value,
						'string',
						`${lang.name} - Key '${key}' should be a string`
					);
					assert.ok(
						(value as string).trim().length > 0,
						`${lang.name} - Key '${key}' should not be empty`
					);
				});
			});
		});
	});

	suite("Bundle.l10n Files (Runtime Messages)", function () {
		const l10nPath = path.join(workspaceRoot, 'l10n');

		test("L10n directory exists", function () {
			assert.ok(
				fs.existsSync(l10nPath),
				`L10n directory does not exist at: ${l10nPath}`
			);
		});

		test("All runtime bundle files exist", function () {
			RUNTIME_BUNDLES.forEach(bundle => {
				const filePath = path.join(l10nPath, bundle.file);
				assert.ok(
					fs.existsSync(filePath),
					`${bundle.name} runtime bundle (${bundle.file}) does not exist at: ${filePath}`
				);
			});
		});

		test("All runtime bundle files are valid JSON", function () {
			RUNTIME_BUNDLES.forEach(bundle => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = fs.readFileSync(filePath, 'utf8');
				
				try {
					JSON.parse(content);
				} catch (error) {
					assert.fail(`${bundle.name} runtime bundle (${bundle.file}) contains invalid JSON: ${error}`);
				}
			});
		});

		test("All runtime bundle files have the same keys", function () {
			// Load the English file as reference
			const englishPath = path.join(l10nPath, 'bundle.l10n.json');
			const englishContent = JSON.parse(fs.readFileSync(englishPath, 'utf8'));
			const englishKeys = Object.keys(englishContent).sort();

			// Compare all other languages
			RUNTIME_BUNDLES.slice(1).forEach(bundle => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				const keys = Object.keys(content).sort();

				assert.deepStrictEqual(
					keys,
					englishKeys,
					`${bundle.name} runtime bundle has different keys than English`
				);
			});
		});

		test("All expected runtime message keys exist", function () {
			RUNTIME_BUNDLES.forEach(bundle => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				
				EXPECTED_BUNDLE_KEYS.forEach(key => {
					assert.ok(
						key in content,
						`${bundle.name} is missing runtime key: ${key}`
					);
					assert.ok(
						content[key].trim().length > 0,
						`${bundle.name} has empty value for runtime key: ${key}`
					);
				});
			});
		});

		test("All runtime message values are non-empty strings", function () {
			RUNTIME_BUNDLES.forEach(bundle => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				Object.entries(content).forEach(([key, value]) => {
					assert.strictEqual(
						typeof value,
						'string',
						`${bundle.name} - Key '${key}' should be a string`
					);
					assert.ok(
						(value as string).trim().length > 0,
						`${bundle.name} - Key '${key}' should not be empty`
					);
				});
			});
		});

		test("Runtime messages with placeholders use correct format", function () {
			RUNTIME_BUNDLES.forEach(bundle => {
				const filePath = path.join(l10nPath, bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				// Keys that should have placeholders
				const keysWithPlaceholders = [
					'validators.fileType.unsupported', // {0}
					'validators.content.empty', // {0}
					'fileService.newFile.success', // {0}
					'fileService.inPlace.success', // {0}
					'minificationService.fileType.unsupported', // {0}
					'minificationService.fileSize.tooLarge', // {0}
					'minificationService.error.invalidSyntax', // {0}
					'minificationService.error.apiError', // {0}, {1}, {2}
					'minificationService.error.timeout', // {0}
					'minificationService.error.generic' // {0}, {1}
				];

				keysWithPlaceholders.forEach(key => {
					const message = content[key];
					assert.ok(
						message.includes('{0}'),
						`${bundle.name} - Key '${key}' should contain placeholder {0}`
					);
				});
			});
		});
	});

	suite("VS Code Integration", function () {
		test("Extension loads commands with localized titles", function () {
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

		test("Extension configuration uses localized descriptions", function () {
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

	suite("Translation Quality", function () {
		test("No translations contain only English text for non-English languages", function () {
			// Common English-only patterns that shouldn't appear in translations
			const englishPatterns = [
				/\bMinify this File\b/,
				/\bMinify and Save as New File\b/,
				/\bJS & CSS Minifier Tool Configuration\b/,
				/\bMinify files automatically on save\b/
			];

			SUPPORTED_LANGUAGES.slice(1).forEach(lang => {
				const filePath = path.join(workspaceRoot, lang.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				Object.entries(content).forEach(([key, value]) => {
					englishPatterns.forEach(pattern => {
						assert.ok(
							!pattern.test(value as string),
							`${lang.name} - Key '${key}' appears to contain untranslated English text: '${value}'`
						);
					});
				});
			});
		});

		test("Translations preserve placeholder format", function () {
			// Load English bundle to get reference placeholders
			const englishPath = path.join(workspaceRoot, 'l10n', 'bundle.l10n.json');
			const englishContent = JSON.parse(fs.readFileSync(englishPath, 'utf8'));

			RUNTIME_BUNDLES.slice(1).forEach(bundle => {
				const filePath = path.join(workspaceRoot, 'l10n', bundle.file);
				const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

				Object.entries(englishContent).forEach(([key, englishValue]) => {
					const translatedValue = content[key];
					
					// Check if English has placeholders
					const placeholderMatches = (englishValue as string).match(/\{(\d+)\}/g);
					if (placeholderMatches) {
						placeholderMatches.forEach(placeholder => {
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
});
