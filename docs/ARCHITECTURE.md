# Extension Architecture

## Overview

The CSS & JS Minifier extension follows a modular architecture pattern that separates concerns into distinct layers for better maintainability, testability, and code reusability.

## Architecture Layers

### 1. Extension Entry Point (`src/extension.ts`)

- **Purpose**: Activation / deactivation lifecycle management.
- **Responsibilities**: Synchronous command registration at the top of `activate()` (prevents the "command not found" race documented in #145), `onDidSaveTextDocument` listener for the `minifyOnSave` feature, output channel initialization, and reporting activation failures via `showErrorMessage` with a pointer to the output panel.

### 2. Commands Layer (`src/commands/`)

- **Purpose**: VS Code command handlers and user interaction logic.
- **Components**:
  - `minifyCommand.ts` — `extension.minify` and `extension.minifyInNewFile` handlers, plus the shared `processDocument()` core. Handles both active-editor and explorer-URI invocations, plus the untitled-document guard (#145).
  - `index.ts` — command exports.

### 3. Services Layer (`src/services/`)

- **Purpose**: Business logic and minification orchestration.
- **Components**:
  - `minificationService.ts` — facade that routes to the appropriate strategy based on `languageId`.
  - `fileService.ts` — file system operations, filename generation with the configured `minifiedNewFilePrefix`, and the size-reduction statistics rendering.
  - `strategies/localCssMinifier.ts` — CSS via LightningCSS (Rust `transform()`).
  - `strategies/localJsMinifier.ts` — JavaScript via oxc-minify (Rust `minifySync()`).
  - `strategies/index.ts`, `index.ts` — barrel exports.

### 4. Utils Layer (`src/utils/`)

- **Purpose**: Reusable validation and localization helpers.
- **Components**:
  - `validators.ts` — file type and content validation with localized user feedback.
  - `l10nHelper.ts` — one-line delegate to `vscode.l10n.t(message, ...args)` so every call site imports from a single stable path. See [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md).
  - `index.ts` — barrel exports.

### 5. Lib Layer (`src/lib/`)

- **Purpose**: Shared infrastructure constants and pure helpers.
- **Components**:
  - `constants.ts` — byte size constants used for the size-reduction display.
  - `helpers.ts` — pure functions such as `formatBytes()` and `calculateStats()`.
  - `index.ts` — barrel exports.

### 6. Types Layer (`src/types/`)

- **Purpose**: Domain type definitions shared across layers.
- **Components**:
  - `minification.ts` — `MinificationStats`, `MinificationResult`.
  - `index.ts` — barrel exports.

## Benefits of Modular Architecture

### ✅ Separation of Concerns

- Each module has a single responsibility
- Clear boundaries between UI logic, business logic, and utilities
- Easier to locate and modify specific functionality

### ✅ Code Reusability

- No duplicate validation or API logic between commands
- Shared utilities across different command handlers
- Consistent error handling patterns

### ✅ Enhanced Testability

- Pure functions easier to unit test
- Isolated business logic can be tested independently
- Mocking external dependencies is straightforward

### ✅ Improved Maintainability

- 63% reduction in main file complexity
- Self-documenting code with comprehensive JSDoc
- Clear module dependencies and exports

### ✅ Better Developer Experience

- IntelliSense support for all module functions
- Type safety with proper interfaces
- Consistent coding patterns throughout

## Data Flow

```
User Action (Command / Keybinding / Context Menu / onDidSaveTextDocument)
    ↓
Command Handler (commands/minifyCommand.ts)
    ↓
Validation (utils/validators.ts)
    ↓
Minification Service (services/minificationService.ts)
    ↓
Strategy (services/strategies/local{Css,Js}Minifier.ts)
    ↓
File Operations (services/fileService.ts) + Stats (lib/helpers.ts)
    ↓
User Feedback (VS Code Notifications, localized via utils/l10nHelper.ts)
```

## Module Dependencies

```
extension.ts
    ├── commands/minifyCommand.ts
    │     ├── utils/validators.ts
    │     ├── utils/l10nHelper.ts
    │     ├── services/minificationService.ts
    │     │     └── services/strategies/{localCssMinifier,localJsMinifier}.ts
    │     └── services/fileService.ts
    │           └── lib/helpers.ts (formatBytes, calculateStats)
    └── types/minification.ts (shared across layers)
```

## Error Handling Strategy

### Layered Error Handling

1. **Validation Layer**: Input validation with user-friendly messages
2. **Service Layer**: Minification error handling with specific error codes
3. **Command Layer**: Coordination and user notification
4. **Extension Layer**: Global error catching and logging

### User Experience Focus

- All errors show appropriate VS Code notifications
- Context-aware error messages (file type, syntax errors)
- Both CSS and JS minification work fully offline

## Configuration Management

### Centralized Settings

- All configuration accessed through `vscode.workspace.getConfiguration()`
- Settings validated at the point of use
- Default values provided for all optional settings

### Dynamic Configuration

- Settings can be changed without extension restart
- Configuration changes take effect immediately
- Per-workspace and global configuration support

## Performance Optimizations

### Efficient Processing

- Local Rust-based minification (LightningCSS + oxc-minify) — no network latency, fully offline.
- Synchronous minification APIs for instant results.
- Webpack bundling with `oxc-minify`, `lightningcss`, and `detect-libc` marked as externals so the platform-specific `.node` binaries are loaded from `node_modules/` at runtime rather than bundled into `dist/extension.js`.
- `.vscodeignore` whitelists only the required native binaries per architecture, keeping each `.vsix` small.

## Distribution (multi-target `.vsix`)

The extension ships **six platform-specific `.vsix` files** — one per VS Code Marketplace target — instead of a single "universal" archive. This is required because both `lightningcss` and `oxc-minify` ship Rust-based `.node` binaries via `optionalDependencies`, and `vsce package` only bundles the bindings that `npm install` materialized on the packaging host.

| Marketplace target | GitHub Actions runner | Native arch |
|---|---|---|
| `darwin-x64` | `macos-15-intel` | Intel Mac |
| `darwin-arm64` | `macos-latest` | Apple Silicon |
| `linux-x64` | `ubuntu-latest` | x64 Linux (glibc) |
| `linux-arm64` | `ubuntu-24.04-arm` | ARM Linux (glibc) |
| `win32-x64` | `windows-latest` | x64 Windows |
| `win32-arm64` | `windows-11-arm` | ARM Windows |

Each runner:

1. `npm ci` — installs the native optional dependencies for its own OS/CPU automatically.
2. `npm run package` — webpack production bundle.
3. `npx vsce package --target <target>` — produces the platform-tagged `.vsix`.
4. `node scripts/verify-vsix-activation.mjs <vsix>` — extracts the archive, `require()`s `lightningcss` and `oxc-minify`, and calls each once to prove the binaries load on that platform. Exit `1` on a binding regression, `2` on an infrastructure failure.

The six artifacts are attached to the GitHub Release and published to the Marketplace as separate platform-tagged listings by the `Build & Release` workflow (`.github/workflows/release.yml`). VS Code serves each user the artifact that matches their OS/CPU. See [AGENTS.md → Cross-platform CI matrix](../AGENTS.md#cross-platform-ci-matrix) for the workflow contract and [`.github/instructions/publish-update-extension.instructions.md`](../.github/instructions/publish-update-extension.instructions.md) for the release runbook.

## Future Extensibility

- **New strategies**: add another `services/strategies/*Minifier.ts` and wire it into `minificationService`.
- **New file types**: extend `utils/validators.ts` and register the language in `package.json`.
- **New languages**: add `package.nls.<locale>.json` + `l10n/bundle.l10n.<locale>.json`; see [INTERNATIONALIZATION.md](INTERNATIONALIZATION.md).

---

**Last Updated**: 2026-07-22
**Extension Version**: 1.3.3
