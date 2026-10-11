# Workflows

Repeatable pipelines for Maker Faire Kochi campaign content. Each one has its own runbook; read it before running anything.

| Workflow | What it does | Runbook |
|---|---|---|
| `awareness-carousels/` | Renders the awareness carousels (19 topics × 5 designs × post + story) in English and in Manglish, packages the gallery, runs layout QA | [README](awareness-carousels/README.md) |
| `instagram-scheduling/` | Schedules those carousels and their stories on Meta Business Suite (Instagram @makerfairekochi) from an approved plan | [README](instagram-scheduling/README.md) |

The flow is: **copy → render → QA → caption approval → schedule → verify**.

## Conventions

- **Source in git, output out of git.** `workflows/` holds code, copy and plans. Everything generated (PNGs, gallery, ledgers, screenshots, upload copies) goes to `output/` (git-ignored). Both workflows read `MFK_OUT` (default `output/awareness-carousels`); set it to another folder to work on an older or scratch run. This repository is public: never commit generated artwork, schedules, screenshots, Meta account identifiers or anything from `output/`.
- **Design system first.** All artwork follows `design-system/` (see the root `AGENTS.md`). The renderers read it directly; don't copy tokens, fonts or logos into a workflow.
- **One source of truth per thing.** Slide copy: `awareness-carousels/content/topics.mjs` (English) and `topics-ml.mjs` (Manglish). Captions and keyword tags: `awareness-carousels/content/captions.md`. Schedules: `instagram-scheduling/plans/*.json`. Generated copies of these (in `output/`) are never edited by hand.
- **Human gates.** A person approves the copy before artwork is final, and approves every caption before it is scheduled. Agents record approvals; they never invent them.
- **Prove changes by re-rendering to a scratch folder** (`MFK_OUT=/tmp/x node src/build.mjs 05-`) and comparing with `cmp`; the renderer is deterministic, so unchanged inputs give byte-identical PNGs.

## Requirements

Node 24+, Google Chrome (macOS path is the default; override with `CHROME_PATH`), `ffmpeg`, Python 3. Run `npm install` once inside each workflow folder.
