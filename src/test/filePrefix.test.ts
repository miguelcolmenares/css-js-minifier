/**
 * @fileoverview Tests for the validation of `minifiedNewFilePrefix` (issue #259).
 *
 * The `enum` of the setting in `package.json` only drives the Settings UI: a value written
 * by hand in `settings.json` reached `createMinifiedFileName` unchecked, so a prefix such as
 * `/../../escaped` wrote the new file outside the source folder, `a/b` created new folders,
 * and an empty string made "Minify and Save as New File" minify the original in place.
 * These tests pin the validation function, the error, and the two entry points (the command
 * and minify on save): an invalid prefix writes nothing and shows an error, a valid one
 * behaves as before.
 *
 * @author Miguel Colmenares
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import assert from 'assert';
import { onSaveMinify } from '../commands/minifyCommand';
import {
	MAX_FILE_PREFIX_LENGTH,
	isValidFilePrefix,
	reportInvalidFilePrefix,
	resetReportedInvalidFilePrefixes,
} from '../utils/validators';
import { t } from '../utils/l10nHelper';

/** The setting name the error message has to mention. */
const SETTING_NAME = 'css-js-minifier.minifiedNewFilePrefix';

/**
 * The prefix choices the setting offers, read from `package.json` so the test follows the
 * real enum instead of a copy of it.
 */
function readPrefixOptions(): string[] {
	const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));
	return packageJson.contributes.configuration.properties[SETTING_NAME].enum;
}

/** Invalid prefixes the setting could hold when edited by hand, with the reason each one is unsafe. */
const INVALID_PREFIXES: { value: string; why: string }[] = [
	{ value: '/../x', why: 'parent folder through a forward slash' },
	{ value: '/../../escaped', why: 'two levels up' },
	{ value: '../../../escaped', why: 'three levels up' },
	{ value: '..\\x', why: 'parent folder through a backslash (Windows separator)' },
	{ value: 'a/b', why: 'creates a new folder' },
	{ value: '/abs/olute', why: 'creates nested folders' },
	{ value: 'a\\b', why: 'backslash separator' },
	{ value: '', why: 'empty' },
	{ value: 'x\u0000y', why: 'NUL character' },
	{ value: '..', why: 'parent folder segment' },
	{ value: '.min..', why: 'contains ..' },
	{ value: ' min', why: 'whitespace' },
	{ value: 'min\n', why: 'trailing newline' },
	{ value: 'C:x', why: 'drive-like colon' },
	{ value: 'mínimo', why: 'non-ASCII letter' },
	{ value: 'a'.repeat(MAX_FILE_PREFIX_LENGTH + 1), why: 'overlong' },
];

/** Lists every file and folder below a folder, relative to it and sorted. */
function listTree(root: string): string[] {
	const found: string[] = [];
	const walk = (dir: string): void => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			found.push(path.relative(root, full) + (entry.isDirectory() ? path.sep : ''));
			if (entry.isDirectory()) {
				walk(full);
			}
		}
	};
	walk(root);
	return found.sort();
}

/**
 * Removes a temporary file or folder, retrying while Windows reports it as busy.
 *
 * @remarks
 * On Windows the VS Code file watcher can still hold a handle on a folder it observed while a
 * document inside it was open, so an immediate delete fails with EPERM or EBUSY. Node retries
 * those errors itself with `maxRetries`. An error that persists after the retries is still
 * thrown, because leftovers would falsify the tests that list the folder to prove nothing was written.
 *
 * @param target - The path to remove
 */
function removeTemp(target: string): void {
	fs.rmSync(target, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}

suite('File Prefix Validation Test Suite', function () {
	this.timeout(30000);

	suite('isValidFilePrefix', function () {
		test('accepts every value the setting offers', function () {
			const options = readPrefixOptions();
			assert.ok(options.length > 0, 'The enum should not be empty');
			for (const prefix of options) {
				assert.strictEqual(isValidFilePrefix(prefix), true, `'${prefix}' is offered by the Settings UI`);
			}
		});

		test('accepts custom prefixes made of letters, digits, ".", "-" and "_"', function () {
			for (const prefix of ['.mini', '_opt', '-v2', 'min', '.min.v2', '.MIN', '.a-b_c.9']) {
				assert.strictEqual(isValidFilePrefix(prefix), true, `'${prefix}'`);
			}
		});

		test('accepts a prefix of exactly the maximum length and rejects one more', function () {
			assert.strictEqual(isValidFilePrefix('a'.repeat(MAX_FILE_PREFIX_LENGTH)), true);
			assert.strictEqual(isValidFilePrefix('a'.repeat(MAX_FILE_PREFIX_LENGTH + 1)), false);
		});

		for (const { value, why } of INVALID_PREFIXES) {
			test(`rejects ${JSON.stringify(value.length > 40 ? `${value.slice(0, 10)}...` : value)} (${why})`, function () {
				assert.strictEqual(isValidFilePrefix(value), false);
			});
		}

		test('rejects anything that is not a string', function () {
			for (const value of [undefined, null, 5, true, ['.min'], { prefix: '.min' }]) {
				assert.strictEqual(isValidFilePrefix(value), false, JSON.stringify(value));
			}
		});
	});

	suite('reportInvalidFilePrefix', function () {
		let errorStub: sinon.SinonStub;

		setup(function () {
			resetReportedInvalidFilePrefixes();
			errorStub = sinon.stub(vscode.window, 'showErrorMessage').resolves(undefined);
		});

		teardown(function () {
			sinon.restore();
			resetReportedInvalidFilePrefixes();
		});

		test('names the setting and shows the offending value', function () {
			reportInvalidFilePrefix('/../x');

			assert.strictEqual(errorStub.callCount, 1);
			assert.strictEqual(
				errorStub.firstCall.args[0],
				t(
					"Cannot create the minified file: the setting 'css-js-minifier.minifiedNewFilePrefix' has an invalid value ({0}). Use only letters, digits, '.', '-' and '_' (up to {1} characters, and no '..'), for example '.min'. No file was written.",
					'"/../x"',
					MAX_FILE_PREFIX_LENGTH
				)
			);
			assert.ok(String(errorStub.firstCall.args[0]).includes(SETTING_NAME));
		});

		test('makes an empty string and a NUL visible', function () {
			reportInvalidFilePrefix('');
			reportInvalidFilePrefix('x\u0000y');

			assert.ok(String(errorStub.firstCall.args[0]).includes('("")'), 'The empty string is shown as ""');
			assert.ok(String(errorStub.secondCall.args[0]).includes('"x\\u0000y"'), 'The NUL is shown escaped');
		});

		test('truncates a very long value', function () {
			const long = 'b'.repeat(500);
			reportInvalidFilePrefix(long);

			const message = String(errorStub.firstCall.args[0]);
			assert.ok(message.includes('...'), 'A long value is cut');
			assert.ok(!message.includes('b'.repeat(100)), 'The whole value is not echoed');
		});

		test('shows a value that is not a string as it is in JSON', function () {
			reportInvalidFilePrefix(5);
			reportInvalidFilePrefix(undefined);

			assert.ok(String(errorStub.firstCall.args[0]).includes('(5)'));
			assert.ok(String(errorStub.secondCall.args[0]).includes('(undefined)'));
		});

		test('shows the error every time by default', function () {
			reportInvalidFilePrefix('a/b');
			reportInvalidFilePrefix('a/b');

			assert.strictEqual(errorStub.callCount, 2);
		});

		test('with oncePerSession shows the error once per distinct value', function () {
			reportInvalidFilePrefix('a/b', true);
			reportInvalidFilePrefix('a/b', true);
			reportInvalidFilePrefix('a/b', true);
			assert.strictEqual(errorStub.callCount, 1, 'The same value is reported once');

			reportInvalidFilePrefix('c/d', true);
			assert.strictEqual(errorStub.callCount, 2, 'Another bad value is reported');

			reportInvalidFilePrefix('c/d', true);
			assert.strictEqual(errorStub.callCount, 2);

			resetReportedInvalidFilePrefixes();
			reportInvalidFilePrefix('a/b', true);
			assert.strictEqual(errorStub.callCount, 3, 'A new session reports it again');
		});

		test('an every-time report is not silenced by an earlier once-per-session one', function () {
			reportInvalidFilePrefix('a/b', true);
			reportInvalidFilePrefix('a/b');

			assert.strictEqual(errorStub.callCount, 2);
		});
	});

	suite('entry points', function () {
		let tempDir: string;
		let sourceDir: string;
		let sourcePath: string;
		let errorStub: sinon.SinonStub;
		let infoStub: sinon.SinonStub;

		const cssSource = 'p {\n  color: red;\n}\n';
		const config = (): vscode.WorkspaceConfiguration => vscode.workspace.getConfiguration('css-js-minifier');

		suiteSetup(function () {
			// A private temp folder: the other suites sweep the fixtures folder for names containing "min".
			// realpath, because os.tmpdir() is a symlink on macOS and the tree is compared as strings.
			tempDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'css-js-minifier-259-')));
		});

		suiteTeardown(async function () {
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			removeTemp(tempDir);
		});

		setup(async function () {
			resetReportedInvalidFilePrefixes();
			// Two levels of folders above the source, so that a prefix climbing one or two
			// levels still lands inside tempDir where the listing can see it
			sourceDir = path.join(tempDir, 'outer', 'inner', 'src');
			fs.mkdirSync(sourceDir, { recursive: true });
			sourcePath = path.join(sourceDir, 'style.css');
			fs.writeFileSync(sourcePath, cssSource);

			await config().update('autoOpenNewFile', false, true);
			errorStub = sinon.stub(vscode.window, 'showErrorMessage').resolves(undefined);
			infoStub = sinon.stub(vscode.window, 'showInformationMessage').resolves(undefined);
		});

		teardown(async function () {
			sinon.restore();
			await vscode.commands.executeCommand('workbench.action.closeAllEditors');
			await config().update('autoOpenNewFile', undefined, true);
			await config().update('minifiedNewFilePrefix', undefined, true);
			await config().update('minifyInNewFile', undefined, true);
			for (const entry of fs.readdirSync(tempDir)) {
				removeTemp(path.join(tempDir, entry));
			}
		});

		/** Opens the source file in an editor, as the commands expect. */
		async function openSource(): Promise<vscode.TextDocument> {
			const document = await vscode.workspace.openTextDocument(vscode.Uri.file(sourcePath));
			await vscode.window.showTextDocument(document);
			return document;
		}

		suite('Minify and Save as New File (command)', function () {
			for (const { value, why } of INVALID_PREFIXES) {
				test(`writes nothing and shows the error for ${JSON.stringify(value.length > 40 ? `${value.slice(0, 10)}...` : value)} (${why})`, async function () {
					await config().update('minifiedNewFilePrefix', value, true);
					await openSource();
					const before = listTree(tempDir);

					await vscode.commands.executeCommand('extension.minifyInNewFile');

					assert.deepStrictEqual(listTree(tempDir), before, 'No file or folder may be created anywhere');
					assert.strictEqual(fs.readFileSync(sourcePath, 'utf8'), cssSource, 'The source must not change');
					assert.strictEqual(errorStub.callCount, 1, 'One error should be shown');
					assert.ok(String(errorStub.firstCall.args[0]).includes(SETTING_NAME), 'The error names the setting');
					assert.strictEqual(infoStub.callCount, 0, 'No success message');
				});
			}

			test('shows the error on every run, it is not limited to once per session', async function () {
				await config().update('minifiedNewFilePrefix', 'a/b', true);
				await openSource();

				await vscode.commands.executeCommand('extension.minifyInNewFile');
				await vscode.commands.executeCommand('extension.minifyInNewFile');

				assert.strictEqual(errorStub.callCount, 2);
			});

			for (const prefix of readPrefixOptions()) {
				test(`still writes the new file for the offered value '${prefix}'`, async function () {
					await config().update('minifiedNewFilePrefix', prefix, true);
					await openSource();

					await vscode.commands.executeCommand('extension.minifyInNewFile');

					const expected = path.join(sourceDir, `style${prefix}.css`);
					assert.ok(fs.existsSync(expected), `Expected ${expected}`);
					assert.strictEqual(fs.readFileSync(expected, 'utf8'), 'p{color:red}');
					assert.strictEqual(fs.readFileSync(sourcePath, 'utf8'), cssSource);
					assert.strictEqual(errorStub.callCount, 0);
				});
			}

			test('still writes the new file for a custom valid prefix', async function () {
				await config().update('minifiedNewFilePrefix', '.mini', true);
				await openSource();

				await vscode.commands.executeCommand('extension.minifyInNewFile');

				assert.strictEqual(fs.readFileSync(path.join(sourceDir, 'style.mini.css'), 'utf8'), 'p{color:red}');
				assert.strictEqual(errorStub.callCount, 0);
			});
		});

		suite('Minify on save with a new file (onSaveMinify)', function () {
			// The real onDidSaveTextDocument listener is registered at activation, and only when
			// minifyOnSave is on, so the host cannot trigger it. onSaveMinify is called directly:
			// it is the function that listener runs.
			setup(async function () {
				await config().update('minifyInNewFile', true, true);
			});

			for (const { value, why } of INVALID_PREFIXES) {
				test(`writes nothing and shows the error for ${JSON.stringify(value.length > 40 ? `${value.slice(0, 10)}...` : value)} (${why})`, async function () {
					await config().update('minifiedNewFilePrefix', value, true);
					const document = await openSource();
					const before = listTree(tempDir);

					await onSaveMinify(document);

					assert.deepStrictEqual(listTree(tempDir), before, 'No file or folder may be created anywhere');
					assert.strictEqual(fs.readFileSync(sourcePath, 'utf8'), cssSource, 'The source must not change');
					assert.strictEqual(errorStub.callCount, 1, 'One error should be shown');
					assert.ok(String(errorStub.firstCall.args[0]).includes(SETTING_NAME), 'The error names the setting');
					assert.strictEqual(infoStub.callCount, 0, 'No success message');
				});
			}

			test('shows the error once per session for the same bad value, not on every save', async function () {
				await config().update('minifiedNewFilePrefix', 'a/b', true);
				const document = await openSource();
				const before = listTree(tempDir);

				await onSaveMinify(document);
				await onSaveMinify(document);
				await onSaveMinify(document);

				assert.strictEqual(errorStub.callCount, 1, 'Three saves, one notification');
				assert.deepStrictEqual(listTree(tempDir), before, 'Still nothing written');
			});

			test('shows the error again when the bad value changes', async function () {
				const document = await openSource();

				await config().update('minifiedNewFilePrefix', 'a/b', true);
				await onSaveMinify(document);
				await config().update('minifiedNewFilePrefix', '/../x', true);
				await onSaveMinify(document);
				await onSaveMinify(document);

				assert.strictEqual(errorStub.callCount, 2, 'One per distinct value');
			});

			test('writes the new file once the setting is fixed', async function () {
				await config().update('minifiedNewFilePrefix', 'a/b', true);
				const document = await openSource();
				await onSaveMinify(document);
				assert.strictEqual(errorStub.callCount, 1);

				await config().update('minifiedNewFilePrefix', '.min', true);
				await onSaveMinify(document);

				assert.strictEqual(fs.readFileSync(path.join(sourceDir, 'style.min.css'), 'utf8'), 'p{color:red}');
				assert.strictEqual(fs.readFileSync(sourcePath, 'utf8'), cssSource);
				assert.strictEqual(errorStub.callCount, 1, 'No further error');
			});

			for (const prefix of readPrefixOptions()) {
				test(`still writes the new file for the offered value '${prefix}'`, async function () {
					await config().update('minifiedNewFilePrefix', prefix, true);
					const document = await openSource();

					await onSaveMinify(document);

					const expected = path.join(sourceDir, `style${prefix}.css`);
					assert.strictEqual(fs.readFileSync(expected, 'utf8'), 'p{color:red}');
					assert.strictEqual(fs.readFileSync(sourcePath, 'utf8'), cssSource);
					assert.strictEqual(errorStub.callCount, 0);
				});
			}

			test('does not read the prefix when minifying in place', async function () {
				await config().update('minifyInNewFile', false, true);
				await config().update('minifiedNewFilePrefix', 'a/b', true);
				const document = await openSource();

				await onSaveMinify(document);

				assert.strictEqual(errorStub.callCount, 0, 'The prefix is not used in place, so no error');
				assert.strictEqual(fs.readFileSync(sourcePath, 'utf8'), 'p{color:red}', 'Minified in place as before');
			});
		});
	});
});
