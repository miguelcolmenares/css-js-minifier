/**
 * @fileoverview Library module exports.
 *
 * This module exports constants and helper functions used throughout
 * the extension. Following DDD principles, shared utilities are
 * centralized here for consistent usage across all layers.
 *
 * @author Miguel Colmenares
 * @version 1.3.0
 * @since 1.2.0
 *
 * @example
 * ```typescript
 * import {
 *   TOPTAL_JS_API,
 *   API_TIMEOUT_MS,
 *   formatBytes,
 *   calculateStats
 * } from '@/lib';
 * ```
 */

// Constants
export {
	TOPTAL_JS_API,
	HTTP_REQUEST_CONFIG,
	API_TIMEOUT_MS,
	MAX_FILE_SIZE_BYTES,
	BYTES_PER_KB,
	BYTES_PER_MB,
} from './constants';

// Helper functions
export { formatBytes, calculateStats } from './helpers';
