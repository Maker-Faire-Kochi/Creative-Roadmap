"""Caption hashtags, checked against the pool in hashtags.json (README, "Keywords and hashtags").

A caption ends with its bracketed keywords (search words) and then, on its own last line, its hashtags
(labels): 3 to `cap` tags, #MakerFaireKochi first, every tag spelled as in the pool. Used by prepare.py
(feed) and phone.py (trial reels). Standard library only.
"""
import json, os, re

POOL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "hashtags.json")
TAG_LINE = re.compile(r"^\s*(#[A-Za-z0-9_]+\s*)+$")


def load_pool(path=POOL_FILE):
    pool = json.load(open(path, encoding="utf-8"))
    allowed = [t["tag"] for t in pool["always"] + pool["place"]]
    for v in pool["verticals"].values():
        allowed += [t["tag"] for t in v["tags"]]
    return pool, {t.lower(): t for t in allowed}, {t["tag"].lower() for t in pool["avoid"]}


def split_tags(caption):
    """(caption without its hashtag line, [tags]); [] when the last line isn't a hashtag line."""
    lines = caption.rstrip("\n").split("\n")
    if lines and TAG_LINE.match(lines[-1]):
        return "\n".join(lines[:-1]).rstrip("\n"), lines[-1].split()
    return caption.rstrip("\n"), []


def check(caption, required=True, pool_file=POOL_FILE):
    """Raise ValueError if the caption's hashtags break the pool's rules; return the tags."""
    pool, allowed, avoid = load_pool(pool_file)
    body, tags = split_tags(caption)
    if not tags:
        if required: raise ValueError("no hashtag line: end the caption with 3-5 tags from hashtags.json")
        return []
    if "#" in body.replace("[#", ""):
        stray = re.findall(r"#\w+", body)
        if stray: raise ValueError(f"hashtags outside the last line: {' '.join(stray)}")
    if not 3 <= len(tags) <= pool["cap"]: raise ValueError(f"{len(tags)} hashtags: use 3 to {pool['cap']}")
    if len({t.lower() for t in tags}) != len(tags): raise ValueError("a hashtag is repeated")
    if tags[0] != "#MakerFaireKochi": raise ValueError("#MakerFaireKochi comes first")
    for t in tags:
        if t.lower() in avoid: raise ValueError(f"{t} is on the avoid list in hashtags.json")
        if t.lower() not in allowed: raise ValueError(f"{t} isn't in hashtags.json: add it there first, with its post count and source")
        if t != allowed[t.lower()]: raise ValueError(f"write {allowed[t.lower()]}, not {t}")
    return tags


if __name__ == "__main__":
    import sys
    text = open(sys.argv[1], encoding="utf-8").read()
    print("ok:", " ".join(check(text)))
