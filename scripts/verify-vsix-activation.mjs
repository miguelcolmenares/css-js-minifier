#!/usr/bin/env node
/**
 * verify-vsix-activation.mjs
 *
 * Smoke-tests a packaged .vsix by reproducing the module-load chain that
 * runs during extension activation. Fails if the native bindings for
 * lightningcss or oxc-minify cannot be loaded on the current platform.
 *
 * Usage:
 *   node scripts/verify-vsix-activation.mjs <path-to-vsix>
 *
 * Contract:
 *   - Exit 0: every required binding loaded and produced non-empty output.
 *   - Exit 1: at least one binding failed to load or execute.
 *
 * Portability:
 *   - Requires Node 20+ (ESM, `fs.rmSync`, `fs.mkdtempSync`).
 *   - A .vsix is a ZIP archive. Extraction uses `unzip` on Linux/macOS
 *     (preinstalled on every GitHub Actions Linux/macOS runner) and
 *     .NET's `System.IO.Compression.ZipFile::ExtractToDirectory` invoked
 *     from PowerShell on Windows. `Expand-Archive` was avoided on purpose:
 *     it rejects files whose extension is not `.zip`, so it can't unpack a
 *     `.vsix` directly. `ZipFile::ExtractToDirectory` is extension-agnostic
 *     and available via `System.IO.Compression.FileSystem` on every
 *     Windows Server / Windows 11 GitHub Actions runner (.NET 4.6.1+).
 *   - No npm dependencies of its own.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { argv, exit, platform } from "node:process";

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------
const vsixArg = argv[2];
if (!vsixArg) {
  console.error("usage: node scripts/verify-vsix-activation.mjs <path-to-vsix>");
  exit(2);
}
const vsixPath = resolve(vsixArg);
if (!existsSync(vsixPath)) {
  console.error(`error: file not found: ${vsixPath}`);
  exit(2);
}

console.log(`--- verify-vsix-activation ---`);
console.log(`host:   ${platform}-${process.arch}   node ${process.version}`);
console.log(`vsix:   ${basename(vsixPath)}`);

// ---------------------------------------------------------------------------
// Extract the .vsix (a ZIP archive) into a temp dir. Windows gets .NET's
// System.IO.Compression.ZipFile (works with any file extension, unlike
// Expand-Archive which insists on `.zip`); every other platform gets
// `unzip -q`.
// ---------------------------------------------------------------------------
const workDir = mkdtempSync(join(tmpdir(), "vsix-verify-"));
try {
  if (platform === "win32") {
    // Use the 2-arg ExtractToDirectory(src, dst) overload deliberately:
    // Windows PowerShell 5.1 (bundled on every windows-* GitHub Actions
    // runner) mis-resolves the 3-arg overload — it can pick
    // (String, String, Encoding) instead of (String, String, Boolean)
    // and fail with "Cannot convert value 'True' to System.Text.Encoding".
    // workDir was just returned by mkdtempSync, so it is guaranteed empty
    // and we do not need the `overwrite` flag anyway.
    const psCommand =
      "Add-Type -AssemblyName System.IO.Compression.FileSystem; " +
      `[System.IO.Compression.ZipFile]::ExtractToDirectory('${vsixPath.replace(/'/g, "''")}', '${workDir.replace(/'/g, "''")}')`;
    execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", psCommand],
      { stdio: "inherit" }
    );
  } else {
    execFileSync("unzip", ["-q", vsixPath, "-d", workDir], { stdio: "inherit" });
  }
} catch (err) {
  console.error(`error: failed to extract vsix: ${err.message}`);
  rmSync(workDir, { recursive: true, force: true });
  exit(2);
}
const extDir = join(workDir, "extension");
if (!existsSync(extDir)) {
  console.error(`error: extracted vsix has no 'extension/' directory: ${workDir}`);
  rmSync(workDir, { recursive: true, force: true });
  exit(2);
}

// ---------------------------------------------------------------------------
// Run the activation probe as a child node process. Setting cwd + writing
// the probe *inside* the extension dir guarantees require() resolves from
// the bundled node_modules — the exact code path VS Code takes at
// activation time.
// ---------------------------------------------------------------------------
const probePath = join(extDir, "__vsix_activation_probe.cjs");
writeFileSync(
  probePath,
  `
"use strict";
const results = [];
function report(name, ok, detail) {
  results.push({ name, ok });
  const tag = ok ? "PASS" : "FAIL";
  const suffix = detail ? " — " + String(detail).split("\\n")[0] : "";
  console.log("[" + tag + "] " + name + suffix);
}

try { require("lightningcss"); report("require('lightningcss')", true); }
catch (e) { report("require('lightningcss')", false, e.message); }

try {
  const { transform } = require("lightningcss");
  const r = transform({
    filename: "t.css",
    code: Buffer.from("a { color: red; margin: 0px; }"),
    minify: true,
  });
  const out = r.code.toString();
  if (!out) throw new Error("empty output");
  report("lightningcss.transform()", true, out);
} catch (e) { report("lightningcss.transform()", false, e.message); }

try { require("oxc-minify"); report("require('oxc-minify')", true); }
catch (e) { report("require('oxc-minify')", false, e.message); }

try {
  const r = require("oxc-minify").minifySync(
    "t.js",
    "const x = 1; const y = 2; console.log(x + y);"
  );
  if (!r || !r.code) throw new Error("empty output");
  report("oxc-minify.minifySync()", true, r.code);
} catch (e) { report("oxc-minify.minifySync()", false, e.message); }

const failed = results.filter((r) => !r.ok);
console.log("");
console.log("Results: " + (results.length - failed.length) + "/" + results.length + " passed");
process.exit(failed.length > 0 ? 1 : 0);
`,
  "utf8"
);

const child = spawnSync(process.execPath, [probePath], {
  cwd: extDir,
  stdio: "inherit",
});

// ---------------------------------------------------------------------------
// Cleanup + propagate exit code
// ---------------------------------------------------------------------------
rmSync(workDir, { recursive: true, force: true });

if (child.error) {
  console.error(`error: failed to spawn activation probe: ${child.error.message}`);
  exit(2);
}
exit(child.status ?? 1);
