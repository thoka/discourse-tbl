# Rules for discourse-tbl

This file holds the rules of this project for agents. This project has no `CLAUDE.md`.

## Domain

- Purpose: a self-hosted Discourse forum shows and edits a `tbl` table block as if it were a native part of Discourse.
- Owns: this repository, the Discourse plugin `discourse-tbl` (server rendering, allow list, email fallback, composer and rich editor extensions), the scripts that start a Discourse development instance for the tests, and the plan of this project.
- Does not own: the package `tbl-md` and its markdown-it plugin, the `tbl` format, Discourse itself, and the configuration of the machine (for example the group `docker`). A change there goes as a proposal or a task to its owner.
- Delegator: the user.

## Public repository

- This repository is public. It names no local path, no private project, and no private decision. The planning files (`PLAN.md`, `HISTORY.md`, `review-queue.md`, `research/`, `outbox/`, `proposals/`) live in a private companion repository, cloned into the git-ignored folder `.plan/`. `.handover.toml` sets `plan_dir = ".plan"`. Check: `test/public.test.ts` fails on a local path in a tracked file, with the file and the line. The pre-commit hook runs `public-check` on the staged files when it is on the PATH.

## What to read first

- `.plan/PLAN.md`: the open steps and the hand-off. A worktree has no `.plan/`, so read it in the main checkout.
- `README.md`: what the plugin is and how to install it.
- The format of a `tbl` block: `docs/format.md` of the package `tbl-md` (also in `node_modules/tbl-md/docs/format.md` after `mise run install`).

## Stack

- A Discourse plugin: Ruby for the server, JavaScript for the markdown feature and the client. The markdown-it plugin comes from the npm package `tbl-md` as one IIFE file.
- `mise.toml` pins Bun and lefthook. Run tools with `mise exec -- <command>`.
- `mise run test` runs all tests that run without Docker. The pre-push hook runs it. If it fails, the step is not complete.
- Run `mise run hooks-install` once in each new checkout, so that the hooks of `lefthook.yml` run.

## Rules for the code and the docs

- Write each table in the docs as a `tbl` block, never as a GFM pipe table. Check: `tbl-md lint` in the pre-commit hook on the staged Markdown files.
- Discourse is GPL-2.0-only, and so is this plugin. Code from Discourse can go into this repository with its license notice.
