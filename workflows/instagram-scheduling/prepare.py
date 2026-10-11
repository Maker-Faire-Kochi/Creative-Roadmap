"""Build and validate the scheduling ledger for a plan (plans/*.json). Never publishes.

usage: python3 prepare.py [--plan plans/2026-10-08.json]
       python3 prepare.py --approve A4 C5 --basis "User: approved captions for A4, C5 on <date>"   # or: --approve all

Environment: MFK_OUT = artwork folder (default: output/awareness-carousels at the repo root).
Reads  $MFK_OUT/captions.md and the topic folders; writes $MFK_OUT/scheduling/{schedule.json,inventory.json,calendar.md}.
--approve records a caption approval. Only run it after the user has explicitly approved those captions.
"""
import argparse
import hashlib
import json
import os
import re
from datetime import datetime
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
ROOT = (REPO / os.environ.get('MFK_OUT', 'output/awareness-carousels')).resolve()  # artwork root
STATE = ROOT / 'scheduling'  # run state (ledger, uploads, screenshots): untracked, never commit
STATE.mkdir(parents=True, exist_ok=True)
STYLES = dict(zip('ABCDE', ['A-assembly', 'B-panorama', 'C-colour-blocks', 'D-board', 'E-signage']))

ap = argparse.ArgumentParser()
ap.add_argument('--plan', default=str(HERE / 'plans' / '2026-10-08.json'))
ap.add_argument('--approve', nargs='+', metavar='CODE', help='creative codes to mark caption-approved, or "all"')
ap.add_argument('--basis', help='who approved and when (required with --approve)')
args = ap.parse_args()
PLAN = json.loads(Path(args.plan).read_text())
DAYS = PLAN['days']

def digest(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def bracket_tags(caption):
    """Caption keywords are literal bracketed text, not hashtags or account tags."""
    body = '\n'.join(line for line in caption.splitlines() if not line.lstrip().startswith('#')).rstrip()
    if re.search(r'\[[^\[\]]+\]$', body):
        return re.sub(r'\s*(\[[^\[\]]+\])$', r'\n\n\1', body)
    raise ValueError('Caption missing approved bracketed keywords')

folders = {int(p.name[:2]): p for p in ROOT.iterdir() if p.is_dir() and re.match(r'^\d\d-', p.name)}
assert set(folders) == set(range(1, 20)), 'Topic inventory changed; review numbering before continuing.'
captions = {}
notes = {}
for match in re.finditer(r'^## (\d+) · ([^\n]+)\n(.*?)(?=^## |\Z)', (ROOT/'captions.md').read_text(), re.M | re.S):
    n = int(match[1])
    captions[n] = bracket_tags('\n'.join(line for line in match[3].strip().splitlines() if not line.startswith('>')).strip())
    notes[n] = [line[1:].strip() for line in match[3].splitlines() if line.startswith('>')]

inventory = {}
for number, folder in sorted(folders.items()):
    for letter, style in STYLES.items():
        files = sorted((folder/style/'post').glob('[0-9][0-9].png'))
        assert 2 <= len(files) <= 10, (folder, style, len(files))
        assert [p.stem for p in files] == [f'{i:02}' for i in range(1, len(files)+1)]
        for p in files:
            raw = p.read_bytes()
            assert raw[:8] == b'\x89PNG\r\n\x1a\n'
            assert (int.from_bytes(raw[16:20], 'big'), int.from_bytes(raw[20:24], 'big')) == (1080, 1350)
        story_files = []
        for sp in sorted((folder/style/'story').glob('[0-9][0-9].png')):
            sraw = sp.read_bytes()
            assert (int.from_bytes(sraw[16:20], 'big'), int.from_bytes(sraw[20:24], 'big')) == (1080, 1920)
            story_files.append({'path': str(sp.relative_to(ROOT)), 'sha256': digest(sp)})
        assert len(story_files) == len(files), f'{folder.name}/{style}: story and post slide counts differ'
        inventory[f'{letter}{number}'] = {
            'topic': number, 'folder': folder.name, 'style': style,
            'files': [{'path': str(p.relative_to(ROOT)), 'sha256': digest(p)} for p in files],
            'story_files': story_files,
            'preview': str((folder/style/'_strip-post.jpg').relative_to(ROOT)),
        }

posts = []
start = date.fromisoformat(PLAN['start_date'])
for day, codes in enumerate(DAYS):
    codes = codes.split()
    times = PLAN['default_times'][str(len(codes))]
    for code, time in zip(codes, times):
        scheduled_at = f'{start+timedelta(days=day)}T{time}:00+05:30'
        if code in PLAN['overrides']:
            scheduled_at = PLAN['overrides'][code] + ':00+05:30'
        item = inventory[code]
        posts.append({
            'id': f'IG-{len(posts)+1:02}', 'creative': code,
            'scheduled_at': scheduled_at,
            'timezone': PLAN['timezone'], 'destination': 'Instagram',
            'caption': captions[item['topic']], 'editorial_notes': notes[item['topic']],
            'status': 'pending_caption_approval', 'approval': None,
            'remote_duplicate_check': None, 'meta_confirmation': None,
            **{k: v for k, v in item.items() if k != 'story_files'},
            # Stories pair with the feed post: same slot, same design, no caption.
            'story': {'scheduled_at': scheduled_at, 'status': 'ready', 'caption': None,
                      'files': item['story_files'], 'remote_duplicate_check': None, 'meta_confirmation': None},
        })
assert len(posts) == len({p['creative'] for p in posts}), 'A creative appears twice in the plan'
assert len(posts) == len({p['scheduled_at'] for p in posts}), 'Two posts share a slot'
assert len(inventory) == 5 * len(folders)

tracker = STATE/'schedule.json'
if not tracker.exists():
    tracker.write_text(json.dumps({
        'platform': 'Instagram', 'account': None, 'timezone': 'Asia/Kolkata',
        'start_date': PLAN['start_date'], 'end_date': str(start + timedelta(days=len(DAYS) - 1)),
        'weekly_counts': PLAN['weekly_counts'], 'posts': posts,
        'week3_starts_with': PLAN['week3_starts_with'],
        'remaining_creatives': [c for c in inventory if c not in {p['creative'] for p in posts}],
    }, indent=2, ensure_ascii=False)+'\n')
else:
    saved = json.loads(tracker.read_text())
    assert [(p['creative'], p['scheduled_at']) for p in saved['posts']] == [(p['creative'], p['scheduled_at']) for p in posts]
    for p in saved['posts']:
        assert p['files'] == inventory[p['creative']]['files'], f"Artwork changed: {p['creative']}"
        assert p['caption'] == captions[p['topic']], f"Caption mismatch: {p['creative']}"
        for frame in p.get('story', {}).get('files', []):
            path = ROOT/frame['path']
            assert digest(path) == frame['sha256'], f"Story artwork changed: {p['creative']}"
            raw = path.read_bytes()
            assert (int.from_bytes(raw[16:20], 'big'), int.from_bytes(raw[20:24], 'big')) == (1080,1920)
        if p['status'] in ('approved','scheduled','published'):
            assert p['approval'] and p['approval']['caption_sha256'] == hashlib.sha256(p['caption'].encode()).hexdigest(), 'Missing or stale caption approval'
        if p['status'] in ('scheduled','published'):
            assert p['meta_confirmation'] and p['remote_duplicate_check'], 'Missing remote verification'

(STATE/'inventory.json').write_text(json.dumps(inventory, indent=2)+'\n')

if args.approve:
    assert args.basis, '--basis is required with --approve (record who approved, and when)'
    ledger = json.loads(tracker.read_text())
    wanted = {p['creative'] for p in ledger['posts']} if args.approve == ['all'] else set(args.approve)
    unknown = wanted - {p['creative'] for p in ledger['posts']}
    assert not unknown, f'Not in the ledger: {sorted(unknown)}'
    for p in ledger['posts']:
        if p['creative'] in wanted and p['status'] == 'pending_caption_approval':
            p['status'] = 'approved'
            p['approval'] = {'recorded_at': datetime.now().astimezone().isoformat(),
                             'caption_sha256': hashlib.sha256(p['caption'].encode()).hexdigest(),
                             'basis': args.basis, 'scope': f"{PLAN['name']}, Instagram feed + paired stories"}
    tracker.write_text(json.dumps(ledger, indent=2, ensure_ascii=False)+'\n')

# calendar.md: one column per distinct time of day
times = sorted({p['scheduled_at'][11:16] for p in posts})
lines = [f"# Instagram / {PLAN['name']}", '', 'All times IST. Stories use their feed post\'s slot, without captions.', '',
         '| Date | ' + ' | '.join(times) + ' |', '|---|' + '---|' * len(times)]
for day in range(len(DAYS)):
    when = str(start + timedelta(days=day))
    row = ['—'] * len(times)
    for p in posts:
        if p['scheduled_at'].startswith(when):
            row[times.index(p['scheduled_at'][11:16])] = p['creative']
    lines.append('| ' + when + ' | ' + ' | '.join(row) + ' |')
if PLAN.get('notes'):
    lines += ['', PLAN['notes']]
(STATE/'calendar.md').write_text('\n'.join(lines)+'\n')
state = json.loads(tracker.read_text())['posts']
print(json.dumps({'inventory': len(inventory), 'planned': len(posts), 'remaining': len(inventory) - len(posts),
                  'duplicates': 0, 'status_counts': dict(Counter(p['status'] for p in state))}))
