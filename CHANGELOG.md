# Change Log

All notable changes to the "css-js-minifier" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Migrate to ESLint v9 flat config for better compatibility
- Optimize GitHub Actions cache strategy across all workflows
- Optimize CodeQL execution to run only on PRs and weekly schedule
- Standardize action versions to checkout@v5
- Improve CI/CD efficiency and reduce resource usage

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