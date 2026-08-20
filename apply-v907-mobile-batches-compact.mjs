import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const VERSION = "9.07.0";
const BUILD_DATE = "20260820";
const MARK = "RUBJAI_V907_MOBILE_BATCHES_COMPACT_20260820";
const SELF = "apply-v907-mobile-batches-compact.mjs";

const indexFile = path.join(root, "index.html");
const packageFile = path.join(root, "package.json");
const assetsDir = path.join(root, "assets");
const cssFile = path.join(assetsDir, "batches-mobile-v907.css");
const jsFile = path.join(assetsDir, "batches-mobile-v907.js");

if (!fs.existsSync(indexFile)) throw new Error("v9.07 missing index.html");
fs.mkdirSync(assetsDir, { recursive:true });

const css = `/* ${MARK}
   Mobile reimbursement composition
   Goals:
   - scan 5-7 requisitions per phone screen instead of 1-2
   - keep desktop table untouched
   - keep the whole row as the detail affordance
   - show only decision-making information on the list
*/

@media (max-width: 700px) {
  /* ----------------------------------------------------------
     PAGE / COMMAND AREA
     ---------------------------------------------------------- */
  #page-batches{
    --v907-line:#E4E7EC;
    --v907-ink:#101828;
    --v907-text:#344054;
    --v907-muted:#667085;
    --v907-muted2:#98A2B3;
    --v907-soft:#F2F4F7;
    --v907-primary:#4F46E5;
    --v907-warning:#B45309;
    --v907-success:#39705A;
    --v907-danger:#B42318;
  }

  #page-batches .acct-command-head,
  #page-batches .batch-topline{
    margin:0 0 9px!important;
    gap:8px!important;
  }
  #page-batches .acct-command-head{
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    align-items:center!important;
  }
  #page-batches .acct-command-head h3,
  #page-batches .batch-topline h3{
    margin:0!important;
    font-size:25px!important;
    line-height:1.08!important;
    letter-spacing:-.04em!important;
  }
  #page-batches .acct-command-head p,
  #page-batches .batch-topline>div:first-child>p,
  #page-batches .head-kicker{
    display:none!important;
  }
  #page-batches .acct-head-actions{
    display:flex!important;
    width:auto!important;
    gap:6px!important;
    justify-content:flex-end!important;
  }
  #page-batches .acct-head-actions .btn,
  #page-batches .acct-head-actions button{
    width:40px!important;
    min-width:40px!important;
    height:40px!important;
    min-height:40px!important;
    padding:0!important;
    border-radius:12px!important;
  }

  /* Automatic batch schedule: one compact utility strip. */
  #page-batches .batch-schedule-card{
    min-height:48px!important;
    padding:8px 10px!important;
    border-radius:14px!important;
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    grid-template-rows:auto auto!important;
    column-gap:8px!important;
    row-gap:1px!important;
    align-items:center!important;
    box-shadow:none!important;
  }
  #page-batches .batch-schedule-card>span{
    font-size:9.5px!important;
    line-height:1.15!important;
  }
  #page-batches .batch-schedule-card>#batchNext,
  #page-batches .batch-schedule-card>strong{
    font-size:12px!important;
    line-height:1.2!important;
  }
  #page-batches .batch-schedule-card>#batchRefresh{
    grid-column:2!important;
    grid-row:1 / 3!important;
    height:34px!important;
    min-height:34px!important;
    padding:0 11px!important;
    border-radius:10px!important;
    font-size:10px!important;
  }

  /* ----------------------------------------------------------
     STATUS FILTERS: horizontal chips, not giant KPI cards
     ---------------------------------------------------------- */
  #page-batches .acct-status-strip{
    display:flex!important;
    grid-template-columns:none!important;
    gap:6px!important;
    margin:0 -2px 9px!important;
    padding:1px 2px 3px!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    scroll-snap-type:x proximity!important;
    overscroll-behavior-x:contain!important;
    -webkit-overflow-scrolling:touch!important;
    scrollbar-width:none!important;
  }
  #page-batches .acct-status-strip::-webkit-scrollbar{display:none!important}
  #page-batches .acct-status-strip button{
    flex:0 0 auto!important;
    min-width:0!important;
    width:auto!important;
    height:38px!important;
    min-height:38px!important;
    padding:0 10px!important;
    border-radius:11px!important;
    gap:7px!important;
    display:inline-flex!important;
    flex-direction:row!important;
    justify-content:center!important;
    align-items:center!important;
    scroll-snap-align:start!important;
    white-space:nowrap!important;
    box-shadow:none!important;
  }
  #page-batches .acct-status-strip button span{
    font-size:10.5px!important;
    line-height:1!important;
  }
  #page-batches .acct-status-strip button strong{
    font-size:12px!important;
    line-height:1!important;
    min-width:auto!important;
  }

  /* ----------------------------------------------------------
     TABLE HEADER / SEARCH
     ---------------------------------------------------------- */
  #page-batches .accounting-worktable,
  #page-batches .accounting-worktable-v4{
    margin:0!important;
    border-radius:16px!important;
    overflow:visible!important;
    box-shadow:none!important;
  }
  #page-batches .worktable-head{
    padding:10px!important;
    gap:8px!important;
    display:block!important;
    border-radius:16px 16px 0 0!important;
  }
  #page-batches .worktable-head>div:first-child{
    margin:0 0 8px!important;
  }
  #page-batches .worktable-head h3{
    margin:0!important;
    font-size:15px!important;
    line-height:1.25!important;
  }
  #page-batches .worktable-head p,
  #page-batches #batchTableHint{
    display:none!important;
  }
  #page-batches .worktable-tools{
    width:100%!important;
    display:grid!important;
    grid-template-columns:minmax(0,1fr) 112px auto!important;
    gap:6px!important;
    align-items:center!important;
  }
  #page-batches .worktable-tools input,
  #page-batches .worktable-tools select,
  #page-batches .worktable-tools button{
    min-width:0!important;
    width:100%!important;
    height:40px!important;
    min-height:40px!important;
    margin:0!important;
    border-radius:11px!important;
    font-size:10.5px!important;
  }
  #page-batches .worktable-tools input{
    padding:0 11px!important;
  }
  #page-batches .worktable-tools select{
    padding:0 26px 0 10px!important;
  }
  #page-batches .worktable-tools #batchMasterRefresh{
    width:40px!important;
    min-width:40px!important;
    padding:0!important;
    font-size:0!important;
  }
  #page-batches .worktable-tools #batchMasterRefresh::before{
    content:"↻"!important;
    font-size:17px!important;
    line-height:1!important;
  }

  /* Bulk actions stay available but stop dominating the screen. */
  #page-batches .acct-bulkbar,
  #page-batches .worktable-actions{
    min-height:0!important;
    padding:7px 10px!important;
    gap:6px!important;
    flex-direction:row!important;
    align-items:center!important;
  }
  #page-batches .acct-bulkbar>div:first-child,
  #page-batches .worktable-actions .left{
    min-width:0!important;
    flex:1!important;
    gap:5px!important;
    flex-direction:row!important;
    align-items:center!important;
  }
  #page-batches .acct-bulkbar strong,
  #page-batches .acct-bulkbar span,
  #page-batches .worktable-actions .left,
  #page-batches #batchMasterSelected{
    font-size:9.5px!important;
    line-height:1.25!important;
  }
  #page-batches .acct-bulk-actions,
  #page-batches .worktable-actions .right{
    display:flex!important;
    width:auto!important;
    gap:5px!important;
    flex-wrap:nowrap!important;
    justify-content:flex-end!important;
  }
  #page-batches .acct-bulk-actions .btn,
  #page-batches .worktable-actions .right .btn{
    width:auto!important;
    min-width:0!important;
    height:32px!important;
    min-height:32px!important;
    padding:0 8px!important;
    border-radius:9px!important;
    font-size:9px!important;
  }

  /* ----------------------------------------------------------
     MASTER TABLE -> COMPACT MOBILE ROWS
     Information visible in the list:
       recipient | amount
       status    | claim date
       claim no./summary
     Everything else stays in the existing detail drawer.
     ---------------------------------------------------------- */
  #page-batches .acct-master-wrap,
  #page-batches .master-table-wrap{
    max-height:none!important;
    min-height:0!important;
    overflow:visible!important;
    padding:0!important;
    border:0!important;
  }
  #page-batches .acct-master-table,
  #page-batches .master-table{
    display:block!important;
    width:100%!important;
    min-width:0!important;
    table-layout:fixed!important;
    border-collapse:separate!important;
    border-spacing:0!important;
    background:transparent!important;
  }
  #page-batches .acct-master-table thead,
  #page-batches .master-table thead{
    display:none!important;
  }
  #page-batches .acct-master-table tbody,
  #page-batches .master-table tbody,
  #page-batches #batchMasterBody{
    display:grid!important;
    grid-template-columns:1fr!important;
    gap:7px!important;
    width:100%!important;
    padding:8px!important;
    background:#F8F9FB!important;
  }

  #page-batches #batchMasterBody>tr,
  #page-batches .acct-master-table tbody>tr,
  #page-batches .master-table tbody>tr{
    position:relative!important;
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    grid-template-rows:auto auto auto!important;
    column-gap:10px!important;
    row-gap:0!important;
    width:100%!important;
    min-width:0!important;
    min-height:0!important;
    margin:0!important;
    padding:11px 12px!important;
    border:1px solid var(--v907-line)!important;
    border-radius:14px!important;
    background:#fff!important;
    box-shadow:0 1px 2px rgba(16,24,40,.025)!important;
    overflow:hidden!important;
    cursor:pointer!important;
    -webkit-tap-highlight-color:transparent!important;
  }
  #page-batches #batchMasterBody>tr:active{
    transform:scale(.995)!important;
    background:#FAFBFF!important;
  }

  /* Reset every desktop/mobile-card cell rule first. */
  #page-batches #batchMasterBody>tr>td,
  #page-batches .acct-master-table tbody>tr>td,
  #page-batches .master-table tbody>tr>td{
    display:none!important;
    position:static!important;
    inset:auto!important;
    float:none!important;
    width:auto!important;
    min-width:0!important;
    max-width:none!important;
    min-height:0!important;
    height:auto!important;
    margin:0!important;
    padding:0!important;
    border:0!important;
    border-bottom:0!important;
    background:transparent!important;
    box-shadow:none!important;
    text-align:left!important;
    white-space:normal!important;
  }
  #page-batches #batchMasterBody>tr>td::before,
  #page-batches #batchMasterBody>tr>td::after{
    display:none!important;
    content:none!important;
  }

  /* recipient / requester */
  #page-batches #batchMasterBody>tr>td:nth-child(6){
    display:block!important;
    grid-column:1!important;
    grid-row:1!important;
    align-self:start!important;
    padding-right:6px!important;
  }
  #page-batches #batchMasterBody>tr>td:nth-child(6) .master-primary{
    display:block!important;
    max-width:100%!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    white-space:nowrap!important;
    color:var(--v907-ink)!important;
    font-size:14px!important;
    font-weight:700!important;
    line-height:1.25!important;
  }
  #page-batches #batchMasterBody>tr>td:nth-child(6) .master-secondary{
    display:none!important;
  }

  /* amount */
  #page-batches #batchMasterBody>tr>td:nth-child(8){
    display:block!important;
    grid-column:2!important;
    grid-row:1!important;
    align-self:start!important;
    text-align:right!important;
    color:var(--v907-ink)!important;
    font-size:14px!important;
    font-weight:750!important;
    line-height:1.25!important;
    white-space:nowrap!important;
  }

  /* status */
  #page-batches #batchMasterBody>tr>td:nth-child(3){
    display:flex!important;
    grid-column:1!important;
    grid-row:2!important;
    align-items:center!important;
    margin-top:7px!important;
  }
  #page-batches #batchMasterBody .master-status{
    min-height:24px!important;
    padding:4px 7px!important;
    border-radius:999px!important;
    gap:5px!important;
    font-size:9.5px!important;
    line-height:1!important;
    white-space:nowrap!important;
  }
  #page-batches #batchMasterBody .master-status::before{
    width:6px!important;
    height:6px!important;
    flex:0 0 6px!important;
  }

  /* claim date */
  #page-batches #batchMasterBody>tr>td:nth-child(4){
    display:block!important;
    grid-column:2!important;
    grid-row:2!important;
    align-self:center!important;
    margin-top:7px!important;
    text-align:right!important;
  }
  #page-batches #batchMasterBody>tr>td:nth-child(4) .master-primary,
  #page-batches #batchMasterBody>tr>td:nth-child(4){
    color:var(--v907-text)!important;
    font-size:10.5px!important;
    font-weight:600!important;
    white-space:nowrap!important;
  }

  /* claim number / short summary */
  #page-batches #batchMasterBody>tr>td:nth-child(7){
    display:block!important;
    grid-column:1 / -1!important;
    grid-row:3!important;
    min-width:0!important;
    margin-top:8px!important;
    padding-top:7px!important;
    padding-right:0!important;
    border-top:1px solid #EEF0F3!important;
  }
  #page-batches #batchMasterBody>tr>td:nth-child(7) .master-primary{
    display:block!important;
    max-width:100%!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    white-space:nowrap!important;
    color:var(--v907-text)!important;
    font-size:10.5px!important;
    font-weight:700!important;
    line-height:1.25!important;
  }
  #page-batches #batchMasterBody>tr>td:nth-child(7) .master-secondary{
    display:block!important;
    max-width:100%!important;
    margin-top:2px!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    white-space:nowrap!important;
    color:var(--v907-muted2)!important;
    font-size:9.5px!important;
    line-height:1.2!important;
  }

  /* Normal/urgent does not deserve a whole table column on phone.
     Only urgent remains as a tiny flag. */
  #page-batches #batchMasterBody>tr>td:nth-child(2){display:none!important}
  #page-batches #batchMasterBody>tr>td:nth-child(2):has(.acct-priority.urgent){
    display:block!important;
    position:absolute!important;
    right:11px!important;
    bottom:10px!important;
    z-index:2!important;
  }
  #page-batches #batchMasterBody .acct-priority.urgent{
    min-height:20px!important;
    padding:3px 6px!important;
    gap:4px!important;
    font-size:8.5px!important;
    line-height:1!important;
  }
  #page-batches #batchMasterBody>tr:has(td:nth-child(2) .acct-priority.urgent)>td:nth-child(7){
    padding-right:52px!important;
  }

  /* Keep selection possible without creating another row of UI. */
  #page-batches #batchMasterBody>tr>td:nth-child(1):has(input){
    display:block!important;
    position:absolute!important;
    left:11px!important;
    bottom:10px!important;
    z-index:3!important;
  }
  #page-batches #batchMasterBody .master-checkbox{
    width:17px!important;
    height:17px!important;
    margin:0!important;
  }
  #page-batches #batchMasterBody>tr:has(td:nth-child(1) input)>td:nth-child(7){
    padding-left:25px!important;
  }

  /* Whole card opens the existing detail drawer, so the repeated giant
     action button is deliberately removed from the list. */
  #page-batches #batchMasterBody>tr>td:nth-child(14),
  #page-batches #batchMasterBody .acct-next,
  #page-batches #batchMasterBody [data-open-batch-button]{
    display:none!important;
  }

  /* Old grouped-batch badge repeats the same claim number in the same card.
     Runtime adds this class only when it is genuinely duplicated. */
  #page-batches .v907-mobile-duplicate-batchref{
    display:none!important;
  }

  /* Empty state is not a card row. */
  #page-batches #batchMasterBody>tr:has(.master-empty){
    display:block!important;
    padding:0!important;
    border:0!important;
    background:transparent!important;
    box-shadow:none!important;
  }
  #page-batches #batchMasterBody>tr:has(.master-empty)>td{
    display:block!important;
  }
  #page-batches .master-empty{
    padding:24px 14px!important;
    font-size:11px!important;
    text-align:center!important;
  }

  /* Existing drawer becomes the place for full information. */
  #page-batches .acct-drawer{
    width:100vw!important;
    max-width:100vw!important;
    border-radius:18px 18px 0 0!important;
  }
  #page-batches .acct-drawer-head{
    padding:13px 14px!important;
  }
  #page-batches .acct-drawer-body{
    padding:12px 14px!important;
  }
  #page-batches .acct-drawer-footer{
    padding:9px 12px calc(9px + env(safe-area-inset-bottom))!important;
    gap:6px!important;
  }

  /* Small visible build marker for verifying LINE/iOS cache. */
  #page-batches .batch-page-version-v907{
    display:inline-flex!important;
    align-items:center!important;
    margin-left:6px!important;
    padding:2px 5px!important;
    border-radius:999px!important;
    background:#F2F4F7!important;
    color:#98A2B3!important;
    font-size:8px!important;
    font-weight:700!important;
    line-height:1!important;
    vertical-align:middle!important;
    letter-spacing:0!important;
  }
}

@media (max-width: 390px) {
  #page-batches .worktable-tools{
    grid-template-columns:minmax(0,1fr) 104px auto!important;
  }
  #page-batches #batchMasterBody>tr{
    padding:10px 11px!important;
  }
  #page-batches #batchMasterBody>tr>td:nth-child(6) .master-primary,
  #page-batches #batchMasterBody>tr>td:nth-child(8){
    font-size:13.5px!important;
  }
}
`;

const js = `/* ${MARK} */
(() => {
  "use strict";
  const VERSION = "${VERSION}";
  const ROOT = "#page-batches";
  let observer = null;
  let scheduled = false;

  const txt = node => String(node?.textContent || "").replace(/\\s+/g," ").trim();

  function updateVersion(){
    const old = document.getElementById("appBuildBadge");
    if(old){
      const b = old.querySelector("b");
      const s = old.querySelector("span");
      if(b) b.textContent = "Dashboard v" + VERSION;
      if(s) s.textContent = "Build 20 ส.ค. 2569";
    }

    const h = document.querySelector(ROOT + " .acct-command-head h3") ||
              document.querySelector(ROOT + " .batch-topline h3");
    if(h && !document.getElementById("batchPageVersionV907")){
      const badge = document.createElement("span");
      badge.id = "batchPageVersionV907";
      badge.className = "batch-page-version-v907";
      badge.textContent = "v9.07";
      badge.setAttribute("aria-label","Dashboard version 9.07");
      h.appendChild(badge);
    }
  }

  function dedupeBatchRefs(){
    document.querySelectorAll(ROOT + " #batchMasterBody tr").forEach(row => {
      row.querySelectorAll(".v907-mobile-duplicate-batchref").forEach(n => n.classList.remove("v907-mobile-duplicate-batchref"));
      const rowText = txt(row);
      if(!rowText) return;

      row.querySelectorAll("td:nth-child(7) span, td:nth-child(7) small, td:nth-child(7) b, td:nth-child(7) div").forEach(node => {
        if(node.childElementCount) return;
        const t = txt(node);
        if(!/^รวมใบเบิกแล้ว\\s*[·•:\-]?/i.test(t)) return;
        const m = t.match(/(20\\d{2}-[A-Z0-9-]{4,})/i);
        if(!m) return;
        const ref = m[1];
        const occurrences = rowText.split(ref).length - 1;
        if(occurrences > 1) node.classList.add("v907-mobile-duplicate-batchref");
      });
    });
  }

  function audit(){
    scheduled = false;
    updateVersion();
    dedupeBatchRefs();
    document.querySelectorAll(ROOT + " #batchMasterBody tr[data-open-batch]," + ROOT + " #batchMasterBody tr[data-open-queue]")
      .forEach(row => row.classList.add("v907-mobile-compact-row"));
    window.__RUBJAI_DASHBOARD_VERSION__ = VERSION;
    window.__RUBJAI_V907_MOBILE_BATCHES_COMPACT__ = true;
  }

  function queue(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(audit);
  }

  function install(){
    audit();
    observer?.disconnect();
    observer = new MutationObserver(queue);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window.addEventListener("resize", queue, {passive:true});
    [80,300,900,1800].forEach(ms => setTimeout(audit,ms));
    console.info("${MARK}", VERSION);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
`;

fs.writeFileSync(cssFile, css, "utf8");
fs.writeFileSync(jsFile, js, "utf8");
execFileSync(process.execPath, ["--check", jsFile], { stdio:"pipe" });

/* Always load v9.07 LAST so old mobile/table !important rules cannot win. */
let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i, `$1Dashboard v${VERSION}`);
html = html.replace(/\s*<link[^>]+batches-mobile-v907\.css[^>]*>\s*/gi, "\n");
html = html.replace(/\s*<script[^>]+batches-mobile-v907\.js[^>]*><\/script>\s*/gi, "\n");

if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) throw new Error("v9.07 invalid index.html anchors");
html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="./assets/batches-mobile-v907.css?v=${VERSION}.${BUILD_DATE}">\n</head>`);
html = html.replace(/<\/body>/i, `<script src="./assets/batches-mobile-v907.js?v=${VERSION}.${BUILD_DATE}"></script>\n</body>`);

/* Cache bust direct sources touched by earlier patchers as well. */
html = html.replace(/(\.\/assets\/dashboard\.css)\?v=[^"'<>]+/g, `$1?v=${VERSION}.${BUILD_DATE}`);
html = html.replace(/(\.\/assets\/dashboard\.js)\?v=[^"'<>]+/g, `$1?v=${VERSION}.${BUILD_DATE}`);
html = html.replace(/(\.\/assets\/reimbursement-batch-lock\.js)\?v=[^"'<>]+/g, `$1?v=${VERSION}.${BUILD_DATE}`);
html = html.replace(/(\.\/assets\/brand-theme\.css)\?v=[^"'<>]+/g, `$1?v=${VERSION}.${BUILD_DATE}`);

fs.writeFileSync(indexFile, html, "utf8");

/* Keep future deploys pinned to this patch even if package.json gets reused. */
if (fs.existsSync(packageFile)) {
  const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  pkg.version = VERSION;
  const deploy = String(pkg?.scripts?.deploy || "");
  if(deploy && !deploy.includes(SELF)){
    const idx = deploy.lastIndexOf("wrangler deploy");
    const hook = `node ${SELF}`;
    if(idx >= 0){
      const left = deploy.slice(0,idx).replace(/\s*&&\s*$/,"").trimEnd();
      const right = deploy.slice(idx);
      pkg.scripts.deploy = `${left} && ${hook} && ${right}`;
    }else{
      pkg.scripts.deploy = `${deploy} && ${hook}`;
    }
  }
  fs.writeFileSync(packageFile, JSON.stringify(pkg,null,2) + "\n", "utf8");
}

/* Static audit */
const finalHtml = fs.readFileSync(indexFile,"utf8");
const finalCss = fs.readFileSync(cssFile,"utf8");
const finalJs = fs.readFileSync(jsFile,"utf8");
const checks = {
  cssLinked: finalHtml.includes(`batches-mobile-v907.css?v=${VERSION}.${BUILD_DATE}`),
  jsLinked: finalHtml.includes(`batches-mobile-v907.js?v=${VERSION}.${BUILD_DATE}`),
  cssOnce: (finalHtml.match(/batches-mobile-v907\.css/g)||[]).length === 1,
  jsOnce: (finalHtml.match(/batches-mobile-v907\.js/g)||[]).length === 1,
  compactRows: finalCss.includes("#batchMasterBody>tr") && finalCss.includes("td:nth-child(6)") && finalCss.includes("td:nth-child(8)"),
  statusScroller: finalCss.includes("scroll-snap-type:x proximity"),
  actionHiddenOnMobile: finalCss.includes("td:nth-child(14)"),
  duplicateGuard: finalJs.includes("v907-mobile-duplicate-batchref"),
  versionMarker: finalJs.includes("batchPageVersionV907")
};
const failed = Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
if(failed.length) throw new Error("v9.07 audit failed: " + failed.join(", "));

console.log("✅ Dashboard v9.07.0");
console.log("✅ Mobile เบิกจ่าย: compact scan-first rows");
console.log("✅ Status filters: horizontal compact chips");
console.log("✅ Search/filter/header: reduced vertical space");
console.log("✅ Repeated ดูรายละเอียด button hidden on phone; whole row still opens drawer");
console.log("✅ Duplicate รวมใบเบิกแล้ว reference hidden only when repeated");
console.log("✅ Desktop table/workflow untouched");
