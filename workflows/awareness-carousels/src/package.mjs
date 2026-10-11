import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { TOPICS, SOURCES } from '../content/topics.mjs';
import { OUT, WORK, DS, CONTENT, CHROME, relFrom } from './paths.mjs';

fs.mkdirSync(WORK,{recursive:true});
const DSREL = relFrom(OUT, DS); // design system as seen from the output folder (for generated docs/gallery)
const styles = ['A-assembly','B-panorama','C-colour-blocks','D-board','E-signage'];
const names = ['A / Assembly','B / Panorama','C / Colour blocks','D / Board','E / Signage'];
const entries = Object.entries(TOPICS);
const esc = s => s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const plain = s => s.replaceAll('*','').replaceAll('~','');
const total = entries.reduce((n,[,t]) => n + t.slides.length, 0);
const sourceLinks = t => t.sources.map(id => `[${SOURCES[id].title}](${SOURCES[id].url})`).join(' · ');
const T = entries.length; // 19 topics: original 01–09, continuation 10–19
// English captions + keyword tags are hand-reviewed and approved: content/captions.md is the source of truth, copied as-is.
fs.copyFileSync(path.join(CONTENT,'captions.md'), path.join(OUT,'captions.md'));
fs.writeFileSync(path.join(OUT,'copy-deck.md'), '# Awareness / slide copy\n\nOriginal topics 01–09, followed by new topics 10–19. Slide numbers restart within each carousel. Every final slide carries COMING SOON.\n\n'+entries.map(([key,t])=>`## ${key.slice(0,2)} / ${t.question}\n\n${t.slides.map((sl,i)=>`${i+1}. ${sl.stat ? `${sl.stat} — ${sl.label}` : sl.lines.map(plain).join(' / ')}`).join('\n')}\n\n${t.sources.length ? 'Sources: '+sourceLinks(t) : 'Basis: existing campaign, supplied brief and Creative Content Roadmap.'}\n`).join('\n'));
fs.copyFileSync(path.join(CONTENT,'sources.md'), path.join(OUT,'sources.md'));
fs.copyFileSync(path.join(CONTENT,'topic-review.md'), path.join(OUT,'topic-review.md'));
fs.writeFileSync(path.join(OUT,'README.md'), `# Awareness carousels / Maker Faire Kochi

**${T} topics × 5 styles = ${T*5} carousel treatments**, each in post (1080×1350) and story (1080×1920) format. ${total*10} PNG slides and ${T*10} carousel strips.

[Open the combined gallery](index.html) · [All covers](_series-overview.jpg) · [Captions](captions.md) · [Slide copy](copy-deck.md) · [Sources](sources.md) · [Overlap review](topic-review.md)

The original topics 01–09 are preserved (the former 05, Maker Party → Maker Faire, was withdrawn). The WHAT continuation adds topics 10–19; repeated concepts are excluded or folded into related topics. Topic numbering is continuous across the folder.

| Number | Topic | Slides |
|---|---|---|
${entries.map(([key,t])=>`| ${key.slice(0,2)} | ${t.label} | ${t.slides.length} |`).join('\n')}

## Templates and design

A / Assembly builds a kit assembly in steps. B / Panorama connects slides with a continuous rule and seam gears. C / Colour blocks changes solid grounds. D / Board uses blue editorial layouts. E / Signage uses bolted plates and wayfinding arrows.

The offline [design system](${DSREL}/DESIGN.md) provides colours, local fonts, tokens, kit geometry and the official Maker Faire Kochi logos. The Construction K is not used. The event CTA remains COMING SOON. Historical/statistical years remain where relevant.

## Logo

The official Maker Faire Kochi logo (\`${DSREL}/assets/logo/official/\`) appears on every cover and sign-off. It is used as supplied: the white plate is part of the mark, and it is never recoloured, cropped or overlapped. Middle slides keep the small mono header.

| Style | Cover header | Final slide |
|---|---|---|
| A Assembly (paper) | long, 84 / 108 px tall (post / story) | long logo sign-off + COMING SOON |
| B Panorama (ink) | border | border logo sign-off + COMING SOON |
| C Colour blocks | long | square logo sign-off + COMING SOON (corner assembly omitted on that slide) |
| D Board (blue) | border | border logo sign-off + COMING SOON |
| E Signage (yellow) | border | original text tag “Maker Faire Kochi · Coming soon” |

On the cover, the logo stands alone in the header because the headline already names the topic. Use \`--no-logo\` to render without it.

## Files and rebuilding

Each topic contains its five style folders, with numbered PNGs inside post/ and story/. Whole-carousel strips sit beside these, and topic overview sheets compare the five styles. The build folder contains editable fitted HTML and the canonical topics.mjs copy.

Regenerate from the repository:

    cd workflows/awareness-carousels   # see its README for the full runbook
    MFK_OUT=<this folder> node src/build.mjs
    MFK_OUT=<this folder> node src/package.mjs

To rebuild only the addition, pass topic prefixes 10- through 19-. To rebuild one topic, for example, use node src/build.mjs 18-. Without filters the renderer rebuilds all ${T} topics. The packaging script rebuilds the gallery, the cover sheet and every topic's overview sheet.

Captions come from workflows/awareness-carousels/content/captions.md (the English source of truth). QA reports cover renders and packaging checks. These are static carousel assets.
`);

const data = entries.map(([key,t])=>({ key, ...t }));
const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Awareness / Maker Faire Kochi</title><link rel="stylesheet" href="${DSREL}/tokens/tokens.css"><style>
*{box-sizing:border-box}body{margin:0;background:var(--mf-color-paper);color:var(--mf-color-ink);font-family:var(--mf-font-body)}header,main{max-width:1440px;margin:auto;padding:40px 64px}header{border-bottom:3px solid var(--mf-color-ink)}.eyebrow,label,nav,.meta,.files{font:500 14px/1.5 var(--mf-font-label);text-transform:uppercase}h1{font:800 clamp(50px,7vw,96px)/.94 var(--mf-font-display);letter-spacing:-.03em;margin:24px 0}header p{font-size:23px;line-height:1.4;max-width:850px}a{color:var(--mf-color-blue);text-underline-offset:4px}nav{display:flex;flex-wrap:wrap;gap:20px}.controls{display:flex;flex-wrap:wrap;gap:24px;padding:28px 0;border-bottom:2px solid;align-items:end}label{display:flex;flex-direction:column;gap:8px}select,input{font:400 20px var(--mf-font-body);background:var(--mf-color-paper);color:var(--mf-color-ink);border:2px solid;padding:10px;min-height:48px;border-radius:0}input{min-width:280px}#count{font:500 14px var(--mf-font-label)}article{padding:36px 0;border-bottom:2px solid}.meta{color:var(--mf-color-blue)}h2{font:800 30px/1.1 var(--mf-font-display);margin:12px 0 20px}.strip{display:block;width:100%;height:auto;border:1px solid var(--mf-color-ink)}.caption{font-size:20px;line-height:1.4;max-width:900px}.files{display:flex;gap:20px;flex-wrap:wrap;margin:18px 0}details{margin:20px 0}summary{cursor:pointer;font:500 14px var(--mf-font-label);text-transform:uppercase}li{font-size:20px;line-height:1.5}.source{font-size:16px;line-height:1.6}.empty{padding:40px 0;font-size:23px}@media(max-width:700px){header,main{padding:28px 20px}.controls{gap:14px}h2{font-size:26px}select,input{max-width:100%}label{width:100%}.strip-link{display:block;overflow-x:auto}.strip{width:1000px;max-width:none}.caption{font-size:18px}}
</style></head><body><header><div class="eyebrow">Maker Faire Kochi / Awareness / Topics 01–${String(T).padStart(2,'0')}</div><h1>WHAT IS<br>MAKER FAIRE?</h1><p>The original nine topics, followed by ten new chapters on the movement, its global network and Kerala’s place in it.</p><nav><a href="_series-overview.jpg">All ${T} covers</a><a href="captions.md">Captions</a><a href="copy-deck.md">Slide copy</a><a href="sources.md">Sources</a><a href="README.md">Readme</a></nav></header><main><div class="controls"><label for="style">Template<select id="style">${styles.map((s,i)=>`<option value="${s}" ${i===2?'selected':''}>${names[i]}</option>`).join('')}</select></label><label for="format">Format<select id="format"><option value="post">Post / 1080 × 1350</option><option value="story">Story / 1080 × 1920</option></select></label><label for="search">Find a topic<input id="search" type="search" placeholder="Try Kerala, maker, global…"></label><p id="count" aria-live="polite"></p></div><div id="topics"></div></main><script>
const topics=${JSON.stringify(data).replaceAll('<','\\u003c')};const sources=${JSON.stringify(SOURCES)};
const $=id=>document.getElementById(id);const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function render(){const style=$('style').value,format=$('format').value,q=$('search').value.toLowerCase();const shown=topics.filter(t=>(t.key+' '+t.question+' '+t.chapter+' '+t.caption).toLowerCase().includes(q));$('count').textContent=shown.length+' / ${T} TOPICS';$('topics').innerHTML=shown.map(t=>{const base=t.key+'/'+style;return '<article id="'+t.key+'"><div class="meta">'+t.key.slice(0,2)+' / '+escape(t.chapter)+' / '+t.slides.length+' SLIDES</div><h2>'+escape(t.question)+'</h2><a class="strip-link" href="'+base+'/_strip-'+format+'.jpg"><img class="strip" loading="lazy" src="'+base+'/_strip-'+format+'.jpg" alt="'+escape(t.question)+' — complete carousel"></a><div class="files">'+t.slides.map((_,i)=>'<a href="'+base+'/'+format+'/'+String(i+1).padStart(2,'0')+'.png">Slide '+(i+1)+'</a>').join('')+'<a href="'+t.key+'/_overview-'+format+'.jpg">Compare all five styles</a></div><p class="caption">'+escape(t.caption)+'</p><details><summary>Slide copy &amp; sources</summary><ol>'+t.slides.map(sl=>'<li>'+escape(sl.stat?sl.stat+' / '+sl.label:sl.lines.join(' ').replaceAll('*','').replaceAll('~',''))+'</li>').join('')+'</ol><p class="source">'+(t.sources.length?t.sources.map(id=>'<a href="'+sources[id].url+'">'+sources[id].title+'</a>').join(' · '):'Original campaign framing / supplied brief and Creative Content Roadmap')+'</p></details></article>'}).join('')||'<p class="empty">No matching topics.</p>'}
['style','format'].forEach(id=>$(id).addEventListener('change',render));$('search').addEventListener('input',render);render();
</script></body></html>`;
fs.writeFileSync(path.join(OUT,'index.html'),page);
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify({topics:T,styles,formats:{post:[1080,1350],story:[1080,1920]},slidesPerStyle:total,pngCount:total*10,topicsData:data},null,2));

if(process.argv.includes('--docs-only')) process.exit(0);

// Verify every export directly from its PNG IHDR, without another imaging dependency.
let pngCount=0;
for(const [key,t] of entries) for(const style of styles) for(const format of ['post','story']) {
  const dir=path.join(OUT,key,style,format);
  const files=fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
  if(files.length!==t.slides.length) throw new Error('Slide count mismatch: '+dir);
  for(const file of files){const b=fs.readFileSync(path.join(dir,file));if(b.readUInt32BE(16)!==1080||b.readUInt32BE(20)!==(format==='post'?1350:1920))throw new Error('Incorrect size: '+file);pngCount++;}
}
const browser=await chromium.launch({executablePath:CHROME,args:['--force-color-profile=srgb','--disable-gpu']});
const p=await browser.newPage({viewport:{width:1600,height:1000},deviceScaleFactor:1});
const sheetHead='<link rel="stylesheet" href="'+relFrom(WORK,DS)+'/tokens/tokens.css"><style>*{box-sizing:border-box;margin:0}body{background:var(--mf-color-paper);color:var(--mf-color-ink)}h1{font:800 30px/1.1 var(--mf-font-display);padding:28px 36px}h2{font:500 18px/1.2 var(--mf-font-label);padding:18px 36px;text-transform:uppercase;border-top:2px solid}img{display:block;width:1600px}</style>';
for(const [key,t] of entries) for(const format of ['post','story']) {
  const html='<!doctype html><html><head><meta charset="utf-8">'+sheetHead+'</head><body><h1>'+esc(key.slice(0,2)+' / '+t.question)+' — '+format.toUpperCase()+'</h1>'+styles.map((style,i)=>'<h2>'+names[i]+'</h2><img src="../'+key+'/'+style+'/_strip-'+format+'.jpg">').join('')+'</body></html>';
  const file=path.join(WORK,'overview.html');fs.writeFileSync(file,html);
  await p.goto('file://'+file);await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()));});
  await p.screenshot({path:path.join(OUT,key,'_overview-'+format+'.jpg'),fullPage:true,type:'jpeg',quality:88});
  console.log('Overview '+key+' '+format);
}
const coverFile=path.join(WORK,'covers.html');
fs.writeFileSync(coverFile,'<!doctype html><html><head><meta charset="utf-8">'+sheetHead+'<style>body{padding:28px}h1{padding:8px 8px 24px}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}.grid img{width:100%}.grid p{font:500 16px/1.2 var(--mf-font-label);padding:12px 4px 20px;text-transform:uppercase}</style></head><body><h1>AWARENESS / TOPICS 01–'+String(T).padStart(2,'0')+' / MAKER FAIRE KOCHI</h1><div class="grid">'+entries.map(([key,t])=>'<div><img src="../'+key+'/C-colour-blocks/post/01.png"><p>'+esc(key.slice(0,2)+' / '+t.label)+'</p></div>').join('')+'</div></body></html>');
await p.goto('file://'+coverFile);await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()));});
await p.screenshot({path:path.join(OUT,'_series-overview.jpg'),type:'jpeg',quality:90,fullPage:true});

// Check local review interactions and local links once the artwork exists.
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto('file://'+path.join(OUT,'index.html'));
if(await p.locator('article').count()!==entries.length)throw new Error('Gallery topic count');
await p.selectOption('#style','E-signage');await p.selectOption('#format','story');
await p.fill('#search','global');
if(!(await p.locator('article').count()))throw new Error('Gallery search returned no topics');
const first=await p.locator('.strip').first().getAttribute('src');
if(!first.includes('E-signage/_strip-story.jpg'))throw new Error('Gallery selector mismatch');
await p.fill('#search','no-such-topic-zz');
if(await p.locator('article').count()!==0)throw new Error('Empty state failed');
await p.fill('#search','');await p.selectOption('#style','C-colour-blocks');await p.selectOption('#format','post');
const links=await p.locator('a').evaluateAll(as=>as.map(a=>a.getAttribute('href')).filter(x=>x&&!x.startsWith('http')));
for(const link of links)if(!fs.existsSync(path.resolve(OUT,link)))throw new Error('Broken gallery link: '+link);
await p.setViewportSize({width:390,height:844});
if(await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw new Error('Mobile page overflow');
if(errors.length)throw new Error(errors.join('\n'));
await browser.close();
fs.writeFileSync(path.join(WORK,'package-qa.json'),JSON.stringify({pngCount,dimensions:'All 1080×1350 / 1080×1920',topicOverviewSheets:T*2,regeneratedTopicOverviews:T*2,galleryChecks:T+' topics; style/format selection; search; empty state; local links; mobile width; no JS errors',issues:errors},null,2));
console.log('Package complete: '+pngCount+' PNG slides; '+T*2+' overview sheets; gallery verified.');
