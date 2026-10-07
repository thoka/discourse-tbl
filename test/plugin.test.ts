// Step 2a: the metadata of the plugin and its site setting `tbl_enabled`.
// Discourse reads the metadata from the comment lines at the top of plugin.rb.
import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (file: string) => readFileSync(join(root, file), "utf8");

test("plugin.rb has the metadata lines", () => {
  const lines = read("plugin.rb").split("\n");
  expect(lines).toContain("# name: discourse-tbl");
  expect(lines.some((line) => /^# about: \S/.test(line))).toBe(true);
  expect(lines).toContain("# version: 0.0.1");
  expect(lines).toContain("# authors: Thomas Kalka");
  expect(lines).toContain("# url: https://github.com/thoka/discourse-tbl");
  expect(lines).toContain("enabled_site_setting :tbl_enabled");
});

test("the setting file names the setting tbl_enabled, on by default and sent to the client", () => {
  const text = read("config/settings.yml");
  expect(text).toMatch(/^plugins:\n  tbl_enabled:\n    default: true\n    client: true\n/);
});

test("the English server locale has a text for the setting", () => {
  expect(read("config/locales/server.en.yml")).toMatch(/^en:\n  site_settings:\n    tbl_enabled: "\S[^"]*"\n/);
});
