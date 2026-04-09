/**
 * @fileoverview Application-wide constants.
 * 
 * This module centralizes all constant values used throughout the extension.
 * Following Single Responsibility Principle, configuration values are
 * defined here and imported where needed.
 * 
 * @author Miguel Colmenares
 * @version 1.3.0
 * @since 1.2.0
 */

import type { ApiConfig, HttpRequestConfig } from "@/types";

// ============================================================================
// API Configuration
// ============================================================================

/**
 * Configuration for Toptal JavaScript minification API.
 * @readonly
 */
export const TOPTAL_JS_API: ApiConfig = {
	url: 'https://www.toptal.com/developers/javascript-minifier/api/raw',
	name: 'JavaScript Minifier'
} as const;

/**
 * HTTP configuration for API requests.
 * @readonly
 */
export const HTTP_REQUEST_CONFIG: HttpRequestConfig = {
	method: 'POST',
	headers: {
		'Content-Type': 'application/x-www-form-urlencoded',
	}
} as const;

// ============================================================================
// Timeouts and Limits
// ============================================================================

/**
 * Timeout duration for API requests in milliseconds.
 * Based on performance testing showing responses up to 1100ms.
 * @readonly
 */
export const API_TIMEOUT_MS = 5000;

/**
 * Maximum file size allowed by Toptal APIs (5MB in bytes).
 * Files larger than this will be rejected with HTTP 413 error.
 * @readonly
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// ============================================================================
// File Size Constants
// ============================================================================

/**
 * Number of bytes in a kilobyte.
 * @readonly
 */
export const BYTES_PER_KB = 1024;

/**
 * Number of bytes in a megabyte.
 * @readonly
 */
export const BYTES_PER_MB = 1024 * 1024;
