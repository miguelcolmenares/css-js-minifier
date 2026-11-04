<!-- agents-toolkit:planning-doc issue=244 -->
# Plan: Alpine (musl) platform targets (#244)

## Problem statement

The release ships six platform-specific `.vsix` files, all built on glibc runners. VS Code treats Alpine
hosts as their own targets (`alpine-x64`, `alpine-arm64`). The issue asks whether the extension is usable
there today and, if both native modules publish musl builds, to add the two targets.

## Findings (all verified, 2026-11-04)

Tool versions: Docker 29.9.2 (Docker Desktop, `node:20-alpine` = Node v20.20.2, npm 10.8.2, Alpine
`ID=alpine`), host Node 22.23.1, `@vscode/vsce` 2.15.0 (the repo's pinned version).

### 1. VS Code and the Marketplace require an exact target match

Official docs
([publishing-extension, "Platform-specific extensions"](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#platformspecific-extensions)):

- "The currently available platforms are: `win32-x64`, `win32-arm64`, `linux-x64`, `linux-arm64`,
  `linux-armhf`, `alpine-x64`, `alpine-arm64`, `darwin-x64`, `darwin-arm64` and `web`."
- "If you don't pass this flag, that package will be used as a fallback for all platforms that have no
  platform-specific package." The only fallback is a package published without `--target`. This extension
  has none, so there is no fallback.

VS Code source (`src/vs/platform/extensionManagement/common/extensionManagementUtil.ts`, `main`):
`computeTargetPlatform` reads `/etc/os-release` (then `/usr/lib/os-release`) and, when `ID=alpine`, calls
`getTargetPlatform('alpine', arch)`, which returns `alpine-x64` or `alpine-arm64`.
`isTargetPlatformCompatible` (`src/vs/platform/extensionManagement/common/extensionManagement.ts`) returns
true only for undefined or universal packages, or when `extensionTargetPlatform === productTargetPlatform`.
`linux-x64` is not equal to `alpine-x64`, so no `linux-*` package is offered on Alpine.

```bash
npx vsce package --help | grep -A6 "Valid targets"
#   Valid targets: win32-x64, win32-ia32, win32-arm64, linux-x64, linux-arm64, linux-armhf,
#                  darwin-x64, darwin-arm64, alpine-x64, alpine-arm64, web
```

Open VSX supports both targets too (`TargetPlatform.java` in eclipse-openvsx defines `NAME_ALPINE_X64` and
`NAME_ALPINE_ARM64`), so `ovsx publish` accepts the new `.vsix` files.

### 2. Both native modules publish musl bindings, pinned in `package-lock.json`

```bash
for p in lightningcss-linux-x64-musl@1.33.0 lightningcss-linux-arm64-musl@1.33.0 \
         @oxc-minify/binding-linux-x64-musl@0.156.0 @oxc-minify/binding-linux-arm64-musl@0.156.0; do
  npm view $p name version os cpu libc dist.unpackedSize
done
```

| Package | version | os | cpu | libc | unpacked size |
| --- | --- | --- | --- | --- | --- |
| `lightningcss-linux-x64-musl` | 1.33.0 | linux | x64 | musl | 10,048,575 |
| `lightningcss-linux-arm64-musl` | 1.33.0 | linux | arm64 | musl | 8,909,864 |
| `@oxc-minify/binding-linux-x64-musl` | 0.156.0 | linux | x64 | musl | 4,474,307 |
| `@oxc-minify/binding-linux-arm64-musl` | 0.156.0 | linux | arm64 | musl | 4,056,118 |

`package-lock.json` already lists all four (`lightningcss` 1.33.0, `oxc-minify` 0.156.0). Important
difference: the `@oxc-minify/*-musl` entries carry `"libc": ["musl"]`, the `lightningcss-*-musl` and
`-gnu` entries carry no `libc` field.

### 3. Today a glibc `linux-*` package does not work on Alpine

Run in a `node:20-alpine` container (arm64), `npm ci --omit=dev --ignore-scripts`, then `require()` and one
call per module. A `linux-arm64` `.vsix` was also built exactly like the release job (`npm ci --os=linux
--cpu=arm64 --libc=glibc`, `npm run package`, `vsce package --target linux-arm64`) and run with the repo's
smoke script inside Alpine.

```text
=== glibc-only install (what the linux-arm64 vsix ships): npm ci ... --os=linux --cpu=arm64 --libc=glibc
--- installed native packages:
lightningcss-linux-arm64-gnu
lightningcss-linux-arm64-musl          <- installed too, lightningcss has no libc field
binding-linux-arm64-gnu                <- the only oxc-minify binding
require(lightningcss) OK
require(oxc-minify) FAIL: Cannot find native binding. npm has a bug related to optional dependencies ...
lightningcss.transform OK: a{color:red;margin:0}
oxc-minify.minifySync FAIL: Cannot find native binding. ...

$ docker run ... node:20-alpine node scripts/verify-vsix-activation.mjs css-js-minifier-1.3.4-linux-arm64.vsix
host:   linux-arm64 (musl)   node v20.20.2
[PASS] require('lightningcss')
[PASS] lightningcss.transform() - a{color:red;margin:0}
[FAIL] require('oxc-minify') - Cannot find native binding. ...
[FAIL] oxc-minify.minifySync() - Cannot find native binding. ...
Results: 2/4 passed        exit 1
```

`src/services/strategies/localJsMinifier.ts` calls `require('oxc-minify')` at module load, so the bundled
extension would fail on this at activation. In practice the `linux-*` package is not even offered on Alpine
(finding 1), so the extension is not installable from the Marketplace there.

With musl bindings the same check passes:

```text
=== native alpine install (musl): npm ci --omit=dev --ignore-scripts
lightningcss-linux-arm64-gnu
lightningcss-linux-arm64-musl
binding-linux-arm64-musl
require(lightningcss) OK        require(oxc-minify) OK
lightningcss.transform OK: a{color:red;margin:0}
oxc-minify.minifySync OK: const x=1,y=2;console.log(3);
```

The same probe on `--platform linux/amd64` (emulated) also passes, with `binding-linux-x64-musl`.

### 4. A glibc runner can build the musl package

On a glibc host (`node:20`, Debian) `npm ci --libc=musl` installs `binding-linux-arm64-musl` and no glibc
oxc binding, so the existing Linux runners can build the Alpine packages; no Alpine build container needed.
The musl bindings cannot be loaded on that host (`oxc-minify` fails to find its binding), which is why the
smoke test must run in Alpine.

Rehearsal of the planned release steps (arm64 Docker, same npm flags and `vsce`):

```bash
npm ci --os=linux --cpu=arm64 --libc=musl
rm -rf node_modules/lightningcss-linux-*-gnu
npx vsce package --target alpine-arm64 --out css-js-minifier-1.3.4-alpine-arm64.vsix
#   manifest: TargetPlatform="alpine-arm64"
docker run --rm -v "$PWD:/work:ro" -v <out>:/out:ro -w /work node:20-alpine \
  node scripts/verify-vsix-activation.mjs /out/css-js-minifier-1.3.4-alpine-arm64.vsix --expect-libc musl
#   host: linux-arm64 (musl)   4/4 passed   exit 0
#   with --expect-libc glibc: "expected a glibc host but this one is musl", exit 2
```

Package size (measured): the alpine `.vsix` is 10.3 MB with both `lightningcss` bindings and 6.7 MB after
deleting the glibc one, in line with the existing darwin package (6.4 MB). The `~50 KB` size target in
`AGENTS.md` is stale (it predates the native bindings), so the comparison used the existing packages.

## Decision

Feasible and clear, so implement. Both bindings publish musl x64 and arm64 at the pinned versions, VS Code
needs the exact targets, and the rehearsal passes.

## Proposed changes

- `release.yml`: add `alpine-x64` (`ubuntu-26.04`) and `alpine-arm64` (`ubuntu-24.04-arm`) to the build
  matrix. `alpine-*` installs with `npm ci --libc=musl` and removes `lightningcss-linux-*-gnu`; the activation
  check for those targets runs in a `node:20-alpine` container with `--expect-libc musl`. Existing targets,
  preflight, tag-and-release and publish logic untouched.
- `scripts/verify-vsix-activation.mjs`: new `--expect-libc glibc|musl` option (exit 2 on mismatch), host
  libc printed in the header.
- `.vscodeignore`: the existing `lightningcss-*` and `@oxc-minify` globs already include the musl `.node`
  files; only a comment is added.
- `publish-openvsx.yml`: expect eight `.vsix` files.
- Docs: `AGENTS.md`, `CONTRIBUTING.md`, `docs/ARCHITECTURE.md`, `.github/copilot-instructions.md` and the
  release runbook (counts, tables, troubleshooting).
- `CHANGELOG.md`: one bullet under `## [Unreleased]`.

## Phases

1. Investigation and evidence (done, above).
2. Implementation (workflow, smoke script, docs, changelog).
3. Validation (lint, tsc, markdown lint, prettier, actionlint, smoke script on Alpine) and `core-review`.

## Testing strategy

- Run `scripts/verify-vsix-activation.mjs` against a rehearsed `alpine-arm64` `.vsix` inside `node:20-alpine`.
- `actionlint` on both touched workflows (known finding: the `ubuntu-26.04` label).
- Not verifiable locally: the real GitHub runners (`ubuntu-26.04`, `ubuntu-24.04-arm`) and a real x64
  `.vsix` build; the first PR run of the matrix is the proof. No release is dispatched and no tag is pushed.
