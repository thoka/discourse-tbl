# discourse-tbl

A Discourse plugin that renders a `tbl` block as a table.

`tbl` is a table format for Markdown that stays readable as text. Each cell is on its own line, so a long cell or a cell with several lines stays easy to edit. The format and its tools are in the npm package [tbl-md](https://www.npmjs.com/package/tbl-md).

Example:

````markdown
```tbl
name: Name
role: Role
--
name: Ada
role: Engineer
```
````

Status: in development. The plugin does not work yet.

## Plan

1. A reader sees each `tbl` block in a post as a table: in the post, in emails, in the search index, and in excerpts.
2. The composer can convert a GFM pipe table into a `tbl` block.
3. The rich text editor of Discourse edits a `tbl` block as a table and saves it as `tbl`.

## Development

You need [mise](https://mise.jdx.dev/) and, for the Discourse tests, Docker.

```sh
mise install
mise run hooks-install
mise run test
```

## Update tbl-md

The plugin bundles the markdown-it plugin of tbl-md as one file, `assets/vendor/javascripts/tbl-md-markdown-it.js`. The script `scripts/vendor-tbl-md.ts` copies it from the npm package and adds a header with the version and the MIT notice of tbl-md. Do not edit the file by hand.

To move to a new version of tbl-md:

1. Change the version of `tbl-md` in `package.json`. Use an exact version, with no `^` or `~`.
2. Run `bun install` to update `bun.lock`, then `mise run install`.
3. Run `mise run vendor`. It writes the new file.
4. Run `mise run test`. If the file and the pinned version differ, the test `test/vendor.test.ts` fails.
5. Commit `package.json`, `bun.lock`, and the new file together.

## Development instance

The Discourse tests run in a Discourse development instance in Docker. The script `bin/dev-instance` drives it.

Run `bin/dev-instance check` first. It makes sure that Docker works for your session. If it fails, it prints the cause and exits with a code. `bin/dev-instance help` lists the codes.

The file `dev/discourse.env` pins the Discourse version of the instance:

- `DISCOURSE_DEV_IMAGE` is the image `discourse/discourse_dev` with a dated tag, never `release`.
- `DISCOURSE_COMMIT` is the commit of Discourse that the instance uses.

To move to a new Discourse version, change both lines in one commit.

## License

GPL-2.0-only, as Discourse. See `LICENSE`.
