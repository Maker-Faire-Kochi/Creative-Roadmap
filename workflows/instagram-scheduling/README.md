# Instagram scheduling

Schedules the awareness carousels (feed) and their matching stories on **Meta Business Suite** for **@makerfairekochi**, from an approved plan. A Playwright script drives a dedicated Chrome window, attaches files directly (no macOS file picker) and confirms every booking in Meta's own Scheduled lists. Read `../README.md` and the repo-root `AGENTS.md` first.

## Hard rules

1. **Never schedule a caption the user hasn't approved.** Record approval with `prepare.py --approve ... --basis "<who/when>"` only after the user has actually approved those captions. An agent's own judgment is not approval.
2. **Never publish immediately.** The script only uses Schedule; don't add or click "Publish now".
3. **Don't book a slot less than 15 minutes away** (the script refuses). Never silently move a missed slot; ask the user for a new time and record it in the plan's `overrides`.
4. **Instagram only, account `@makerfairekochi`.** The script checks the account before it uploads.
5. **Captions:** keywords are literal bracketed text on the last line, e.g. `[MakerFaireKochi, Maker, Coding, Kochi, Kerala]`. No `#` hashtags, no account tags. **Stories have no caption.**
6. **Don't duplicate.** The script checks Meta's scheduled lists first (a duplicate = same caption **and** same time; captions repeat across designs, so caption alone isn't enough). If a run ends `unconfirmed`, look at Meta before retrying.
7. **The repo is public.** Don't commit anything from `output/` (ledger, screenshots, upload copies) or Meta identifiers (`asset_id`, `business_id`). They come from the open Meta page, or from `META_ASSET_ID` / `META_BUSINESS_ID` in your shell.
8. Never change the artwork. The ledger holds each PNG's SHA-256 and validation fails if it changed.

## One-time setup

```bash
cd workflows/instagram-scheduling
npm install                       # playwright-core; ffmpeg must also be installed
node meta.mjs launch              # opens a separate Chrome profile (~/.mfk-chrome-meta, debugging port 9333)
```

Log in to Meta Business Suite in that window and pick the MakerFaire Kochi business and the Instagram account. The agent needs this window because Chrome and Brave won't allow automation on your everyday profile. If the script reports it can't find the Meta ids, or the window shows a login page, log in again; the login does not always survive a Chrome restart.

## The flow

All commands read `MFK_OUT` (the artwork folder; see `../README.md`).

1. **Plan** a run in `plans/<start-date>.json`: `start_date`, `days` (one string of creative codes per day, e.g. `"A1 B2 E3"`; letter = design A–E, number = topic), `default_times` (by posts per day, IST), `overrides` (exact `"YYYY-MM-DDTHH:MM"` per code), `weekly_counts`, `notes`. A creative (code) is used once per run. See `plans/2026-10-08.json`.
2. **Build the ledger:** `python3 prepare.py --plan plans/<file>.json`. It inventories the PNGs (checking sizes), pairs each post with its story frames, takes captions from `$MFK_OUT/captions.md` and writes `$MFK_OUT/scheduling/{schedule.json,calendar.md,inventory.json}`. Re-running is safe: it validates and keeps existing state.
3. **Get caption approval.** Show the user the calendar and each distinct caption (with keywords). Then `python3 prepare.py --plan ... --approve A4 C5 --basis "User: approved <what>, <date>"` (or `--approve all`). Status goes `pending_caption_approval → approved`.
4. **Upload copies:** `node meta.mjs uploads` creates numbered JPEGs for every unfinished creative (post and story) under `scheduling/uploads/`.
5. **Dry-run the first job:** `node meta.mjs run <CODE> --dry-run` fills the composer (files, caption, date and time) and stops. Check the screenshot in `scheduling/shots/`.
6. **Schedule:** `node meta.mjs run <CODE>` (feed, then story) or `node meta.mjs batch` for every approved job in calendar order. It stops at the first failure.
7. **Verify** (see below) and report the table of date, time, creative.

## What a job does

Feed: check the ledger and the account → look for an existing booking → upload the slides in order → type the caption exactly → set date and time (IST) → Schedule → confirm the post is in Meta's **Scheduled** list at that time → record the confirmation in the ledger. Story: same flow in the story composer, same slot, no caption; confirmed when Meta lists one row per frame.

If Meta's "Scheduling your post…" overlay is still up after **1 minute**, the script reloads the scheduled list. If the item is there it's recorded; if not it retries the whole job (up to 3 attempts). Page loads that fail on the network are retried 6 times, 20 seconds apart. Other errors stop the batch.

Ledger status: `pending_caption_approval → approved → scheduled` (also `published`, `completed_by_user` for jobs done by hand; the script skips those). To record something you verified in Meta by hand: `node meta.mjs record <CODE> <feed|story> <ISO time> "<what you saw>"`.

## Running a long batch

Run it detached with a log, and watch the log by PID. A monitor that wraps the batch itself kills it when the monitor expires:

```bash
nohup node meta.mjs batch > "$MFK_OUT/scheduling/shots/batch.log" 2>&1 &
```

## Verifying

Meta's lists are **virtualized**: only about 10 rows exist at once, so a one-shot count is wrong. Scroll and collect rows by `data-index`. A job is verified when Scheduled posts show one row for its caption and time, and Scheduled stories show one row per frame at that time. Also check that nothing published early and no slot is doubled.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Meta asset_id/business_id not found` | The Meta window isn't logged in or isn't on a Business Suite page. Log in, or set `META_ASSET_ID` and `META_BUSINESS_ID` |
| `connectOverCDP: Browser context management is not supported` | The Chrome process has no window (or is still starting). Quit it (`pkill -f mfk-chrome-meta`), run `node meta.mjs launch`, wait 10 s |
| `slot ... is less than 15 minutes away` | The slot is gone or imminent. Ask the user for a new time, then add an override to the plan |
| `Artwork changed` / `Missing or stale caption approval` (from `prepare.py`) | A PNG was re-rendered, or a caption was edited after approval. Restore the artwork, or get the new caption approved again |
| `unconfirmed` / `count N of M` | Meta may have saved it anyway. Check the lists, then `record` it, or rerun (the duplicate check protects you) |
| A hung "Scheduling your post…" overlay | Handled by the 1-minute reload and retry |
| Uploads fail in the macOS file dialog | Not used here; attach through the script. Don't switch to clicking the dialog |
