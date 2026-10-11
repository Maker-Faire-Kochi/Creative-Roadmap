// Drives Meta Business Suite (Instagram) in a dedicated Chrome profile over CDP. Never publishes immediately.
// Usage: node meta.mjs launch | inspect [filter] | uploads [CODE ...] | run <CODE> [--feed|--story] [--dry-run] | batch [--dry-run]
// Environment:
//   MFK_OUT          artwork folder (default output/awareness-carousels); run state lives in $MFK_OUT/scheduling/
//   META_ASSET_ID, META_BUSINESS_ID   only needed if the open Meta page's URL doesn't carry them (they are account
//                    identifiers: keep them in your shell or local config, never commit them)
//   CHROME_PATH      Chrome binary for `launch`
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const OUT = path.resolve(REPO, process.env.MFK_OUT || 'output/awareness-carousels');
const STATE = path.join(OUT, 'scheduling'); // ledger, upload copies, screenshots: untracked run state
const LEDGER = path.join(STATE, 'schedule.json');
const SHOTS = path.join(STATE, 'shots');
const PORT = 9333;
const PROFILE = path.join(os.homedir(), '.mfk-chrome-meta');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HOME = 'https://business.facebook.com/latest/home';

const [cmd, ...args] = process.argv.slice(2);
const flag = (f) => args.includes(f);

async function connect() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  const ctx = browser.contexts()[0];
  let page = ctx.pages().find((p) => p.url().includes('business.facebook.com'));
  if (!page) { page = await ctx.newPage(); await go(page, HOME); }
  await page.bringToFront();
  return { browser, ctx, page };
}

async function shot(page, name) {
  fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file });
  return file;
}

// Compact list of visible interactive elements, so inspection stays small.
async function controls(page, filter = '') {
  return page.evaluate((filter) => {
    const out = [];
    const sel = 'button,[role=button],input,textarea,[contenteditable=true],[role=checkbox],[role=switch],[role=radio],[role=tab],[role=combobox],[role=spinbutton],[role=menuitem],[role=option],a[href]';
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const name = (el.getAttribute('aria-label') || el.innerText || el.value || el.placeholder || '').trim().replace(/\s+/g, ' ').slice(0, 60);
      const role = el.getAttribute('role') || el.tagName.toLowerCase() + (el.type ? ':' + el.type : '');
      const state = ['aria-checked', 'aria-pressed', 'aria-selected', 'aria-disabled'].map((a) => el.getAttribute(a) ? `${a.slice(5)}=${el.getAttribute(a)}` : '').filter(Boolean).join(' ');
      const line = `${role} "${name}" ${state} @${Math.round(r.x)},${Math.round(r.y)}`;
      if (!filter || line.toLowerCase().includes(filter.toLowerCase())) out.push(line);
    }
    return [...new Set(out)];
  }, filter);
}

// page.goto that rides out short network drops (DNS / connection resets).
async function go(page, url) {
  for (let i = 1; ; i++) {
    try { return await page.goto(url); } catch (e) {
      if (i >= 6 || !/net::ERR_/.test(e.message)) throw e;
      console.log(`network error (${e.message.match(/net::ERR_\w+/)[0]}); retry ${i} in 20s`);
      await page.waitForTimeout(20000);
    }
  }
}

const readLedger = () => JSON.parse(fs.readFileSync(LEDGER, 'utf8'));
const writeLedger = (d) => fs.writeFileSync(LEDGER, JSON.stringify(d, null, 2) + '\n');

function job(code) {
  const post = readLedger().posts.find((p) => p.creative === code);
  if (!post) throw new Error(`No ledger entry for ${code}`);
  return post;
}

function uploadFiles(code, kind) {
  const dir = path.join(STATE, 'uploads', code, kind);
  const files = fs.readdirSync(dir).filter((f) => /^\d\d\.jpg$/.test(f)).sort().map((f) => path.join(dir, f));
  if (!files.length) throw new Error(`No upload files in ${dir}`);
  return files;
}

// Meta account identifiers come from the logged-in page's URL, else META_ASSET_ID / META_BUSINESS_ID. Never hardcode them.
function idParams(page) {
  const u = new URL(page.url());
  const asset = u.searchParams.get('asset_id') || process.env.META_ASSET_ID;
  const business = u.searchParams.get('business_id') || process.env.META_BUSINESS_ID;
  if (!asset || !business) throw new Error('Meta asset_id/business_id not found: open Business Suite in the automation Chrome, or set META_ASSET_ID and META_BUSINESS_ID');
  return `asset_id=${asset}&business_id=${business}`;
}

async function openComposer(page, which) {
  const url = new URL(page.url());
  const ids = idParams(page);
  await go(page, `https://business.facebook.com/latest/${which}/?${ids}`);
  await page.getByRole('button', { name: /Add photo\/video|Add photo|Add media|Upload/i }).first().waitFor({ timeout: 30000 });
  const acct = await page.getByRole('combobox').first().innerText().catch(() => '');
  if (!/makerfairekochi/i.test(acct)) throw new Error(`Unexpected account: ${acct}`);
}

async function attach(page, files) {
  const btn = page.getByRole('button', { name: /Add photo\/video|Add photo|Add media/i }).first();
  const chooser = page.waitForEvent('filechooser', { timeout: 8000 });
  await btn.click();
  let fc = await chooser.catch(() => null);
  if (!fc) {
    // Some composers open a menu first.
    const item = page.getByText(/Upload from (desktop|computer)/i).first();
    const again = page.waitForEvent('filechooser', { timeout: 8000 });
    await item.click();
    fc = await again;
  }
  await fc.setFiles(files);
}

async function typeCaption(page, caption) {
  const box = page.getByRole('combobox', { name: /Write into the dialogue box/i });
  await box.click();
  const lines = caption.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) await page.keyboard.insertText(lines[i]);
    if (i < lines.length - 1) await page.keyboard.press('Shift+Enter');
  }
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const got = await box.innerText();
  if (norm(got) !== norm(caption)) throw new Error(`Caption mismatch:\n${got}`);
}

// iso like 2026-10-09T13:30:00+05:30 (machine clock is IST).
async function setSchedule(page, iso) {
  const [, y, mo, d, h, mi] = iso.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/).map(Number);
  const sw = page.getByRole('switch', { name: 'Set date and time' });
  if (await sw.count()) {
    if ((await sw.getAttribute('aria-checked')) !== 'true') await sw.click();
  } else {
    const seg = page.getByRole('button', { name: 'Schedule', exact: true }).first();
    if ((await seg.getAttribute('aria-pressed')) !== 'true') await seg.click();
  }
  const date = page.locator('input:not([type]):not([role])').first();
  await date.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.type(`${String(mo).padStart(2, '0')}/${String(d).padStart(2, '0')}/${y}`);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape').catch(() => {});
  const h12 = ((h + 11) % 12) + 1;
  for (const [name, val] of [['hours', String(h12).padStart(2, '0')], ['minutes', String(mi).padStart(2, '0')], ['meridiem', h < 12 ? 'A' : 'P']]) {
    await page.getByRole('spinbutton', { name }).click();
    await page.keyboard.type(val);
  }
  await page.waitForTimeout(500);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const got = {
    date: await date.inputValue(),
    hours: await page.getByRole('spinbutton', { name: 'hours' }).getAttribute('aria-valuenow'),
    minutes: await page.getByRole('spinbutton', { name: 'minutes' }).getAttribute('aria-valuenow'),
    meridiem: await page.getByRole('spinbutton', { name: 'meridiem' }).getAttribute('aria-valuetext'),
  };
  const ok = got.date === `${months[mo - 1]} ${d}, ${y}` && Number(got.hours) === h12 && Number(got.minutes) === mi && String(got.meridiem).toUpperCase().startsWith(h < 12 ? 'A' : 'P');
  if (!ok) throw new Error(`Schedule fields not set: ${JSON.stringify(got)}`);
  return got;
}


// Meta lists times like "Fri Oct 9, 1:30pm".
function metaLabel(iso) {
  const [, y, mo, d, h, mi] = iso.match(/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/).map(Number);
  const wd = new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  const mon = new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  return `${wd} ${mon} ${d}, ${((h + 11) % 12) + 1}:${String(mi).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
}

// Rows of scheduled items matching both caption and time (captions repeat across designs), or null.
async function findScheduled(page, list, caption, iso) {
  await go(page, `https://business.facebook.com/latest/posts/${list}?${idParams(page)}`);
  await page.waitForTimeout(7000);
  const label = metaLabel(iso);
  const first = caption ? caption.split('\n')[0].replace(/\s+/g, ' ').slice(0, 50) : '';
  const rows = [];
  for (const row of await page.getByRole('row').all()) {
    const text = (await row.innerText()).replace(/\s+/g, ' ');
    if (text.includes(label) && (!first || text.includes(first))) rows.push(text);
  }
  return rows.length ? rows : null;
}

async function submit(page, name) {
  const before = await shot(page, `${name}-before`);
  await page.getByRole('button', { name: 'Schedule', exact: true }).last().click();
  // Wait for the "Scheduling your post/story" overlay to come and go; the scheduled list is the real confirmation.
  const busy = page.getByText(/^Scheduling your/i).first();
  await busy.waitFor({ timeout: 15000 }).catch(() => {});
  await busy.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const after = await shot(page, `${name}-after`);
  const done = page.getByRole('button', { name: 'Done' });
  if (await done.isVisible().catch(() => false)) await done.click();
  return { before, after };
}

async function confirm(page, list, caption, iso, sub, expected = 1) {
  let rows = [];
  // Meta's list can lag a few seconds behind the composer.
  for (let i = 0; i < 4 && rows.length !== expected; i++) rows = (await findScheduled(page, list, caption, iso)) || [];
  if (rows.length === expected) return { ...sub, outcome: 'ok', message: `${rows.length} × ${rows[0].slice(0, 160)}` };
  return { ...sub, outcome: rows.length ? `count ${rows.length} of ${expected}` : 'unconfirmed' };
}

async function runFeed(page, post, dry) {
  if (await findScheduled(page, 'scheduled_posts', post.caption, post.scheduled_at)) return { outcome: 'duplicate' };
  const checkedAt = new Date().toISOString();
  await openComposer(page, 'composer');
  const files = uploadFiles(post.creative, 'post');
  await attach(page, files);
  const removes = page.getByRole('button', { name: /Remove photo/ });
  for (let t = 0; t < 60 && (await removes.count()) !== files.length; t++) await page.waitForTimeout(1000);
  if ((await removes.count()) !== files.length) throw new Error(`Media count mismatch: ${await removes.count()} of ${files.length}`);
  await typeCaption(page, post.caption);
  const when = await setSchedule(page, post.scheduled_at);
  if (dry) return { outcome: 'dry-run', when, shot: await shot(page, `${post.creative}-feed-dry`) };
  const sub = await submit(page, `${post.creative}-feed`);
  return { ...(await confirm(page, 'scheduled_posts', post.caption, post.scheduled_at, sub)), when, checkedAt };
}

async function runStory(page, post, dry) {
  const story = post.story;
  if (await findScheduled(page, 'scheduled_stories', null, story.scheduled_at)) return { outcome: 'duplicate' };
  const checkedAt = new Date().toISOString();
  await openComposer(page, 'story_composer');
  const files = uploadFiles(post.creative, 'story');
  await attach(page, files);
  const removes = page.getByRole('button', { name: /^Remove/ });
  for (let t = 0; t < 60 && (await removes.count()) !== files.length; t++) await page.waitForTimeout(1000);
  if ((await removes.count()) !== files.length) throw new Error(`Story frame count mismatch: ${await removes.count()} of ${files.length}`);
  const when = await setSchedule(page, story.scheduled_at);
  if (dry) return { outcome: 'dry-run', when, shot: await shot(page, `${post.creative}-story-dry`) };
  const sub = await submit(page, `${post.creative}-story`);
  return { ...(await confirm(page, 'scheduled_stories', null, story.scheduled_at, sub, files.length)), when, checkedAt };
}

function record(code, kind, result) {
  const d = readLedger();
  const p = d.posts.find((x) => x.creative === code);
  const target = kind === 'feed' ? p : p.story;
  target.remote_duplicate_check = { checked_at: result.checkedAt, match_found: false };
  target.meta_confirmation = { at: new Date().toISOString(), message: result.message, fields: result.when, screenshots: [result.before, result.after].map((f) => path.relative(STATE, f)) };
  target.status = 'scheduled';
  writeLedger(d);
}

async function run(page, code, kind, dry) {
  const post = job(code);
  const target = kind === 'feed' ? post : post.story;
  if (['scheduled', 'completed_by_user', 'published'].includes(target.status)) return console.log(`${code} ${kind}: already ${target.status}`);
  if (new Date(target.scheduled_at) - Date.now() < 15 * 60000) throw new Error(`${code} ${kind}: slot ${target.scheduled_at} is less than 15 minutes away`);
  if (kind === 'feed' && post.status !== 'approved') throw new Error(`${code}: caption not approved`);
  let result;
  // A stuck "Scheduling your post" overlay times out after 1 minute; confirm() then reloads the scheduled list.
  // If the item still isn't there, retry the whole job (the duplicate check runs again first).
  for (let attempt = 1; attempt <= 3; attempt++) {
    result = kind === 'feed' ? await runFeed(page, post, dry) : await runStory(page, post, dry);
    if (result.outcome !== 'unconfirmed') break;
    console.log(`${code} ${kind}: not in Meta's scheduled list after attempt ${attempt}; retrying`);
  }
  if (result.outcome === 'duplicate' && !dry) {
    // Found on the pre-check: an earlier attempt landed after all.
    const rows = await findScheduled(page, kind === 'feed' ? 'scheduled_posts' : 'scheduled_stories', kind === 'feed' ? post.caption : null, target.scheduled_at);
    const expected = kind === 'feed' ? 1 : uploadFiles(code, 'story').length;
    if (rows && rows.length === expected) result = { outcome: 'ok', message: `${rows.length} × ${rows[0].slice(0, 160)} (found on re-check)`, checkedAt: new Date().toISOString(), when: null, before: path.join(SHOTS, `${code}-${kind}-before.png`), after: path.join(SHOTS, `${code}-${kind}-after.png`) };
  }
  if (result.outcome === 'ok') record(code, kind, result);
  console.log(`${code} ${kind}: ${result.outcome}${result.message ? ` (${result.message.replace(/\s+/g, ' ').slice(0, 80)})` : ''}`);
  if (!['ok', 'dry-run'].includes(result.outcome)) throw new Error(`${code} ${kind}: stopped on ${result.outcome}; check Meta before retrying`);
}

if (cmd === 'run') {
  const { browser, page } = await connect();
  page.on('dialog', (d) => d.accept());
  const kinds = flag('--story') ? ['story'] : flag('--feed') ? ['feed'] : ['feed', 'story'];
  try {
    for (const kind of kinds) await run(page, args[0], kind, flag('--dry-run'));
  } finally { await browser.close(); }
} else if (cmd === 'batch') {
  // Every pending feed + story in calendar order; stops at the first failure.
  const { browser, page } = await connect();
  page.on('dialog', (d) => d.accept());
  try {
    for (const p of readLedger().posts) for (const kind of ['feed', 'story']) await run(page, p.creative, kind, flag('--dry-run'));
  } finally { await browser.close(); }
} else if (cmd === 'uploads') {
  // Upload copies: Meta's uploader takes JPEGs reliably, so convert each creative's PNG slides (post + story) with ffmpeg.
  // node meta.mjs uploads [CODE ...]   (default: every creative that still has work to do)
  const ledger = readLedger();
  const done = ['completed_by_user', 'published', 'scheduled'];
  const pending = (p) => !done.includes(p.status) || !done.includes(p.story.status);
  const jobs = ledger.posts.filter((p) => (args.length ? args.includes(p.creative) : pending(p)));
  for (const p of jobs) {
    for (const [kind, files] of [['post', p.files], ['story', p.story.files]]) {
      const dir = path.join(STATE, 'uploads', p.creative, kind);
      fs.mkdirSync(dir, { recursive: true });
      for (const f of files) {
        const out = path.join(dir, path.basename(f.path).replace(/\.png$/, '.jpg'));
        execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(OUT, f.path), '-q:v', '2', out]);
      }
    }
    console.log(`${p.creative}: upload copies ready`);
  }
} else if (cmd === 'record') {
  // Record a job already verified in Meta by hand: node meta.mjs record <CODE> <feed|story> <checkedAt> <message>
  record(args[0], args[1], { checkedAt: args[2], message: args[3], when: null, before: path.join(SHOTS, 'queue.png'), after: path.join(SHOTS, 'queue.png') });
} else if (cmd === 'launch') {
  fs.mkdirSync(PROFILE, { recursive: true });
  spawn(CHROME, [`--user-data-dir=${PROFILE}`, `--remote-debugging-port=${PORT}`, '--no-first-run', HOME], { detached: true, stdio: 'ignore' }).unref();
  console.log(`Chrome automation profile launched (${PROFILE}). Log in to Meta Business Suite there.`);
} else if (cmd === 'inspect') {
  const { browser, page } = await connect();
  console.log(page.url());
  console.log((await controls(page, args[0])).join('\n'));
  console.log('shot:', await shot(page, 'inspect'));
  await browser.close();
} else if (cmd === 'click') {
  // Exploration helper: click the first visible element whose accessible name matches args[0].
  const { browser, page } = await connect();
  await page.getByRole(args[1] || 'button', { name: args[0], exact: false }).first().click();
  await page.waitForTimeout(2500);
  console.log(page.url());
  console.log((await controls(page, args[2])).join('\n'));
  console.log('shot:', await shot(page, 'inspect'));
  await browser.close();
} else {
  console.error('Unknown command'); process.exit(1);
}
