import * as vscode from 'vscode';
import { t } from './l10nHelper';

/**
 * Supported file types for minification.
 */
const SUPPORTED_FILE_TYPES = {
	CSS: 'css',
	JAVASCRIPT: 'javascript',
} as const;

/**
 * Validates if the provided file type is supported for minification.
 *
 * This function checks if the file type is either CSS or JavaScript,
 * which are the only file types supported for minification.
 *
 * @param fileType - The VS Code language identifier (e.g., 'css', 'javascript')
 * @returns True if the file type is supported (css or javascript), false otherwise
 *
 * @example
 * ```typescript
 * isValidFileType('css');        // returns true
 * isValidFileType('javascript'); // returns true
 * isValidFileType('html');       // returns false
 * isValidFileType('python');     // returns false
 * ```
 */
export function isValidFileType(fileType: string): boolean {
	return fileType === SUPPORTED_FILE_TYPES.CSS || fileType === SUPPORTED_FILE_TYPES.JAVASCRIPT;
}

/**
 * Validates the file type and displays user feedback for invalid types.
 *
 * This function performs validation using isValidFileType() and provides
 * user-friendly error messages when the file type is not supported.
 * It's designed to be used in command handlers where user feedback is required.
 *
 * @remarks
 * Shows an error message to the user via VS Code's notification system
 * when the file type is not supported.
 *
 * @param fileType - The VS Code language identifier to validate
 * @returns True if validation passes, false if validation fails
 *
 * @example
 * ```typescript
 * // In a command handler
 * const document = vscode.window.activeTextEditor?.document;
 * if (document && validateFileType(document.languageId)) {
 *   // Proceed with minification
 * }
 * ```
 */
export function validateFileType(fileType: string): boolean {
	if (!isValidFileType(fileType)) {
		// Show user-friendly error message with supported file types
		vscode.window.showErrorMessage(
			t("File type '{0}' is not supported. Only CSS and JavaScript files can be minified.", fileType)
		);
		return false;
	}
	return true;
}

/**
 * Validates that the file content is not empty and displays appropriate user feedback.
 *
 * This function ensures that there is actual content to minify before processing.
 * Empty files should be handled gracefully with appropriate user feedback.
 *
 * @remarks
 * Shows an informative error message to the user when the file is empty.
 *
 * @param text - The complete text content of the file to validate
 * @param fileType - The file type identifier (used for contextual error messages)
 * @returns True if the file has content (length \> 0), false if empty
 *
 * @example
 * ```typescript
 * const document = vscode.window.activeTextEditor?.document;
 * if (document) {
 *   const text = document.getText();
 *   if (validateContentLength(text, document.languageId)) {
 *     // File has content, proceed with minification
 *   }
 * }
 * ```
 */
export function validateContentLength(text: string, fileType: string): boolean {
	// Check for empty content (whitespace-only content is still considered valid)
	if (text.length === 0) {
		// Provide contextual error message based on file type
		vscode.window.showErrorMessage(t('Cannot minify empty {0} file. Please add some content first.', fileType));
		return false;
	}
	return true;
}

/**
 * Longest `minifiedNewFilePrefix` the extension accepts.
 *
 * The longest value the Settings UI offers is `-compressed` (11 characters). The limit only
 * exists so that a pasted or generated value cannot produce an absurd file name.
 */
export const MAX_FILE_PREFIX_LENGTH = 32;

/** Letters, digits, `.`, `-` and `_`: no path separator, no whitespace, no control character. */
const FILE_PREFIX_PATTERN = /^[A-Za-z0-9._-]+$/;

/** Longest rendering of an offending value inside the error message. */
const MAX_DISPLAYED_VALUE_LENGTH = 40;

/**
 * Offending `minifiedNewFilePrefix` values already reported in this session (JSON form).
 * Used to show the minify on save error once per value instead of on every save.
 */
const reportedInvalidFilePrefixes = new Set<string>();

/**
 * Checks that a value is safe to insert into a file name as the minified file prefix.
 *
 * @remarks
 * The `enum` of `css-js-minifier.minifiedNewFilePrefix` in `package.json` only drives the
 * Settings UI: VS Code passes a value written by hand in `settings.json` through unchanged,
 * so the extension has to check it at runtime (issue #259). The prefix is accepted when it is:
 *
 * - a string of 1 to {@link MAX_FILE_PREFIX_LENGTH} characters,
 * - made only of ASCII letters, digits, `.`, `-` and `_` (so it has no `/`, `\`, `:`, NUL,
 *   whitespace or other path syntax),
 * - free of `..`, so it can never read as a parent folder segment.
 *
 * Any such string is accepted, not only the six values of the `enum`, so a custom suffix
 * such as `.mini` keeps working as it did before.
 *
 * @param value - The raw value of the setting. Typed `unknown` because a hand-edited
 *   `settings.json` can hold any JSON value
 * @returns True when the value can be used as a prefix, false otherwise
 *
 * @example
 * ```typescript
 * isValidFilePrefix('.min');         // returns true
 * isValidFilePrefix('_opt');         // returns true
 * isValidFilePrefix('/../escaped');  // returns false
 * isValidFilePrefix('a/b');          // returns false
 * isValidFilePrefix('');             // returns false
 * ```
 */
export function isValidFilePrefix(value: unknown): value is string {
	return (
		typeof value === 'string' &&
		value.length <= MAX_FILE_PREFIX_LENGTH &&
		FILE_PREFIX_PATTERN.test(value) &&
		!value.includes('..')
	);
}

/**
 * Tells the user that `minifiedNewFilePrefix` holds a value that cannot be used.
 *
 * @remarks
 * Shows an error message that names the setting and the offending value. The value is
 * rendered as JSON so an empty string or a NUL character is visible, and it is truncated
 * when it is long. With `oncePerSession` the message is shown at most once per distinct
 * value until the window is reloaded, which keeps minify on save from raising a
 * notification on every save.
 *
 * @param value - The offending raw value of the setting
 * @param oncePerSession - Whether to skip the message when this value was already reported
 *
 * @example
 * ```typescript
 * reportInvalidFilePrefix('a/b');        // always shows the error
 * reportInvalidFilePrefix('a/b', true);  // shows it the first time only
 * ```
 */
export function reportInvalidFilePrefix(value: unknown, oncePerSession: boolean = false): void {
	const rendered = JSON.stringify(value) ?? String(value);
	if (oncePerSession) {
		if (reportedInvalidFilePrefixes.has(rendered)) {
			return;
		}
		reportedInvalidFilePrefixes.add(rendered);
	}

	const displayed =
		rendered.length > MAX_DISPLAYED_VALUE_LENGTH ? `${rendered.slice(0, MAX_DISPLAYED_VALUE_LENGTH)}...` : rendered;
	vscode.window.showErrorMessage(
		t(
			"Cannot create the minified file: the setting 'css-js-minifier.minifiedNewFilePrefix' has an invalid value ({0}). Use only letters, digits, '.', '-' and '_' (up to {1} characters, and no '..'), for example '.min'. No file was written.",
			displayed,
			MAX_FILE_PREFIX_LENGTH
		)
	);
}

/**
 * Forgets which invalid prefixes were already reported, so the next one is shown again.
 *
 * @remarks
 * Only the tests need this: in the extension the set lasts until the window is reloaded.
 *
 * @internal
 */
export function resetReportedInvalidFilePrefixes(): void {
	reportedInvalidFilePrefixes.clear();
}

/**
 * Reads `minifiedNewFilePrefix` and returns it only when it is safe to use.
 *
 * @remarks
 * This is the single place both entry points (the `Minify and Save as New File` command
 * and minify on save with `minifyInNewFile`) read the setting from. When the value is not
 * valid it reports the error and returns `undefined`, and the caller must write nothing.
 * There is deliberately no fallback to the default prefix, so the user notices and fixes
 * the setting.
 *
 * @param oncePerSession - Whether to show the error at most once per distinct value
 *   (minify on save) instead of every time (the command)
 * @returns The prefix, or undefined after showing the error when the value is not valid
 *
 * @example
 * ```typescript
 * const prefix = getValidFilePrefix();
 * if (prefix === undefined) {
 *   return; // the error was already shown, write nothing
 * }
 * ```
 */
export function getValidFilePrefix(oncePerSession: boolean = false): string | undefined {
	const value = vscode.workspace.getConfiguration('css-js-minifier').get<unknown>('minifiedNewFilePrefix');
	if (isValidFilePrefix(value)) {
		return value;
	}
	reportInvalidFilePrefix(value, oncePerSession);
	return undefined;
}
