// The markdown feature of discourse-tbl.
//
// The markdown-it plugin of tbl-md calls an `attributes` hook for each column, row, and cell of a tbl block.
// The hook of this file maps the attributes of a writer into names that cannot collide with the names of Discourse:
//
// - `#id` becomes `id="tbl-<post id>-<id>"`. With no post id (the composer preview, the first cook), the ID goes away.
// - `.class` becomes `class="tbl-<class>"`.
// - `key=value` stays, and the plugin writes it as `data-<key>="value"`.
//
// The allow list of the sanitizer can reuse the predicates below to keep only these names.

/** The class grammar of rule 14 of the tbl format, after the dot. */
const CLASS = /^[A-Za-z][A-Za-z0-9_-]*$/;

/** The ID grammar of rule 4 of the tbl format, after the `#`. */
const ID = /^[A-Za-z0-9_-]+$/;

/** The prefix of each class and each ID that the hook writes. */
const PREFIX = "tbl-";

/**
 * Gives the post id as a string of digits, or null when there is no valid post id.
 * A valid post id is a positive safe integer, or a string of digits with no leading zero.
 *
 * @param {unknown} postId
 * @returns {string | null}
 */
function normalPostId(postId) {
  if (typeof postId === "number") {
    return Number.isSafeInteger(postId) && postId > 0 ? String(postId) : null;
  }
  if (typeof postId === "string" && /^[1-9][0-9]*$/.test(postId)) {
    return postId;
  }
  return null;
}

/**
 * Gives the prefix of each ID in the post: `tbl-<postId>-`, or null when there is no valid post id.
 * The post id has only digits, so the first `-` after it ends it, and two posts never share an ID.
 *
 * @param {unknown} postId a positive integer or a string of digits
 * @returns {string | null}
 */
export function idPrefix(postId) {
  const id = normalPostId(postId);
  return id === null ? null : `${PREFIX}${id}-`;
}

/**
 * Tells if the value of a `class` attribute holds only classes of this plugin.
 * Each word (the value splits at single spaces) is `tbl-` and then a class of rule 14: `[A-Za-z][A-Za-z0-9_-]*`.
 * An empty value is not allowed.
 *
 * @param {string} value the value of the attribute, for example `tbl-warn tbl-x`
 * @returns {boolean}
 */
export function isAllowedClass(value) {
  if (typeof value !== "string" || value === "") {
    return false;
  }
  return value
    .split(" ")
    .every((word) => word.startsWith(PREFIX) && CLASS.test(word.slice(PREFIX.length)));
}

/**
 * Tells if the value of an `id` attribute is an ID of this plugin for the given post:
 * `tbl-<postId>-` and then an ID of rule 4: `[A-Za-z0-9_-]+`. With no valid post id, no ID is allowed.
 *
 * @param {string} value the value of the attribute, for example `tbl-12-a1`
 * @param {unknown} postId the post id of the current cook
 * @returns {boolean}
 */
export function isAllowedId(value, postId) {
  const prefix = idPrefix(postId);
  if (prefix === null || typeof value !== "string" || !value.startsWith(prefix)) {
    return false;
  }
  return ID.test(value.slice(prefix.length));
}

/**
 * Gives the `attributes` hook of the markdown-it plugin of tbl-md for one cook.
 * The hook works the same for a column, a row, and a cell. It changes the object that it gets and gives it back,
 * never null. The plugin gives the hook a copy, so the change does not reach the parsed table.
 *
 * @param {unknown} postId the post id of the cook, or undefined, null, 0, or "" when there is none
 * @returns {(attributes: {id?: string, classes: string[], pairs: {key: string, value: string}[]}, place: object) =>
 *   {id?: string, classes: string[], pairs: {key: string, value: string}[]}}
 */
export function tblAttributes(postId) {
  const prefix = idPrefix(postId);
  return (attributes) => {
    if (attributes.id !== undefined) {
      if (prefix === null) {
        delete attributes.id;
      } else {
        attributes.id = prefix + attributes.id;
      }
    }
    attributes.classes = attributes.classes.map((name) => PREFIX + name);
    return attributes;
  };
}
