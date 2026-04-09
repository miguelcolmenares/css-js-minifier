/**
 * @fileoverview Minification strategies module exports.
 *
 * This module exports all available minification strategies:
 * - Local CSS minification using LightningCSS (Rust-based)
 * - Local JavaScript minification using oxc-minify (Rust-based)
 *
 * @author Miguel Colmenares
 * @version 1.3.0
 * @since 1.2.0
 *
 * @example
 * ```typescript
 * import { minifyCss, minifyJs } from './strategies';
 *
 * // Local CSS minification
 * const cssResult = minifyCss(cssCode);
 *
 * // Local JavaScript minification
 * const jsResult = minifyJs(jsCode);
 * ```
 */

export { minifyCss } from './localCssMinifier';
export { minifyJs } from './localJsMinifier';
