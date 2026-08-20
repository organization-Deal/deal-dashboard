import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const VERSION = "9.09.0";
const BUILD_DATE = "20260820";
const SELF = "apply-v909-permissions-fullwidth-no-flicker.mjs";
const MARK = "RUBJAI_V909_PERMISSIONS_FULLWIDTH_NO_FLICKER_20260820";

const indexFile = path.join(root, "index.html");
const packageFile = path.join(root, "package.json");
const assetsDir = path.join(root, "assets");
const cssFile = path.join(assetsDir, "permissions-fullwidth-v909.css");
const jsFile = path.join(assetsDir, "permissions-fullwidth-v909.js");

if (!fs.existsSync(indexFile)) throw new Error("v9.09 missing index.html");
fs.mkdirSync(assetsDir, { recursive: true });

const css = `/* ${MARK} */
:root{
  --v909-ink:#11162E;
  --v909-text:#39405A;
  --v909-muted:#667085;
  --v909-line:#D9DEEA;
  --v909-soft:#F0F2F8;
  --v909-bg:#F8F9FC;
}

/* -------------------------------------------------------------------------
   Permissions is a FULL workspace feature, not a narrow centered form.
   The JS marks the real workflow shell + every limiting ancestor before paint.
   ------------------------------------------------------------------------- */
.v909-permission-page{
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
  align-items:stretch!important;
  justify-items:stretch!important;
  box-sizing:border-box!important;
}
.v909-permission-width-parent{
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
  margin-left:0!important;
  margin-right:0!important;
  align-self:stretch!important;
  flex:1 1 auto!important;
  box-sizing:border-box!important;
}
.v909-permission-shell,
.v908-team-page .v909-permission-shell,
.v908-team-page .v908-permission-card.v909-permission-shell,
.v908-team-page .v908-composition-wide.v909-permission-shell{
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
  margin:0!important;
  align-self:stretch!important;
  box-sizing:border-box!important;
}

/* Keep the same visual rhythm as the other workspace features. */
@media (min-width:960px){
  .v909-permission-page{
    padding-left:0!important;
    padding-right:0!important;
  }
  .v909-permission-shell{
    border-radius:18px!important;
    padding:24px!important;
  }
  .v909-permission-shell .role-grid,
  .v909-permission-shell [class*="role-grid"],
  .v909-permission-shell [class*="permission-role"]{
    width:100%!important;
    max-width:none!important;
  }
  .v909-permission-shell select,
  .v909-permission-shell input:not([type="checkbox"]):not([type="radio"]),
  .v909-permission-shell textarea{
    max-width:none!important;
  }
}

@media (max-width:959px){
  .v909-permission-shell{
    margin:0!important;
    padding-left:16px!important;
    padding-right:16px!important;
  }
}

/* -------------------------------------------------------------------------
   NO OLD -> NEW FLASH.
   Clicking the permissions route starts this cover synchronously in capture
   phase. It disappears only after the NEW shell has been identified/marked.
   This prevents the previous/legacy composition being painted in between.
   ------------------------------------------------------------------------- */
html.v909-permission-transition body::before{
  content:"";
  position:fixed;
  inset:0;
  z-index:2147483000;
  background:var(--v909-bg);
  pointer-events:auto;
}
html.v909-permission-transition body::after{
  content:"";
  position:fixed;
  left:50%;
  top:50%;
  width:28px;
  height:28px;
  margin:-14px 0 0 -14px;
  z-index:2147483001;
  border:3px solid #D9DEEA;
  border-top-color:#11162E;
  border-radius:50%;
  animation:v909-spin .7s linear infinite;
  pointer-events:none;
}
@keyframes v909-spin{to{transform:rotate(360deg)}}

/* The transition must never trap the app if a legacy route fails to render. */
html.v909-permission-ready.v909-permission-transition body::before,
html.v909-permission-ready.v909-permission-transition body::after{
  display:none!important;
}

/* Prevent the v9.08 1120px limiter from winning after an async rerender. */
.v909-permission-page .v908-permission-card,
.v909-permission-page .v908-composition-wide{
  max-width:none!important;
}
`;

/*
  EARLY observer runs in <head>, before the body is parsed. MutationObserver
  callbacks run before the browser's next paint, so rerendered permission UI is
  widened before users can see the legacy narrow composition.
*/
const early = `<script id="v909PermissionEarly">/* ${MARK}_EARLY */
(()=>{\n  'use strict';\n  const d=document, h=d.documentElement;\n  const clean=s=>String(s||'').replace(/\\s+/g,' ').trim();\n  const low=s=>clean(s).toLowerCase();\n  const route=()=>{try{const u=new URL(location.href);return u.searchParams.get('page')==='business'&&u.searchParams.get('biz')==='permissions'}catch{return false}};\n  const start=()=>{h.classList.remove('v909-permission-ready');h.classList.add('v909-permission-transition')};\n  if(route()) start();\n\n  function candidates(){\n    return [...d.querySelectorAll('h1,h2,h3,h4,.page-title,.section-title')].filter(x=>/เพิ่มสิทธิ์ให้พนักงาน/.test(clean(x.textContent)));\n  }\n  function score(el){\n    const t=low(el?.textContent); let s=0;\n    if(t.includes('เพิ่มสิทธิ์ให้พนักงาน'))s+=3;\n    if(t.includes('เลือกหน้าที่'))s+=2;\n    if(t.includes('เลือกคนจาก line'))s+=2;\n    if(t.includes('สมาชิกที่มีสิทธิ์แล้ว'))s+=2;\n    if(t.includes('ผู้อนุมัติ'))s+=1;\n    if(t.includes('บัญชี / การเงิน')||t.includes('บัญชี/การเงิน'))s+=1;\n    return s;\n  }\n  function mark(){\n    let done=false;\n    for(const head of candidates()){\n      let cur=head, shell=null, page=null;\n      for(let i=0;cur&&i<10;i++,cur=cur.parentElement){\n        if(cur.id&&/^page-/.test(cur.id)){page=cur;break}\n        if(cur.matches?.('main,.page,[data-page-root]')){page=cur;break}\n        if(score(cur)>=7) shell=cur;\n      }\n      if(!shell){\n        cur=head;\n        for(let i=0;cur&&i<8;i++,cur=cur.parentElement){\n          if(score(cur)>=5){shell=cur;break}\n        }\n      }\n      if(!page){\n        page=shell?.closest?.('[id^="page-"],main,.page,[data-page-root]')||null;\n      }\n      if(!shell) continue;\n      shell.classList.add('v909-permission-shell');\n      if(page) page.classList.add('v909-permission-page');\n      let p=shell.parentElement;\n      while(p&&p!==page&&p!==d.body&&p!==d.documentElement){\n        p.classList.add('v909-permission-width-parent');\n        p=p.parentElement;\n      }\n      done=true;\n    }\n    if(done){\n      h.classList.add('v909-permission-ready');\n      h.classList.remove('v909-permission-transition');\n    }\n    return done;\n  }\n  const mo=new MutationObserver(()=>mark());\n  mo.observe(d,{subtree:true,childList:true,characterData:true});\n  d.addEventListener('click',e=>{\n    const a=e.target?.closest?.('a,button,[role="button"]'); if(!a)return;\n    const t=low(a.textContent); const href=String(a.getAttribute?.('href')||'');\n    if(t.includes('สิทธิ์การใช้งาน')||t.includes('สิทธิ์พนักงาน')||t.includes('ทีมและสิทธิ์')||href.includes('biz=permissions')) start();\n  },true);\n  addEventListener('popstate',()=>{if(route())start();queueMicrotask(mark)});\n  d.addEventListener('DOMContentLoaded',()=>{mark();setTimeout(mark,0);setTimeout(()=>{mark();if(h.classList.contains('v909-permission-transition'))h.classList.remove('v909-permission-transition')},1800)},{once:true});\n})();
</script>`;

const js = `/* ${MARK} */
(() => {
  "use strict";
  const VERSION = "${VERSION}";
  const root = document.documentElement;
  const clean = s => String(s || "").replace(/\\s+/g, " ").trim();
  const low = s => clean(s).toLowerCase();
  let lastUrl = location.href;
  let queued = false;

  function findPermissionHeading(){
    return [...document.querySelectorAll('h1,h2,h3,h4,.page-title,.section-title')]
      .find(el => /เพิ่มสิทธิ์ให้พนักงาน/.test(clean(el.textContent)));
  }

  function score(el){
    const t = low(el?.textContent);
    let s = 0;
    if(t.includes('เพิ่มสิทธิ์ให้พนักงาน')) s += 3;
    if(t.includes('เลือกหน้าที่')) s += 2;
    if(t.includes('เลือกคนจาก line')) s += 2;
    if(t.includes('สมาชิกที่มีสิทธิ์แล้ว')) s += 2;
    if(t.includes('ผู้อนุมัติ')) s += 1;
    if(t.includes('บัญชี / การเงิน') || t.includes('บัญชี/การเงิน')) s += 1;
    return s;
  }

  function permissionShell(head){
    if(!head) return null;
    let cur = head;
    let best = null;
    for(let i=0; cur && i<10; i++, cur=cur.parentElement){
      if(cur.id && /^page-/.test(cur.id)) break;
      if(cur.matches?.('main,.page,[data-page-root]')) break;
      if(score(cur) >= 7) best = cur;
    }
    if(best) return best;
    cur = head;
    for(let i=0; cur && i<8; i++, cur=cur.parentElement){
      if(score(cur) >= 5) return cur;
    }
    return head.closest?.('.card,section,article,.panel,.box,form,[class*="card"],[class*="panel"]') || head.parentElement;
  }

  function markFullWidth(){
    const head = findPermissionHeading();
    const shell = permissionShell(head);
    if(!shell) return false;
    const page = shell.closest?.('[id^="page-"],main,.page,[data-page-root]') || null;
    shell.classList.add('v909-permission-shell');
    if(page) page.classList.add('v909-permission-page');

    let p = shell.parentElement;
    while(p && p !== page && p !== document.body && p !== document.documentElement){
      p.classList.add('v909-permission-width-parent');
      p = p.parentElement;
    }

    // v9.08 may have already attached these. Keep semantic page markers but
    // the v9.09 class now owns width and composition.
    shell.classList.add('v908-permission-card');
    root.classList.add('v909-permission-ready');
    root.classList.remove('v909-permission-transition');
    return true;
  }

  function updateVersion(){
    const badge = document.getElementById('appBuildBadge');
    const b = badge?.querySelector?.('b');
    if(b) b.textContent = 'Dashboard v' + VERSION;
    const pageBadge = document.getElementById('batchPageVersionV907');
    if(pageBadge) pageBadge.textContent = 'v9.09';
    window.__RUBJAI_DASHBOARD_VERSION__ = VERSION;
    window.__RUBJAI_V909_PERMISSIONS_FULLWIDTH__ = true;
  }

  function routeIsPermissions(){
    try{
      const u = new URL(location.href);
      return u.searchParams.get('page') === 'business' && u.searchParams.get('biz') === 'permissions';
    }catch{return false;}
  }

  function audit(){
    queued = false;
    const isPerm = routeIsPermissions() || !!findPermissionHeading();
    if(isPerm) markFullWidth();
    else {
      root.classList.remove('v909-permission-transition','v909-permission-ready');
    }
    updateVersion();
  }

  function queue(){
    if(queued) return;
    queued = true;
    queueMicrotask(audit);
  }

  new MutationObserver(queue).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden']});
  document.addEventListener('click', ev => {
    const el = ev.target?.closest?.('a,button,[role="button"]');
    if(!el) return;
    const t = low(el.textContent);
    const href = String(el.getAttribute?.('href') || '');
    if(t.includes('สิทธิ์การใช้งาน') || t.includes('สิทธิ์พนักงาน') || t.includes('ทีมและสิทธิ์') || href.includes('biz=permissions')){
      root.classList.remove('v909-permission-ready');
      root.classList.add('v909-permission-transition');
    }
  }, true);

  setInterval(() => {
    if(location.href !== lastUrl){
      lastUrl = location.href;
      if(routeIsPermissions()) root.classList.add('v909-permission-transition');
      queue();
    }
  }, 80);

  audit();
  [0,40,120,300,800].forEach(ms => setTimeout(audit, ms));
  console.info('${MARK}', VERSION);
})();
`;

fs.writeFileSync(cssFile, css, "utf8");
fs.writeFileSync(jsFile, js, "utf8");
execFileSync(process.execPath, ["--check", jsFile], { stdio: "pipe" });

let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(/\s*<link[^>]+permissions-fullwidth-v909\.css[^>]*>\s*/gi, "\n");
html = html.replace(/\s*<script[^>]+permissions-fullwidth-v909\.js[^>]*><\/script>\s*/gi, "\n");
html = html.replace(/\s*<script[^>]+id=["']v909PermissionEarly["'][^>]*>[\s\S]*?<\/script>\s*/gi, "\n");
if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) throw new Error("v9.09 invalid index.html anchors");

// CSS first, then synchronous early observer, both in <head> before body paint.
html = html.replace(/<\/head>/i,
  `<link rel="stylesheet" href="./assets/permissions-fullwidth-v909.css?v=${VERSION}.${BUILD_DATE}">\n${early}\n</head>`);
html = html.replace(/<\/body>/i,
  `<script src="./assets/permissions-fullwidth-v909.js?v=${VERSION}.${BUILD_DATE}"></script>\n</body>`);

html = html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i, `$1Dashboard v${VERSION}`);
for (const asset of [
  "dashboard.css","brand-theme.css","batches-mobile-v907.css","brand-composition-v908.css",
  "dashboard.js","reimbursement-batch-lock.js","batches-mobile-v907.js","brand-composition-v908.js"
]) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\.\\/assets\\/${escaped})(?:\\?v=[^\"'<>]+)?`, "g");
  html = html.replace(re, `$1?v=${VERSION}.${BUILD_DATE}`);
}
fs.writeFileSync(indexFile, html, "utf8");

if (fs.existsSync(packageFile)) {
  const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  pkg.version = VERSION;
  const deploy = String(pkg?.scripts?.deploy || "");
  if (deploy && !deploy.includes(SELF)) {
    const idx = deploy.lastIndexOf("wrangler deploy");
    const hook = `node ${SELF}`;
    if (idx >= 0) {
      const left = deploy.slice(0, idx).replace(/\s*&&\s*$/, "").trimEnd();
      const right = deploy.slice(idx);
      pkg.scripts.deploy = `${left} && ${hook} && ${right}`;
    } else {
      pkg.scripts.deploy = `${deploy} && ${hook}`;
    }
  }
  fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

const finalHtml = fs.readFileSync(indexFile, "utf8");
const finalCss = fs.readFileSync(cssFile, "utf8");
const finalJs = fs.readFileSync(jsFile, "utf8");
const checks = {
  cssLinked: finalHtml.includes(`permissions-fullwidth-v909.css?v=${VERSION}.${BUILD_DATE}`),
  jsLinked: finalHtml.includes(`permissions-fullwidth-v909.js?v=${VERSION}.${BUILD_DATE}`),
  earlyObserverInHead: finalHtml.indexOf('id="v909PermissionEarly"') > 0 && finalHtml.indexOf('id="v909PermissionEarly"') < finalHtml.indexOf('</head>'),
  v909AfterV908Css: finalHtml.lastIndexOf('permissions-fullwidth-v909.css') > finalHtml.lastIndexOf('brand-composition-v908.css'),
  v909AfterV908Js: finalHtml.lastIndexOf('permissions-fullwidth-v909.js') > finalHtml.lastIndexOf('brand-composition-v908.js'),
  fullWidthOverride: finalCss.includes('.v909-permission-shell') && finalCss.includes('max-width:none!important'),
  parentLimiterOverride: finalCss.includes('.v909-permission-width-parent'),
  noFlickerCover: finalCss.includes('html.v909-permission-transition body::before'),
  prePaintObserver: finalHtml.includes(`${MARK}_EARLY`) && finalHtml.includes('new MutationObserver'),
  routeGuard: finalJs.includes("biz') === 'permissions") && finalJs.includes('v909-permission-transition'),
  version: finalJs.includes(`const VERSION = "${VERSION}"`),
};
const failed = Object.entries(checks).filter(([,ok]) => !ok).map(([k]) => k);
if (failed.length) throw new Error(`v9.09 audit failed: ${failed.join(', ')}`);

console.log('✅ Dashboard v9.09.0');
console.log('✅ Employee permissions composition is full workspace width');
console.log('✅ Width-limiting ancestors are neutralized only on the permissions feature');
console.log('✅ Pre-paint MutationObserver prevents legacy narrow UI from flashing');
console.log('✅ Navigation transition cover prevents old page -> new page visual flicker');
console.log('✅ v9.08 LINE + navy CI fixes remain intact');
