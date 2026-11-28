// Usage: node shared/render.mjs <episode dir> <fps> [onlyTimes,comma,separated]
// Writes <episode>/frames/ (or stills/). RANGE="a-b,c-d" re-renders only those seconds. WORKERS=n sets parallel pages.
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const epDir = path.resolve(process.argv[2]);
const epUrl = '/' + path.relative(root, epDir).split(path.sep).join('/');
const fps = Number(process.argv[3] || 30);
const only = process.argv[4] ? process.argv[4].split(',').map(Number) : null;
const WORKERS = Number(process.env.WORKERS || 3);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); r.end(d); });
}).listen(0);
const url = `http://127.0.0.1:${server.address().port}${epUrl}/index.html`;

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function newPage() {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  p.on('pageerror', e => console.error('PAGE ERROR', e.message));
  p.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await p.goto(url); await p.waitForFunction(() => window.READY === true, null, { timeout: 60000 });
  await p.evaluate(() => document.fonts.ready);
  return p;
}
const dur = await (await newPage()).evaluate(() => window.DURATION);
const outDir = path.join(epDir, only ? 'stills' : 'frames'); fs.mkdirSync(outDir, { recursive: true });
const jobs = only ? only.map((t, i) => ({ t, file: `still_${String(t).replace('.', '_')}.jpg` }))
  : Array.from({ length: Math.ceil(dur * fps) }, (_, i) => ({ t: i / fps, file: `f${String(i).padStart(5, '0')}.jpg` }))
    .filter(j => !process.env.RANGE || process.env.RANGE.split(',').some(r => { const [a, b] = r.split('-').map(Number); return j.t >= a && j.t <= b; }));
let next = 0, done = 0; const t0 = Date.now();
await Promise.all(Array.from({ length: Math.min(WORKERS, jobs.length) }, async () => {
  const p = await newPage();
  while (next < jobs.length) {
    const j = jobs[next++];
    await p.evaluate(t => window.renderAt(t), j.t);
    await p.screenshot({ path: path.join(outDir, j.file), type: 'jpeg', quality: 92 });
    if (++done % 60 === 0) console.log(`${done}/${jobs.length} ${((Date.now() - t0) / done).toFixed(0)}ms/frame`);
  }
}));
console.log('done', jobs.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');
await browser.close(); server.close();
