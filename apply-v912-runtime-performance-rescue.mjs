import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const VERSION = "9.12.0";
const BUILD_DATE = "20260820";
const SELF = "apply-v912-runtime-performance-rescue.mjs";
const MARK = "RUBJAI_V912_RUNTIME_PERFORMANCE_RESCUE_20260820";

const indexFile = path.join(root, "index.html");
const packageFile = path.join(root, "package.json");
const assetsDir = path.join(root, "assets");
const permJsFile = path.join(assetsDir, "permissions-fullwidth-v909.js");
const batchJsFile = path.join(assetsDir, "batches-mobile-v907.js");
const brandJsFile = path.join(assetsDir, "brand-composition-v908.js");
const batchLockFile = path.join(assetsDir, "reimbursement-batch-lock.js");
const reconJsFile = path.join(assetsDir, "reconciliation-operator-v910.js");

if (!fs.existsSync(indexFile)) throw new Error("v9.12 missing index.html");
if (!fs.existsSync(permJsFile)) throw new Error("v9.12 expected v9.09 permissions runtime");
if (!fs.existsSync(batchJsFile)) throw new Error("v9.12 expected v9.07 batches runtime");

/*
  Production freeze root cause:
  v9.09 observed characterData/class/style across the whole document and queued
  a microtask. Its audit then wrote appBuildBadge.textContent again, which can
  itself create another characterData mutation. In Chromium this can starve
  timers/network callbacks and leave the dashboard forever on loading skeletons.

  v9.07 had a second global characterData observer and wrote the version text on
  every audit, creating a continuous render loop. v9.06/v9.08 also did global
  work for unrelated pages.

  v9.12 makes the enhancement runtimes route-scoped, childList-only and debounced.
  It intentionally does not touch API/fetch/accounting logic.
*/

const safePermissionsJs = `/* ${MARK} — permissions */
(() => {
  "use strict";
  const VERSION = "${VERSION}";
  const root = document.documentElement;
  const clean = s => String(s || "").replace(/\\s+/g, " ").trim();
  const low = s => clean(s).toLowerCase();
  let observer = null;
  let scheduled = false;
  let timer = 0;
  let lastHref = location.href;

  function isPermissionRoute(){
    try {
      const u = new URL(location.href);
      return u.searchParams.get("page") === "business" && u.searchParams.get("biz") === "permissions";
    } catch { return false; }
  }

  function visible(el){
    if(!el || el.hidden || el.getAttribute("aria-hidden") === "true") return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  }

  function heading(){
    if(!isPermissionRoute()) return null;
    return [...document.querySelectorAll("h1,h2,h3,h4,.page-title,.section-title")]
      .find(el => visible(el) && /เพิ่มสิทธิ์ให้พนักงาน/.test(clean(el.textContent))) || null;
  }

  function score(el){
    const t = low(el?.textContent);
    let s = 0;
    if(t.includes("เพิ่มสิทธิ์ให้พนักงาน")) s += 3;
    if(t.includes("เลือกหน้าที่")) s += 2;
    if(t.includes("เลือกคนจาก line")) s += 2;
    if(t.includes("สมาชิกที่มีสิทธิ์แล้ว")) s += 2;
    if(t.includes("ผู้อนุมัติ")) s += 1;
    if(t.includes("บัญชี / การเงิน") || t.includes("บัญชี/การเงิน")) s += 1;
    return s;
  }

  function findShell(head){
    if(!head) return null;
    let cur = head, best = null;
    for(let i=0; cur && i<10; i++, cur=cur.parentElement){
      if(cur.id && /^page-/.test(cur.id)) break;
      if(cur.matches?.("main,.page,[data-page-root]")) break;
      if(score(cur) >= 7) best = cur;
    }
    if(best) return best;
    cur = head;
    for(let i=0; cur && i<8; i++, cur=cur.parentElement){
      if(score(cur) >= 5) return cur;
    }
    return head.closest?.(".card,section,article,.panel,.box,form,[class*=card],[class*=panel]") || head.parentElement;
  }

  function mark(){
    scheduled = false; timer = 0;
    if(!isPermissionRoute()){
      root.classList.remove("v909-permission-transition","v909-permission-ready");
      return false;
    }
    const head = heading();
    const shell = findShell(head);
    if(!shell) return false;
    const page = shell.closest?.('[id^="page-"],main,.page,[data-page-root]') || null;
    if(!shell.classList.contains("v909-permission-shell")) shell.classList.add("v909-permission-shell");
    if(page && !page.classList.contains("v909-permission-page")) page.classList.add("v909-permission-page");
    let p = shell.parentElement;
    while(p && p !== page && p !== document.body && p !== document.documentElement){
      if(!p.classList.contains("v909-permission-width-parent")) p.classList.add("v909-permission-width-parent");
      p = p.parentElement;
    }
    if(!shell.classList.contains("v908-permission-card")) shell.classList.add("v908-permission-card");
    root.classList.add("v909-permission-ready");
    root.classList.remove("v909-permission-transition");
    window.__RUBJAI_V912_PERMISSIONS_SAFE__ = true;
    return true;
  }

  function schedule(delay = 24){
    if(!isPermissionRoute()) return;
    if(scheduled) return;
    scheduled = true;
    clearTimeout(timer);
    timer = setTimeout(mark, delay);
  }

  function attachObserver(){
    observer?.disconnect();
    observer = null;
    if(!isPermissionRoute()) return;
    observer = new MutationObserver(() => schedule(28));
    observer.observe(document.body, {subtree:true, childList:true});
  }

  function routeChanged(){
    const active = isPermissionRoute();
    if(active){
      root.classList.add("v909-permission-transition");
      attachObserver();
      schedule(0);
      setTimeout(() => root.classList.remove("v909-permission-transition"), 1200);
    } else {
      observer?.disconnect(); observer = null;
      root.classList.remove("v909-permission-transition","v909-permission-ready");
    }
  }

  document.addEventListener("click", ev => {
    const el = ev.target?.closest?.("a,button,[role=button]");
    if(!el) return;
    const t = low(el.textContent);
    const href = String(el.getAttribute?.("href") || "");
    if(t.includes("สิทธิ์การใช้งาน") || t.includes("สิทธิ์พนักงาน") || t.includes("ทีมและสิทธิ์") || href.includes("biz=permissions")){
      root.classList.add("v909-permission-transition");
      setTimeout(() => { if(location.href !== lastHref){ lastHref = location.href; routeChanged(); } }, 0);
      setTimeout(() => root.classList.remove("v909-permission-transition"), 1200);
    }
  }, true);

  addEventListener("popstate", () => setTimeout(routeChanged, 0));
  setInterval(() => {
    if(location.href !== lastHref){ lastHref = location.href; routeChanged(); }
  }, 400);

  window.__RUBJAI_DASHBOARD_VERSION__ = VERSION;
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", routeChanged, {once:true});
  else routeChanged();
  console.info("${MARK}_PERMISSIONS", VERSION);
})();
`;

const safeBatchesJs = `/* ${MARK} — batches */
(() => {
  "use strict";
  const VERSION = "${VERSION}";
  const ROOT = "#page-batches";
  const clean = n => String(n?.textContent || "").replace(/\\s+/g," ").trim();
  let observer = null;
  let scheduled = false;
  let timer = 0;
  let lastHref = location.href;

  function isBatchRoute(){
    try { return new URL(location.href).searchParams.get("page") === "batches"; }
    catch { return false; }
  }

  function audit(){
    scheduled = false; timer = 0;
    if(!isBatchRoute()) return;
    const root = document.querySelector(ROOT);
    if(!root) return;

    const h = root.querySelector(".acct-command-head h3") || root.querySelector(".batch-topline h3");
    if(h){
      let badge = document.getElementById("batchPageVersionV907");
      if(!badge){
        badge = document.createElement("span");
        badge.id = "batchPageVersionV907";
        badge.className = "batch-page-version-v907";
        badge.setAttribute("aria-label","Dashboard version ${VERSION}");
        h.appendChild(badge);
      }
      if(badge.textContent !== "v9.12") badge.textContent = "v9.12";
    }

    root.querySelectorAll("#batchMasterBody tr").forEach(row => {
      row.querySelectorAll(".v907-mobile-duplicate-batchref").forEach(n => n.classList.remove("v907-mobile-duplicate-batchref"));
      const rowText = clean(row);
      if(!rowText) return;
      row.querySelectorAll("td:nth-child(7) span,td:nth-child(7) small,td:nth-child(7) b,td:nth-child(7) div").forEach(node => {
        if(node.childElementCount) return;
        const t = clean(node);
        if(!/^รวมใบเบิกแล้ว\\s*[·•:\\-]?/i.test(t)) return;
        const m = t.match(/(20\\d{2}-[A-Z0-9-]{4,})/i);
        if(!m) return;
        if(rowText.split(m[1]).length - 1 > 1) node.classList.add("v907-mobile-duplicate-batchref");
      });
    });

    root.querySelectorAll("#batchMasterBody tr[data-open-batch],#batchMasterBody tr[data-open-queue]")
      .forEach(row => { if(!row.classList.contains("v907-mobile-compact-row")) row.classList.add("v907-mobile-compact-row"); });
    window.__RUBJAI_V912_BATCHES_SAFE__ = true;
  }

  function schedule(delay=28){
    if(!isBatchRoute() || scheduled) return;
    scheduled = true;
    clearTimeout(timer);
    timer = setTimeout(audit, delay);
  }

  function attach(){
    observer?.disconnect(); observer = null;
    if(!isBatchRoute()) return;
    observer = new MutationObserver(() => schedule(32));
    observer.observe(document.body,{subtree:true,childList:true});
    schedule(0);
  }

  addEventListener("popstate", () => setTimeout(attach,0));
  document.addEventListener("click", () => setTimeout(() => {
    if(location.href !== lastHref){ lastHref = location.href; attach(); }
  },0), true);
  setInterval(() => {
    if(location.href !== lastHref){ lastHref = location.href; attach(); }
  },500);

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",attach,{once:true});
  else attach();
  console.info("${MARK}_BATCHES", VERSION);
})();
`;

fs.writeFileSync(permJsFile, safePermissionsJs, "utf8");
fs.writeFileSync(batchJsFile, safeBatchesJs, "utf8");
execFileSync(process.execPath, ["--check", permJsFile], {stdio:"pipe"});
execFileSync(process.execPath, ["--check", batchJsFile], {stdio:"pipe"});

/* v9.08 still needs to react to SPA DOM inserts, but never to its own class/style/text writes. */
if (fs.existsSync(brandJsFile)) {
  let s = fs.readFileSync(brandJsFile, "utf8");
  s = s.replace(
    /observer\.observe\(document\.body,\{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:\['class','style','open','aria-hidden'\]\}\);/g,
    "observer.observe(document.body,{childList:true,subtree:true});"
  );
  // v9.12 owns the visible build badge centrally; old patch versions must not fight over it.
  s = s.replace(/if\(b && b\.textContent !== 'Dashboard v' \+ VERSION\) b\.textContent = 'Dashboard v' \+ VERSION;/g, "/* v9.12 central version badge */");
  s = s.replace(/if\(old && old\.textContent !== 'v9\.08'\) old\.textContent = 'v9\.08';/g, "/* v9.12 central page badge */");
  fs.writeFileSync(brandJsFile, s, "utf8");
  execFileSync(process.execPath, ["--check", brandJsFile], {stdio:"pipe"});
}

/* v9.06 queued 3 relocation passes for every DOM insert. Limit it to the two pages that need relocation. */
if (fs.existsSync(batchLockFile)) {
  let s = fs.readFileSync(batchLockFile, "utf8");
  s = s.replace(
    /const observer = new MutationObserver\(\(\) => queue\(\)\);/g,
    `const observer = new MutationObserver(() => {\n    try {\n      const p = new URL(location.href).searchParams.get("page");\n      if (p === "batches" || p === "business") queue();\n    } catch {}\n  });`
  );
  fs.writeFileSync(batchLockFile, s, "utf8");
  execFileSync(process.execPath, ["--check", batchLockFile], {stdio:"pipe"});
}

/* v9.11 reconciliation runtime is already route-safe; only align its visible/runtime version. */
if (fs.existsSync(reconJsFile)) {
  let s = fs.readFileSync(reconJsFile, "utf8");
  s = s.replace(/const VERSION = "9\.11\.0";/g, `const VERSION = "${VERSION}";`);
  s = s.replace(/pageBadge\.textContent !== "v9\.11"/g, 'pageBadge.textContent !== "v9.12"');
  s = s.replace(/pageBadge\.textContent = "v9\.11"/g, 'pageBadge.textContent = "v9.12"');
  fs.writeFileSync(reconJsFile, s, "utf8");
  execFileSync(process.execPath, ["--check", reconJsFile], {stdio:"pipe"});
}

let html = fs.readFileSync(indexFile, "utf8");

/* Remove the v9.09 global pre-paint MutationObserver. A tiny route-only cover is enough. */
html = html.replace(/\s*<script[^>]+id=["']v909PermissionEarly["'][^>]*>[\s\S]*?<\/script>\s*/gi, "\n");
html = html.replace(/\s*<script[^>]+id=["']v912RuntimeGuard["'][^>]*>[\s\S]*?<\/script>\s*/gi, "\n");
const earlyGuard = `<script id="v912RuntimeGuard">/* ${MARK}_EARLY */
(()=>{\n  'use strict';\n  const h=document.documentElement;\n  const perm=()=>{try{const u=new URL(location.href);return u.searchParams.get('page')==='business'&&u.searchParams.get('biz')==='permissions'}catch{return false}};\n  if(perm()) h.classList.add('v909-permission-transition');\n  document.addEventListener('click',e=>{const a=e.target?.closest?.('a,button,[role="button"]');if(!a)return;const t=String(a.textContent||'').toLowerCase();const href=String(a.getAttribute?.('href')||'');if(t.includes('สิทธิ์การใช้งาน')||t.includes('สิทธิ์พนักงาน')||href.includes('biz=permissions')){h.classList.add('v909-permission-transition');setTimeout(()=>h.classList.remove('v909-permission-transition'),1200)}},true);\n  document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('#appBuildBadge b');if(b&&b.textContent!=='Dashboard v${VERSION}')b.textContent='Dashboard v${VERSION}';window.__RUBJAI_DASHBOARD_VERSION__='${VERSION}'},{once:true});\n  setTimeout(()=>{if(!perm())h.classList.remove('v909-permission-transition','v909-permission-ready')},0);\n})();
</script>`;
if (!/<\/head>/i.test(html)) throw new Error("v9.12 invalid index.html head");
html = html.replace(/<\/head>/i, `${earlyGuard}\n</head>`);

html = html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i, `$1Dashboard v${VERSION}`);
for (const asset of [
  "dashboard.css","brand-theme.css","batches-mobile-v907.css","brand-composition-v908.css","permissions-fullwidth-v909.css","reconciliation-operator-v910.css",
  "dashboard.js","reimbursement-batch-lock.js","batches-mobile-v907.js","brand-composition-v908.js","permissions-fullwidth-v909.js","reconciliation-operator-v910.js"
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
      pkg.scripts.deploy = `${left} && ${hook} && ${deploy.slice(idx)}`;
    } else pkg.scripts.deploy = `${deploy} && ${hook}`;
  }
  fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

const finalHtml = fs.readFileSync(indexFile,"utf8");
const finalPerm = fs.readFileSync(permJsFile,"utf8");
const finalBatch = fs.readFileSync(batchJsFile,"utf8");
const finalBrand = fs.existsSync(brandJsFile) ? fs.readFileSync(brandJsFile,"utf8") : "";
const finalLock = fs.existsSync(batchLockFile) ? fs.readFileSync(batchLockFile,"utf8") : "";
const checks = {
  removedOldEarlyObserver: !finalHtml.includes('id="v909PermissionEarly"'),
  safeEarlyGuard: finalHtml.includes('id="v912RuntimeGuard"'),
  permissionStrictRoute: finalPerm.includes('if(!isPermissionRoute())') && finalPerm.includes('childList:true') && !finalPerm.includes('characterData:true') && !finalPerm.includes('queueMicrotask'),
  batchStrictRoute: finalBatch.includes('if(!isBatchRoute())') && finalBatch.includes('childList:true') && !finalBatch.includes('characterData:true'),
  noUnconditionalBadgeWritePerm: !finalPerm.includes('appBuildBadge'),
  brandNoAttributeObserver: !finalBrand.includes("attributeFilter:['class','style','open','aria-hidden']"),
  brandNoVersionFight: !finalBrand.includes("b.textContent = 'Dashboard v' + VERSION"),
  v906RouteGuarded: !finalLock.includes('const observer = new MutationObserver(() => queue())'),
  reconVersionAligned: !fs.existsSync(reconJsFile) || fs.readFileSync(reconJsFile,'utf8').includes(`const VERSION = "${VERSION}";`),
  cacheBust: finalHtml.includes(`permissions-fullwidth-v909.js?v=${VERSION}.${BUILD_DATE}`),
};
const failed = Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
if(failed.length) throw new Error(`v9.12 audit failed: ${failed.join(', ')}`);
fs.writeFileSync(path.join(root,"AUDIT_V912.json"), JSON.stringify({version:VERSION,mark:MARK,checks},null,2)+"\n","utf8");

console.log(`✅ Dashboard v${VERSION}`);
console.log("✅ Removed v9.09 global characterData/class/style MutationObserver microtask loop");
console.log("✅ Removed v9.07 global characterData version repaint loop");
console.log("✅ Permissions and mobile batches observers now exist only on their exact routes");
console.log("✅ v9.08 observes DOM inserts only; it no longer reacts to its own class/style writes");
console.log("✅ v9.06 relocation work is skipped on Overview and unrelated pages");
console.log("✅ API / fetch / accounting data logic untouched");
