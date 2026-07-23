# TSDoc Adoption Plan — Issue #182

## Problem Statement

The project currently uses JSDoc-style documentation comments with several non-standard patterns that are incompatible with the TSDoc specification. This creates interoperability issues between tools (TypeDoc, API Extractor, VS Code IntelliSense) and introduces redundant type annotations that TypeScript already provides.

## Current Architecture

### Documentation Patterns in Use

| File | Non-TSDoc Patterns Found |
|------|--------------------------|
| `src/extension.ts` | `@fileoverview`, `@author`, `@version`, `@since`, `@function`, `@param {type}`, `@returns {void}` |
| `src/commands/minifyCommand.ts` | `@fileoverview`, `@author`, `@since`, `@async`, `@function`, `@param {type}`, `@returns {type}`, `@interface`, `@property {type}` |
| `src/commands/index.ts` | `@fileoverview`, `@module` |
| `src/services/minificationService.ts` | `@fileoverview`, `@author`, `@version`, `@since`, `@function`, `@param {type}`, `@returns {type}`, `@sideEffects` |
| `src/services/fileService.ts` | `@async`, `@function`, `@param {type}`, `@returns {type}`, `@sideEffects` |
| `src/services/strategies/localCssMinifier.ts` | `@fileoverview`, `@author`, `@version`, `@since`, `@function`, `@param {type}`, `@returns {type}`, `@sideEffects` |
| `src/services/strategies/localJsMinifier.ts` | `@fileoverview`, `@author`, `@version`, `@since`, `@function`, `@param {type}`, `@returns {type}`, `@sideEffects` |
| `src/services/strategies/index.ts` | `@fileoverview`, `@author`, `@version`, `@since` |
| `src/services/index.ts` | `@fileoverview`, `@module`, `@since` |
| `src/lib/constants.ts` | `@fileoverview`, `@author`, `@version`, `@since`, `@readonly` |
| `src/lib/helpers.ts` | `@fileoverview`, `@author`, `@version`, `@since`, `@function`, `@param {type}`, `@returns {type}` |
| `src/lib/index.ts` | `@fileoverview`, `@author`, `@version`, `@since` |
| `src/types/minification.ts` | `@fileoverview`, `@author`, `@version`, `@since`, `@interface`, `@property {type}` |
| `src/types/index.ts` | `@fileoverview`, `@author`, `@version`, `@since` |
| `src/utils/validators.ts` | `@function`, `@param {type}`, `@returns {type}`, `@sideEffects`, `@readonly`, `@enum {string}` |
| `src/utils/l10nHelper.ts` | `@fileoverview`, `@author`, `@since` |
| `src/utils/index.ts` | `@fileoverview`, `@module` |

### Violation Summary

- **17 files** need migration
- **~60 occurrences** of `{type}` annotations to remove
- **~12 occurrences** of `@fileoverview` to convert
- **~10 occurrences** of `@function` / `@async` to remove
- **~6 occurrences** of `@sideEffects` to move into `@remarks`
- **~5 occurrences** of `@interface` / `@property {type}` to remove

## Proposed Changes

### Tooling

1. **Install** `eslint-plugin-tsdoc` (dev dependency)
2. **Create** `tsdoc.json` at project root — define custom tags `@since`, `@version`, `@author` as block tags (they carry content like version numbers and names)
3. **Update** `eslint.config.mjs` — add `tsdoc` plugin with `tsdoc/syntax: "error"` rule for `src/**/*.ts` files

### Comment Migration Rules

| Action | Before | After |
|--------|--------|-------|
| Remove type braces | `@param {string} text - desc` | `@param text - desc` |
| Remove type braces | `@returns {boolean} desc` | `@returns desc` |
| Remove redundant tag | `@function functionName` | _(delete entirely)_ |
| Remove redundant tag | `@async` | _(delete entirely)_ |
| Remove redundant tag | `@interface InterfaceName` | _(delete entirely)_ |
| Remove redundant tag | `@enum {string}` | _(delete entirely)_ |
| Remove type braces | `@property {type} name - desc` | _(delete — TS handles it)_ |
| Convert module doc | `@fileoverview desc` | `@packageDocumentation` + summary |
| Move custom content | `@sideEffects\n- list` | Under `@remarks` heading |
| Keep non-standard | `@module name` | _(delete — not TSDoc)_ |
| Keep with custom def | `@since`, `@version`, `@author` | Keep — defined in `tsdoc.json` |
| Keep standard | `@remarks`, `@example`, `@throws`, `@see`, `{@link}`, `@returns`, `@param` | Keep as-is |

## Phase Breakdown

### Phase 1: Tooling Setup (~15 min)

1. `npm install --save-dev eslint-plugin-tsdoc`
2. Create `tsdoc.json` with custom tag definitions
3. Add `tsdoc` plugin + rule to `eslint.config.mjs`
4. Run `npm run lint` to establish baseline violations

### Phase 2: Core Module Migration (~30 min)

Migrate in dependency order (leaves first):
1. `src/types/minification.ts` + `src/types/index.ts`
2. `src/lib/constants.ts` + `src/lib/helpers.ts` + `src/lib/index.ts`
3. `src/utils/l10nHelper.ts` + `src/utils/validators.ts` + `src/utils/index.ts`

### Phase 3: Service Layer Migration (~30 min)

4. `src/services/strategies/localCssMinifier.ts`
5. `src/services/strategies/localJsMinifier.ts`
6. `src/services/strategies/index.ts`
7. `src/services/minificationService.ts`
8. `src/services/fileService.ts`
9. `src/services/index.ts`

### Phase 4: Command & Entry Point Migration (~20 min)

10. `src/commands/minifyCommand.ts`
11. `src/commands/index.ts`
12. `src/extension.ts`

### Phase 5: Validation & Docs (~15 min)

13. Run full lint — zero warnings
14. Run full test suite — all passing
15. Update `AGENTS.md` documentation standards
16. Update `.github/copilot-instructions.md` documentation section

## Testing Strategy

- **Lint validation**: `npm run lint` must produce 0 `tsdoc/syntax` errors
- **Functional tests**: `npm test` must pass (52 tests) — doc changes are non-functional
- **Manual verification**: Hover over symbols in VS Code to confirm IntelliSense renders correctly
- **TSDoc Playground**: Spot-check complex comments at https://tsdoc.org/play/

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Breaking IntelliSense | TSDoc is VS Code's native format — should improve |
| Missing custom tags cause lint errors | `tsdoc.json` defines `@since`, `@version`, `@author` |
| Tests fail unexpectedly | Tests don't depend on doc comments — purely cosmetic change |
| Large diff hard to review | Split commits by phase for clear review |
