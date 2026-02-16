/**
 * @fileoverview Minification strategies module exports.
 * 
 * This module exports all available minification strategies:
 * - Local CSS minification using clean-css
 * - Remote JavaScript minification using Toptal API
 * 
 * @author Miguel Colmenares
 * @version 1.2.0
 * @since 1.2.0
 * 
 * @example
 * ```typescript
 * import { minifyCss, minifyJavaScript } from './strategies';
 * 
 * // Local CSS minification
 * const cssResult = minifyCss(cssCode);
 * 
 * // Remote JavaScript minification
 * const jsResult = await minifyJavaScript(jsCode);
 * ```
 */

export { minifyCss } from './localCssMinifier';
export { minifyJavaScript } from './toptalApiMinifier';
