/**
 * @fileoverview Tests for the new-file naming and the overwrite guard (issue #255).
 *
 * "Minify and Save as New File" used to build the new name with a regex that only matched
 * a lowercase `.css` or `.js` at the end of the path. For any other name (`.mjs`, `.cjs`,
 * `.JS`, `.CSS`, no extension) the name came back unchanged and the minified text was
 * written over the original source. These tests pin the name mapping and prove that the
 * original is never overwritten.
 *
 * @author Miguel Colmenares
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import assert from 'assert';
import { createMinifiedFileName, saveAsNewFile } from '../services/fileService';
import { t } from '../utils/l10nHelper';

/**
 * The prefix choices the `css-js-minifier.minifiedNewFilePrefix` setting offers, read from
 * `package.json` so the test follows the real enum instead of a copy of it.
 */
function readPrefixOptions(): string[] {
	const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
	return packageJson.contributes.configuration.properties['css-js-minifier.minifiedNewFilePrefix'].enum;
}

const MINIFICATION_STATS = {
	originalSize: 100,
	minifiedSize: 50,
	reductionPercent: 50,
	originalSizeKB: '0.10 KB',
	minifiedSizeKB: '0.05 KB',
};

suite('File Service Test Suite', function () {
	this.timeout(30000);

	suite('createMinifiedFileName', function () {
		test('inserts the prefix before .css and .js (existing behaviour)', function () {
			assert.strictEqual(createMinifiedFileName('/p/style.css', '.min'), '/p/style.min.css');
			assert.strictEqual(createMinifiedFileName('/p/script.js', '.min'), '/p/script.min.js');
			assert.strictEqual(createMinifiedFileName('/p/script.js', '-compressed'), '/p/script-compressed.js');
		});

		test('handles .mjs and .cjs (issue #255)', function () {
			assert.strictEqual(createMinifiedFileName('/p/a.mjs', '.min'), '/p/a.min.mjs');
			assert.strictEqual(createMinifiedFileName('/p/a.cjs', '.min'), '/p/a.min.cjs');
		});

		test('handles uppercase extensions and keeps their case (issue #255)', function () {
			assert.strictEqual(createMinifiedFileName('/p/a.JS', '.min'), '/p/a.min.JS');
			assert.strictEqual(createMinifiedFileName('/p/A.CSS', '.min'), '/p/A.min.CSS');
			assert.strictEqual(createMinifiedFileName('/p/a.Mjs', '.min'), '/p/a.min.Mjs');
		});

		test('works for every prefix option offered by the setting', function () {
			const prefixes = readPrefixOptions();
			assert.ok(prefixes.length >= 6, 'package.json should offer the six prefix choices');
			for (const prefix of prefixes) {
				for (const extension of ['css', 'js', 'mjs', 'cjs', 'JS', 'CSS']) {
					const original = `/p/name.${extension}`;
					assert.strictEqual(
						createMinifiedFileName(original, prefix),
						`/p/name${prefix}.${extension}`,
						`prefix '${prefix}' on '${original}'`
					);
				}
			}
		});

		test('handles Windows-style paths with backslashes', function () {
			assert.strictEqual(
				createMinifiedFileName('C:\\projects\\app.css', '.minified'),
				'C:\\projects\\app.minified.css'
			);
			assert.strictEqual(createMinifiedFileName('C:\\projects\\app.mjs', '.min'), 'C:\\projects\\app.min.mjs');
			assert.strictEqual(createMinifiedFileName('C:\\my.dir\\Makefile', '.min'), 'C:\\my.dir\\Makefile.min');
			assert.strictEqual(createMinifiedFileName('C:/mixed\\separators/a.js', '.min'), 'C:/mixed\\separators/a.min.js');
		});

		test('only the last extension counts and dots in folder names are ignored', function () {
			assert.strictEqual(createMinifiedFileName('/p/jquery.slim.js', '.min'), '/p/jquery.slim.min.js');
			assert.strictEqual(createMinifiedFileName('/p/app.test.mjs', '-min'), '/p/app.test-min.mjs');
			assert.strictEqual(createMinifiedFileName('/my.project/src.d/a.css', '.min'), '/my.project/src.d/a.min.css');
		});

		test('a name with no extension gets the prefix appended', function () {
			assert.strictEqual(createMinifiedFileName('/p/Makefile', '.min'), '/p/Makefile.min');
			assert.strictEqual(createMinifiedFileName('/p/Makefile', '-minified'), '/p/Makefile-minified');
			// The dot belongs to the folder, not to the file name
			assert.strictEqual(createMinifiedFileName('/my.dir/Makefile', '.min'), '/my.dir/Makefile.min');
			assert.strictEqual(createMinifiedFileName('Makefile', '.min'), 'Makefile.min');
		});

		test('a name with only a leading dot gets the prefix appended', function () {
			assert.strictEqual(createMinifiedFileName('/p/.eslintrc', '.min'), '/p/.eslintrc.min');
			assert.strictEqual(createMinifiedFileName('/p/.eslintrc', '-min'), '/p/.eslintrc-min');
			assert.strictEqual(createMinifiedFileName('.eslintrc', '.min'), '.eslintrc.min');
		});

		test('a trailing dot is treated as an empty extension', function () {
			assert.strictEqual(createMinifiedFileName('/p/a.', '.min'), '/p/a.min.');
		});

		test('a name that already contains the prefix gets another one and does not collide', function () {
			assert.strictEqual(createMinifiedFileName('/p/a.min.js', '.min'), '/p/a.min.min.js');
			assert.strictEqual(createMinifiedFileName('/p/a.min.css', '-min'), '/p/a.min-min.css');
			assert.strictEqual(createMinifiedFileName('/p/a-min.js', '-min'), '/p/a-min-min.js');
		});

		test('never returns the original name for a non-empty prefix', function () {
			const names = [
				'/p/a.css',
				'/p/a.js',
				'/p/a.mjs',
				'/p/a.cjs',
				'/p/a.JS',
				'/p/A.CSS',
				'/p/a.min.js',
				'/p/Makefile',
				'/p/.eslintrc',
				'/p/a.',
				'C:\\projects\\app.css',
				'a.js',
				'.js',
			];
			for (const prefix of readPrefixOptions()) {
				for (const name of names) {
					assert.notStrictEqual(createMinifiedFileName(name, prefix), name, `'${name}' with prefix '${prefix}'`);
				}
			}
		});
	});

	suite('overwrite guard and end to end behaviour', function () {
		let tempDir: string;

		suiteSetup(function () {
			// A private temp folder: the other suites sweep the fixtures folder for names containing "min"
			tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-js-minifier-255-'));
		});

		suiteTeardown(async function () {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			fs.rmSync(tempDir, { recursive: true, force: true });
		});

		setup(async function () {
			// Do not open the new file in an editor: only the files on disk matter here
			await vscode.workspace.getConfiguration('css-js-minifier').update('autoOpenNewFile', false, true);
			await vscode.workspace.getConfiguration('css-js-minifier').update('minifiedNewFilePrefix', '.min', true);
		});

		teardown(async function () {
			sinon.restore();
			await vscode.workspace.getConfiguration('css-js-minifier').update('autoOpenNewFile', undefined, true);
			await vscode.workspace.getConfiguration('css-js-minifier').update('minifiedNewFilePrefix', undefined, true);
		});

		const jsSource = 'function add(first, second) {\n  var total = first + second;\n  return total;\n}\n';
		const cssSource = 'p {\n  color: red;\n}\n';

		// Every name here used to map to itself, so the command overwrote the source
		const cases = [
			{ fileName: 'module.mjs', expectedName: 'module.min.mjs', source: jsSource },
			{ fileName: 'common.cjs', expectedName: 'common.min.cjs', source: jsSource },
			{ fileName: 'UPPER.JS', expectedName: 'UPPER.min.JS', source: jsSource },
			{ fileName: 'UPPER.CSS', expectedName: 'UPPER.min.CSS', source: cssSource },
		];

		for (const { fileName, expectedName, source } of cases) {
			test(`Minify and Save as New File never overwrites the original: ${fileName}`, async function () {
				const originalPath = path.join(tempDir, fileName);
				fs.writeFileSync(originalPath, source);

				const document = await vscode.workspace.openTextDocument(vscode.Uri.file(originalPath));
				await vscode.window.showTextDocument(document);
				assert.ok(
					['javascript', 'css'].includes(document.languageId),
					`'${fileName}' should open as CSS or JavaScript, got '${document.languageId}'`
				);

				await vscode.commands.executeCommand('extension.minifyInNewFile');

				// The original is byte for byte what we wrote
				assert.strictEqual(fs.readFileSync(originalPath, 'utf8'), source, 'The original file must not change');

				// A new file exists next to it with the prefix before the extension, holding the minified text
				const newPath = path.join(tempDir, expectedName);
				assert.ok(fs.existsSync(newPath), `Expected the new file at ${newPath}`);
				const minified = fs.readFileSync(newPath, 'utf8');
				assert.notStrictEqual(minified, source, 'The new file should hold the minified text');
				assert.ok(minified.length < source.length, 'The minified text should be shorter than the source');
			});
		}

		test('the guard refuses to write when the target is the source and shows an error', async function () {
			const originalPath = path.join(tempDir, 'guard-same.mjs');
			fs.writeFileSync(originalPath, jsSource);

			const errorSpy = sinon.stub(vscode.window, 'showErrorMessage').resolves(undefined);
			const infoSpy = sinon.stub(vscode.window, 'showInformationMessage').resolves(undefined);

			// Same path as the source: what the old name mapping produced for ".mjs"
			await saveAsNewFile('MINIFIED', originalPath, MINIFICATION_STATS, vscode.Uri.file(originalPath));

			assert.strictEqual(fs.readFileSync(originalPath, 'utf8'), jsSource, 'The source must not be overwritten');
			assert.strictEqual(errorSpy.callCount, 1, 'An error should be shown');
			assert.strictEqual(
				errorSpy.firstCall.args[0],
				t(
					'Cannot create the minified file: its name would be the same as the original ({0}) and would overwrite it. The original file was not changed.',
					'guard-same.mjs'
				)
			);
			assert.strictEqual(infoSpy.callCount, 0, 'No success message should be shown');
		});

		test('the guard compares the full URI, so another scheme with the same path is not refused', async function () {
			const targetPath = path.join(tempDir, 'guard-scheme.mjs');
			const errorSpy = sinon.stub(vscode.window, 'showErrorMessage').resolves(undefined);
			sinon.stub(vscode.window, 'showInformationMessage').resolves(undefined);

			// Same path string, different scheme and authority: a different file, so it must be written
			const otherFileSystem = vscode.Uri.from({
				scheme: 'vscode-vfs',
				authority: 'github',
				path: vscode.Uri.file(targetPath).path,
			});
			await saveAsNewFile('MINIFIED', targetPath, MINIFICATION_STATS, otherFileSystem);

			assert.strictEqual(errorSpy.callCount, 0, 'No error should be shown');
			assert.strictEqual(fs.readFileSync(targetPath, 'utf8'), 'MINIFIED');
		});

		test('a different target is written normally', async function () {
			const sourcePath = path.join(tempDir, 'guard-ok.mjs');
			const targetPath = path.join(tempDir, 'guard-ok.min.mjs');
			fs.writeFileSync(sourcePath, jsSource);
			const errorSpy = sinon.stub(vscode.window, 'showErrorMessage').resolves(undefined);
			const infoSpy = sinon.stub(vscode.window, 'showInformationMessage').resolves(undefined);

			await saveAsNewFile('MINIFIED', targetPath, MINIFICATION_STATS, vscode.Uri.file(sourcePath));

			assert.strictEqual(errorSpy.callCount, 0);
			assert.strictEqual(infoSpy.callCount, 1);
			assert.strictEqual(fs.readFileSync(sourcePath, 'utf8'), jsSource);
			assert.strictEqual(fs.readFileSync(targetPath, 'utf8'), 'MINIFIED');
		});
	});
});
