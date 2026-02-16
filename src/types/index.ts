/**
 * @fileoverview Type definitions module exports.
 * 
 * This module exports all type definitions used throughout the extension.
 * Following DDD principles, types are centralized here for consistent
 * usage across all layers.
 * 
 * @author Miguel Colmenares
 * @version 1.2.0
 * @since 1.2.0
 * 
 * @example
 * ```typescript
 * import { MinificationResult, MinificationStats } from '../types';
 * ```
 */

export {
	MinificationStats,
	MinificationResult,
	ApiConfig,
	HttpRequestConfig
} from './minification';
