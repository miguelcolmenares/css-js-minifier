/**
 * @fileoverview Command handlers for VS Code extension commands.
 * 
 * This module exports the main command handlers that are registered
 * with VS Code to handle user-initiated minification operations.
 * 
 * Available commands:
 * - minifyCommand: In-place minification
 * - minifyInNewFileCommand: Create new minified files
 * - onSaveMinify: Auto-minification on file save
 * 
 * @module commands
 */

export * from './minifyCommand';