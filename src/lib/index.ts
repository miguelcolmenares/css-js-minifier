/**
 * @packageDocumentation
 * Library module exports.
 *
 * This module exports constants and helper functions used throughout
 * the extension. Following DDD principles, shared utilities are
 * centralized here for consistent usage across all layers.
 *
 * @author Miguel Colmenares
 * @since 1.2.0
 *
 * @example
 * ```typescript
 * import {
 *   formatBytes,
 *   calculateStats
 * } from '@/lib';
 * ```
 */

// Constants
export { BYTES_PER_KB, BYTES_PER_MB } from './constants';

// Helper functions
export { formatBytes, calculateStats } from './helpers';
