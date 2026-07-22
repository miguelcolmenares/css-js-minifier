/**
 * @fileoverview Activation event regression guard for the CSS & JS Minifier extension.
 *
 * This suite locks the shape of `activationEvents` in `package.json` so that
 * regressions like issue #168 (`minifyOnSave` silently failing on the first
 * save after VS Code startup because the extension had not activated yet)
 * are caught in CI.
 *
 * The extension MUST activate as soon as a CSS or JavaScript document is
 * opened, so that the `workspace.onDidSaveTextDocument` listener registered
 * inside `activate()` is in place before the user's first save. That is the
 * only mechanism guaranteeing `minifyOnSave` runs on the first save.
 *
 * @author Miguel Colmenares
 * @since 1.3.3
 * @see https://github.com/miguelcolmenares/css-js-minifier/issues/168
 * @see https://github.com/miguelcolmenares/css-js-minifier/issues/169
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

suite('Activation Events (regression guard for #168)', function () {
	const workspaceRoot = path.resolve(__dirname, '../../');
	const packageJsonPath = path.join(workspaceRoot, 'package.json');
	const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
	const rawActivationEvents: unknown = packageJson.activationEvents;

	test('activationEvents is declared as an array in package.json', function () {
		assert.ok(
			Array.isArray(rawActivationEvents),
			`activationEvents must be an array of strings in package.json. ` +
				`Got: ${JSON.stringify(rawActivationEvents)} (type: ${typeof rawActivationEvents})`
		);
	});

	// Downstream tests only run meaningfully when the type invariant above holds.
	// Fall back to an empty array so those tests still fail with a clear message
	// rather than throwing an unrelated TypeError on `.includes` / `.filter`.
	const activationEvents: string[] = Array.isArray(rawActivationEvents) ? (rawActivationEvents as string[]) : [];

	test('activationEvents contains onLanguage:css', function () {
		assert.ok(
			activationEvents.includes('onLanguage:css'),
			`activationEvents must include "onLanguage:css" so the extension activates ` +
				`when a CSS document is opened. Without it, minifyOnSave silently fails on ` +
				`the first save after VS Code startup (issue #168). Got: ${JSON.stringify(activationEvents)}`
		);
	});

	test('activationEvents contains onLanguage:javascript', function () {
		assert.ok(
			activationEvents.includes('onLanguage:javascript'),
			`activationEvents must include "onLanguage:javascript" so the extension activates ` +
				`when a JavaScript document is opened. Without it, minifyOnSave silently fails on ` +
				`the first save after VS Code startup (issue #168). Got: ${JSON.stringify(activationEvents)}`
		);
	});

	test('activationEvents does not use the invalid "onSaveTextDocument" event', function () {
		// `onSaveTextDocument` is not a valid activation event — VS Code silently
		// ignores it. The pre-1.3.3 manifest shipped it under the mistaken assumption
		// that it would trigger activation on save; it never did. Re-adding it is a
		// regression to the broken v1.3.2 activation model that caused #168.
		assert.ok(
			!activationEvents.includes('onSaveTextDocument'),
			`activationEvents must not include the invalid "onSaveTextDocument" event. ` +
				`Got: ${JSON.stringify(activationEvents)}`
		);
	});

	test('activationEvents does not rely on deprecated onCommand:* entries', function () {
		// Implicit command activation has been standard since VS Code 1.74; the
		// legacy `onCommand:extension.minify` / `onCommand:extension.minifyInNewFile`
		// entries are auto-generated and re-adding them signals a regression to the
		// v1.3.2 activation model that is the root cause of issue #168.
		const legacy = activationEvents.filter((e) => e.startsWith('onCommand:'));
		assert.deepStrictEqual(
			legacy,
			[],
			`activationEvents must not include explicit "onCommand:*" entries. ` + `Got: ${JSON.stringify(legacy)}`
		);
	});
});
