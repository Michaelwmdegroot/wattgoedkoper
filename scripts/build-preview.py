#!/usr/bin/env python3
"""Bundle the real energy playground into one offline review file.

The source graph uses local named ES-module imports and named function/const
exports. Each module retains its scope. No runtime CDN or backend is needed.
"""

from pathlib import Path
import base64
import json
import mimetypes
import re


ROOT = Path(__file__).resolve().parents[1]
ENTRY = ROOT / 'assets/app.mjs'
TARGET = ROOT / 'preview/wattgoedkoper-preview.html'
IMPORT = re.compile(
    r'^\s*import\s*\{(?P<names>[^}]+)\}\s*from\s*'
    r'(?P<quote>[\'"])(?P<path>\.[^\'"]+)(?P=quote)\s*;?',
    re.MULTILINE,
)
DECLARED_EXPORT = re.compile(
    r'^[ \t]*export[ \t]+(?:async[ \t]+)?'
    r'(?:function|class|const|let|var)[ \t]+([A-Za-z_$][\w$]*)',
    re.MULTILINE,
)
LISTED_EXPORT = re.compile(r'^[ \t]*export\s*\{([^}]+)\}\s*;?', re.MULTILINE)


def name_pairs(specifiers):
    """Return (original, local/exported) names from a named import/export list."""
    pairs = []
    for part in specifiers.split(','):
        part = re.sub(r'/\*.*?\*/|//[^\n]*', '', part, flags=re.DOTALL).strip()
        if not part:
            continue
        match = re.fullmatch(r'([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?', part)
        if not match:
            raise ValueError(f'Unsupported named import/export: {part!r}')
        original, alias = match.groups()
        pairs.append((original, alias or original))
    return pairs


def offline_app(source):
    """Fail closed before a preview could create a server session or lead."""
    message = (
        'Dit is de zelfstandige preview. Adviesaanvragen staan hier uit. '
        'Je kunt je hele energiehuis en plan wel uitproberen en als PDF bewaren.'
    )
    source, session_count = re.subn(
        r'(async\s+function\s+ensureSession\s*\([^)]*\)\s*\{)',
        lambda match: match.group(1) + '\nthrow new Error(' + json.dumps(message, ensure_ascii=False) + ');\n',
        source, count=1,
    )
    source, tracking_count = re.subn(
        r'(async\s+function\s+track\s*\([^)]*\)\s*\{)',
        lambda match: match.group(1) + '\nreturn; // Tracking is disabled in the offline preview.\n',
        source, count=1,
    )
    if session_count != 1 or tracking_count != 1:
        raise ValueError('Offline guards could not be installed. Check ensureSession() and track() before building.')
    return source


def module_bundle(entry=ENTRY):
    """Topological local-module bundling with an isolated namespace per file."""
    modules = []
    visited, visiting = set(), set()

    def visit(path):
        path = path.resolve()
        if not path.is_relative_to(ROOT.resolve()):
            raise ValueError(f'Module is outside the project: {path}')
        if path in visited:
            return
        if path in visiting:
            raise ValueError(f'Circular module dependency: {path.relative_to(ROOT)}')
        visiting.add(path)
        source = path.read_text(encoding='utf-8')
        imports = list(IMPORT.finditer(source))
        for match in imports:
            visit((path.parent / match.group('path')).resolve())

        def inject_import(match):
            dependency = (path.parent / match.group('path')).resolve().relative_to(ROOT).as_posix()
            bindings = ', '.join(original if original == alias else f'{original}: {alias}' for original, alias in name_pairs(match.group('names')))
            return f'\nconst {{{bindings}}} = __wattModules[{json.dumps(dependency)}];\n'

        source = IMPORT.sub(inject_import, source)
        exports = [(name, name) for name in DECLARED_EXPORT.findall(source)]
        for match in LISTED_EXPORT.finditer(source):
            exports.extend(name_pairs(match.group(1)))
        source = LISTED_EXPORT.sub('', source)
        source = re.sub(
            r'(^[ \t]*)export[ \t]+(?=(?:async[ \t]+)?(?:function|class|const|let|var)\b)',
            r'\1', source, flags=re.MULTILINE,
        )
        if re.search(r'^\s*(?:import|export)\b', source, re.MULTILINE):
            raise ValueError(f'Unsupported module syntax in {path.relative_to(ROOT)}')
        if path == entry.resolve():
            source = offline_app(source)
        export_bindings = ', '.join(original if original == alias else f'{alias}: {original}' for original, alias in exports)
        module_id = json.dumps(path.relative_to(ROOT).as_posix())
        modules.append(f'__wattModules[{module_id}] = (() => {{\n{source}\nreturn {{{export_bindings}}};\n}})();\n')
        visiting.remove(path)
        visited.add(path)

    visit(entry)
    return 'const __wattModules = Object.create(null);\n' + '\n'.join(modules)


def content_pages():
    contents = {}
    paths = [ROOT/'rekenmodel.html', ROOT/'privacy.html', *sorted((ROOT/'kennis').rglob('index.html'))]
    for path in paths:
        url = '/' + path.relative_to(ROOT).as_posix().removesuffix('index.html')
        match = re.search(r'<main\b[^>]*>([\s\S]*?)</main>', path.read_text(encoding='utf-8'), re.IGNORECASE)
        if not match:
            raise ValueError(f'No main content found in {path.relative_to(ROOT)}')
        contents[url] = match.group(1)
    return contents


def article_bridge(contents):
    payload = json.dumps(contents, ensure_ascii=False).replace('<', '\\u003c')
    return r'''
(() => {
  const previewPages = PREVIEW_CONTENT;
  const article = document.createElement('dialog');
  article.className = 'preview-article';
  article.setAttribute('aria-label', 'Uitleg bij je energiehuis');
  article.innerHTML = '<button type="button" class="preview-back" aria-label="Sluit uitlegpagina">← Terug naar je energiehuis</button><div class="content-layout" id="preview-article-content"></div>';
  document.body.appendChild(article);
  article.querySelector('.preview-back').addEventListener('click', () => article.close());
  function returnHome() {
    if (article.open) article.close();
    const tool = document.getElementById('tool-dialog');
    if (tool?.open) {
      const closeButton = document.getElementById('dialog-close');
      if (closeButton) closeButton.click(); else tool.close();
    }
    const main = document.getElementById('main-content');
    main?.scrollIntoView({block:'start'});
    if (main) {
      main.setAttribute('tabindex', '-1');
      main.focus({preventScroll:true});
    }
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || link.hasAttribute('download')) return;
    let target;
    try { target = new URL(href, 'https://wattgoedkoper.nl/'); } catch { return; }
    if (target.origin !== 'https://wattgoedkoper.nl') return;
    const path = target.pathname.replace(/\/index\.html$/, '/');
    if (previewPages[path]) {
      event.preventDefault();
      event.stopImmediatePropagation();
      article.querySelector('#preview-article-content').innerHTML = previewPages[path];
      if (!article.open) article.showModal();
      article.scrollTop = 0;
      if (target.hash) {
        const id = decodeURIComponent(target.hash.slice(1));
        [...article.querySelectorAll('[id]')].find(node => node.id === id)?.scrollIntoView();
      }
    } else if (path === '/' && !href.startsWith('#')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      returnHome();
    } else if (article.open && href.startsWith('#')) {
      const id = decodeURIComponent(target.hash.slice(1));
      const section = [...article.querySelectorAll('[id]')].find(node => node.id === id);
      if (section) { event.preventDefault(); section.scrollIntoView(); }
      else { event.preventDefault(); returnHome(); }
    }
  }, true);
})();
'''.replace('PREVIEW_CONTENT', payload)


def inline_assets(html):
    """Inline local images and fonts wherever they occur in HTML, CSS or JS."""
    paths = set(re.findall(r'/assets/[A-Za-z0-9_.%/\-]+', html))
    for url in sorted(paths, key=len, reverse=True):
        path = ROOT / url.lstrip('/')
        if not path.is_file():
            raise ValueError(f'Preview asset is missing: {url}')
        if path.suffix in {'.mjs', '.js', '.css'}:
            raise ValueError(f'Unbundled runtime dependency in preview: {url}')
        mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
        data = base64.b64encode(path.read_bytes()).decode('ascii')
        html = html.replace(url, f'data:{mime};base64,{data}')
    return html


EXTRA_CSS = '''
.preview-ribbon{padding:7px 20px;background:#e8e6dc;color:#445659;text-align:center;font:500 11px/1.5 system-ui,sans-serif;letter-spacing:.025em}
.preview-ribbon strong{font-weight:700;color:#1b3340}
.preview-article{position:fixed;inset:0;width:100%;height:100%;max-width:none;max-height:none;margin:0;border:0;background:#f6f4ed;padding:0;overflow:auto;color:#1b3340}
.preview-back{position:sticky;top:14px;left:20px;margin:18px 20px 0;background:#1b3340;color:white;border:0;border-radius:99px;padding:12px 20px;font:600 14px/1.3 system-ui,sans-serif;cursor:pointer;z-index:2}
.preview-back:focus-visible{outline:3px solid #e6bf20;outline-offset:3px}
.preview-article::backdrop{background:#1b3340}
@media print{.preview-ribbon,.preview-back{display:none}}
'''


def build():
    html = (ROOT/'index.html').read_text(encoding='utf-8')
    css = '\n'.join((ROOT/'assets'/name).read_text(encoding='utf-8') for name in ['styles.css','house-scene.css','content.css'])
    style_pattern = re.compile(r'<link\b(?=[^>]*\brel=[\'"]stylesheet[\'"])(?=[^>]*\bhref=[\'"]/assets/(?:styles|house-scene|content)\.css[\'"])[^>]*>', re.IGNORECASE)
    html, count = style_pattern.subn('', html)
    if count < 1:
        raise ValueError('Could not find the playground stylesheet links.')
    app_pattern = re.compile(r'<script\b(?=[^>]*\bsrc=[\'"]/assets/app\.mjs[\'"])[^>]*>\s*</script>', re.IGNORECASE)
    html, count = app_pattern.subn('', html)
    if count != 1:
        raise ValueError('Could not find exactly one app entry script.')
    if re.search(r'<script\b[^>]*\bsrc\s*=|<link\b[^>]*\brel=[\'"]stylesheet', html, re.IGNORECASE):
        raise ValueError('An external script or stylesheet remains in the preview.')
    html = html.replace('</head>', '<style id="preview-styles">' + css + '\n' + EXTRA_CSS + '</style>\n</head>')
    ribbon = '<div class="preview-ribbon"><strong>SPEELBARE PREVIEW</strong> · je gegevens blijven op dit apparaat · adviesaanvragen uitgeschakeld</div>'
    html, count = re.subn(r'(<body\b[^>]*>)', lambda match: match.group(1) + '\n' + ribbon, html, count=1, flags=re.IGNORECASE)
    if count != 1:
        raise ValueError('Could not find the document body.')
    bundle = module_bundle() + '\n' + article_bridge(content_pages())
    # HTML parsers terminate script elements regardless of JS string context.
    bundle = re.sub(r'</script', lambda match: '<\\/' + match.group(0)[2:], bundle, flags=re.IGNORECASE)
    bundle = bundle.replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    html = html.replace('</body>', '<script type="module" id="preview-app">\n' + bundle + '\n</script>\n</body>')
    html = inline_assets(html)
    TARGET.parent.mkdir(exist_ok=True)
    TARGET.write_text('\n'.join(line.rstrip() for line in html.splitlines())+'\n', encoding='utf-8')
    print(f'Created {TARGET} ({TARGET.stat().st_size:,} bytes)')


if __name__ == '__main__':
    build()
