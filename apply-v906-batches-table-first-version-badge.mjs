import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const indexFile = path.join(root, "index.html");
const dashboardFile = path.join(root, "assets", "dashboard.js");
const batchFile = path.join(root, "assets", "reimbursement-batch-lock.js");
const cssFile = path.join(root, "assets", "dashboard.css");
const packageFile = path.join(root, "package.json");

const VERSION = "9.06.0";
const BUILD_LABEL = "20 ส.ค. 2569";
const SELF = "apply-v906-batches-table-first-version-badge.mjs";
const MARK = "RUBJAI_V906_BATCH_TABLE_FIRST_20260820";

for (const file of [indexFile, dashboardFile, batchFile, cssFile]) {
  if (!fs.existsSync(file)) throw new Error(`v9.06 missing ${path.relative(root, file)}`);
}

let html = fs.readFileSync(indexFile, "utf8");
let dashboard = fs.readFileSync(dashboardFile, "utf8");
let batches = fs.readFileSync(batchFile, "utf8");
let css = fs.readFileSync(cssFile, "utf8");

/* ============================================================
   1) BUSINESS NAV
   ============================================================ */
if (!html.includes('data-biz="line"')) {
  const anchor = '<button class="subnavlink" data-biz="workflow">Workflow เบิกจ่าย</button>';
  if (!html.includes(anchor)) throw new Error("v9.06 business workflow menu anchor not found");
  html = html.replace(
    anchor,
    `${anchor}
          <button class="subnavlink" data-biz="line">กลุ่ม LINE</button>`
  );
}

/* ============================================================
   2) DESTINATION TABS / MOUNTS
   ============================================================ */
if (!html.includes('id="biz-line"')) {
  const financeAnchor = '      <div class="business-tab" id="biz-finance">';
  if (!html.includes(financeAnchor)) throw new Error("v9.06 biz-finance anchor not found");
  html = html.replace(
    financeAnchor,
    `      <div class="business-tab" id="biz-line">
        <div id="lineGroupBusinessMount"></div>
      </div>

${financeAnchor}`
  );
}

if (!html.includes('id="lineGroupBusinessMount"')) {
  html = html.replace(
    '<div class="business-tab" id="biz-line">',
    '<div class="business-tab" id="biz-line">\n        <div id="lineGroupBusinessMount"></div>'
  );
}

if (!html.includes('id="cashPositionBusinessMount"')) {
  const financeAnchor = '<div class="business-tab" id="biz-finance">';
  if (!html.includes(financeAnchor)) throw new Error("v9.06 finance mount anchor not found");
  html = html.replace(
    financeAnchor,
    `${financeAnchor}
        <div id="cashPositionBusinessMount"></div>`
  );
}

/* ============================================================
   3) PAGE COPY: เบิกจ่าย = WORK TABLE
   ============================================================ */
html = html.replace(
  /<div class="head-kicker">ACCOUNTING WORKSPACE<\/div>\s*<h3>โต๊ะทำงานเบิกจ่าย<\/h3>\s*<p>[\s\S]*?<\/p>/,
  '<div class="head-kicker">EXPENSE REQUISITION</div><h3>เบิกจ่าย</h3><p>ตรวจ อนุมัติ และจ่ายรายการเบิกของบริษัทจากตารางเดียว</p>'
);

/* ============================================================
   4) VERSION BADGE — bottom left
   ============================================================ */
if (!html.includes('id="appBuildBadge"')) {
  const sidefootWho = /(<div class="sidefoot">\s*<div class="who">[\s\S]*?<\/div>\s*<\/div>)/;
  const match = html.match(sidefootWho);
  if (!match) throw new Error("v9.06 sidefoot anchor not found");

  const original = match[1];
  const replacement = original.replace(
    /<\/div>\s*$/,
    `  <div class="app-build-badge" id="appBuildBadge" title="RUBJAI Dashboard build">
        <b>Dashboard v${VERSION}</b>
        <span>Build ${BUILD_LABEL}</span>
      </div>
    </div>`
  );
  html = html.replace(original, replacement);
}

/* ============================================================
   5) BUSINESS ROUTING FOR LINE TAB
   ============================================================ */
dashboard = dashboard.replace(
  'if(!opts.bypassSetup&&!["profile","approver","workflow","finance"].includes(tab)&&requireCompanySetup("business"))return;',
  'if(!opts.bypassSetup&&!["profile","approver","workflow","finance","line"].includes(tab)&&requireCompanySetup("business"))return;'
);

if (!dashboard.includes('line:"กลุ่ม LINE"')) {
  dashboard = dashboard.replace(
    '{profile:"ข้อมูลธุรกิจ",approver:"ผู้อนุมัติค่าใช้จ่าย",workflow:"Workflow เบิกจ่าย",categories:"หมวดหมู่",finance:"ช่องทางการเงิน",team:"ทีมของฉัน"}',
    '{profile:"ข้อมูลธุรกิจ",approver:"ผู้อนุมัติค่าใช้จ่าย",workflow:"Workflow เบิกจ่าย",line:"กลุ่ม LINE",categories:"หมวดหมู่",finance:"บัญชีและช่องทางการเงิน",team:"ทีมของฉัน"}'
  );
}

/* ============================================================
   6) DIRECT SOURCE FIX — LINE GROUP
   Old behavior:
     ensureLineGroupMonitor() creates inside #page-batches
     renderBatches() always loads it
   New:
     creates inside #lineGroupBusinessMount
     only renders when BUSINESS_TAB === "line"
   ============================================================ */
const oldLineEnsure = `  function ensureLineGroupMonitor() {
    const page = document.getElementById("page-batches");
    if (!page || document.getElementById("lineGroupMonitor")) return;

    const anchor = page.querySelector(".acct-status-strip") || page.firstElementChild;
    const section = document.createElement("section");`;

const newLineEnsure = `  function ensureLineGroupMonitor() {
    const page = document.getElementById("lineGroupBusinessMount");
    if (!page) return;

    const existing = document.getElementById("lineGroupMonitor");
    if (existing) {
      if (existing.parentElement !== page) page.appendChild(existing);
      return;
    }

    const section = document.createElement("section");`;

if (batches.includes(oldLineEnsure)) {
  batches = batches.replace(oldLineEnsure, newLineEnsure);
}

batches = batches.replace(
  `    if (anchor) page.insertBefore(section, anchor);
    else page.prepend(section);`,
  `    page.appendChild(section);`
);

const oldLineBatchWrapper = `  const renderBatchesBeforeLineGroups = renderBatches;
  renderBatches = function(...args) {
    const result = renderBatchesBeforeLineGroups.apply(this, args);
    ensureLineGroupMonitor();
    decorateBatchRowsWithSourceGroup();
    if (!LINE_GROUP_LAST_LOAD || Date.now() - LINE_GROUP_LAST_LOAD > 60_000) {
      loadLineGroups(false);
    } else {
      renderLineGroupMonitor();
    }
    return result;
  };`;

const newLineBatchWrapper = `  const renderBatchesBeforeLineGroups = renderBatches;
  renderBatches = function(...args) {
    const result = renderBatchesBeforeLineGroups.apply(this, args);
    decorateBatchRowsWithSourceGroup();
    return result;
  };

  const renderBusinessBeforeLineGroupsV906 = renderBusiness;
  renderBusiness = function(...args) {
    const result = renderBusinessBeforeLineGroupsV906.apply(this, args);
    if (BUSINESS_TAB === "line") {
      ensureLineGroupMonitor();
      if (!LINE_GROUP_LAST_LOAD || Date.now() - LINE_GROUP_LAST_LOAD > 60_000) {
        loadLineGroups(false);
      } else {
        renderLineGroupMonitor();
      }
    }
    return result;
  };`;

if (batches.includes(oldLineBatchWrapper)) {
  batches = batches.replace(oldLineBatchWrapper, newLineBatchWrapper);
}

batches = batches.replace(
  `  setTimeout(() => {
    if (currentPageKey() === "batches") {
      ensureLineGroupMonitor();
      loadLineGroups(false);
      decorateBatchRowsWithSourceGroup();
    }
  }, 0);`,
  `  setTimeout(() => {
    if (currentPageKey() === "business" && BUSINESS_TAB === "line") {
      ensureLineGroupMonitor();
      loadLineGroups(false);
    }
    if (currentPageKey() === "batches") decorateBatchRowsWithSourceGroup();
  }, 0);`
);

/* ============================================================
   7) DIRECT SOURCE FIX — CASH POSITION
   ============================================================ */
const oldCashEnsure = `  function ensureBoard() {
    const page = document.getElementById("page-batches");
    if (!page || document.getElementById("cashPositionBoard")) return;

    const lineBoard = document.getElementById("lineGroupMonitor");
    const board = document.createElement("section");`;

const newCashEnsure = `  function ensureBoard() {
    const page = document.getElementById("cashPositionBusinessMount");
    if (!page) return;

    const existing = document.getElementById("cashPositionBoard");
    if (existing) {
      if (existing.parentElement !== page) page.appendChild(existing);
      return;
    }

    const board = document.createElement("section");`;

if (batches.includes(oldCashEnsure)) {
  batches = batches.replace(oldCashEnsure, newCashEnsure);
}

batches = batches.replace(
  `    if (lineBoard) lineBoard.insertAdjacentElement("afterend", board);
    else page.prepend(board);`,
  `    page.appendChild(board);`
);

const oldCashBusinessWrapper = `  const renderBusinessCore = renderBusiness;
  renderBusiness = function(...args) {
    const result = renderBusinessCore.apply(this, args);
    if (BUSINESS_TAB === "finance") decorateFinanceCards();
    return result;
  };

  const renderBatchesCore = renderBatches;
  renderBatches = function(...args) {
    const result = renderBatchesCore.apply(this, args);
    renderCashPositionBoard();
    return result;
  };`;

const newCashBusinessWrapper = `  const renderBusinessCore = renderBusiness;
  renderBusiness = function(...args) {
    const result = renderBusinessCore.apply(this, args);
    if (BUSINESS_TAB === "finance") {
      decorateFinanceCards();
      renderCashPositionBoard();
    }
    return result;
  };

  const renderBatchesCore = renderBatches;
  renderBatches = function(...args) {
    return renderBatchesCore.apply(this, args);
  };`;

if (batches.includes(oldCashBusinessWrapper)) {
  batches = batches.replace(oldCashBusinessWrapper, newCashBusinessWrapper);
}

/* ============================================================
   8) FINAL FAIL-SAFE
   Even if an old async path tries to prepend the panels again,
   move them out of page-batches immediately.
   ============================================================ */
if (!batches.includes(MARK)) {
  batches += `

/* ============================================================
   ${MARK}
   ============================================================ */
(() => {
  const BUILD_VERSION = "${VERSION}";

  function relocate() {
    const line = document.getElementById("lineGroupMonitor");
    const lineMount = document.getElementById("lineGroupBusinessMount");
    if (line && lineMount && line.parentElement !== lineMount) lineMount.appendChild(line);

    const cash = document.getElementById("cashPositionBoard");
    const cashMount = document.getElementById("cashPositionBusinessMount");
    if (cash && cashMount && cash.parentElement !== cashMount) cashMount.appendChild(cash);

    const batchesPage = document.getElementById("page-batches");
    if (batchesPage) {
      batchesPage.querySelectorAll("#lineGroupMonitor,#cashPositionBoard").forEach(node => {
        node.style.setProperty("display","none","important");
      });

      const command = batchesPage.querySelector(".acct-command-head");
      const status = batchesPage.querySelector(".acct-status-strip");
      const table = batchesPage.querySelector(".accounting-worktable");

      if (command && status && command.nextElementSibling !== status) {
        command.insertAdjacentElement("afterend", status);
      }
      if (status && table && status.nextElementSibling !== table) {
        status.insertAdjacentElement("afterend", table);
      }
    }
  }

  const queue = () => {
    requestAnimationFrame(relocate);
    setTimeout(relocate, 60);
    setTimeout(relocate, 250);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", queue, { once:true });
  } else {
    queue();
  }

  const observer = new MutationObserver(() => queue());
  const startObserve = () => document.body && observer.observe(document.body,{childList:true,subtree:true});
  if (document.body) startObserve();
  else document.addEventListener("DOMContentLoaded", startObserve, {once:true});

  window.__RUBJAI_DASHBOARD_VERSION__ = BUILD_VERSION;
  window.__RUBJAI_V906_TABLE_FIRST__ = true;
})();
`;
}

/* ============================================================
   9) CSS — table-first + version badge
   ============================================================ */
if (!css.includes("RUBJAI_V906_BUILD_BADGE_CSS")) {
  css += `

/* RUBJAI_V906_BUILD_BADGE_CSS */
.app-build-badge{
  margin-top:8px;
  padding:7px 4px 0;
  border-top:1px solid rgba(17,22,46,.08);
  color:#98A2B3;
  line-height:1.25;
}
.app-build-badge b{
  display:block;
  color:#5F6885;
  font-size:9px;
  font-weight:800;
  letter-spacing:.01em;
}
.app-build-badge span{
  display:block;
  margin-top:2px;
  font-size:8px;
}

#page-batches>#lineGroupMonitor,
#page-batches>#cashPositionBoard,
#page-batches #lineGroupMonitor,
#page-batches #cashPositionBoard{
  display:none!important;
}

#page-batches .acct-command-head{
  margin-bottom:12px!important;
}
#page-batches .acct-status-strip{
  margin-top:0!important;
  margin-bottom:12px!important;
}
#page-batches .accounting-worktable{
  margin-top:0!important;
}
#biz-line #lineGroupMonitor,
#biz-finance #cashPositionBoard{
  display:block!important;
  margin-top:0!important;
  margin-bottom:16px!important;
}

@media(max-width:700px){
  .app-build-badge{display:none!important}
}
`;
}

/* ============================================================
   10) CACHE BUST
   ============================================================ */
html = html.replace(
  /(\.\/assets\/dashboard\.js)\?v=[^"'<>]+/g,
  "$1?v=9.06.0.20260820"
);
html = html.replace(
  /(\.\/assets\/reimbursement-batch-lock\.js)\?v=[^"'<>]+/g,
  "$1?v=9.06.0.20260820"
);
html = html.replace(
  /(\.\/assets\/dashboard\.css)\?v=[^"'<>]+/g,
  "$1?v=9.06.0.20260820"
);

html = html.replace(
  /src="\.\/assets\/dashboard\.js"/g,
  'src="./assets/dashboard.js?v=9.06.0.20260820"'
);
html = html.replace(
  /src="\.\/assets\/reimbursement-batch-lock\.js"/g,
  'src="./assets/reimbursement-batch-lock.js?v=9.06.0.20260820"'
);
html = html.replace(
  /href="\.\/assets\/dashboard\.css"/g,
  'href="./assets/dashboard.css?v=9.06.0.20260820"'
);

fs.writeFileSync(indexFile, html, "utf8");
fs.writeFileSync(dashboardFile, dashboard, "utf8");
fs.writeFileSync(batchFile, batches, "utf8");
fs.writeFileSync(cssFile, css, "utf8");

/* ============================================================
   11) INSTALL THIS PATCH AS LAST DEPLOY PATCH
   ============================================================ */
if (fs.existsSync(packageFile)) {
  const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));

  pkg.version = VERSION;

  if (pkg?.scripts?.deploy && !pkg.scripts.deploy.includes(SELF)) {
    const deploy = String(pkg.scripts.deploy);
    const hook = `node ${SELF}`;
    const idx = deploy.lastIndexOf("wrangler deploy");

    if (idx >= 0) {
      const left = deploy.slice(0, idx).replace(/\s*&&\s*$/,"").trimEnd();
      const right = deploy.slice(idx);
      pkg.scripts.deploy = `${left} && ${hook} && ${right}`;
    } else {
      pkg.scripts.deploy = `${deploy} && ${hook}`;
    }
  }

  fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

/* ============================================================
   12) AUDIT
   ============================================================ */
execFileSync(process.execPath, ["--check", dashboardFile], { stdio:"pipe" });
execFileSync(process.execPath, ["--check", batchFile], { stdio:"pipe" });

const finalHtml = fs.readFileSync(indexFile, "utf8");
const finalDash = fs.readFileSync(dashboardFile, "utf8");
const finalBatch = fs.readFileSync(batchFile, "utf8");
const finalCss = fs.readFileSync(cssFile, "utf8");

const checks = {
  lineMenu: finalHtml.includes('data-biz="line"'),
  lineMount: finalHtml.includes('id="lineGroupBusinessMount"'),
  cashMount: finalHtml.includes('id="cashPositionBusinessMount"'),
  versionBadge: finalHtml.includes(`Dashboard v${VERSION}`),
  lineTitle: finalDash.includes('line:"กลุ่ม LINE"'),
  lineDirectMount: finalBatch.includes('document.getElementById("lineGroupBusinessMount")'),
  cashDirectMount: finalBatch.includes('document.getElementById("cashPositionBusinessMount")'),
  noLineBatchWrapper: !finalBatch.includes('ensureLineGroupMonitor();\n    decorateBatchRowsWithSourceGroup();\n    if (!LINE_GROUP_LAST_LOAD'),
  noCashBatchRender: !finalBatch.includes('const result = renderBatchesCore.apply(this, args);\n    renderCashPositionBoard();'),
  failSafe: finalBatch.includes(MARK),
  versionGlobal: finalBatch.includes('__RUBJAI_DASHBOARD_VERSION__'),
  cssGuard: finalCss.includes('#page-batches #lineGroupMonitor'),
  cacheBust: finalHtml.includes('9.06.0.20260820')
};

const failed = Object.entries(checks).filter(([,ok]) => !ok).map(([key]) => key);
if (failed.length) throw new Error("v9.06 audit failed: " + failed.join(", "));

console.log("✅ Dashboard v9.06.0");
console.log("✅ เบิกจ่าย = status + ตารางทันที");
console.log("✅ กลุ่ม LINE -> จัดการธุรกิจ > กลุ่ม LINE");
console.log("✅ ยอดเงินบัญชี -> จัดการธุรกิจ > บัญชีและช่องทางการเงิน");
console.log("✅ Version badge -> มุมล่างซ้าย");
console.log("✅ Cache bust 9.06.0");
console.log("✅ deploy chain installs v906 as the last patch");
