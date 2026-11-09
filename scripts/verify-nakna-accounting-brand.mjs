import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { RELEASE, NAME, assertAccounting } from '../apply-nakna-accounting-brand.mjs';
export function verifyBrand(root) {
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  const css = fs.readFileSync(path.join(root,'assets/nakna-accounting-brand.css'),'utf8');
  const marker = JSON.parse(fs.readFileSync(path.join(root,'assets/nakna-accounting-brand.json'),'utf8'));
  assertAccounting(html);
  const head = html.slice(0,html.indexOf('</head>'));
  const checks = {
    product_title: /<title>นากนะ บัญชี/.test(html),
    root_brand: html.includes('data-nk-brand="accounting"'),
    release: html.includes(`data-nk-release="${RELEASE}"`) && marker.release === RELEASE,
    one_sidebar_brand: (html.match(/id="nkAccountingBrand"/g)||[]).length === 1,
    one_theme: (html.match(/id="nkAccountingTheme"/g)||[]).length === 1,
    theme_last: head.lastIndexOf('id="nkAccountingTheme"') > Math.max(head.lastIndexOf('<style'),...([...head.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g)].filter(m=>!m[0].includes('nkAccountingTheme')).map(m=>m.index))),
    hr_teal: /--nk-primary:\s*#04878a/i.test(css),
    hr_typography: css.includes('IBM Plex Sans Thai') && css.includes('IBM Plex Sans'),
    fonts_linked: html.includes('family=IBM+Plex+Sans+Thai'),
    hr_text_colors: css.includes('#20373e') && css.includes('#153c45'),
    semantic_colors: css.includes('#b43e40') && css.includes('#22734f') && css.includes('#91600b'),
    logo_present: fs.existsSync(path.join(root,'assets/nakna-accounting-mark.webp')),
    css_integrity: marker.theme_sha256 === crypto.createHash('sha256').update(css).digest('hex'),
    canonical_theme: css === fs.readFileSync(path.join(root, 'branding/nakna-accounting-brand.css'), 'utf8'),
    canonical_mascot: marker.mascot_sha256 === crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/nakna-accounting-mark.webp'))).digest('hex'),
    no_new_browser_script: !/src=["'][^"']*nakna-accounting[^"']*\.js/.test(html),
  };
  const failed = Object.entries(checks).filter(([,ok])=>!ok).map(([name])=>name);
  if (failed.length) throw new Error('Brand verification failed: ' + failed.join(', '));
  return checks;
}
if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const checks=verifyBrand(process.cwd()); console.log(`✓ ${NAME} — ${Object.keys(checks).length} build-time brand checks passed`);}
  catch(e){console.error('✗',e.message);process.exitCode=1;}
}
