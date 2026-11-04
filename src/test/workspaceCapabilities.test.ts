import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import assert from 'assert';
import { setTimeout } from 'timers';
import { TextDecoder } from 'util';

/** Minified output of the CSS used in these tests. */
const cssMinifiedContent = 'p{color:red}';

/**
 * Minimal in-memory file system used to emulate a virtual workspace.
 *
 * It is registered under a scheme other than `file`, so any code path that builds a
 * `file:` URI for a document of this scheme writes to the wrong place and the
 * assertions below fail.
 */
class InMemoryFileSystemProvider implements vscode.FileSystemProvider {
	private readonly emitter = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
	readonly onDidChangeFile = this.emitter.event;
	readonly files = new Map<string, Uint8Array>();

	watch(): vscode.Disposable {
		return new vscode.Disposable(() => undefined);
	}

	stat(uri: vscode.Uri): vscode.FileStat {
		const data = this.files.get(uri.path);
		if (data) {
			return { type: vscode.FileType.File, ctime: 0, mtime: Date.now(), size: data.byteLength };
		}
		// A path without an extension is treated as a directory so parents resolve
		if (!path.posix.extname(uri.path)) {
			return { type: vscode.FileType.Directory, ctime: 0, mtime: 0, size: 0 };
		}
		throw vscode.FileSystemError.FileNotFound(uri);
	}

	readDirectory(): [string, vscode.FileType][] {
		return [];
	}

	createDirectory(): void {
		// Directories are implicit
	}

	readFile(uri: vscode.Uri): Uint8Array {
		const data = this.files.get(uri.path);
		if (!data) {
			throw vscode.FileSystemError.FileNotFound(uri);
		}
		return data;
	}

	writeFile(uri: vscode.Uri, content: Uint8Array): void {
		const existed = this.files.has(uri.path);
		this.files.set(uri.path, content);
		this.emitter.fire([{ type: existed ? vscode.FileChangeType.Changed : vscode.FileChangeType.Created, uri }]);
	}

	delete(uri: vscode.Uri): void {
		this.files.delete(uri.path);
	}

	rename(): void {
		throw vscode.FileSystemError.NoPermissions('rename is not supported');
	}
}

suite('Virtual Workspace Test Suite', function () {
	this.timeout(30000);

	const scheme = 'css-js-minifier-test';
	const provider = new InMemoryFileSystemProvider();
	const encoder = new TextEncoder();
	const decoder = new TextDecoder();
	const config = () => vscode.workspace.getConfiguration('css-js-minifier');
	let registration: vscode.Disposable;
	let originalPrefix: unknown;
	let originalAutoOpen: unknown;

	this.beforeAll(async function () {
		registration = vscode.workspace.registerFileSystemProvider(scheme, provider, { isCaseSensitive: true });
		originalPrefix = config().inspect('minifiedNewFilePrefix')?.globalValue;
		originalAutoOpen = config().inspect('autoOpenNewFile')?.globalValue;
		await config().update('minifiedNewFilePrefix', '.min', true);
		await config().update('autoOpenNewFile', false, true);
	});

	this.afterAll(async function () {
		registration.dispose();
		await config().update('minifiedNewFilePrefix', originalPrefix, true);
		await config().update('autoOpenNewFile', originalAutoOpen, true);
	});

	this.afterEach(function () {
		sinon.restore();
		provider.files.clear();
	});

	/** Opens `source` in the editor and runs a command against it. */
	async function runOn(source: vscode.Uri, command: string): Promise<vscode.TextDocument> {
		const document = await vscode.workspace.openTextDocument(source);
		await vscode.window.showTextDocument(document);
		await vscode.commands.executeCommand(command);
		return document;
	}

	test('Minify and Save as New File writes next to the source on the same scheme and authority', async function () {
		const source = vscode.Uri.from({ scheme, authority: 'host', path: '/virtual-project/css/style.css' });
		const original = 'p {\n  color: red;\n}\n';
		provider.files.set(source.path, encoder.encode(original));
		const wrongLocalPath = '/virtual-project/css/style.min.css';

		await runOn(source, 'extension.minifyInNewFile');

		const written = provider.files.get('/virtual-project/css/style.min.css');
		assert.ok(written, 'The minified file should be written through the provider of the source scheme');
		assert.strictEqual(decoder.decode(written), cssMinifiedContent);
		assert.ok(!fs.existsSync(wrongLocalPath), `No local file should be created at: ${wrongLocalPath}`);
		assert.strictEqual(decoder.decode(provider.files.get(source.path)), original, 'The source must stay unchanged');
	});

	test('Minify and Save as New File works for JavaScript with another prefix', async function () {
		await config().update('minifiedNewFilePrefix', '-compressed', true);
		try {
			const source = vscode.Uri.from({ scheme, authority: 'host', path: '/virtual-project/js/app.js' });
			provider.files.set(source.path, encoder.encode('function  test() {\n  return 1;\n}\n'));

			await runOn(source, 'extension.minifyInNewFile');

			assert.ok(
				provider.files.has('/virtual-project/js/app-compressed.js'),
				`Expected app-compressed.js in the provider, found: ${[...provider.files.keys()].join(', ')}`
			);
		} finally {
			await config().update('minifiedNewFilePrefix', '.min', true);
		}
	});

	test('The new file does not inherit the query or fragment of the source URI', async function () {
		const source = vscode.Uri.from({
			scheme,
			authority: 'host',
			path: '/virtual-project/query/style.css',
			query: 'rev=abc',
			fragment: 'frag',
		});
		provider.files.set(source.path, encoder.encode('p { color: red; }'));

		await runOn(source, 'extension.minifyInNewFile');

		assert.ok(provider.files.has('/virtual-project/query/style.min.css'), 'The sibling file should be written');
	});

	test('The success message names the new file and not its path', async function () {
		const showMessageStub = sinon.stub(vscode.window, 'showInformationMessage');
		const source = vscode.Uri.from({ scheme, authority: 'host', path: '/virtual-project/msg/style.css' });
		provider.files.set(source.path, encoder.encode('p { color: red; }'));

		await runOn(source, 'extension.minifyInNewFile');
		await new Promise((resolve) => setTimeout(resolve, 300));

		assert.ok(showMessageStub.called, 'showInformationMessage should be called');
		const message = showMessageStub.lastCall.args[0] as string;
		assert.ok(message.includes('style.min.css'), `Message should name the new file. Got: ${message}`);
		assert.ok(!message.includes('/virtual-project'), `Message should show only the file name. Got: ${message}`);
	});

	test('Minify this File replaces the content through the virtual file system', async function () {
		const source = vscode.Uri.from({ scheme, authority: 'host', path: '/virtual-project/inplace/style.css' });
		provider.files.set(source.path, encoder.encode('p {\n  color: red;\n}\n'));

		const document = await runOn(source, 'extension.minify');

		assert.strictEqual(document.getText(), cssMinifiedContent);
		assert.strictEqual(decoder.decode(provider.files.get(source.path)), cssMinifiedContent);
	});
});

suite('Workspace Capabilities Test Suite', function () {
	const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'package.json'), 'utf8'));

	test('Virtual workspaces are declared as supported', function () {
		assert.strictEqual(packageJson.capabilities?.virtualWorkspaces, true);
	});

	test('Untrusted workspaces are limited and restrict every setting that decides where files are written', function () {
		const untrusted = packageJson.capabilities?.untrustedWorkspaces;
		assert.strictEqual(untrusted?.supported, 'limited');
		assert.ok(
			typeof untrusted.description === 'string' && untrusted.description.length > 0,
			'A limited declaration needs a description'
		);

		const restricted = untrusted.restrictedConfigurations as string[];
		assert.deepStrictEqual(
			[...restricted].sort(),
			['css-js-minifier.minifiedNewFilePrefix', 'css-js-minifier.minifyInNewFile', 'css-js-minifier.minifyOnSave'],
			'Settings that trigger writes or choose the target file name must come from user settings only'
		);

		const declared = Object.keys(packageJson.contributes.configuration.properties);
		restricted.forEach((setting) => {
			assert.ok(declared.includes(setting), `Restricted setting '${setting}' must be a declared setting`);
		});
	});
});
