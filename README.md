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

## License

GPL-2.0-only, as Discourse. See `LICENSE`.
