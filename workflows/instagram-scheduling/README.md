# Instagram scheduling

Schedules the awareness carousels (feed) and their matching stories on **Meta Business Suite** for **@makerfairekochi**, from an approved plan. A Playwright script drives a dedicated Chrome window, attaches files directly (no macOS file picker) and confirms every booking in Meta's own Scheduled lists. Read `../README.md` and the repo-root `AGENTS.md` first.

**Trial reels** (reels shown to non-followers first) can only be made in the Instagram mobile app, so they go through a phone instead: `phone.py` drives the app on an Android phone over wireless debugging. See [Trial reels from a phone](#trial-reels-from-a-phone-wireless-debugging) at the end.

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

## Trial reels from a phone (wireless debugging)

Meta Business Suite can't make a reel a **trial**; only the Instagram app can. `phone.py` schedules one by driving Instagram on an Android phone over `adb`, the way it was done for the first seven trial reels (2 Nov 2026: the old motion posters, *What is Maker Faire?* and *Why Kochi?*). It is plain Python (standard library only); you need `adb` (Android platform-tools).

### Rules (in addition to the ones above)
1. **The caption is approved first**, word for word, as for the feed. Write it to a text file (it can live in `output/`) and pass that file. The script types it, reads the field back and stops if it differs in any character.
2. **Schedule only. Never tap Share.** The script checks that the button reads *Schedule* and, by default, stops just before it (`READY, not submitted`). Look at `shots/ready.png`, then rerun with `--submit` or tap Schedule yourself. Do the first reel of a run this way; the rest can go with `--submit`.
3. **Trial on, tag @makerfaire** (user, 2 Nov 2026). The tag goes in *Tag people*, not the caption (the caption has no account tags). "Automatically share to everyone" in Trial settings stays **off** unless the user asks: a trial that does well is shared to followers by hand.
4. **Check the content before it goes on the phone:** no event date, CODING not CODE, and any QR decodes to the right URL (decode a frame of the end card with `jsqr`).
5. **The cover:** if the video starts on a blank ground before its title draws in, set the cover to the title frame (`--cover-drag`, below), and say so in the report.
6. **Keep the phone's address out of the repo.** It goes in `MFK_ADB_SERIAL` in your shell; screenshots and the ledger go to `output/trial-reels/` (`MFK_PHONE_OUT`).

### One-time pairing (the user does this on the phone)
1. On the phone: **Settings → Developer options → Wireless debugging** (on), then **Pair device with pairing code**.
2. The phone shows an `IP:port` and a six-digit code. Run `! adb pair IP:PAIRPORT CODE` in the session (the pairing port is not the connect port).
3. Send the agent the `IP:port` from the main Wireless debugging screen. Instagram must be logged in as **@makerfairekochi**.

The pairing persists. The connect port changes when wireless debugging is toggled or the phone restarts; read the new one from the phone, or `adb mdns services`.

### The flow
```bash
cd workflows/instagram-scheduling
export MFK_ADB_SERIAL=<IP:PORT>                # from the phone's Wireless debugging screen
python3 phone.py connect                        # prints model, Android and Instagram versions
python3 phone.py push "<video.mp4>" mfk-7-why-kochi.mp4   # into Movies/MFK, newest = first gallery tile
```
Then, on the phone (or with `phone.py shot` and taps): Instagram → **+** → **Reel** to open the *New reel* gallery, and dismiss any promo popup. Find the new video's tile with `python3 phone.py shot gallery`; the duration on the tile tells it apart. On the OnePlus the first video tile after the camera tile is at `608,970`.

```bash
python3 phone.py reel --tile 608,970 --caption output/trial-reels/why-kochi.txt \
  --date 2026-11-02 --time 12:30 [--cover-drag 35]      # stops before Schedule
# check output/trial-reels/shots/ready.png, then repeat with --submit (or tap Schedule)
python3 phone.py scheduled                     # Settings → Scheduled content: confirm it is listed at the time
```

What `reel` does: pick the tile → Next → (cover) → type the caption, read it back → Tag people → @makerfaire → **Trial** toggle on, then check that Audience reads *Trial* → More options → **Schedule this reel** → check the date row → set the 24-hour time dial → check the time row → back to the share screen and check the button reads *Schedule* → (with `--submit`) Schedule, and append a line to `output/trial-reels/ledger.jsonl`. Any check that fails stops the run with `FAIL:` and the screen as it is. Find out where it stopped with `phone.py shot <name>` before you touch anything.

Report the run as a table of time (IST) and reel, plus caption, tag, Trial, cover and anything you changed without asking. Trial reels are booked outside `meta.mjs`, so they aren't in its `schedule.json`; the record is `ledger.jsonl` plus Instagram's Scheduled content list.

### Trial-reel troubleshooting

| Symptom | Cause / fix |
|---|---|
| `adb connect` "failed to connect" / refused | This Mac isn't paired with the phone, or the connect port changed. Pair again (above) and read the current port |
| `no Trial toggle` | Trial reels need a **public professional** account (about 200 followers for professional accounts) that is eligible for recommendations. On 2 Nov the toggle was missing after the app had updated itself, although the account had posted trials before. The user got it back on the phone. Ask the user to check rather than guessing; never post without Trial as a workaround |
| `caption mismatch` | Autocorrect changed a word (e.g. "interestform" → "interest form"), or typing began before the field had focus. Clear the field and rerun. The script sends text in pieces that end at spaces, so a word is never split |
| `non-ASCII character` | `adb input text` can't type Malayalam or emoji. Paste those captions on the phone by hand, then let the script verify them (or do the rest by hand) |
| `the date row isn't …` | The date picker isn't automated; the script books the date already shown (today). For another day, set the date by hand on the phone |
| `less than 15 minutes` | As for the feed: ask the user for a new time |
| Back closed Instagram / taps land on the wrong screen | The share screen scrolls, so positions move. Relaunch (`adb shell monkey -p com.instagram.android -c android.intent.category.LAUNCHER 1`), take a `shot` and continue from what is on screen |
| Settings search box empty | The text arrived before the box had focus; tap the box and type again |
