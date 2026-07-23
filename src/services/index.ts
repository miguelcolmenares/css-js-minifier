/**
 * @packageDocumentation
 * Service layer for minification and file operations.
 *
 * This module exports services that handle:
 * - Minification orchestration via the minificationService facade
 * - Minification strategies (local CSS, local JS)
 * - File system operations for saving and modifying files
 * - Filename generation utilities
 *
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * import { getMinifiedText, MinificationResult } from './services';
 *
 * const result = getMinifiedText(code, 'css');
 * ```
 */

export * from './minificationService';
export * from './fileService';
