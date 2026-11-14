#!/usr/bin/env python3
"""Build a complete, offline review copy. No backend, keys or personal data."""
from pathlib import Path
import re, json, base64
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
css=(root/'assets/styles.css').read_text()+'\n'+(root/'assets/content.css').read_text()
model=(root/'assets/model.mjs').read_text()
model=re.sub(r'^export\s+', '', model, flags=re.M)
app=(root/'assets/app.mjs').read_text()
imports=re.search(r"import\s*\{([^}]+)\}\s*from\s*'./model.mjs';",app).group(1)
app=re.sub(r"import\s*\{[^}]+\}\s*from\s*'./model.mjs';\n",'',app)
app=app.replace('async function ensureSession() {','async function ensureSession() {\n  throw new Error("Dit is de zelfstandige preview. Adviesaanvragen staan hier uit. Je kunt je volledige plan wel gebruiken en als PDF bewaren.");')
app=app.replace("async function track(event) {", "async function track(event) { return;")
# File URLs cannot always use localStorage. The production app already fails gracefully.
contents={}
for p in [root/'rekenmodel.html',root/'privacy.html',*sorted((root/'kennis').rglob('index.html'))]:
    path='/'+str(p.relative_to(root)).replace('index.html','')
    body=re.search(r'<main[^>]*>([\s\S]*?)</main>',p.read_text()).group(1)
    contents[path]=body
bundle='const __wattModel=(()=>{\n'+model+'\nreturn { '+imports+' };\n})();\nconst {'+imports+'}=__wattModel;\n'+app+'\n'
bundle+='''
const previewPages=PREVIEW_CONTENT;
const previewDialog=document.createElement('dialog');previewDialog.className='preview-article';
previewDialog.innerHTML='<button class="preview-back" aria-label="Sluit uitlegpagina">← Terug naar de scan</button><div class="content-layout" id="preview-article-content"></div>';
document.body.appendChild(previewDialog);
previewDialog.querySelector('.preview-back').addEventListener('click',()=>previewDialog.close());
document.addEventListener('click',event=>{
 const link=event.target.closest('a'); if(!link)return;
 const href=link.getAttribute('href')||'';const [path,anchor]=href.split('#');
 if(previewPages[path]){event.preventDefault();event.stopImmediatePropagation();document.querySelector('#preview-article-content').innerHTML=previewPages[path];if(!previewDialog.open)previewDialog.showModal();previewDialog.scrollTop=0;if(anchor)previewDialog.querySelector('#'+anchor)?.scrollIntoView();}
 else if(previewDialog.open&&href.startsWith('/')){event.preventDefault();event.stopImmediatePropagation();previewDialog.close();if(href.includes('#scan'))beginScan();else showHome();}
},true);
'''.replace('PREVIEW_CONTENT',json.dumps(contents,ensure_ascii=False))
html=html.replace('<link rel="stylesheet" href="/assets/styles.css">','<style>'+css+'</style>')
html=html.replace('<script type="module" src="/assets/app.mjs"></script>','')
for name in ['favicon.svg','energy-home.svg']:
    data=base64.b64encode((root/'assets'/name).read_bytes()).decode()
    html=html.replace('/assets/'+name,'data:image/svg+xml;base64,'+data)
extra='''<style>.preview-ribbon{padding:8px 20px;background:#123b31;color:#e2f36b;text-align:center;font-size:12px;letter-spacing:.02em}.preview-article{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;border:0;background:#f8f8f2;padding:0;overflow:auto;color:#183b32}.preview-back{position:sticky;top:14px;left:20px;margin:18px 20px 0;background:#123b31;color:white;border:0;border-radius:99px;padding:11px 20px;z-index:2}.preview-article::backdrop{background:#123b31}@media print{.preview-ribbon{display:none}}</style>'''
html=html.replace('</head>',extra+'</head>').replace('<body>','<body><div class="preview-ribbon">WERKENDE PREVIEW · je scan blijft op dit apparaat · adviesaanvragen uitgeschakeld</div>')
# Escape only HTML script end markers, retaining JavaScript syntax.
bundle=bundle.replace('</script','<\\/script')
html=html.replace('</body>','<script type="module" id="preview-app">'+bundle+'</script></body>')
target=root/'preview/wattgoedkoper-preview.html';target.parent.mkdir(exist_ok=True);target.write_text("\n".join(line.rstrip() for line in html.splitlines())+"\n")
print(f'Created {target} ({target.stat().st_size:,} bytes)')
