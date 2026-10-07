// Step 3a: the vendored markdown-it plugin of tbl-md in assets/vendor/javascripts/.
// The file is the header of scripts/vendor-tbl-md.ts, then the IIFE file of the npm package byte for byte.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";
import { HEADER_LINES, SOURCE, TARGET, header, installedVersion } from "../scripts/vendor-tbl-md.ts";

const root = join(import.meta.dir, "..");

/** The version of tbl-md that package.json pins, without a leading ^ or ~. */
const pinned = (JSON.parse(readFileSync(join(root, "package.json"), "utf8")).devDependencies["tbl-md"] as string).replace(
  /^[\^~]/,
  "",
);

const vendored = readFileSync(TARGET);

/** The byte offset of the end of the header: the end of line HEADER_LINES. */
function headerEnd(bytes: Buffer): number {
  let offset = 0;
  for (let line = 0; line < HEADER_LINES; line++) {
    offset = bytes.indexOf(0x0a, offset) + 1;
    if (offset === 0) throw new Error(`the vendored file has less than ${HEADER_LINES} lines`);
  }
  return offset;
}

/** Runs the vendored file in an empty context and gives the context. */
function runVendored(): Record<string, any> {
  const context = createContext({});
  runInContext(vendored.toString("utf8"), context, { filename: "tbl-md-markdown-it.js" });
  return context;
}

test("package.json pins an exact version of tbl-md", () => {
  expect(pinned).toMatch(/^\d+\.\d+\.\d+$/);
});

test("the installed tbl-md has the pinned version", () => {
  expect(installedVersion()).toBe(pinned);
});

test("the header is the header of the script for the pinned version", () => {
  const head = vendored.subarray(0, headerEnd(vendored)).toString("utf8");
  expect(header(pinned).split("\n")).toHaveLength(HEADER_LINES + 1);
  expect(head).toBe(header(pinned));
  expect(head).toContain(`// tbl-md ${pinned}, `);
  expect(head).toContain("MIT License");
});

test("the body after the header is byte-equal to the npm file", () => {
  const body = vendored.subarray(headerEnd(vendored));
  expect(body.equals(readFileSync(SOURCE))).toBe(true);
});

test("the vendored file defines tblMdMarkdownIt.default as a function", () => {
  const context = runVendored();
  expect(typeof context.tblMdMarkdownIt).toBe("object");
  expect(typeof context.tblMdMarkdownIt.default).toBe("function");
});

test("the vendored plugin renders a tbl block as a table with markdown-it", async () => {
  // markdown-it is a dependency of tbl-md, so bun installs it into node_modules. If it is not there, this check
  // has nothing to run with, and the test ends here.
  let markdownit: (options?: object) => any;
  try {
    markdownit = (await import("markdown-it")).default;
  } catch {
    return;
  }
  const md = markdownit().use(runVendored().tblMdMarkdownIt.default);
  const html: string = md.render("```tbl\nname: Name\nrole: Role\n--\nname: Ada\nrole: Engineer\n```\n");
  expect(html).toContain("<table");
  expect(html).toContain("Ada");
  expect(html).toContain("Engineer");
});
