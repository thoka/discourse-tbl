// Step 3d: the attributes hook of the feature file and the predicates that the allow list can reuse.
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createContext, runInContext } from "node:vm";
import {
  idPrefix,
  isAllowedClass,
  isAllowedId,
  tblAttributes,
} from "../assets/javascripts/lib/discourse-markdown/tbl.js";

type Attributes = { id?: string; classes: string[]; pairs: { key: string; value: string }[] };

const places = [
  { kind: "column", key: "name" },
  { kind: "row", row: 1 },
  { kind: "cell", key: "name", row: 1 },
] as const;

/** A new attributes object with an ID, two classes, and one pair. */
function sample(): Attributes {
  return { id: "a1", classes: ["warn", "x"], pairs: [{ key: "note", value: "a b" }] };
}

describe("tblAttributes", () => {
  for (const place of places) {
    test(`${place.kind}: with a post id, the ID and the classes get the prefixes`, () => {
      expect(tblAttributes(12)(sample(), place)).toEqual({
        id: "tbl-12-a1",
        classes: ["tbl-warn", "tbl-x"],
        pairs: [{ key: "note", value: "a b" }],
      });
    });

    test(`${place.kind}: with no post id, the ID goes away`, () => {
      for (const postId of [undefined, null, 0, ""]) {
        const result = tblAttributes(postId)(sample(), place);
        expect(result).toEqual({ classes: ["tbl-warn", "tbl-x"], pairs: [{ key: "note", value: "a b" }] });
        expect("id" in result).toBe(false);
      }
    });
  }

  test("a numeric string post id works as a number", () => {
    expect(tblAttributes("12")(sample(), places[1]).id).toBe("tbl-12-a1");
  });

  test("a post id that is not a positive integer counts as no post id", () => {
    for (const postId of [-1, 1.5, "abc", "012", "1a", NaN]) {
      expect("id" in tblAttributes(postId)(sample(), places[1])).toBe(false);
    }
  });

  test("several classes keep their order", () => {
    const result = tblAttributes(1)({ classes: ["c", "a", "b"], pairs: [] }, places[0]);
    expect(result.classes).toEqual(["tbl-c", "tbl-a", "tbl-b"]);
  });

  test("the pairs stay unchanged", () => {
    const pairs = [
      { key: "note", value: "x" },
      { key: "level", value: "high \"quoted\"" },
    ];
    const result = tblAttributes(1)({ classes: [], pairs: structuredClone(pairs) }, places[2]);
    expect(result.pairs).toEqual(pairs);
  });

  test("an empty attributes object stays empty and is not null", () => {
    for (const place of places) {
      const result = tblAttributes(12)({ classes: [], pairs: [] }, place);
      expect(result).toEqual({ classes: [], pairs: [] });
      expect("id" in result).toBe(false);
    }
  });
});

describe("idPrefix", () => {
  test("gives tbl-<post id>- or null", () => {
    expect(idPrefix(12)).toBe("tbl-12-");
    expect(idPrefix("7")).toBe("tbl-7-");
    for (const postId of [undefined, null, 0, "", -3, "x"]) {
      expect(idPrefix(postId)).toBeNull();
    }
  });
});

describe("isAllowedClass", () => {
  test("allows words that start with tbl- and then match the class grammar", () => {
    for (const value of ["tbl-a", "tbl-warn tbl-x", "tbl-A_b-9", "tbl-a tbl-b tbl-c"]) {
      expect(isAllowedClass(value)).toBe(true);
    }
  });

  test("refuses other classes", () => {
    for (const value of [
      "hidden",
      "tbl-a hidden",
      "tbl-",
      "tbl-1a", // the class grammar needs a letter first
      "tbl-a:b",
      "tbl-a  tbl-b", // two spaces give an empty word
      " tbl-a",
      "",
      "TBL-a",
    ]) {
      expect(isAllowedClass(value)).toBe(false);
    }
  });
});

describe("isAllowedId", () => {
  test("allows an ID of the current post", () => {
    expect(isAllowedId("tbl-12-a1", 12)).toBe(true);
    expect(isAllowedId("tbl-12-a1", "12")).toBe(true);
    expect(isAllowedId("tbl-12-1", 12)).toBe(true);
    expect(isAllowedId("tbl-12-a-b_c", 12)).toBe(true);
  });

  test("refuses an ID of another post", () => {
    expect(isAllowedId("tbl-999-a", 12)).toBe(false);
    expect(isAllowedId("tbl-123-a", 12)).toBe(false);
    expect(isAllowedId("tbl-1-a", 12)).toBe(false);
  });

  test("refuses each ID with no post id", () => {
    for (const postId of [undefined, null, 0, ""]) {
      expect(isAllowedId("tbl-12-a1", postId)).toBe(false);
      expect(isAllowedId("tbl--a1", postId)).toBe(false);
    }
  });

  test("refuses an ID with no rest or a bad character", () => {
    expect(isAllowedId("tbl-12-", 12)).toBe(false);
    expect(isAllowedId("tbl-12-a:b", 12)).toBe(false);
    expect(isAllowedId("tbl-12-a b", 12)).toBe(false);
    expect(isAllowedId("main", 12)).toBe(false);
  });
});

test("the vendored plugin writes the mapped attributes into the HTML", async () => {
  const context = createContext({});
  const vendored = readFileSync(join(import.meta.dir, "../assets/vendor/javascripts/tbl-md-markdown-it.js"), "utf8");
  runInContext(vendored, context, { filename: "tbl-md-markdown-it.js" });
  const markdownit = (await import("markdown-it")).default;
  const md = markdownit().use(context.tblMdMarkdownIt.default, { attributes: tblAttributes(12) });
  const source = [
    "```tbl",
    "name: Name",
    "{.wide}",
    "note: Note",
    "-- {#a1}",
    "name: Ada",
    "note: hi",
    "{level=high}",
    "```",
    "",
  ].join("\n");
  const html: string = md.render(source);
  expect(html).toContain('id="tbl-12-a1"');
  expect(html).toContain('class="tbl-wide"');
  expect(html).toContain('data-level="high"');
  expect(html).not.toContain('id="a1"');
});
