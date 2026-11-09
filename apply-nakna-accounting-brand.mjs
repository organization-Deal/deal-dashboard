import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const RELEASE = 'NAKNA-ACCOUNTING-BRAND-1.1.0';
export const NAME = 'นากนะ บัญชี';
export const TAGLINE = 'รับจ่ายและเบิกจ่าย เป็นระบบ';
const LEGACY_NAMES = ['รับจ่ายแบบไม่จำกัด', 'รับจ่ายแบบไม่ จำกัด', 'รับจ่ายไม่จำกัด', 'รับจ่ายได้หมด', 'DEALPAY', 'DEAL PAY', 'RUBJAI'];
const FONT_URL = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap';
const HASH = s => crypto.createHash('sha256').update(s).digest('hex');
const escRE = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

// Small source locator, not a browser DOM patch. Script/style bodies are masked before scanning.
function maskedHTML(html) {
  return html.replace(/<!--[^]*?-->|<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi, s => ' '.repeat(s.length));
}
function elements(html) {
  const nodes = [], stack = [], masked = maskedHTML(html);
  const voids = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
  const tags = /<\/?([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
  for (const m of masked.matchAll(tags)) {
    const raw = m[0], tag = m[1].toLowerCase();
    if (raw[1] === '/') {
      let i = stack.length - 1;
      while (i >= 0 && stack[i].tag !== tag) i--;
      if (i >= 0) { const n = stack[i]; n.closeStart = m.index; n.end = m.index + raw.length; stack.length = i; }
    } else {
      const n = { tag, raw, start: m.index, openEnd: m.index + raw.length, end: m.index + raw.length };
      nodes.push(n);
      if (!voids.has(tag) && !/\/\s*>$/.test(raw)) stack.push(n);
    }
  }
  return nodes;
}
function hasClass(raw, name) {
  const c = raw.match(/\bclass\s*=\s*(["'])(.*?)\1/i)?.[2] || '';
  return c.split(/\s+/).includes(name);
}
function lockup(mobile = false) {
  return `<div id="${mobile ? 'nkAccountingMobileBrand' : 'nkAccountingBrand'}" class="nk-accounting-brand${mobile ? ' nk-accounting-mobile-brand' : ''}" aria-label="${NAME}"><img src="./assets/nakna-accounting-mark.webp" width="38" height="38" alt="" decoding="async"><div class="nk-accounting-brand-copy"><strong>${NAME}</strong><small>${TAGLINE}</small></div></div>`;
}
export function assertAccounting(html) {
  if (!/<head\b/i.test(html) || !/<\/head>/i.test(html)) throw new Error('ไม่พบ <head> ที่สมบูรณ์ใน index.html');
  if (!/(?:id=["'](?:page-batches|batchMasterBody)["']|data-p=["']batches["'])/i.test(html)) {
    throw new Error('หยุด: ไฟล์นี้ไม่ใช่ deal-dashboard ที่รองรับ ห้ามใช้กับ hr-line / Nakna HR');
  }
  if (!elements(html).some(n => n.tag === 'aside' && hasClass(n.raw, 'sidebar'))) {
    throw new Error('หยุด: ไม่พบ sidebar ของระบบบัญชี จะไม่เดาโครงสร้างหรือเขียนทับไฟล์');
  }
}
export function brandHtml(html, assetHash) {
  assertAccounting(html);
  let out = html;
  out = out.replace(/<html\b([^>]*)>/i, (_, attrs) => `<html${attrs.replace(/\sdata-nk-(?:brand|release)\s*=\s*(["'])[^]*?\1/gi, '')} data-nk-brand="accounting" data-nk-release="${RELEASE}">`);
  out = out.replace(/<title\b[^>]*>[^]*?<\/title>/i, `<title>${NAME} · รับจ่ายและเบิกจ่าย</title>`);
  if (!/<title\b/i.test(out)) out = out.replace(/<\/head>/i, `<title>${NAME}</title>\n</head>`);

  // Replace an OLD STATIC product brand only. Never change tenant/workspace elements.
  let nodes = elements(out);
  let aside = nodes.find(n => n.tag === 'aside' && hasClass(n.raw, 'sidebar'));
  if (!/id=["']nkAccountingBrand["']/.test(out)) {
    const legacy = nodes.find(n => n.tag === 'div' && hasClass(n.raw, 'brand') && n.start > aside.openEnd && n.end < aside.end && (() => {
      const chunk = out.slice(n.openEnd, n.closeStart);
      const h = chunk.match(/<h[1-4][^>]*>([^<]*)<\/h[1-4]>/i)?.[1];
      return LEGACY_NAMES.includes(clean(h)) && !/<(?:button|input|select)\b|\b(?:id|data-tenant)\s*=/i.test(chunk);
    })());
    if (legacy) out = out.slice(0, legacy.start) + lockup() + out.slice(legacy.end);
    else out = out.slice(0, aside.openEnd) + '\n' + lockup() + out.slice(aside.openEnd);
  }
  if (!/id=["']nkAccountingMobileBrand["']/.test(out)) {
    const main = elements(out).find(n => n.tag === 'main' || (n.tag === 'div' && hasClass(n.raw, 'main')));
    if (main) out = out.slice(0, main.openEnd) + '\n' + lockup(true) + out.slice(main.openEnd);
  }
  // Visible, exact product-only text. Legal names, business names, code, IDs and URLs remain unchanged.
  const protectedChunks = [];
  out = out.replace(/<(script|style)\b[^>]*>[^]*?<\/\1\s*>/gi, s => {protectedChunks.push(s);return `<!--NK_PROTECTED_${protectedChunks.length - 1}-->`;});
  out = out.replace(/>([^<>]+)</g, (all, text) => {
    const t = clean(text);
    if (LEGACY_NAMES.includes(t)) return '>' + text.replace(t, NAME) + '<';
    if (/^financial workspace$/i.test(t)) return '>' + text.replace(t, 'NAKNA ACCOUNTING') + '<';
    return all;
  });
  out = out.replace(/<!--NK_PROTECTED_(\d+)-->/g, (_, n) => protectedChunks[Number(n)]);
  out = out.replace(/<meta\b[^>]*\bname\s*=\s*["'](?:theme-color|application-name|apple-mobile-web-app-title)["'][^>]*>\s*/gi, '');
  out = out.replace(/<!-- NAKNA_ACCOUNTING_BRAND:START -->[^]*?<!-- NAKNA_ACCOUNTING_BRAND:END -->\s*/g, '');
  const block = `<!-- NAKNA_ACCOUNTING_BRAND:START -->
<meta name="application-name" content="${NAME}">
<meta name="apple-mobile-web-app-title" content="${NAME}">
<meta name="theme-color" content="#04878a">
<link rel="icon" type="image/webp" href="./assets/nakna-accounting-mark.webp">
<link id="nkAccountingFont" rel="stylesheet" href="${FONT_URL.replace(/&/g, '&amp;')}">
<link id="nkAccountingTheme" rel="stylesheet" href="./assets/nakna-accounting-brand.css?v=${assetHash}">
<!-- NAKNA_ACCOUNTING_BRAND:END -->`;
  // Avoid a second blocking Google Fonts stylesheet; display=swap remains enabled.
  out = out.replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com\/[^"']*["'][^>]*>\s*/gi, '');
  // Always last: previous build scripts may append their legacy CSS again on every deploy.
  out = out.replace(/\s*<\/head>/i, '\n' + block + '\n</head>');
  return out;
}
export function brandRuntimeCopy(s) {
  // Restrict edits to explicit presentation assignments/template text. A string that happens
  // to equal an old product name can also be a storage key or integration ID: leave it alone.
  const lhs = '(?:document\\.title|\\.textContent|\\.innerText|\\b(?:const|let|var)\\s+(?:APP_NAME|PRODUCT_NAME|BRAND_NAME|APP_TITLE|brandName|productName))';
  for (const old of LEGACY_NAMES) {
    const assignment = new RegExp(`(${lhs}\\s*=\\s*)(['"\x60])${escRE(old)}\\2`, 'g');
    s = s.replace(assignment, (_, prefix, quote) => prefix + quote + NAME + quote);
    const prop = new RegExp(`(\\b(?:appName|productName|brandName)\\s*:\\s*)(['"\x60])${escRE(old)}\\2`, 'g');
    s = s.replace(prop, (_, prefix, quote) => prefix + quote + NAME + quote);
    s = s.replace(new RegExp(`>${escRE(old)}<`, 'g'), '>' + NAME + '<');
  }
  s = s.replace(/(document\.title\s*=\s*)(['"`])Dashboard\s*[·—–-]\s*/g, '$1$2' + NAME + ' · ');
  return s;
}
export function applyBrand(root) {
  const index = path.join(root, 'index.html');
  const css = path.join(root, 'branding/nakna-accounting-brand.css');
  const logo = path.join(root, 'branding/nakna-accounting-mark.webp');
  for (const f of [index, css, logo]) if (!fs.existsSync(f)) throw new Error(`ขาดไฟล์ ${path.relative(root, f)} — วางชุดนี้ที่ root ของ deal-dashboard`);
  const source = fs.readFileSync(index, 'utf8');
  assertAccounting(source);
  const cssHash = HASH(fs.readFileSync(css)).slice(0, 12);
  // Prepare all changes first: incompatible input never produces partially rebranded HTML.
  const planned = new Map([[index, brandHtml(source, cssHash)], [path.join(root,'assets/nakna-accounting-brand.css'), fs.readFileSync(css,'utf8')]]);
  const runtimes = ['dashboard.js','contextual-help-v916.js','usage-guide.js','brand-composition-v908.js'];
  for (const f of runtimes) {
    const abs = path.join(root, 'assets', f);
    if (fs.existsSync(abs)) planned.set(abs, brandRuntimeCopy(fs.readFileSync(abs, 'utf8')));
  }
  for (const f of ['manifest.webmanifest','manifest.json']) {
    const abs = path.join(root, f);
    if (!fs.existsSync(abs)) continue;
    let data; try {data = JSON.parse(fs.readFileSync(abs, 'utf8'));} catch {throw new Error(`อ่าน ${f} ไม่ได้ — หยุดเพื่อไม่แก้ manifest ผิด`);}
    if (!data.name && !data.short_name) continue;
    data.name = NAME; data.short_name = NAME; data.theme_color = '#04878a'; data.background_color = '#f5f7f8';
    planned.set(abs, JSON.stringify(data, null, 2) + '\n');
  }
  const changes = [];
  for (const [file, after] of planned) {
    const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
    if (before === after) continue;
    fs.mkdirSync(path.dirname(file), {recursive:true});
    fs.writeFileSync(file, after, 'utf8');
    changes.push(path.relative(root, file).split(path.sep).join('/'));
  }
  const generatedLogo = path.join(root, 'assets/nakna-accounting-mark.webp');
  if (!fs.existsSync(generatedLogo) || HASH(fs.readFileSync(generatedLogo)) !== HASH(fs.readFileSync(logo))) {
    fs.copyFileSync(logo, generatedLogo); changes.push('assets/nakna-accounting-mark.webp');
  }
  const marker = { release: RELEASE, product: NAME, theme_sha256: HASH(fs.readFileSync(css)), mascot_sha256: HASH(fs.readFileSync(logo)), reference: 'Nakna HR supplied public/ui/p10.css, public/styles.css, public/ui/nakna-mark.webp', scope: 'accounting dashboard presentation; no backend, APIs, tenant data, prices, authentication or LINE OA changes' };
  fs.writeFileSync(path.join(root, 'assets/nakna-accounting-brand.json'), JSON.stringify(marker, null, 2) + '\n');
  return { release: RELEASE, changes, cssHash };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const arg = process.argv.indexOf('--root');
    const root = arg >= 0 ? path.resolve(process.argv[arg + 1] || '.') : process.cwd();
    const result = applyBrand(root);
    console.log(`✓ ${result.release} — ${NAME}`);
    console.log(`✓ ชื่อผลิตภัณฑ์ / สี / ฟอนต์ / มาสคอต — ${result.changes.length} source file(s) changed`);
    console.log('✓ No browser MutationObserver, polling, API changes or data migrations added');
  } catch (e) {console.error('✗ Nakna Accounting:', e.message);process.exitCode = 1;}
}
