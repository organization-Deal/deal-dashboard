import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const indexFile = path.join(root, "index.html");
const dashboardFile = path.join(root, "assets", "dashboard.js");
const batchFile = path.join(root, "assets", "reimbursement-batch-lock.js");

for (const file of [indexFile, dashboardFile, batchFile]) {
  if (!fs.existsSync(file)) throw new Error(`V904 missing ${path.relative(root, file)}`);
}

let html = fs.readFileSync(indexFile, "utf8");
let dashboard = fs.readFileSync(dashboardFile, "utf8");
let batches = fs.readFileSync(batchFile, "utf8");

/* ============================================================
   V9.04 — BATCHES TABLE FIRST
   - เบิกจ่าย = status + table immediately
   - LINE workspace monitor -> จัดการธุรกิจ > กลุ่ม LINE
   - Cash position -> จัดการธุรกิจ > บัญชีและช่องทางการเงิน
   ============================================================ */

// 1) Sidebar: add a dedicated LINE group business tab.
if (!html.includes('data-biz="line"')) {
  const anchor = '<button class="subnavlink" data-biz="workflow">Workflow เบิกจ่าย</button>';
  if (!html.includes(anchor)) throw new Error("V904 sidebar workflow anchor not found");
  html = html.replace(
    anchor,
    `${anchor}
          <button class="subnavlink" data-biz="line">กลุ่ม LINE</button>`
  );
}

// 2) Business page: add LINE tab mount before finance.
if (!html.includes('id="biz-line"')) {
  const financeAnchor = '      <div class="business-tab" id="biz-finance">';
  if (!html.includes(financeAnchor)) throw new Error("V904 biz-finance anchor not found");
  html = html.replace(
    financeAnchor,
    `      <div class="business-tab" id="biz-line">
        <div id="lineGroupBusinessMount"></div>
      </div>

${financeAnchor}`
  );
}

// 3) Finance tab: dedicated mount for cash position.
if (!html.includes('id="cashPositionBusinessMount"')) {
  const financeStart = '      <div class="business-tab" id="biz-finance">';
  if (!html.includes(financeStart)) throw new Error("V904 finance mount anchor not found");
  html = html.replace(
    financeStart,
    `${financeStart}
        <div id="cashPositionBusinessMount"></div>`
  );
}

// 4) Make the batches page wording operational, not configuration-heavy.
html = html
  .replace('<div class="head-kicker">ACCOUNTING WORKSPACE</div>\n          <h3>โต๊ะทำงานเบิกจ่าย</h3>\n          <p>รายการที่ผู้เบิกยืนยันจะเดินตาม Workflow ของบริษัทอัตโนมัติ — อนุมัติค่าใช้จ่าย ตรวจเอกสาร หรือเข้าสู่รอโอนตามที่ตั้งไว้</p>',
           '<div class="head-kicker">EXPENSE REQUISITION</div>\n          <h3>เบิกจ่าย</h3>\n          <p>ตรวจ อนุมัติ และจ่ายรายการเบิกของบริษัทจากตารางเดียว</p>');

// 5) Title mapping for the new business tab.
if (!dashboard.includes('line:"กลุ่ม LINE"')) {
  const oldMap = '{profile:"ข้อมูลธุรกิจ",approver:"ผู้อนุมัติค่าใช้จ่าย",workflow:"Workflow เบิกจ่าย",categories:"หมวดหมู่",finance:"ช่องทางการเงิน",team:"ทีมของฉัน"}';
  const newMap = '{profile:"ข้อมูลธุรกิจ",approver:"ผู้อนุมัติค่าใช้จ่าย",workflow:"Workflow เบิกจ่าย",line:"กลุ่ม LINE",categories:"หมวดหมู่",finance:"ช่องทางการเงิน",team:"ทีมของฉัน"}';
  if (!dashboard.includes(oldMap)) throw new Error("V904 openBusiness title map not found");
  dashboard = dashboard.replace(oldMap, newMap);
}

// 6) LINE monitor: mount under business tab instead of page-batches.
const oldLineEnsure = `  function ensureLineGroupMonitor() {
    const page = document.getElementById("page-batches");
    if (!page || document.getElementById("lineGroupMonitor")) return;

    const anchor = page.querySelector(".acct-status-strip") || page.firstElementChild;
    const section = document.createElement("section");`;

const newLineEnsure = `  function ensureLineGroupMonitor() {
    const page = document.getElementById("lineGroupBusinessMount");
    if (!page || document.getElementById("lineGroupMonitor")) return;

    const section = document.createElement("section");`;

if (batches.includes(oldLineEnsure)) {
  batches = batches.replace(oldLineEnsure, newLineEnsure);
} else if (!batches.includes('document.getElementById("lineGroupBusinessMount")')) {
  throw new Error("V904 ensureLineGroupMonitor source not found");
}

const oldLineInsert = `    if (anchor) page.insertBefore(section, anchor);
    else page.prepend(section);

    document.getElementById("lineGroupRefresh")?.addEventListener("click", () => loadLineGroups(true));`;

const newLineInsert = `    page.appendChild(section);

    document.getElementById("lineGroupRefresh")?.addEventListener("click", () => loadLineGroups(true));`;

if (batches.includes(oldLineInsert)) {
  batches = batches.replace(oldLineInsert, newLineInsert);
}

// 7) When user opens จัดการธุรกิจ > กลุ่ม LINE, render + refresh immediately.
if (!batches.includes("V904_LINE_BUSINESS_RENDER")) {
  const hookAnchor = `  const renderBatchesBeforeLineGroups = renderBatches;
  renderBatches = function(...args) {`;
  const at = batches.indexOf(hookAnchor);
  if (at < 0) throw new Error("V904 line render hook anchor not found");

  const nextStyle = batches.indexOf('  const style = document.createElement("style");', at);
  if (nextStyle < 0) throw new Error("V904 line style anchor not found");

  const hook = `
  /* V904_LINE_BUSINESS_RENDER */
  const renderBusinessBeforeLineGroupsV904 = renderBusiness;
  renderBusiness = function(...args) {
    const result = renderBusinessBeforeLineGroupsV904.apply(this, args);
    if (BUSINESS_TAB === "line") {
      ensureLineGroupMonitor();
      if (!LINE_GROUP_LAST_LOAD || Date.now() - LINE_GROUP_LAST_LOAD > 60_000) {
        loadLineGroups(false);
      } else {
        renderLineGroupMonitor();
      }
    }
    return result;
  };

`;
  batches = batches.slice(0, nextStyle) + hook + batches.slice(nextStyle);
}

// 8) Cash position: mount under finance tab instead of page-batches.
const oldCashEnsure = `  function ensureBoard() {
    const page = document.getElementById("page-batches");
    if (!page || document.getElementById("cashPositionBoard")) return;

    const lineBoard = document.getElementById("lineGroupMonitor");
    const board = document.createElement("section");`;

const newCashEnsure = `  function ensureBoard() {
    const page = document.getElementById("cashPositionBusinessMount");
    if (!page || document.getElementById("cashPositionBoard")) return;

    const board = document.createElement("section");`;

if (batches.includes(oldCashEnsure)) {
  batches = batches.replace(oldCashEnsure, newCashEnsure);
} else if (!batches.includes('document.getElementById("cashPositionBusinessMount")')) {
  throw new Error("V904 ensureBoard source not found");
}

const oldCashInsert = `    if (lineBoard) lineBoard.insertAdjacentElement("afterend", board);
    else page.prepend(board);

    document.getElementById("cashManageAccounts")?.addEventListener("click", () => {`;

const newCashInsert = `    page.appendChild(board);

    document.getElementById("cashManageAccounts")?.addEventListener("click", () => {`;

if (batches.includes(oldCashInsert)) {
  batches = batches.replace(oldCashInsert, newCashInsert);
}

// 9) Finance tab should render current cash position whenever opened.
const oldFinanceWrapper = `  const renderBusinessCore = renderBusiness;
  renderBusiness = function(...args) {
    const result = renderBusinessCore.apply(this, args);
    if (BUSINESS_TAB === "finance") decorateFinanceCards();
    return result;
  };`;

const newFinanceWrapper = `  const renderBusinessCore = renderBusiness;
  renderBusiness = function(...args) {
    const result = renderBusinessCore.apply(this, args);
    if (BUSINESS_TAB === "finance") {
      decorateFinanceCards();
      renderCashPositionBoard();
    }
    return result;
  };`;

if (batches.includes(oldFinanceWrapper)) {
  batches = batches.replace(oldFinanceWrapper, newFinanceWrapper);
} else if (!batches.includes("renderCashPositionBoard();\n    }\n    return result;")) {
  throw new Error("V904 finance render wrapper not found");
}

// 10) Defensive CSS: even if stale code creates panels in batches, never show them there.
if (!batches.includes("V904_TABLE_FIRST_STYLE")) {
  batches += `

/* V904_TABLE_FIRST_STYLE */
(() => {
  const style = document.createElement("style");
  style.textContent = \`
    #page-batches > #lineGroupMonitor,
    #page-batches > #cashPositionBoard{
      display:none!important;
    }

    #page-batches .acct-command-head{
      margin-bottom:12px;
    }

    #page-batches .acct-status-strip{
      margin-top:0;
      margin-bottom:12px;
    }

    #page-batches .accounting-worktable{
      margin-top:0;
    }

    #biz-line #lineGroupMonitor,
    #biz-finance #cashPositionBoard{
      margin-top:0;
      margin-bottom:18px;
    }

    @media(max-width:760px){
      #page-batches .acct-command-head{
        margin-bottom:10px;
      }
      #page-batches .acct-status-strip{
        margin-bottom:10px;
      }
    }
  \`;
  document.head.appendChild(style);
})();
`;
}

fs.writeFileSync(indexFile, html, "utf8");
fs.writeFileSync(dashboardFile, dashboard, "utf8");
fs.writeFileSync(batchFile, batches, "utf8");

// Syntax audit after patch.
execFileSync(process.execPath, ["--check", dashboardFile], { stdio: "pipe" });
execFileSync(process.execPath, ["--check", batchFile], { stdio: "pipe" });

// Final structural audit.
const finalHtml = fs.readFileSync(indexFile, "utf8");
const finalDashboard = fs.readFileSync(dashboardFile, "utf8");
const finalBatches = fs.readFileSync(batchFile, "utf8");

const checks = {
  lineMenu: finalHtml.includes('data-biz="line"'),
  lineTab: finalHtml.includes('id="biz-line"'),
  lineMount: finalHtml.includes('id="lineGroupBusinessMount"'),
  cashMount: finalHtml.includes('id="cashPositionBusinessMount"'),
  lineTitle: finalDashboard.includes('line:"กลุ่ม LINE"'),
  lineMoved: finalBatches.includes('document.getElementById("lineGroupBusinessMount")'),
  cashMoved: finalBatches.includes('document.getElementById("cashPositionBusinessMount")'),
  tableFirstGuard: finalBatches.includes("V904_TABLE_FIRST_STYLE"),
};

const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length) throw new Error("V904 audit failed: " + failed.join(", "));

console.log("✅ V9.04 BATCHES TABLE FIRST");
console.log("✅ หน้าเบิกจ่าย = status + table");
console.log("✅ กลุ่ม LINE -> จัดการธุรกิจ > กลุ่ม LINE");
console.log("✅ ยอดเงินบัญชี -> จัดการธุรกิจ > บัญชีและช่องทางการเงิน");
console.log("✅ dashboard.js syntax OK");
console.log("✅ reimbursement-batch-lock.js syntax OK");
