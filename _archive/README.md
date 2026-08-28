# Archived — Solo Play and Point Crawl

Removed from the site nav and build. Nothing here is referenced by
`mkdocs.yml`, `build_site.py`, or any live page.

- `docs/` — the three page sources (`solo-play.md`, `point-crawl.md`,
  and `point-crawl-rath.md`, which was never in the nav)
- `js/`, `stylesheets/` — the interactive tooling and its styling
- `dev-notes/` — feature planning docs for the solo-play tool

`rath-data.js` and `extra.css` were **left in place** — they are still used
by the live site.

To restore: move the files back, re-add the nav entries, and re-add the
`extra_css` / `extra_javascript` lines to `mkdocs.yml`.
