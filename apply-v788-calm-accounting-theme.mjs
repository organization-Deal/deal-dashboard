import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cssFile = path.join(root, "assets", "dashboard.css");
const htmlFile = path.join(root, "index.html");
const MARK = "RUBJAI_CALM_ACCOUNTING_THEME_V7_88_20260819";

if (!fs.existsSync(cssFile)) throw new Error("v7.88 missing assets/dashboard.css");
if (!fs.existsSync(htmlFile)) throw new Error("v7.88 missing index.html");

let css = fs.readFileSync(cssFile, "utf8");
let html = fs.readFileSync(htmlFile, "utf8");

if (!css.includes(MARK)) {
  css += `

/* ============================================================
   ${MARK}
   Calm B2B accounting direction
   90% neutral / 8% brand / 2% semantic status
   ============================================================ */
:root{
  --calm-ink:#111827;
  --calm-muted:#667085;
  --calm-soft:#f6f7f9;
  --calm-bg:#f7f8fa;
  --calm-line:#e4e7ec;
  --calm-line-strong:#d0d5dd;
  --calm-indigo:#4f46e5;
  --calm-indigo-soft:#eef2ff;
  --calm-navy:#111827;
  --calm-success:#15803d;
  --calm-success-soft:#f0fdf4;
  --calm-warning:#b45309;
  --calm-warning-soft:#fffaf0;
  --calm-danger:#b42318;
  --calm-danger-soft:#fff7f6;
}

/* ---------- Global: less decoration, calmer surfaces ---------- */
html,body{background:var(--calm-bg)!important;color:var(--calm-ink)!important}
.main{background:transparent!important}
.card,.kpi,.batch-section,.acct7-card,.acct7-kpi,.income-kpi,
.recon-import-card,.recon-table-card,.recon-account-hero,.recon-account-card,
.worktable-head,.worktable-actions,.acct-bulkbar,.pricing-card,.billing-current,
.usage784-card,.control-panel{
  background:#fff!important;
  border-color:var(--calm-line)!important;
  box-shadow:0 1px 2px rgba(16,24,40,.025),0 8px 22px rgba(16,24,40,.025)!important;
}
.card,.kpi{box-shadow:0 1px 2px rgba(16,24,40,.02),0 7px 20px rgba(16,24,40,.025)!important}
.card:hover,.kpi:hover{transform:none!important;box-shadow:0 1px 2px rgba(16,24,40,.025),0 9px 24px rgba(16,24,40,.035)!important}

/* Primary actions: one calm navy action language, not purple everywhere */
.btn.solid,
.control-action.primary,
.income-action.primary,
.acct7-btn.primary,
.acct-next .btn.primary-next,
button[type="submit"].primary,
.simple-create-v739,
.plan-action.primary,
.pricing-card.recommended .plan-action{
  background:var(--calm-navy)!important;
  border-color:var(--calm-navy)!important;
  color:#fff!important;
  box-shadow:none!important;
  background-image:none!important;
}
.btn.solid:hover,
.control-action.primary:hover,
.income-action.primary:hover,
.acct7-btn.primary:hover,
.acct-next .btn.primary-next:hover,
.plan-action.primary:hover{
  background:#0b1220!important;
  border-color:#0b1220!important;
  transform:none!important;
  box-shadow:none!important;
}

/* Indigo = navigation / focus / progress only */
.navlink.active,.subnavlink.active{
  background:var(--calm-indigo-soft)!important;
  color:var(--calm-indigo)!important;
  box-shadow:none!important;
}
.navlink.active::before{background:var(--calm-indigo)!important}
.navlink.active .ic{color:var(--calm-indigo)!important}
.track .fill,.operation-bar i,.billing-progress>i{background:var(--calm-indigo)!important}

/* ---------- Overview ---------- */
#page-overview .kpi.hero{
  background:var(--calm-navy)!important;
  background-image:none!important;
  border-color:var(--calm-navy)!important;
}
#page-overview .kpi:not(.hero){background:#fff!important}
#page-overview .catrow .track .fill,
#page-overview .merchant-row .track .fill{background:var(--calm-indigo)!important}
#page-overview .accounting-note{background:#fff!important;border-color:var(--calm-line)!important}

/* ---------- Batches / reimbursement ---------- */
#page-batches .acct-status-strip button{
  background:#fff!important;
  border-color:var(--calm-line)!important;
  box-shadow:none!important;
  color:var(--calm-muted)!important;
}
#page-batches .acct-status-strip button::after{
  background-image:none!important;
  background:#f2f4f7!important;
  border:1px solid #eaecf0!important;
}
#page-batches .acct-status-strip button.active,
#page-batches .acct-status-strip button.on,
#page-batches .acct-status-strip button[aria-pressed="true"]{
  background:#fff!important;
  border-color:#c7d2fe!important;
  box-shadow:0 0 0 1px #c7d2fe inset!important;
}
#page-batches .acct-status-strip button.active::after,
#page-batches .acct-status-strip button.on::after,
#page-batches .acct-status-strip button[aria-pressed="true"]::after{
  background:var(--calm-indigo-soft)!important;
  border-color:#c7d2fe!important;
}
#page-batches .acct-status-strip button strong{color:var(--calm-ink)!important}
#page-batches .acct-status-strip button span{color:var(--calm-muted)!important}
#page-batches .batch-schedule-card{background:#fff!important;border-color:var(--calm-line)!important;box-shadow:none!important}
#page-batches .acct-master-table tbody tr,
#page-batches .acct-master-table tbody tr.row-paid,
#page-batches .acct-master-table tbody tr.row-correction{
  background:#fff!important;
  border-color:var(--calm-line)!important;
}

/* Statuses should carry color, not the entire row/card */
.badge.paid,.batch-status.done,.status-paid,.income-status.paid,
.recon-status.reconciled,.income-recon-state.done{
  background:var(--calm-success-soft)!important;
  color:var(--calm-success)!important;
}
.badge.pending,.batch-status.waiting,.status-waiting,
.recon-status.review,.income-recon-state.review{
  background:var(--calm-warning-soft)!important;
  color:var(--calm-warning)!important;
}
.badge.rejected,.status-rejected,.recon-status.unmatched,.income-recon-state.none{
  background:var(--calm-danger-soft)!important;
  color:var(--calm-danger)!important;
}

/* ---------- Expenses ---------- */
#page-expenses .card,#page-expenses .batch-section{background:#fff!important}
#page-expenses .btn.solid{background:var(--calm-navy)!important;border-color:var(--calm-navy)!important}
#page-expenses .badge:not(.paid):not(.rejected){background:#f2f4f7!important;color:#475467!important}

/* ---------- Income ---------- */
#page-income .income-kpi,
#page-income .income-kpi.received{
  background:#fff!important;
  border-color:var(--calm-line)!important;
}
#page-income .income-kpi strong,
#page-income .income-kpi.received strong{color:var(--calm-ink)!important}
#page-income .income-kpi.received small{color:var(--calm-success)!important}
#page-income .income-kpi.overdue strong{color:var(--calm-danger)!important}
#page-income .income-tax-note{background:#fff!important;border-color:var(--calm-line)!important}
#page-income .income-table-wrap{border-color:var(--calm-line)!important;box-shadow:none!important}

/* ---------- Reconciliation ---------- */
#page-reconciliation .recon-account-card{background:#fff!important;border-color:var(--calm-line)!important;color:var(--calm-ink)!important}
#page-reconciliation .recon-account-card.active{
  background:var(--calm-navy)!important;
  border-color:var(--calm-navy)!important;
  color:#fff!important;
}
#page-reconciliation .recon-account-card.active small{color:rgba(255,255,255,.66)!important}
#page-reconciliation .recon-account-card.active .count{background:rgba(255,255,255,.12)!important;color:#fff!important}
#page-reconciliation .recon-kpi{background:#fff!important;border-color:var(--calm-line)!important}
#page-reconciliation .recon-kpi.active{background:var(--calm-navy)!important;border-color:var(--calm-navy)!important;color:#fff!important}
#page-reconciliation .recon-warning{
  background:#fff!important;
  color:#475467!important;
  border:1px solid var(--calm-line)!important;
  border-left:3px solid #d97706!important;
  box-shadow:none!important;
}
#page-reconciliation .recon-table tbody tr.reconciled td,
#page-reconciliation .recon-table tbody tr.reconciled:hover td,
#page-reconciliation .recon-table tbody tr.unmatched td,
#page-reconciliation .recon-table tbody tr.unmatched:hover td,
#page-reconciliation .recon-table tbody tr.review td,
#page-reconciliation .recon-table tbody tr.review:hover td{
  background:#fff!important;
}
#page-reconciliation .recon-candidate.best{
  background:#fff!important;
  border-color:#a5b4fc!important;
  box-shadow:0 0 0 1px #e0e7ff inset!important;
}
#page-reconciliation .finance-account-icon,
#page-reconciliation .recon-account-logo{background:var(--calm-navy)!important}

/* ---------- Forms / controls ---------- */
input,select,textarea,
.income-toolbar input,.income-toolbar select,
.recon-table-tools input,.recon-table-tools select,
.recon-import-fields input,.payment-channel-select{
  border-color:var(--calm-line-strong)!important;
  box-shadow:none!important;
}
input:focus,select:focus,textarea:focus{
  border-color:#818cf8!important;
  box-shadow:0 0 0 3px rgba(79,70,229,.08)!important;
}

/* ---------- Semantic color budget ---------- */
.good,.usage-good{color:var(--calm-success)!important}
.warn{color:var(--calm-warning)!important}
.bad,.danger{color:var(--calm-danger)!important}

/* no giant colored semantic panels */
.income-kpi.received,
.recon-table tbody tr.reconciled,
.recon-table tbody tr.unmatched,
.recon-table tbody tr.review{
  background:#fff!important;
}

/* tighter, more professional typography */
.head h2,.income-head h3,.recon-command-head h3,.acct-command-head h3{
  color:var(--calm-ink)!important;
  font-weight:600!important;
  letter-spacing:-.03em!important;
}
.head-kicker,.income-head p,.recon-command-head p,.acct-command-head p{color:var(--calm-muted)!important}
`;
}

/* Cache-bust the CSS after this visual patch. */
html = html.replace(/\.\/assets\/dashboard\.css\?v=[^"']+/g, "./assets/dashboard.css?v=7.88.20260819");

fs.writeFileSync(cssFile, css);
fs.writeFileSync(htmlFile, html);

if (!css.includes(MARK)) throw new Error("v7.88 CSS marker missing");
if (!html.includes("dashboard.css?v=7.88.20260819")) throw new Error("v7.88 cache-bust missing");

console.log(`✅ ${MARK}`);
console.log("✅ reduced color budget across overview / batches / expenses / income / reconciliation");
console.log("✅ primary actions = deep navy, indigo reserved for navigation/focus/progress");
console.log("✅ semantic colors stay on status badges, not whole cards/rows");
