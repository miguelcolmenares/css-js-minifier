---
applyTo: '**/*.ts'
---

# TSDoc Documentation Standards

This project follows the [TSDoc](https://tsdoc.org/) specification for all TypeScript documentation comments. Compliance is enforced by `eslint-plugin-tsdoc` with `tsdoc/syntax: "error"`.

## Configuration

- **`tsdoc.json`** at project root defines custom modifier tags: `@since`, `@version`, `@author`.
- **ESLint** enforces `tsdoc/syntax` as an error for `src/**/*.ts` (disabled in test files).

## Allowed Tags

### Standard TSDoc Tags (always valid)

| Tag | Kind | Usage |
|-----|------|-------|
| `@param name - desc` | Block | Document a function parameter (NO `{type}` braces) |
| `@returns desc` | Block | Document return value (NO `{type}` braces) |
| `@remarks` | Block | Extended description, side effects, implementation details |
| `@example` | Block | Code example (use fenced ` ```typescript ` blocks) |
| `@throws` | Block | Document exceptions thrown |
| `@see` | Block | Reference other symbols or URLs |
| `@deprecated` | Block | Mark as deprecated with migration guidance |
| `@defaultValue` | Block | Document default value of a property |
| `@typeParam name - desc` | Block | Document a generic type parameter |
| `@privateRemarks` | Block | Internal notes (excluded from generated docs) |
| `@packageDocumentation` | Modifier | Module-level documentation (one per file, first comment) |
| `@readonly` | Modifier | Indicates a read-only member |
| `{@link symbol}` | Inline | Hyperlink to another symbol or URL |
| `{@inheritDoc}` | Inline | Inherit documentation from parent |

### Custom Tags (defined in `tsdoc.json`)

| Tag | Kind | Usage |
|-----|------|-------|
| `@since` | Modifier | Version when the file/API was introduced (file header only) |
| `@version` | Modifier | Current version of the file (entry point headers only) |
| `@author` | Modifier | Author attribution (file header only) |

## Forbidden Patterns

These patterns will cause `tsdoc/syntax` lint errors:

```typescript
// ❌ Type annotations in @param or @returns (TypeScript handles types)
/** @param {string} text - The input */
/** @returns {boolean} True if valid */

// ❌ Redundant tags that TypeScript already provides
/** @function myFunction */
/** @async */
/** @interface MyInterface */
/** @enum {string} */
/** @module myModule */

// ❌ JSDoc-specific tags
/** @fileoverview Description */
/** @typedef {Object} MyType */
/** @callback MyCallback */
/** @property {string} name - Description */

// ❌ Custom non-standard tags not defined in tsdoc.json
/** @sideEffects */
```

## Correct Patterns

### Function Documentation

```typescript
/**
 * Brief one-line summary of what the function does.
 *
 * @remarks
 * Extended description with implementation details.
 * Document side effects here (e.g., shows notifications, writes files).
 *
 * @param text - The source code to process
 * @param options - Configuration options for processing
 * @returns The processed result, or null if processing failed
 *
 * @throws When the input contains invalid syntax
 *
 * @example
 * ```typescript
 * const result = processCode('body { color: red }');
 * ```
 */
```

### File Header (entry point modules)

```typescript
/**
 * @packageDocumentation
 * One-line module summary.
 *
 * Extended description of what this module provides and
 * how it fits into the architecture.
 *
 * @author Miguel Colmenares
 * @version 1.3.3
 * @since 0.1.0
 * @see {@link https://example.com} Related documentation
 */
```

### File Header (non-entry-point modules)

```typescript
/**
 * @packageDocumentation
 * Brief module description.
 *
 * @author Miguel Colmenares
 * @since 1.2.0
 */
```

### Interface/Type Documentation

```typescript
/**
 * Statistics about the minification process.
 */
export interface MinificationStats {
  /** Original file size in bytes. */
  originalSize: number;
  /** Minified file size in bytes. */
  minifiedSize: number;
  /** Percentage of size reduction (0-100). */
  reductionPercent: number;
}
```

### Constants

```typescript
/**
 * Number of bytes in a kilobyte.
 * @readonly
 */
export const BYTES_PER_KB = 1024;
```

### Re-export Modules (barrel files)

```typescript
/**
 * @packageDocumentation
 * Service layer exports.
 *
 * @example
 * ```typescript
 * import { getMinifiedText } from './services';
 * ```
 *
 * @author Miguel Colmenares
 * @since 0.1.0
 */

export * from './minificationService';
export * from './fileService';
```

## Comment Structure Rules

1. **Summary** — First paragraph (before any tag) is the summary. Keep it to one sentence.
2. **`@remarks`** — Use for extended descriptions, side effects, algorithm details. Separated from summary.
3. **`@param`** — One per parameter, format: `@param name - Description`. Hyphen separator is mandatory.
4. **`@returns`** — Single block, plain description. No type braces.
5. **`@throws`** — Document each exception type that may be thrown.
6. **`@example`** — Use fenced code blocks with `typescript` language tag.
7. **Modifier tags** — `@since`, `@version`, `@author` go at the end of the comment block.

## Version Tracking Convention

- `@version` — Only in the main entry point (`src/extension.ts`). Updated with each release.
- `@since` — In file headers only (not on individual functions). Records when the file was introduced.
- `@author` — In file headers only. Always `Miguel Colmenares`.

## Validation

```bash
# Check TSDoc compliance (included in npm run lint)
npm run lint

# The rule will report errors like:
# error  tsdoc-param-tag-with-invalid-type: ...
# error  tsdoc-undefined-tag: ...
```

## References

- [TSDoc specification](https://tsdoc.org/)
- [TSDoc Playground](https://tsdoc.org/play/) — test comments interactively
- [eslint-plugin-tsdoc](https://www.npmjs.com/package/eslint-plugin-tsdoc)
- [tsdoc.json schema](https://developer.microsoft.com/json-schemas/tsdoc/v0/tsdoc.schema.json)
