"""Build styled PDFs of the Creator Pack (markdown -> HTML -> PDF via headless Chromium)."""
import markdown, pathlib, subprocess, json
here = pathlib.Path(__file__).parent
CSS = """
@page { size: A4; margin: 14mm 13mm; }
body { font-family: Inter, 'Segoe UI', Arial, sans-serif; color: #1c2233; font-size: 10.5pt; line-height: 1.45; }
.cover { background: linear-gradient(135deg,#0c1030,#2a1a4a 60%,#5a2a3a); color: #fff; border-radius: 14px; padding: 22px 26px; margin-bottom: 16px; }
.cover small { letter-spacing: 3px; color: #ffb86a; font-weight: 800; font-size: 8.5pt; }
h1 { margin: 6px 0 0; font-size: 22pt; line-height: 1.1; }
h2 { color: #2a1a4a; border-bottom: 2px solid #ffb86a; padding-bottom: 3px; margin-top: 20px; font-size: 14pt; }
table { border-collapse: collapse; width: 100%; font-size: 8.6pt; margin: 8px 0 14px; page-break-inside: auto; }
tr { page-break-inside: avoid; }
th { background: #2a1a4a; color: #fff; text-align: left; padding: 5px 6px; }
td { border-bottom: 1px solid #e3e0ec; padding: 5px 6px; vertical-align: top; }
tr:nth-child(even) td { background: #f7f5fb; }
td img { width: 230px; border-radius: 8px; display: block; }
td img[src*="world-"], td img[src*="block-"] { width: 110px; }
code { background: #f1eef8; padding: 1px 4px; border-radius: 4px; font-size: 8.4pt; }
pre { background: #0f1430; color: #e8e8ff; padding: 10px 12px; border-radius: 10px; white-space: pre-wrap; font-size: 8.6pt; }
pre code { background: none; color: inherit; }
ol li, ul li { margin: 3px 0; }
.foot { margin-top: 18px; font-size: 8pt; color: #8a8aa0; }
"""
files = sorted(here.glob('0*.md'))
pages = []
for f in files:
    md = f.read_text()
    title = md.splitlines()[0].lstrip('# ').strip()
    body = markdown.markdown('\n'.join(md.splitlines()[1:]), extensions=['tables', 'fenced_code'])
    html = f"<!doctype html><html><head><meta charset='utf-8'><base href='file://{here}/'><style>{CSS}</style></head><body><div class='cover'><small>AI STORY VIDEO · CREATOR PACK</small><h1>{title}</h1></div>{body}<div class='foot'>Creator Pack · made with free tools only · original content</div></body></html>"
    out = here / 'pdf' / (f.stem + '.html'); out.parent.mkdir(exist_ok=True); out.write_text(html)
    pages.append(str(out))
json.dump(pages, open(here / 'pdf' / 'pages.json', 'w'))
js = """
const {chromium}=require('playwright');const pages=require(process.argv[2]);
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const f of pages){await p.goto('file://'+f);await p.waitForLoadState('load');await p.pdf({path:f.replace('.html','.pdf'),format:'A4',printBackground:true,margin:{top:'14mm',bottom:'14mm',left:'13mm',right:'13mm'}});}
await b.close();})();"""
(here / 'pdf' / 'print.cjs').write_text(js)
subprocess.run(['node', str(here / 'pdf' / 'print.cjs'), str(here / 'pdf' / 'pages.json')], check=True, cwd='/home/user/meine-claude-skills/video-studio')
for f in pages: pathlib.Path(f).unlink()
(here / 'pdf' / 'pages.json').unlink(); (here / 'pdf' / 'print.cjs').unlink()
print('\n'.join(sorted(str(p.name) for p in (here / 'pdf').glob('*.pdf'))))
