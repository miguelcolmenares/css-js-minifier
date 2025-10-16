# Change Log

All notable changes to the "css-js-minifier" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

### Major Refactoring

- **BREAKING REFACTOR**: Restructured codebase into modular architecture
  - `src/commands/`: Command handlers and core business logic
  - `src/services/`: External API integration and file operations
  - `src/utils/`: Validation utilities and helper functions

- Comprehensive JSDoc documentation with practical examples for all functions
- Modular architecture with clear separation of concerns
- Enhanced error handling with detailed user feedback
- Type safety improvements with interfaces and proper typing
- Reduced main extension file size by 63% (220→81 lines)
- Eliminated code duplication between minify commands
- Improved code reusability and maintainability
- Enhanced documentation standards across all modules

### New Features

- **Robust Timeout Handling**: Added 5000ms timeout for API calls with Promise.race pattern
  - Handles API responses observed up to 1100ms in performance testing
  - Specific error messages for timeout vs connectivity issues
  - Improved user experience with clear, actionable error feedback
  - Graceful degradation when external APIs are slow or unresponsive

- **Enhanced API Error Handling**: Comprehensive error handling based on updated Toptal API documentation
  - **File Size Validation**: Pre-request validation for 5MB maximum file size limit
  - **HTTP Status Code Handling**: Specific user messages for all API error codes (400, 405, 406, 413, 422, 429)
  - **JSON Error Parsing**: Extracts detailed error messages from API JSON responses when available
  - **Rate Limit Awareness**: Clear messaging when hitting 30 requests/minute limit
  - **Syntax Error Details**: Informative feedback for CSS/JavaScript syntax errors with precise error descriptions

### Bug Fixes

- **Fixed Minify on Save**: Resolved issue where minify on save didn't respect `minifyInNewFile` configuration
  - Now properly creates new files when `minifyInNewFile: true` is set
  - Maintains in-place minification when `minifyInNewFile: false` (default behavior)
  - Respects all user configuration settings during auto-minification on save

- **New Configuration Option**: Added `autoOpenNewFile` setting to control file opening behavior
  - When `true` (default): Newly created minified files open automatically in editor
  - When `false`: Files are created silently without opening, reducing editor clutter
  - Addresses user request for less intrusive minification workflow

### Technical Improvements

- Migrate to ESLint v9 flat config for better compatibility
- Optimize GitHub Actions cache strategy across all workflows
- Optimize CodeQL execution to run only on PRs and weekly schedule
- Standardize action versions to checkout@v5
- Enhanced test suite with automatic Sinon spy cleanup
- Updated error message validation in tests for new architecture
- Improve CI/CD efficiency and reduce resource usage
- Fix auto-merge workflow: Remove GitHub Actions approval restrictions

## [0.1.0] - 2024-06-29

### Added

- CSS and JavaScript minification using Toptal API
- Explorer context menu to minify css & js files
- Keyboard shortcuts for minify css & js files
- Prefix options for minified files (.min, -min, .compressed, etc.)
- File extension validation and content length validation before minifying
- Internazionalization support with Spanish translation
- Auto-minification on save (configurable)
- Test cases and comprehensive testing

### Fixed

- Update keybindings configuration to avoid conflicts with macOS default keybindings
- Demo images in README.md

### Changed

- Updated extension icon
- Updated README.md with new features and documentation
