// Copies the markdown-it plugin of the npm package tbl-md into assets/vendor/javascripts/, with a header.
// Run it with `mise run vendor` after a change of the tbl-md version in package.json.
// The output depends only on the installed package, so a second run writes the same bytes.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const root = join(import.meta.dir, "..");

/** The installed package.json of tbl-md. */
export const PACKAGE_JSON = join(root, "node_modules", "tbl-md", "package.json");
/** The IIFE file of the markdown-it plugin in the npm package (export `tbl-md/markdown-it.iife.js`). */
export const SOURCE = join(root, "node_modules", "tbl-md", "dist", "tbl-md-markdown-it.iife.js");
/** The vendored file that the plugin registers. */
export const TARGET = join(root, "assets", "vendor", "javascripts", "tbl-md-markdown-it.js");

/** The number of lines of the header. Each header has this number of lines, each with a final newline. */
export const HEADER_LINES = 3;

/** The header of the vendored file for the version `version` of tbl-md. */
export function header(version: string): string {
  return [
    "/* eslint-disable */",
    `// tbl-md ${version}, copied by scripts/vendor-tbl-md.ts from the npm package. Do not edit.`,
    "// tbl-md: MIT License, Copyright (c) 2026 Thomas Kalka, https://github.com/thoka/tbl-md",
  ]
    .map((line) => `${line}\n`)
    .join("");
}

/** The version of the installed tbl-md package. */
export function installedVersion(): string {
  return JSON.parse(readFileSync(PACKAGE_JSON, "utf8")).version;
}

/** Writes the vendored file: the header, then the npm file byte for byte. */
export function vendor(): string {
  const version = installedVersion();
  const content = Buffer.concat([Buffer.from(header(version), "utf8"), readFileSync(SOURCE)]);
  mkdirSync(dirname(TARGET), { recursive: true });
  writeFileSync(TARGET, content);
  return version;
}

if (import.meta.main) {
  const version = vendor();
  console.log(`vendored tbl-md ${version} to assets/vendor/javascripts/tbl-md-markdown-it.js`);
}
