import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const VERSION = "9.08.0";
const BUILD_DATE = "20260820";
const SELF = "apply-v908-brand-composition-line-guard.mjs";
const MARK = "RUBJAI_V908_BRAND_COMPOSITION_LINE_GUARD_20260820";

const indexFile = path.join(root, "index.html");
const packageFile = path.join(root, "package.json");
const assetsDir = path.join(root, "assets");
const cssFile = path.join(assetsDir, "brand-composition-v908.css");
const jsFile = path.join(assetsDir, "brand-composition-v908.js");

if (!fs.existsSync(indexFile)) throw new Error("v9.08 missing index.html");
fs.mkdirSync(assetsDir, { recursive: true });

const BRAND = {
  primary: "#11162E",
  hover: "#20294F",
  deep: "#080B1A",
  soft: "#F0F2F8",
  line: "#D9DEEA",
  bg: "#F8F9FC",
  ink: "#11162E",
  text: "#39405A",
  muted: "#667085",
};

/* --------------------------------------------------------------------------
   1) REMOVE THE GENERIC AI / INDIGO PALETTE FROM RUNTIME SOURCES
   This patch runs LAST. Earlier patchers are allowed to do their work first;
   then this pass restores the actual RUBJAI navy CI consistently.
   -------------------------------------------------------------------------- */
const colorMap = new Map([
  ["#4f46e5", BRAND.primary], ["#4338ca", BRAND.hover], ["#3730a3", BRAND.deep],
  ["#6366f1", BRAND.primary], ["#5b5fef", BRAND.primary], ["#5850ec", BRAND.primary],
  ["#5d5fef", BRAND.primary], ["#6c63ff", BRAND.primary], ["#5548e8", BRAND.primary],
  ["#7c3aed", BRAND.primary], ["#6d28d9", BRAND.primary], ["#8b5cf6", BRAND.primary],
  ["#2563eb", BRAND.primary], ["#3b82f6", BRAND.primary], ["#0071e3", BRAND.primary],
  ["#4b46c4", BRAND.primary], ["#312e81", BRAND.deep],
  ["#eef2ff", BRAND.soft], ["#ede9fe", BRAND.soft], ["#f0f7ff", BRAND.soft],
  ["#eaf1ff", BRAND.soft], ["#dbeafe", BRAND.soft], ["#c7d2fe", BRAND.line],
  ["#a5b4fc", "#B8C0D1"], ["#818cf8", BRAND.primary], ["#e0e7ff", BRAND.soft], ["#1e1b4b", BRAND.deep],
  ["#f5f3ff", BRAND.soft], ["#ddd6fe", BRAND.line], ["#c4b5fd", "#B8C0D1"], ["#a78bfa", BRAND.primary],
  ["#5b21b6", BRAND.hover], ["#4c1d95", BRAND.deep], ["#2e1065", BRAND.deep],
  ["#faf5ff", BRAND.soft], ["#f3e8ff", BRAND.soft], ["#e9d5ff", BRAND.line], ["#d8b4fe", "#B8C0D1"],
  ["#c084fc", BRAND.primary], ["#a855f7", BRAND.primary], ["#9333ea", BRAND.primary], ["#7e22ce", BRAND.hover],
  ["#6b21a8", BRAND.hover], ["#581c87", BRAND.deep], ["#3b0764", BRAND.deep],
  ["#dfe3ff", "#E1E5EF"],
]);

function scrubAiPalette(source) {
  let out = source;
  for (const [from, to] of colorMap) {
    out = out.replace(new RegExp(from.replace("#", "\\#"), "gi"), to);
  }
  // RGB / RGBA forms of the same indigo accent used by generated UI snippets.
  out = out
    .replace(/rgba?\(\s*79\s*,\s*70\s*,\s*229\s*(,\s*[^)]+)?\)/gi, m => {
      const alpha = m.match(/,\s*([\d.]+)\s*\)$/);
      return alpha ? `rgba(17,22,46,${alpha[1]})` : "rgb(17,22,46)";
    })
    .replace(/rgba?\(\s*99\s*,\s*102\s*,\s*241\s*(,\s*[^)]+)?\)/gi, m => {
      const alpha = m.match(/,\s*([\d.]+)\s*\)$/);
      return alpha ? `rgba(17,22,46,${alpha[1]})` : "rgb(17,22,46)";
    })
    .replace(/rgb\(\s*79\s+70\s+229\s*(?:\/\s*([\d.]+%?))?\s*\)/gi, (_, a) => a ? `rgb(17 22 46 / ${a})` : "rgb(17 22 46)")
    .replace(/rgb\(\s*99\s+102\s+241\s*(?:\/\s*([\d.]+%?))?\s*\)/gi, (_, a) => a ? `rgb(17 22 46 / ${a})` : "rgb(17 22 46)");
  return out;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const runtimeTextFiles = [indexFile, ...walk(assetsDir)].filter(f => /\.(?:html?|css|js|mjs)$/i.test(f));
for (const file of runtimeTextFiles) {
  const before = fs.readFileSync(file, "utf8");
  const after = scrubAiPalette(before);
  if (after !== before) fs.writeFileSync(file, after, "utf8");
}

/* --------------------------------------------------------------------------
   2) FINAL VISUAL SYSTEM + COMPOSITION OVERRIDES
   -------------------------------------------------------------------------- */
const css = `/* ${MARK} */
:root{
  --rubjai-primary:${BRAND.primary}!important;
  --rubjai-primary-hover:${BRAND.hover}!important;
  --rubjai-primary-deep:${BRAND.deep}!important;
  --rubjai-primary-soft:${BRAND.soft}!important;
  --rubjai-primary-line:${BRAND.line}!important;
  --rj-primary:${BRAND.primary}!important;
  --rj-primary-hover:${BRAND.hover}!important;
  --rj-primary-soft:${BRAND.soft}!important;
  --rj-ink:${BRAND.ink}!important;
  --rj-text:${BRAND.text}!important;
  --rj-bg:${BRAND.bg}!important;
}

html body{
  background:${BRAND.bg}!important;
  color:${BRAND.text};
}
html body :focus-visible{
  outline-color:${BRAND.primary}!important;
}
html body input[type="radio"],
html body input[type="checkbox"]{
  accent-color:${BRAND.primary}!important;
}

/* Primary actions are navy. Purple is not a brand color. */
html body .btn.primary,
html body .btn-primary,
html body button.primary,
html body .primary-btn,
html body .button-primary,
html body [data-variant="primary"],
html body [class*="cta-primary"]{
  background:${BRAND.primary}!important;
  background-image:none!important;
  border-color:${BRAND.primary}!important;
  color:#fff!important;
  box-shadow:none!important;
}
html body .btn.primary:hover,
html body .btn-primary:hover,
html body button.primary:hover,
html body .primary-btn:hover,
html body .button-primary:hover,
html body [data-variant="primary"]:hover,
html body [class*="cta-primary"]:hover{
  background:${BRAND.hover}!important;
  border-color:${BRAND.hover}!important;
}

/* Active navigation/filter states use soft navy, not bright AI indigo. */
html body .segmented .active,
html body .segment.active,
html body .tab.active,
html body .filter-tab.active,
html body .subnavlink.active,
html body [role="tab"][aria-selected="true"],
html body .acct-status-strip button.active,
html body .acct-status-strip button[aria-pressed="true"]{
  background:${BRAND.soft}!important;
  color:${BRAND.primary}!important;
  border-color:${BRAND.line}!important;
  box-shadow:none!important;
}

/* Common progress / selection accents. */
html body .progress i,
html body .progress .fill,
html body .usage-progress i,
html body .usage-progress .fill,
html body [class*="progress"] > i,
html body [class*="progress"] > .fill{
  background:${BRAND.primary}!important;
}
html body .recommended,
html body .selected-card,
html body [data-selected="true"]{
  border-color:${BRAND.line}!important;
}

/* Keep semantic statuses semantic. These are state colors, not brand accents. */
html body .status-success, html body .chip.ok, html body .badge.ok{color:#166A46!important}
html body .status-warning, html body .chip.warn, html body .badge.warn{color:#A15C08!important}
html body .status-danger, html body .chip.danger, html body .badge.danger{color:#B42318!important}

/* v9.07 mobile reimbursement inherits the real CI. */
#page-batches{
  --v907-primary:${BRAND.primary}!important;
  --v907-ink:${BRAND.ink}!important;
  --v907-text:${BRAND.text}!important;
  --v907-soft:${BRAND.soft}!important;
  --v907-line:#E4E7EC!important;
}

/* PACKAGES: no purple recommended card / CTA. */
.v908-package-page .v908-package-card-selected,
.v908-package-page .recommended,
.v908-package-page [data-recommended="true"]{
  border-color:${BRAND.primary}!important;
  box-shadow:0 0 0 1px ${BRAND.primary} inset!important;
}
.v908-package-page .v908-package-card-selected button,
.v908-package-page .recommended button,
.v908-package-page [data-recommended="true"] button{
  background:${BRAND.primary}!important;
  border-color:${BRAND.primary}!important;
  color:#fff!important;
}

/* TEAM / PERMISSIONS: keep the form inside the workspace composition instead
   of a small floating island in a huge empty desktop canvas. */
.v908-team-page .v908-permission-card{
  width:100%!important;
  max-width:1120px!important;
  margin:16px auto!important;
  box-sizing:border-box!important;
}
.v908-team-page .v908-permission-card > *{
  max-width:none!important;
}
@media (min-width:1100px){
  .v908-team-page .v908-permission-card{
    padding-left:24px!important;
    padding-right:24px!important;
  }
  .v908-team-page .v908-permission-card .role-grid,
  .v908-team-page .v908-permission-card [class*="role-grid"],
  .v908-team-page .v908-permission-card [class*="permission-role"]{
    gap:10px!important;
  }
}

/* SETTINGS / BUSINESS tabs use the same page rhythm. */
.v908-settings-page .v908-connected-services,
.v908-team-page .v908-team-directory{
  width:100%!important;
  max-width:none!important;
}

/* LINE workspace is an integrated business tab. Never allow the monitor to
   become a full-page/floating panel on top of unrelated pages. */
body #lineGroupMonitor{
  position:static!important;
  inset:auto!important;
  transform:none!important;
  width:100%!important;
  max-width:none!important;
  margin:0!important;
  z-index:auto!important;
  box-shadow:none!important;
}
body #lineGroupBusinessMount{
  width:100%!important;
  max-width:none!important;
}
body #biz-line #lineGroupBusinessMount #lineGroupMonitor{
  display:block!important;
}
body #page-batches #lineGroupMonitor,
body #page-settings #lineGroupMonitor,
body #page-overview #lineGroupMonitor{
  display:none!important;
}

/* Any legacy LINE-group modal is hidden before routing to the integrated tab. */
.v908-legacy-line-dialog,
.v908-legacy-line-backdrop{
  display:none!important;
  visibility:hidden!important;
  pointer-events:none!important;
}

/* Consistent desktop card geometry: avoid random skinny center cards. */
@media (min-width:960px){
  .v908-composition-wide{
    width:100%!important;
    max-width:1180px!important;
    margin-left:auto!important;
    margin-right:auto!important;
    box-sizing:border-box!important;
  }
}

@media (max-width:700px){
  .v908-team-page .v908-permission-card,
  .v908-composition-wide{
    max-width:none!important;
    margin-left:0!important;
    margin-right:0!important;
  }
}
`;

const js = `/* ${MARK} */
(() => {
  "use strict";
  const VERSION = "${VERSION}";
  let scheduled = false;
  let observer = null;
  let routingLine = false;

  const text = el => String(el?.textContent || "").replace(/\\s+/g, " ").trim();
  const norm = s => String(s || "").replace(/\\s+/g, " ").trim().toLowerCase();
  const isVisible = el => !!(el && (el.offsetWidth || el.offsetHeight || el.getClientRects().length));

  function pageRootFor(el){
    return el?.closest?.('[id^="page-"], main, .page, .content') || document.body;
  }

  function cardFor(el){
    if(!el) return null;
    return el.closest?.('.card, section, article, .panel, .box, form, [class*="card"], [class*="panel"]') || el.parentElement;
  }

  function findHeading(rx){
    return [...document.querySelectorAll('h1,h2,h3,h4,.page-title,.section-title')].find(h => rx.test(text(h)));
  }

  function markComposition(){
    const teamH = findHeading(/ทีมและสิทธิ์/);
    if(teamH){
      const page = pageRootFor(teamH);
      page.classList.add('v908-team-page');
      [...page.querySelectorAll('h1,h2,h3,h4')].forEach(h => {
        const t = text(h);
        if(/เพิ่ม(?:คนและกำหนดสิทธิ์|สิทธิ์ให้พนักงาน)/.test(t)){
          const c = cardFor(h);
          if(c) c.classList.add('v908-permission-card','v908-composition-wide');
        }
        if(/สมาชิกที่ทีม|สมาชิกทีม|รายชื่อ/.test(t)){
          const c = cardFor(h);
          if(c) c.classList.add('v908-team-directory');
        }
      });
    }

    const settingsH = findHeading(/ตั้งค่าการใช้งาน/);
    if(settingsH){
      const page = pageRootFor(settingsH);
      page.classList.add('v908-settings-page');
      [...page.querySelectorAll('h1,h2,h3,h4')].forEach(h => {
        if(/บริการที่ระบบกำลังใช้งาน/.test(text(h))){
          const c = cardFor(h);
          if(c) c.classList.add('v908-connected-services');
        }
      });
    }

    const packageH = findHeading(/^แพ็กเกจ$|เลือกแพ็กเกจ/);
    if(packageH){
      const page = pageRootFor(packageH);
      page.classList.add('v908-package-page');
      [...page.querySelectorAll('section,article,.card,[class*="card"]')].forEach(c => {
        const t = norm(text(c));
        if((t.includes('pro') || t.includes('แนะนำ')) && t.includes('399')) c.classList.add('v908-package-card-selected');
      });
    }
  }

  function ensureLineMonitorHome(){
    const monitor = document.getElementById('lineGroupMonitor');
    const mount = document.getElementById('lineGroupBusinessMount');
    if(monitor && mount && monitor.parentElement !== mount) mount.appendChild(monitor);
  }

  function clickEl(el){
    if(!el) return false;
    try { el.click(); return true; } catch { return false; }
  }

  function openBusinessLine(){
    if(routingLine) return;
    routingLine = true;

    // Prefer the app's own routing so state/query-string/history remain correct.
    const businessNav = document.querySelector('[data-page="business"], [data-nav="business"], a[href*="page=business"], button[data-key="business"]');
    if(businessNav && isVisible(businessNav)) clickEl(businessNav);

    const selectLine = () => {
      const lineTab = document.querySelector('[data-biz="line"], [data-business-tab="line"], a[href*="biz=line"]');
      if(lineTab) clickEl(lineTab);
      ensureLineMonitorHome();
    };
    selectLine();
    setTimeout(selectLine, 40);
    setTimeout(selectLine, 140);
    setTimeout(() => { routingLine = false; }, 260);
  }

  function legacyLineDialogCandidates(){
    const selectors = [
      'dialog', '[role="dialog"]', '.modal', '.modal-card', '.dialog', '.dialog-card',
      '.overlay', '.modal-overlay', '[class*="modal"]', '[class*="dialog"]'
    ];
    const all = [...new Set(selectors.flatMap(s => [...document.querySelectorAll(s)]))];
    return all.filter(el => {
      const t = norm(text(el));
      if(!t) return false;
      if(el.classList?.contains('v908-legacy-line-dialog') || el.classList?.contains('v908-legacy-line-backdrop') || el.closest?.('.v908-legacy-line-backdrop')) return false;
      const hasTitle = t.includes('กลุ่ม line ของ') || t.includes('line workspaces');
      const hasActions = t.includes('เชื่อมกลุ่ม line') || t.includes('อัปเดตรายชื่อ') || t.includes('กลุ่มที่เชื่อม');
      return hasTitle && hasActions;
    });
  }

  function suppressLegacyLineDialogs(){
    let found = false;
    for(const dialog of legacyLineDialogCandidates()){
      found = true;
      dialog.classList.add('v908-legacy-line-dialog');
      dialog.setAttribute('aria-hidden','true');
      // Hide a dedicated dimmer/backdrop if this modal owns one.
      const parent = dialog.parentElement;
      if(parent && parent !== document.body){
        const pt = norm(text(parent));
        if(pt.includes('กลุ่ม line ของ') && parent.children.length <= 4) parent.classList.add('v908-legacy-line-backdrop');
      }
    }
    if(found){
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
      openBusinessLine();
    }
  }

  function lineWorkspaceRow(el){
    let cur = el;
    for(let i=0; cur && i<7; i++, cur=cur.parentElement){
      const t = norm(text(cur));
      if(t.includes('line workspace') && (t.includes('รายละเอียด') || t.includes('เชื่อมต่อแล้ว'))) return cur;
    }
    return null;
  }

  function interceptLineWorkspaceClicks(){
    document.addEventListener('click', ev => {
      const target = ev.target?.closest?.('button,a,[role="button"]');
      if(!target) return;
      const tt = norm(text(target));
      const row = lineWorkspaceRow(target);

      // The settings-row Details action must open the integrated Business > LINE tab,
      // not the old isolated LINE modal.
      if(row && (tt.includes('รายละเอียด') || tt.includes('line workspace'))){
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation?.();
        openBusinessLine();
        return;
      }

      // A direct legacy "กลุ่ม LINE" management action should also use the tab.
      if((tt === 'กลุ่ม line' || tt.includes('จัดการกลุ่ม line')) && !target.matches('[data-biz="line"]')){
        ev.preventDefault();
        ev.stopPropagation();
        openBusinessLine();
      }
    }, true);
  }

  function updateVersion(){
    const badge = document.getElementById('appBuildBadge');
    if(badge){
      const b = badge.querySelector('b');
      if(b && b.textContent !== 'Dashboard v' + VERSION) b.textContent = 'Dashboard v' + VERSION;
    }
    const old = document.getElementById('batchPageVersionV907');
    if(old && old.textContent !== 'v9.08') old.textContent = 'v9.08';
    window.__RUBJAI_DASHBOARD_VERSION__ = VERSION;
    window.__RUBJAI_V908_BRAND_COMPOSITION__ = true;
  }

  function audit(){
    scheduled = false;
    markComposition();
    ensureLineMonitorHome();
    suppressLegacyLineDialogs();
    updateVersion();
  }

  function queue(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(audit);
  }

  function install(){
    interceptLineWorkspaceClicks();
    audit();
    observer = new MutationObserver(queue);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','style','open','aria-hidden']});
    [80,250,700,1500].forEach(ms => setTimeout(audit,ms));
    console.info('${MARK}', VERSION);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, {once:true});
  else install();
})();
`;

fs.writeFileSync(cssFile, css, "utf8");
fs.writeFileSync(jsFile, js, "utf8");
execFileSync(process.execPath, ["--check", jsFile], { stdio: "pipe" });

/* --------------------------------------------------------------------------
   3) LOAD LAST + CACHE BUST
   -------------------------------------------------------------------------- */
let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(/\s*<link[^>]+brand-composition-v908\.css[^>]*>\s*/gi, "\n");
html = html.replace(/\s*<script[^>]+brand-composition-v908\.js[^>]*><\/script>\s*/gi, "\n");
if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) throw new Error("v9.08 invalid index.html anchors");
html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="./assets/brand-composition-v908.css?v=${VERSION}.${BUILD_DATE}">\n</head>`);
html = html.replace(/<\/body>/i, `<script src="./assets/brand-composition-v908.js?v=${VERSION}.${BUILD_DATE}"></script>\n</body>`);

html = html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i, `$1Dashboard v${VERSION}`);

for (const asset of ["dashboard.css","brand-theme.css","batches-mobile-v907.css","dashboard.js","reimbursement-batch-lock.js","batches-mobile-v907.js"]) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\.\\/assets\\/${escaped})(?:\\?v=[^\"'<>]+)?`, "g");
  html = html.replace(re, `$1?v=${VERSION}.${BUILD_DATE}`);
}
html = scrubAiPalette(html);
fs.writeFileSync(indexFile, html, "utf8");

/* --------------------------------------------------------------------------
   4) PIN AS THE LAST DEPLOY PATCH
   -------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
   5) STATIC AUDIT — fail deployment before Wrangler if theme regresses.
   -------------------------------------------------------------------------- */
const finalHtml = fs.readFileSync(indexFile, "utf8");
const finalCss = fs.readFileSync(cssFile, "utf8");
const finalJs = fs.readFileSync(jsFile, "utf8");
const scanText = [finalHtml, ...walk(assetsDir).filter(f => /\.(?:css|js)$/i.test(f)).map(f => fs.readFileSync(f,"utf8"))].join("\n").toLowerCase();
const banned = [...colorMap.keys()].filter(c => scanText.includes(c));
const checks = {
  cssLinked: finalHtml.includes(`brand-composition-v908.css?v=${VERSION}.${BUILD_DATE}`),
  jsLinked: finalHtml.includes(`brand-composition-v908.js?v=${VERSION}.${BUILD_DATE}`),
  lastCss: finalHtml.lastIndexOf("brand-composition-v908.css") > finalHtml.lastIndexOf("batches-mobile-v907.css"),
  lastJs: finalHtml.lastIndexOf("brand-composition-v908.js") > finalHtml.lastIndexOf("batches-mobile-v907.js"),
  navyPrimary: finalCss.includes(`--rubjai-primary:${BRAND.primary}!important`),
  batchNavy: finalCss.includes(`--v907-primary:${BRAND.primary}!important`),
  lineRelocation: finalJs.includes("ensureLineMonitorHome") && finalJs.includes("lineGroupBusinessMount"),
  lineModalGuard: finalJs.includes("suppressLegacyLineDialogs") && finalJs.includes("openBusinessLine"),
  teamComposition: finalCss.includes("v908-permission-card") && finalJs.includes("v908-team-page"),
  noKnownAiHex: banned.length === 0,
};
const failed = Object.entries(checks).filter(([,ok]) => !ok).map(([k]) => k);
if (failed.length) throw new Error(`v9.08 audit failed: ${failed.join(", ")}${banned.length ? ` | colors: ${banned.join(",")}` : ""}`);

console.log("✅ Dashboard v9.08.0");
console.log("✅ RUBJAI CI restored: navy #11162E / no generic indigo-purple accent");
console.log("✅ v9.07 mobile reimbursement inherits navy CI");
console.log("✅ LINE Workspace details route into Business > กลุ่ม LINE");
console.log("✅ Legacy standalone LINE-group modal suppressed");
console.log("✅ Team/permission desktop composition widened and normalized");
console.log("✅ Static audit blocks known AI palette from shipping");
