#!/usr/bin/env node
/**
 * coverage-report.mjs
 *
 * Reduces the lcov file written by `vscode-test --coverage` to the files this
 * repository owns (`src/**`, minus `src/test/**`), rewrites it in place with
 * repository-relative paths, and prints a per-file summary.
 *
 * Why it exists: the extension under test is the webpack bundle
 * `dist/extension.js`, and c8 (inside `@vscode/test-cli`) also reports every
 * non-source module of that bundle, such as `external commonjs "vscode"` and
 * `webpack/bootstrap`, as 100% covered because it cannot read them. Those rows
 * are noise and inflate the total, so they are dropped here.
 *
 * Usage:
 *   node scripts/coverage-report.mjs [--markdown] [--lcov <path>]
 *
 *   --markdown   Print a GitHub-flavoured Markdown table instead of plain text.
 *                CI appends it to `$GITHUB_STEP_SUMMARY`.
 *   --lcov       lcov file to read (default: coverage/lcov.info).
 *
 * Contract:
 *   - Exit 0: the summary was printed.
 *   - Exit 1: the lcov file is missing, or has no entry for `src/extension.ts`
 *     (the bundle was built without `--env coverage`). A run that measured
 *     almost nothing must fail loudly instead of reporting a tiny table.
 *
 * No npm dependencies of its own.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { argv, cwd, exit } from 'node:process';

const args = argv.slice(2);
const markdown = args.includes('--markdown');
const lcovFlag = args.indexOf('--lcov');
const lcovPath = resolve(lcovFlag === -1 ? 'coverage/lcov.info' : args[lcovFlag + 1] ?? '');

/** @returns {string} Absolute path in forward-slash form, for matching on any OS. */
const normalize = (/** @type {string} */ p) => resolve(p).replaceAll('\\', '/');
const root = normalize(cwd());

let raw;
try {
	raw = readFileSync(lcovPath, 'utf8');
} catch (error) {
	console.error(`coverage-report: cannot read ${lcovPath}: ${error.message}`);
	console.error('Run "npm run test:coverage" first.');
	exit(1);
}

/**
 * Parses one lcov record into the totals this report needs.
 *
 * @param {string} record - Text of one record, without `end_of_record`.
 * @returns {{ file: string, lines: [number, number], funcs: [number, number], branches: [number, number], text: string } | undefined}
 */
function parseRecord(record) {
	const field = (/** @type {string} */ key) => record.match(new RegExp(`^${key}:(.*)$`, 'm'))?.[1];
	const sourceFile = field('SF');
	if (!sourceFile) {
		return undefined;
	}
	const abs = normalize(sourceFile);
	if (!abs.startsWith(`${root}/src/`) || abs.startsWith(`${root}/src/test/`)) {
		return undefined;
	}
	const file = relative(root, abs).replaceAll('\\', '/');
	const pair = (/** @type {string} */ found, /** @type {string} */ total) => [
		Number(field(found) ?? 0),
		Number(field(total) ?? 0),
	];
	return {
		file,
		lines: pair('LH', 'LF'),
		funcs: pair('FNH', 'FNF'),
		branches: pair('BRH', 'BRF'),
		text: record.replace(/^SF:.*$/m, `SF:${file}`),
	};
}

const records = raw
	.split('end_of_record')
	.map((chunk) => parseRecord(chunk.trim()))
	.filter(Boolean)
	.sort((a, b) => a.file.localeCompare(b.file));

// The extension runs from the webpack bundle, so its entry point only appears when the bundle's
// source map points at real files. Without it the report would hold just the few files the tests
// import directly from out/ (for example l10nHelper), which looks like a complete result and is not.
if (!records.some((r) => r.file === 'src/extension.ts')) {
	console.error(`coverage-report: ${lcovPath} has no entry for src/extension.ts, so the bundle was not measured.`);
	console.error('Rebuild it with "npm run compile:coverage" (source map paths) and run the tests again.');
	exit(1);
}

writeFileSync(lcovPath, records.map((r) => `${r.text.trim()}\nend_of_record\n`).join(''));

/** @returns {string} Percentage with two decimals, or `-` when nothing was counted. */
const pct = (/** @type {[number, number]} */ [hit, found]) =>
	found === 0 ? '-' : `${((hit / found) * 100).toFixed(2)}`;
const sum = (/** @type {'lines' | 'funcs' | 'branches'} */ key) =>
	records.reduce((acc, r) => [acc[0] + r[key][0], acc[1] + r[key][1]], [0, 0]);
const total = { file: `All files (${records.length})`, lines: sum('lines'), funcs: sum('funcs'), branches: sum('branches') };
const rows = [...records, total];

if (markdown) {
	const cell = (/** @type {[number, number]} */ v) => (v[1] === 0 ? '-' : `${pct(v)}% (${v[0]}/${v[1]})`);
	console.log('### Test coverage');
	console.log('');
	console.log('| File | Lines | Functions | Branches |');
	console.log('| --- | ---: | ---: | ---: |');
	for (const r of rows) {
		const name = r === total ? `**${r.file}**` : `\`${r.file}\``;
		console.log(`| ${name} | ${cell(r.lines)} | ${cell(r.funcs)} | ${cell(r.branches)} |`);
	}
	console.log('');
	console.log(
		'Measured on Ubuntu with VS Code Stable. Report only, no threshold. Native code in `lightningcss` and `oxc-minify` is not measurable.',
	);
} else {
	const width = Math.max(...rows.map((r) => r.file.length));
	const line = (/** @type {string[]} */ cells) => `${cells[0].padEnd(width)} | ${cells.slice(1).map((c) => c.padStart(7)).join(' | ')}`;
	console.log(line(['File', '% Lines', '% Funcs', '% Branch']));
	console.log('-'.repeat(width + 30));
	for (const r of rows) {
		if (r === total) {
			console.log('-'.repeat(width + 30));
		}
		console.log(line([r.file, pct(r.lines), pct(r.funcs), pct(r.branches)]));
	}
	console.log(`\nlcov report: ${relative(root, lcovPath)}`);
}
