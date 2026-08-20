import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const VERSION = '9.13.0';
const BUILD_DATE = '20260821';
const SELF = 'apply-v913-team-permissions-unify.mjs';
const MARK = 'RUBJAI_V913_TEAM_PERMISSIONS_UNIFY_20260821';

const indexFile = path.join(root, 'index.html');
const packageFile = path.join(root, 'package.json');
const assetsDir = path.join(root, 'assets');
const cssFile = path.join(assetsDir, 'team-permissions-unify-v913.css');
const jsFile = path.join(assetsDir, 'team-permissions-unify-v913.js');

if (!fs.existsSync(indexFile)) throw new Error('v9.13 missing index.html');
if (!fs.existsSync(assetsDir)) throw new Error('v9.13 missing assets directory');

const css = `/* ${MARK} */
html.v913-team-permissions body { --v913-gap: 18px; }
html.v913-team-permissions .v913-team-page,
html.v913-team-permissions .v913-team-shell,
html.v913-team-permissions .v913-team-width-parent,
html.v913-team-permissions .v913-section-card {
  max-width: none !important;
  width: 100% !important;
}
html.v913-team-permissions .v913-team-page {
  display: block !important;
}
html.v913-team-permissions .v913-team-jump {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 0 0 14px 0;
}
html.v913-team-permissions .v913-team-jump a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid rgba(17,22,46,.14);
  background: #fff;
  color: #11162E;
  font-weight: 700;
  text-decoration: none;
}
html.v913-team-permissions .v913-team-jump a.is-active {
  background: #11162E;
  color: #fff;
  border-color: #11162E;
}
html.v913-team-permissions .v913-section-card {
  border-radius: 20px !important;
  border: 1px solid rgba(17,22,46,.08) !important;
  box-shadow: 0 1px 2px rgba(17,22,46,.04) !important;
}
html.v913-team-permissions .v913-section-card + .v913-section-card {
  margin-top: 22px !important;
}
html.v913-team-permissions .v913-section-label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px 0;
}
html.v913-team-permissions .v913-section-label .badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  border-radius: 999px;
  background: #11162E;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}
html.v913-team-permissions .v913-section-label h3 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  color: #11162E;
}
html.v913-team-permissions .v913-section-note {
  margin: 4px 0 0 42px;
  color: #6B7280;
  font-size: 13px;
}
html.v913-team-permissions .v913-hide-permission-nav {
  display: none !important;
}
html.v913-team-permissions .v913-permission-shell .v909-permission-shell,
html.v913-team-permissions .v913-permission-shell .v908-permission-card {
  max-width: none !important;
  width: 100% !important;
}
html.v913-team-permissions .v913-focus-flash {
  animation: v913focusflash 1.4s ease;
}
@keyframes v913focusflash {
  0% { box-shadow: 0 0 0 0 rgba(17,22,46,.18); }
  20% { box-shadow: 0 0 0 10px rgba(17,22,46,.12); }
  100% { box-shadow: 0 0 0 0 rgba(17,22,46,0); }
}
@media (max-width: 980px) {
  html.v913-team-permissions .v913-team-jump {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  html.v913-team-permissions .v913-section-label h3 {
    font-size: 20px;
  }
}
`;

const js = `/* ${MARK} */
(() => {
  'use strict';
  const VERSION = '${VERSION}';
  const root = document.documentElement;
  let observer = null;
  let timer = 0;
  let scheduled = false;
  let lastHref = location.href;
  let redirected = false;

  const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
  const low = s => clean(s).toLowerCase();
  const hasText = (el, rx) => !!el && rx.test(clean(el.textContent));

  function getRoute() {
    try {
      const u = new URL(location.href);
      return {
        page: u.searchParams.get('page') || '',
        biz: u.searchParams.get('biz') || '',
        focus: u.searchParams.get('focus') || '',
        url: u,
      };
    } catch {
      return { page: '', biz: '', focus: '', url: null };
    }
  }
  function isTeamRoute(){ const r = getRoute(); return r.page === 'business' && r.biz === 'team'; }
  function isPermRoute(){ const r = getRoute(); return r.page === 'business' && r.biz === 'permissions'; }
  function isBusinessRoute(){ const r = getRoute(); return r.page === 'business' && (r.biz === 'team' || r.biz === 'permissions'); }

  function teamUrl(withFocus = false){
    const r = getRoute();
    const u = r.url ? new URL(r.url.toString()) : new URL(location.href);
    u.searchParams.set('page', 'business');
    u.searchParams.set('biz', 'team');
    if (withFocus) u.searchParams.set('focus', 'permissions');
    else u.searchParams.delete('focus');
    return u.toString();
  }

  function visible(el){
    if(!el || el.hidden || el.getAttribute('aria-hidden') === 'true') return false;
    const cs = getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden';
  }

  function replaceExactText(rootEl, from, to){
    if(!rootEl) return;
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    let n;
    while((n = walker.nextNode())){
      const txt = clean(n.nodeValue);
      if(txt === from){ n.nodeValue = n.nodeValue.replace(from, to); return; }
    }
  }

  function findNavItems(){
    return [...document.querySelectorAll('a,button,[role="button"]')].filter(el => visible(el));
  }

  function unifySidebarNav(){
    findNavItems().forEach(el => {
      const t = clean(el.textContent);
      const href = String(el.getAttribute('href') || '');
      if (t === 'ข้อมูลพนักงาน') {
        el.classList.add('v913-team-nav');
        replaceExactText(el, 'ข้อมูลพนักงาน', 'ทีมและสิทธิ์');
        if (href.includes('biz=team')) el.setAttribute('href', teamUrl(false));
      }
      if (t === 'สิทธิ์การใช้งาน' || href.includes('biz=permissions')) {
        el.classList.add('v913-hide-permission-nav');
        el.setAttribute('aria-hidden', 'true');
        if (href.includes('biz=permissions')) el.setAttribute('href', teamUrl(true));
      }
    });
  }

  function interceptPermissionClicks(){
    if (document.documentElement.dataset.v913InterceptBound === '1') return;
    document.documentElement.dataset.v913InterceptBound = '1';
    document.addEventListener('click', ev => {
      const el = ev.target?.closest?.('a,button,[role="button"]');
      if(!el) return;
      const t = clean(el.textContent);
      const href = String(el.getAttribute?.('href') || '');
      if (t === 'สิทธิ์การใช้งาน' || href.includes('biz=permissions')) {
        ev.preventDefault();
        ev.stopPropagation();
        location.assign(teamUrl(true));
      }
    }, true);
  }

  function findShellByMarker(matchers){
    const candidates = [...document.querySelectorAll('div,section,article,form')].filter(visible);
    const marker = candidates.find(el => matchers.some(rx => rx.test(clean(el.textContent))));
    if(!marker) return null;
    let best = marker;
    let cur = marker;
    for(let i=0; cur && i<8; i++, cur=cur.parentElement){
      const txt = clean(cur.textContent);
      if (txt.length > 120 && matchers.some(rx => rx.test(txt))) best = cur;
      if (cur.id && /^page-/.test(cur.id)) break;
    }
    return best;
  }

  function closestPageRoot(el){
    return el?.closest?.('[id^="page-"], main, .page, [data-page-root]') || null;
  }

  function markWidthParents(el, stopAt){
    let p = el?.parentElement || null;
    while(p && p !== stopAt && p !== document.body && p !== document.documentElement){
      p.classList.add('v913-team-width-parent');
      p = p.parentElement;
    }
  }

  function injectSectionHeader(shell, id, n, title, note){
    if(!shell) return;
    if (shell.querySelector(':scope > .v913-section-label')) return;
    const label = document.createElement('div');
    label.className = 'v913-section-label';
    label.innerHTML = '<span class="badge">' + n + '</span><h3>' + title + '</h3>';
    const noteEl = document.createElement('div');
    noteEl.className = 'v913-section-note';
    noteEl.textContent = note;
    const anchor = document.createElement('div');
    anchor.id = id;
    shell.prepend(noteEl);
    shell.prepend(label);
    shell.prepend(anchor);
  }

  function ensureJumpNav(container){
    if(!container || container.querySelector(':scope > .v913-team-jump')) return;
    const nav = document.createElement('div');
    nav.className = 'v913-team-jump';
    nav.innerHTML = [
      '<a href="#employeeInfoSection" data-target="employee">ข้อมูลพนักงาน</a>',
      '<a href="#permissionSection" data-target="permission">สิทธิ์การใช้งาน</a>'
    ].join('');
    nav.addEventListener('click', ev => {
      const a = ev.target.closest('a[data-target]');
      if(!a) return;
      ev.preventDefault();
      const target = document.getElementById(a.dataset.target === 'permission' ? 'permissionSection' : 'employeeInfoSection');
      if(target){
        target.scrollIntoView({behavior:'smooth', block:'start'});
        const card = target.parentElement;
        card?.classList.add('v913-focus-flash');
        setTimeout(() => card?.classList.remove('v913-focus-flash'), 1500);
      }
      nav.querySelectorAll('a').forEach(x => x.classList.toggle('is-active', x === a));
    });
    container.prepend(nav);
  }

  function mergeTeamPage(){
    if(!isTeamRoute()) return false;
    root.classList.add('v913-team-permissions');

    const employeeShell = findShellByMarker([/ส่งคำเชิญลงทะเบียนในกลุ่ม/, /กำลังอ่าน LINE/, /สมาชิกที่เพิ่ม/, /พร้อมรับเงิน/, /ข้อมูลบัญชีไม่ครบ/, /พร้อมรับเงิน/]);
    const permissionShell = findShellByMarker([/เพิ่มสิทธิ์ให้พนักงาน/, /เลือกหน้าที่/, /เลือกคนจาก LINE/, /สมาชิกที่มีสิทธิ์แล้ว/]);
    if(!employeeShell || !permissionShell) return false;

    employeeShell.classList.add('v913-section-card', 'v913-employee-shell');
    permissionShell.classList.add('v913-section-card', 'v913-permission-shell');

    const page = closestPageRoot(employeeShell) || closestPageRoot(permissionShell) || employeeShell.parentElement;
    if (page) page.classList.add('v913-team-page', 'v913-team-shell');
    markWidthParents(employeeShell, page);
    markWidthParents(permissionShell, page);

    // Keep employee section first, permissions second.
    if (employeeShell.nextElementSibling !== permissionShell && employeeShell.compareDocumentPosition(permissionShell) & Node.DOCUMENT_POSITION_PRECEDING) {
      employeeShell.parentElement?.insertBefore(permissionShell, employeeShell.nextSibling);
    }

    injectSectionHeader(employeeShell, 'employeeInfoSection', '1', 'ข้อมูลพนักงาน', 'จัดการสมาชิก LINE, สถานะพร้อมรับเงิน และข้อมูลบัญชี ในหน้ารวมเดียว');
    injectSectionHeader(permissionShell, 'permissionSection', '2', 'สิทธิ์การใช้งาน', 'กำหนดบทบาทผู้อนุมัติ / บัญชี / ดูอย่างเดียว ภายในหน้าเดียวกับข้อมูลพนักงาน');

    const firstTitle = [...document.querySelectorAll('h1,h2,h3')].find(el => visible(el) && /ทีมและสิทธิ์|เพิ่มสิทธิ์ให้พนักงาน|ข้อมูลพนักงาน/.test(clean(el.textContent)));
    const anchorPoint = firstTitle?.closest?.('section,article,div') || employeeShell;
    ensureJumpNav(anchorPoint);

    // Normalize page heading wording.
    [...document.querySelectorAll('h1,h2,h3')].forEach(el => {
      if (visible(el) && clean(el.textContent) === 'เพิ่มสิทธิ์ให้พนักงาน') el.textContent = 'ทีมและสิทธิ์';
    });

    if (getRoute().focus === 'permissions') {
      const target = document.getElementById('permissionSection');
      if (target && !target.dataset.v913Focused) {
        target.dataset.v913Focused = '1';
        setTimeout(() => {
          target.scrollIntoView({behavior:'smooth', block:'start'});
          target.parentElement?.classList.add('v913-focus-flash');
          setTimeout(() => target.parentElement?.classList.remove('v913-focus-flash'), 1500);
          const nav = anchorPoint.querySelector('.v913-team-jump');
          nav?.querySelectorAll('a').forEach(a => a.classList.toggle('is-active', a.dataset.target === 'permission'));
        }, 120);
      }
    }
    return true;
  }

  function routeEffects(){
    unifySidebarNav();
    interceptPermissionClicks();
    if (isPermRoute()) {
      if (!redirected) {
        redirected = true;
        location.replace(teamUrl(true));
      }
      return;
    }
    if (isTeamRoute()) mergeTeamPage();
    else root.classList.remove('v913-team-permissions');
  }

  function schedule(delay = 60){
    if (!isBusinessRoute()) return;
    if (scheduled) return;
    scheduled = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      scheduled = false;
      routeEffects();
    }, delay);
  }

  function attach(){
    observer?.disconnect();
    observer = null;
    routeEffects();
    if (!isBusinessRoute()) return;
    observer = new MutationObserver(() => schedule(80));
    observer.observe(document.body, { childList: true, subtree: true });
  }

  addEventListener('popstate', () => setTimeout(() => {
    if (location.href !== lastHref) { lastHref = location.href; redirected = false; attach(); }
  }, 0));
  document.addEventListener('click', () => setTimeout(() => {
    if (location.href !== lastHref) { lastHref = location.href; redirected = false; attach(); }
  }, 0), true);
  setInterval(() => {
    if (location.href !== lastHref) { lastHref = location.href; redirected = false; attach(); }
  }, 500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach, { once: true });
  else attach();
  window.__RUBJAI_DASHBOARD_VERSION__ = VERSION;
  console.info('${MARK}', VERSION);
})();
`;

fs.writeFileSync(cssFile, css, 'utf8');
fs.writeFileSync(jsFile, js, 'utf8');

let html = fs.readFileSync(indexFile, 'utf8');

if (!html.includes('./assets/team-permissions-unify-v913.css')) {
  html = html.replace(/<link[^>]+href=["']\.\/assets\/reconciliation-operator-v910\.css[^>]*>\s*/i, m => m + `\n<link rel="stylesheet" href="./assets/team-permissions-unify-v913.css?v=${VERSION}.${BUILD_DATE}">\n`);
  if (!html.includes('./assets/team-permissions-unify-v913.css')) {
    html = html.replace(/<\/head>/i, `  <link rel="stylesheet" href="./assets/team-permissions-unify-v913.css?v=${VERSION}.${BUILD_DATE}">\n</head>`);
  }
}
if (!html.includes('./assets/team-permissions-unify-v913.js')) {
  html = html.replace(/<script[^>]+src=["']\.\/assets\/reconciliation-operator-v910\.js[^>]*><\/script>\s*/i, m => m + `\n<script src="./assets/team-permissions-unify-v913.js?v=${VERSION}.${BUILD_DATE}"></script>\n`);
  if (!html.includes('./assets/team-permissions-unify-v913.js')) {
    html = html.replace(/<\/body>/i, `  <script src="./assets/team-permissions-unify-v913.js?v=${VERSION}.${BUILD_DATE}"></script>\n</body>`);
  }
}
html = html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i, `$1Dashboard v${VERSION}`);
for (const asset of [
  'team-permissions-unify-v913.css',
  'team-permissions-unify-v913.js',
]) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(\\./assets/${escaped})(?:\\?v=[^"'<>]+)?`, 'g');
  html = html.replace(re, `$1?v=${VERSION}.${BUILD_DATE}`);
}
fs.writeFileSync(indexFile, html, 'utf8');

if (fs.existsSync(packageFile)) {
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  pkg.version = VERSION;
  const deploy = String(pkg?.scripts?.deploy || '');
  if (deploy && !deploy.includes(SELF)) {
    const idx = deploy.lastIndexOf('wrangler deploy');
    const hook = `node ${SELF}`;
    if (idx >= 0) {
      const left = deploy.slice(0, idx).replace(/\s*&&\s*$/, '').trimEnd();
      pkg.scripts.deploy = `${left} && ${hook} && ${deploy.slice(idx)}`;
    } else {
      pkg.scripts.deploy = `${deploy} && ${hook}`;
    }
  }
  fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

const checks = {
  cssCreated: fs.existsSync(cssFile),
  jsCreated: fs.existsSync(jsFile),
  cssLinked: fs.readFileSync(indexFile, 'utf8').includes(`./assets/team-permissions-unify-v913.css?v=${VERSION}.${BUILD_DATE}`),
  jsLinked: fs.readFileSync(indexFile, 'utf8').includes(`./assets/team-permissions-unify-v913.js?v=${VERSION}.${BUILD_DATE}`),
  pkgVersion: JSON.parse(fs.readFileSync(packageFile, 'utf8')).version === VERSION,
  pkgHook: JSON.parse(fs.readFileSync(packageFile, 'utf8')).scripts.deploy.includes(SELF),
};
const failed = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
if (failed.length) throw new Error('v9.13 audit failed: ' + failed.join(', '));
fs.writeFileSync(path.join(root, 'AUDIT_V913.json'), JSON.stringify({ version: VERSION, mark: MARK, checks }, null, 2) + '\n', 'utf8');

console.log(`✅ Dashboard v${VERSION}`);
console.log('✅ Team + permissions are unified into one combined feature');
console.log('✅ Sidebar hides duplicate permissions entry and renames employee data to ทีมและสิทธิ์');
console.log('✅ Visiting biz=permissions redirects into biz=team with permissions section focus');
console.log('✅ Employee info and permissions sections are full-width and stacked in one workspace flow');
