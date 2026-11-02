#!/usr/bin/env python3
"""Trial reels from a phone: schedules a reel as an Instagram *trial* (shown to non-followers first) by driving the
Instagram app on an Android phone over wireless debugging (adb). Trial reels can only be made in the mobile app,
so Meta Business Suite (meta.mjs) can't do this. Read README.md ("Trial reels from a phone") first.

  python3 phone.py connect [IP:PORT]           connect (pair first, see README); prints the device
  python3 phone.py push VIDEO NAME             copy a video to the phone's Movies/MFK as NAME and index it
  python3 phone.py shot NAME                   screenshot + a summary of the screen's text/clickable nodes
  python3 phone.py reel --tile X,Y --caption FILE --date YYYY-MM-DD --time HH:MM [--tag makerfaire]
                        [--cover-drag PX] [--submit]
      From Instagram's "New reel" gallery: pick the tile, type and verify the caption, tag, Trial on, schedule at
      DATE TIME (phone time zone, IST), then STOP before the Schedule button unless --submit is given.
  python3 phone.py scheduled                   open Settings → Scheduled content and print what is booked

The phone is the one in $MFK_ADB_SERIAL (or $ANDROID_SERIAL), IP:PORT from the phone's Wireless debugging screen. Keep it out of the repo.
Screenshots and the ledger go to $MFK_PHONE_OUT (default output/trial-reels/): shots/, ledger.jsonl.
Screen coordinates (swipes, the Back arrow, the cover strip) were measured on a 1216x2640 OnePlus (CPH2723) with
Instagram 453; everything else is found by the app's view ids and checked after each step.
"""
import argparse, datetime, hashlib, html, json, os, re, subprocess, sys, time

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUT = os.path.abspath(os.path.join(REPO, os.environ.get("MFK_PHONE_OUT", "output/trial-reels")))
SER = os.environ.get("MFK_ADB_SERIAL") or os.environ.get("ANDROID_SERIAL") or ""
DIR = "/sdcard/Movies/MFK"


def die(msg): sys.exit(f"FAIL: {msg}")
def step(msg): print("·", msg, flush=True)
def adb(*a, check=False, binary=False):
    r = subprocess.run(["adb", *(["-s", SER] if SER else []), *a], capture_output=True)
    if check and r.returncode: die(f"adb {' '.join(a)}: {r.stderr.decode(errors='ignore').strip()}")
    return r.stdout if binary else r.stdout.decode("utf-8", "ignore")
def sh(*a): return adb("shell", *a)
def tap(x, y, wait=1.5): sh("input", "tap", str(x), str(y)); time.sleep(wait)
def swipe_up(dist=700): sh("input", "swipe", "608", "2000", "608", str(2000 - dist), "400"); time.sleep(1.2)


def dump():
    """The screen's nodes: text, content-desc, view id, bounds, clickable."""
    sh("uiautomator", "dump", "/sdcard/ui.xml")
    x = adb("exec-out", "cat", "/sdcard/ui.xml")
    nodes = []
    for m in re.finditer(r"<node [^>]*>", x):
        n = m.group(0)
        def g(k):
            mm = re.search(k + r'''=(?:"([^"]*)"|'([^']*)')''', n)
            return html.unescape((mm.group(1) if mm.group(1) is not None else mm.group(2)) if mm else "")
        nodes.append({"t": g("text"), "d": g("content-desc"), "id": g("resource-id").split("/")[-1],
                      "b": list(map(int, re.findall(r"\d+", g("bounds")))), "c": g("clickable") == "true"})
    return nodes
def find(nodes, **kw):
    for n in nodes:
        if all((v(n[k]) if callable(v) else n[k] == v) for k, v in kw.items()): return n
def ctr(n): b = n["b"]; return (b[0] + b[2]) // 2, (b[1] + b[3]) // 2
def wait_for(pred, what, tries=10, gap=1.0):
    for _ in range(tries):
        ns = dump(); n = pred(ns)
        if n: return ns, n
        time.sleep(gap)
    die(f"timed out waiting for {what}")


def shot(name):
    os.makedirs(f"{OUT}/shots", exist_ok=True)
    open(f"{OUT}/shots/{name}.png", "wb").write(adb("exec-out", "screencap", "-p", binary=True))
    for n in dump():
        if n["t"] or n["d"] or (n["c"] and n["id"]):
            print(f"{str(n['b']):24} {'C' if n['c'] else ' '} t={n['t'][:60]!r} d={n['d'][:60]!r} id={n['id']}")
    print(f"→ {OUT}/shots/{name}.png")


# Typing: `adb shell input text` takes ASCII only, chokes on shell characters and long strings, and the keyboard's
# autocorrect rewrites a word whose pieces arrive separately ("interestform" → "interest form"). So each line is sent
# in chunks that end at a space, composing is closed with a cursor move before Enter, and the field is read back and
# compared with the approved text before anything else happens.
SPECIAL = set("'\"()[]&;<>|*?`$\\!~#{}")
def esc(s):
    out = []
    for ch in s:
        if ord(ch) > 127: die(f"non-ASCII character {ch!r}: adb can't type it (Malayalam captions: paste by hand)")
        out.append("%s" if ch == " " else "\\" + ch if ch in SPECIAL else ch)
    return "".join(out)
def chunks(line, size=60):
    while len(line) > size:
        cut = line.rfind(" ", 0, size) + 1 or size
        yield line[:cut]; line = line[cut:]
    if line: yield line
def type_caption(text):
    lines = text.split("\n")
    for i, line in enumerate(lines):
        for c in chunks(line):
            sh("input", "text", esc(c)); time.sleep(0.15)
        sh("input", "keyevent", "KEYCODE_MOVE_END"); time.sleep(0.15)
        if i < len(lines) - 1: sh("input", "keyevent", "66"); time.sleep(0.15)


def cmd_connect(a):
    global SER
    if a.target: SER = a.target
    if not SER: die("set MFK_ADB_SERIAL=IP:PORT (the address on the phone's Wireless debugging screen)")
    print(subprocess.run(["adb", "connect", SER], capture_output=True, text=True).stdout.strip())
    if f"{SER}\tdevice" not in subprocess.run(["adb", "devices"], capture_output=True, text=True).stdout:
        die("not connected. Pair first: phone → Developer options → Wireless debugging → Pair device with pairing "
            "code, then `adb pair IP:PAIRPORT CODE` (the pairing port differs from the connect port)")
    ig = re.search(r"versionName=(\S+)", sh("dumpsys", "package", "com.instagram.android"))
    print(sh("getprop", "ro.product.model").strip(), "· Android", sh("getprop", "ro.build.version.release").strip(),
          "· Instagram", ig.group(1) if ig else "not installed")


def cmd_push(a):
    if not os.path.isfile(a.video): die(f"no such file {a.video}")
    sh("mkdir", "-p", DIR)
    adb("push", a.video, f"{DIR}/{a.name}", check=True)
    sh("touch", f"{DIR}/{a.name}")  # newest file: first video tile in Instagram's gallery
    sh("content", "call", "--uri", "content://media", "--method", "scan_volume", "--arg", "external_primary")
    print(sh("content", "query", "--uri", "content://media/external/video/media", "--projection",
             "_display_name:duration:_size", "--where", f"_display_name='{a.name}'").strip() or "not indexed yet")


def cmd_reel(a):
    want = open(a.caption, encoding="utf-8").read().rstrip("\n")
    when = datetime.datetime.strptime(f"{a.date} {a.time}", "%Y-%m-%d %H:%M")
    if when.minute % 5: die("the time dial takes 5-minute steps")
    phone_now = datetime.datetime.strptime(sh("date", "+%Y-%m-%d %H:%M").strip(), "%Y-%m-%d %H:%M")
    if when - phone_now < datetime.timedelta(minutes=15): die(f"{when} is less than 15 minutes from the phone's clock ({phone_now})")
    tx, ty = map(int, a.tile.split(","))

    step("pick the video"); tap(tx, ty, 4)
    ns, nxt = wait_for(lambda ns: find(ns, id="clips_right_action_button"), "the editor's Next")
    tap(*ctr(nxt), 4)
    ns, cap = wait_for(lambda ns: find(ns, id="caption_input_text_view"), "the share screen")

    if a.cover_drag:
        # The cover often defaults to the first frame (a blank ground before the title draws in).
        step(f"cover: drag the frame selector {a.cover_drag}px")
        ec = find(ns, t="Edit cover") or find(ns, d="Edit cover")
        if not ec: die("no Edit cover on the share screen")
        tap(*ctr(ec), 3.5)
        ns, _ = wait_for(lambda ns: find(ns, id="action_bar_title", t="Edit cover") or find(ns, d="Edit cover", id="action_bar_title"), "the cover editor")
        sh("input", "swipe", "90", "2040", str(90 + a.cover_drag), "2040", "600"); time.sleep(2)
        shot("cover")
        done = find(dump(), d="Finished") or die("no Finished in the cover editor")
        tap(*ctr(done), 3)
        ns, cap = wait_for(lambda ns: find(ns, id="caption_input_text_view"), "the share screen after the cover")

    step("caption"); tap(*ctr(cap), 1.5)
    type_caption(want); time.sleep(1)
    ns = dump(); got = (find(ns, id="caption_input_text_view") or {}).get("t", "")
    if got != want: die(f"caption mismatch (clear the field and rerun):\n{got!r}")
    tap(*ctr(find(ns, t="OK") or die("no OK after the caption")), 2)

    if a.tag:
        step(f"tag @{a.tag}")
        ns, tp = wait_for(lambda ns: find(ns, t="Tag people", id="title"), "Tag people")
        tap(*ctr(tp), 2.5)
        ns, add = wait_for(lambda ns: find(ns, id="add_people_tag_button"), "Add Tag"); tap(*ctr(add), 2)
        sh("input", "text", a.tag); time.sleep(3)
        ns, row = wait_for(lambda ns: find(ns, id="row_search_user_username", t=a.tag), f"@{a.tag} in search")
        tap(*ctr(row), 2)
        ns = dump()
        if not find(ns, id="row_user_primary_name", t=a.tag): die("tag not added")
        tap(*ctr(find(ns, id="clips_people_tagging_done_button")), 2)
        ns = dump()
        if not find(ns, id="inline_subtitle", t=a.tag): die("tag not shown on the share screen")

    step("Trial on")
    tr = find(ns, t="Trial", id="title")
    if not tr: swipe_up(); ns = dump(); tr = find(ns, t="Trial", id="title")
    if not tr: die("no Trial toggle on the share screen (see README: Trial toggle missing)")
    tog = [n for n in ns if n["id"] == "toggle" and n["b"][1] <= tr["b"][1] <= n["b"][3] + 20]
    if not tog: die("no toggle beside Trial")
    tap(*ctr(tog[0]), 2)
    ns = dump()
    if not find(ns, id="inline_subtitle", t="Trial"): die("Audience is not Trial after toggling")

    step(f"schedule {when:%a %d %b %H:%M}")
    for _ in range(3):
        mo = find(ns, t="More options", id="title")
        if mo and mo["b"][3] < 2350: break
        swipe_up(1000); ns = dump()
    tap(*ctr(mo or die("no More options")), 2.5)
    ns = dump(); st = find(ns, t="Schedule this reel") or die("no 'Schedule this reel'")
    sw = [n for n in ns if n["c"] and n["b"][0] >= 1000 and n["b"][1] <= st["b"][1] + 10 and n["b"][3] >= st["b"][3] - 10]
    tap(*ctr(sw[0]), 2.5)
    ns, trow = wait_for(lambda ns: find(ns, d=lambda d: d.startswith("Time, ")), "the schedule rows")
    date_label = f"Date, {when:%a, %b} {when.day}, {when.year}"
    if not find(ns, d=date_label):
        die(f"the date row isn't '{date_label}'. The date picker isn't automated: set the date by hand, or book today")
    tap(*ctr(trow), 2)
    wait_for(lambda ns: find(ns, id="hours"), "the time dial")
    tap(*ctr(find(dump(), d=str(when.hour)) or die(f"no hour {when.hour} on the dial")), 1.2)
    ns = dump(); mm = f"{when.minute:02d}"
    tap(*ctr(find(ns, d=mm) or find(ns, d=str(when.minute)) or die(f"no minute {mm} on the dial")), 1.2)
    ns = dump()
    if find(ns, id="hours")["t"] != f"{when.hour:02d}" or find(ns, id="minutes")["t"] != mm: die("the dial shows the wrong time")
    tap(*ctr(find(ns, t="OK", id="button1")), 1.5)
    ns = dump(); label = f"Time, {when.hour % 12 or 12}:{mm} {'am' if when.hour < 12 else 'pm'}"
    if not find(ns, d=label): die(f"the time row isn't '{label}'")
    tap(*ctr(find(ns, d="Finished", id="bb_primary_action_container")), 1.5)
    ns = dump(); booked = [n["t"] for n in ns if "GMT+" in n["t"]]
    print("  booked for:", booked)
    tap(83, 218, 2)  # back to the share screen
    ns = dump(); sb = find(ns, id="share_button")
    if not sb or sb["d"] != "Schedule": die(f"the button reads {sb and sb['d']!r}, not Schedule. Never tap Share")
    shot("ready")
    if not a.submit:
        print("READY, not submitted. Look at shots/ready.png, then rerun with --submit or tap Schedule yourself."); return
    step("tap Schedule"); tap(*ctr(sb), 6)
    os.makedirs(OUT, exist_ok=True)
    with open(f"{OUT}/ledger.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({"at": datetime.datetime.now().isoformat(timespec="seconds"), "scheduled": when.isoformat(),
                            "trial": True, "tag": a.tag, "caption_sha256": hashlib.sha256(want.encode()).hexdigest(),
                            "caption_file": a.caption, "booked": booked, "verified": False}, ensure_ascii=False) + "\n")
    print("submitted; now run `python3 phone.py scheduled` to confirm it is in the list")


def cmd_scheduled(a):
    sh("monkey", "-p", "com.instagram.android", "-c", "android.intent.category.LAUNCHER", "1"); time.sleep(4)
    ns, prof = wait_for(lambda ns: find(ns, id="profile_tab"), "the profile tab"); tap(*ctr(prof), 3)
    tap(1144, 218, 2.5)  # the profile's menu
    ns, box = wait_for(lambda ns: find(ns, d=lambda d: d.startswith("Search")) or find(ns, t="Search"), "the settings search")
    tap(*ctr(box), 1.2)
    sh("input", "text", "scheduled"); time.sleep(2.5)
    ns, row = wait_for(lambda ns: find(ns, t="Scheduled content"), "Scheduled content in the results")
    tap(*ctr(row), 4)
    for n in dump():
        if re.search(r"\b(AM|PM)\b|GMT", n["t"] + n["d"]): print(" ", (n["t"] or n["d"])[:120])
    shot("scheduled")


p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
s = p.add_subparsers(dest="cmd", required=True)
c = s.add_parser("connect"); c.add_argument("target", nargs="?"); c.set_defaults(f=cmd_connect)
c = s.add_parser("push"); c.add_argument("video"); c.add_argument("name"); c.set_defaults(f=cmd_push)
c = s.add_parser("shot"); c.add_argument("name"); c.set_defaults(f=lambda a: shot(a.name))
c = s.add_parser("reel"); c.add_argument("--tile", default="608,970", help="the gallery tile (default: first video tile)")
c.add_argument("--caption", required=True); c.add_argument("--date", required=True); c.add_argument("--time", required=True)
c.add_argument("--tag", default="makerfaire"); c.add_argument("--cover-drag", type=int, default=0)
c.add_argument("--submit", action="store_true"); c.set_defaults(f=cmd_reel)
c = s.add_parser("scheduled"); c.set_defaults(f=cmd_scheduled)
a = p.parse_args()
if a.cmd != "connect" and not SER: die("set MFK_ADB_SERIAL=IP:PORT")
a.f(a)
