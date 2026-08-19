import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const brandFile = path.join(root, "assets", "brand-theme.css");
const htmlFile = path.join(root, "index.html");
const MARK = "RUBJAI_REFERENCE_REDESIGN_V7_90_20260819";

if (!fs.existsSync(brandFile)) throw new Error("v7.90 missing assets/brand-theme.css");
if (!fs.existsSync(htmlFile)) throw new Error("v7.90 missing index.html");

let css = fs.readFileSync(brandFile, "utf8");
let html = fs.readFileSync(htmlFile, "utf8");

if (!css.includes(MARK)) {
css += `

/* ============================================================
   ${MARK}
   Reference direction:
   white/neutral base + one indigo focus + semantic status only.
   This block MUST stay at the END of brand-theme.css.
   ============================================================ */

:root{
  --ci-ink:#0f172a;
  --ci-ink-2:#1e293b;
  --ci-muted:#667085;
  --ci-muted-2:#98a2b3;
  --ci-bg:#f7f8fc;
  --ci-surface:#ffffff;
  --ci-soft:#f6f7fb;
  --ci-line:#e7eaf0;
  --ci-line-strong:#d8dde7;
  --ci-indigo:#4f46e5;
  --ci-indigo-2:#3730a3;
  --ci-indigo-soft:#eef2ff;
  --ci-success:#15803d;
  --ci-success-soft:#eefbf3;
  --ci-warning:#b45309;
  --ci-warning-soft:#fff7ed;
  --ci-danger:#b42318;
  --ci-danger-soft:#fff2f1;
  --ci-shadow:0 1px 2px rgba(16,24,40,.02),0 8px 24px rgba(16,24,40,.035);
}

/* 01 — Global geometry. Make it look like a finance product, not colorful SaaS. */
html,body{background:var(--ci-bg)!important;color:var(--ci-ink)!important}
body{font-weight:400!important}
.main{max-width:1680px!important;padding:28px 30px 64px!important}
.sidebar{
  width:232px!important;
  background:#fbfcfe!important;
  border-right:1px solid var(--ci-line)!important;
}
.business-switcher-primary{padding:14px 12px 12px!important}
.business-switcher-primary .business-switcher-btn{
  min-height:58px!important;
  border-radius:14px!important;
  box-shadow:none!important;
}
.sidebar-nav-v51{padding-left:10px!important;padding-right:10px!important}
.nav-kicker{
  font-size:9.5px!important;
  letter-spacing:.06em!important;
  color:var(--ci-muted-2)!important;
}
.navlink{
  border-radius:9px!important;
  min-height:40px!important;
  padding:9px 10px!important;
  margin-bottom:2px!important;
  color:#667085!important;
}
.navlink:hover{background:#f2f4f7!important;color:var(--ci-ink)!important}
.navlink.active{
  background:var(--ci-indigo-soft)!important;
  color:var(--ci-indigo)!important;
  border:0!important;
  box-shadow:none!important;
}
.navlink.active .ic{color:var(--ci-indigo)!important}
.navlink.active::before{background:var(--ci-indigo)!important}

.head{
  margin-bottom:20px!important;
  padding-top:0!important;
  padding-bottom:3px!important;
}
.head h2{
  font-size:26px!important;
  line-height:1.12!important;
  font-weight:600!important;
  letter-spacing:-.035em!important;
}
.head-kicker{font-size:10px!important;color:var(--ci-muted)!important}
.rangesel{border-radius:10px!important}
.workspace-link,.company-menu,.syncstate{
  box-shadow:none!important;
  border-color:var(--ci-line)!important;
}

/* 02 — One visual language for cards */
.card,.kpi,.batch-section,.acct7-card,.acct7-kpi,.income-kpi,
.recon-import-card,.recon-table-card,.recon-account-hero,.recon-account-card,
.worktable-head,.worktable-actions,.acct-bulkbar,.billing-current,.usage784-card,
.control-panel{
  background:#fff!important;
  border:1px solid var(--ci-line)!important;
  box-shadow:var(--ci-shadow)!important;
}
.card{
  border-radius:17px!important;
  padding:20px 22px!important;
  margin-bottom:14px!important;
}
.card h3{font-size:16px!important;font-weight:600!important}
.card .cs{font-size:11px!important;color:var(--ci-muted)!important;margin-bottom:14px!important}

/* 03 — Overview. Only ONE large brand surface. */
.kpis{
  grid-template-columns:1.16fr repeat(3,1fr)!important;
  gap:12px!important;
  margin-bottom:14px!important;
}
.kpi{
  min-height:124px!important;
  border-radius:16px!important;
  padding:18px 19px!important;
  box-shadow:var(--ci-shadow)!important;
}
.kpi:hover{transform:none!important;box-shadow:var(--ci-shadow)!important}
.kpi .lb{font-size:11px!important;color:var(--ci-muted)!important}
.kpi .big{
  font-size:29px!important;
  font-weight:600!important;
  margin:8px 0 4px!important;
  letter-spacing:-.045em!important;
}
.kpi .foot{font-size:10.5px!important;color:var(--ci-muted)!important}
.kpi.hero{
  background:linear-gradient(135deg,#3037d8 0%,#3730a3 100%)!important;
  border-color:transparent!important;
  box-shadow:0 12px 30px rgba(55,48,163,.14)!important;
}
.kpi.hero .lb,.kpi.hero .foot{color:rgba(255,255,255,.68)!important}
.kpi.hero .big{color:#fff!important}
.kpi.hero .bar{background:rgba(255,255,255,.58)!important}
.accounting-note{
  background:#fff!important;
  border:1px solid var(--ci-line)!important;
  box-shadow:none!important;
  border-radius:11px!important;
  padding:9px 12px!important;
  margin-bottom:14px!important;
  color:var(--ci-muted)!important;
}
.grid2{
  grid-template-columns:minmax(0,1.72fr) minmax(320px,.88fr)!important;
  gap:14px!important;
}
.catrow{margin-bottom:13px!important}
.catrow .track,.merchant-row .track{background:#edf0f5!important}
.catrow .track .fill,.merchant-row .track .fill,.track .fill{
  background:var(--ci-indigo)!important;
}
/* Chart: turn the old black chart into the CI chart from the reference. */
#trend polyline,#trend path[stroke],#trend line[stroke]{
  stroke:var(--ci-indigo)!important;
}
#trend circle{fill:var(--ci-indigo)!important;stroke:var(--ci-indigo)!important}
#trend polygon,#trend path:not([stroke]){
  fill:rgba(79,70,229,.08)!important;
}

/* 04 — CTA hierarchy: indigo only for the main action. */
.btn.solid,
.control-action.primary,
.income-action.primary,
.acct7-btn.primary,
.pricing-card.recommended .plan-action,
.pricing-card .plan-action.primary,
.simple-create-v739,
button[type="submit"].primary,
.plan-action.primary,
.acct-next .btn.primary-next{
  background:var(--ci-indigo)!important;
  border-color:var(--ci-indigo)!important;
  color:#fff!important;
  background-image:none!important;
  box-shadow:none!important;
}
.btn.solid:hover,
.control-action.primary:hover,
.income-action.primary:hover,
.acct7-btn.primary:hover,
.plan-action.primary:hover,
.acct-next .btn.primary-next:hover{
  background:var(--ci-indigo-2)!important;
  border-color:var(--ci-indigo-2)!important;
  transform:none!important;
  box-shadow:none!important;
}
.btn:not(.solid),.acct7-btn:not(.primary),.income-action:not(.primary){
  box-shadow:none!important;
}

/* 05 — Batches. Remove the decorative circles and make the strip a clean status navigator. */
.acct-command-head{margin-bottom:14px!important}
.acct-command-head h3,.recon-command-head h3{
  font-size:28px!important;
  font-weight:600!important;
  letter-spacing:-.035em!important;
}
.acct-status-strip{
  gap:8px!important;
  margin-bottom:14px!important;
}
.acct-status-strip button{
  min-height:76px!important;
  border:1px solid var(--ci-line)!important;
  border-radius:13px!important;
  padding:13px 14px!important;
  background:#fff!important;
  box-shadow:none!important;
  color:var(--ci-muted)!important;
  flex-direction:column!important;
  align-items:flex-start!important;
  justify-content:center!important;
  gap:4px!important;
}
.acct-status-strip button::after{display:none!important;content:none!important}
.acct-status-strip button strong{
  font-size:22px!important;
  line-height:1!important;
  color:var(--ci-ink)!important;
  font-weight:600!important;
}
.acct-status-strip button span{font-size:10.5px!important;color:var(--ci-muted)!important}
.acct-status-strip button.active,
.acct-status-strip button.on,
.acct-status-strip button[aria-pressed="true"]{
  background:#fff!important;
  border-color:#a5b4fc!important;
  box-shadow:0 0 0 1px #c7d2fe inset!important;
}
.acct-status-strip button.active strong,
.acct-status-strip button.on strong,
.acct-status-strip button[aria-pressed="true"] strong{
  color:var(--ci-indigo)!important;
}
.acct-status-strip button.active span,
.acct-status-strip button.on span,
.acct-status-strip button[aria-pressed="true"] span{
  color:var(--ci-indigo)!important;
}

.accounting-worktable-v4{
  border:1px solid var(--ci-line)!important;
  border-radius:16px!important;
  background:#fff!important;
  overflow:hidden!important;
  box-shadow:var(--ci-shadow)!important;
}
.worktable-head{
  padding:16px 18px!important;
  margin:0!important;
  border:0!important;
  border-bottom:1px solid var(--ci-line)!important;
  border-radius:0!important;
  box-shadow:none!important;
}
.acct-bulkbar,.worktable-actions{
  border-radius:0!important;
  border-left:0!important;
  border-right:0!important;
  box-shadow:none!important;
}
.acct-master-table thead th{
  background:#fafbfc!important;
  color:#667085!important;
  border-color:var(--ci-line)!important;
  font-weight:500!important;
}
.acct-master-table tbody td{border-color:#eef0f4!important}
.acct-master-table tbody tr,
.acct-master-table tbody tr.row-paid,
.acct-master-table tbody tr.row-correction,
.acct-master-table tbody tr.row-paid td,
.acct-master-table tbody tr.row-correction td{
  background:#fff!important;
}
.acct-master-table tbody tr:hover td{background:#fafbff!important}
.acct-master-table tbody tr:hover td:last-child{background:#fafbff!important}
.acct-master-table thead th:last-child{background:#fafbfc!important}

/* Important: color belongs to STATUS, never to a whole table row */
.master-status,.acct-priority{
  box-shadow:none!important;
}
.master-status.review{background:#eef2ff!important;color:#4338ca!important}
.master-status.correction,.master-status.rejected,.master-status.missing{
  background:var(--ci-danger-soft)!important;color:var(--ci-danger)!important
}
.master-status.payment{background:var(--ci-warning-soft)!important;color:var(--ci-warning)!important}
.master-status.proof{background:#f4f3ff!important;color:#5925dc!important}
.master-status.paid{background:var(--ci-success-soft)!important;color:var(--ci-success)!important}
.acct-doc-meter{background:#edf0f5!important}
.acct-doc-meter i{background:var(--ci-indigo)!important}

/* 06 — Cash position. Money itself is neutral. Green is not a brand color. */
.cash-position .good,
.cash-position-card .good,
.cash-account-card .good,
.account-balance-card .good,
.batch-section .good{
  color:var(--ci-ink)!important;
}

/* 07 — Expenses */
.batch-section,.expense-table-card,.expense-register{
  border-radius:16px!important;
}
.badge:not(.paid):not(.rejected):not(.pending){
  background:#f2f4f7!important;
  color:#475467!important;
}
.badge.paid,.batch-status.done,.status-paid,.row-paid .badge{
  background:var(--ci-success-soft)!important;
  color:var(--ci-success)!important;
}
.badge.pending,.batch-status.waiting,.status-waiting{
  background:var(--ci-warning-soft)!important;
  color:var(--ci-warning)!important;
}
.badge.rejected,.status-rejected{
  background:var(--ci-danger-soft)!important;
  color:var(--ci-danger)!important;
}

/* 08 — Income: all white KPI cards. Only the number/state may be semantic. */
.income-kpis{gap:10px!important}
.income-kpi,.income-kpi.received,.income-kpi.overdue{
  background:#fff!important;
  border:1px solid var(--ci-line)!important;
  border-radius:15px!important;
  box-shadow:var(--ci-shadow)!important;
}
.income-kpi strong,.income-kpi.received strong{
  color:var(--ci-ink)!important;
}
.income-kpi.received small{color:var(--ci-success)!important}
.income-kpi.overdue strong{color:var(--ci-danger)!important}
.income-tax-note{
  background:#fff!important;
  border:1px solid var(--ci-line)!important;
  border-left:3px solid #c7d2fe!important;
}
.income-table-wrap{
  border:1px solid var(--ci-line)!important;
  border-radius:15px!important;
  box-shadow:none!important;
}

/* 09 — Reconciliation: remove dark/colored blocks except selected account context. */
.recon-account-card{
  background:#fff!important;
  border:1px solid var(--ci-line)!important;
  color:var(--ci-ink)!important;
  box-shadow:none!important;
}
.recon-account-card.active{
  background:#fff!important;
  color:var(--ci-ink)!important;
  border-color:#a5b4fc!important;
  box-shadow:0 0 0 1px #c7d2fe inset!important;
}
.recon-account-card.active small{color:var(--ci-muted)!important}
.recon-account-card.active .count{
  background:var(--ci-indigo-soft)!important;
  color:var(--ci-indigo)!important;
}
.recon-account-hero{
  border-radius:15px!important;
  box-shadow:none!important;
}
.recon-kpis{gap:8px!important}
.recon-kpi,.recon-kpi.active{
  background:#fff!important;
  border:1px solid var(--ci-line)!important;
  color:var(--ci-ink)!important;
  box-shadow:none!important;
}
.recon-kpi.active{
  border-color:#a5b4fc!important;
  box-shadow:0 0 0 1px #c7d2fe inset!important;
}
.recon-kpi.active span{color:var(--ci-indigo)!important}
.recon-kpi.active strong{color:var(--ci-indigo)!important}
.recon-warning{
  min-height:0!important;
  background:#fff!important;
  color:var(--ci-muted)!important;
  border:1px solid var(--ci-line)!important;
  border-left:3px solid #f59e0b!important;
  box-shadow:none!important;
}
.recon-table tbody tr.reconciled td,
.recon-table tbody tr.unmatched td,
.recon-table tbody tr.review td{
  background:#fff!important;
}
.recon-table tbody tr:hover td{background:#fafbff!important}
.recon-candidate.best{
  background:#fff!important;
  border-color:#a5b4fc!important;
  box-shadow:0 0 0 1px #e0e7ff inset!important;
}

/* 10 — Forms / controls */
input,select,textarea,
.income-toolbar input,.income-toolbar select,
.recon-table-tools input,.recon-table-tools select,
.recon-import-fields input,.payment-channel-select{
  background:#fff!important;
  border-color:var(--ci-line-strong)!important;
  box-shadow:none!important;
}
input:focus,select:focus,textarea:focus{
  border-color:#818cf8!important;
  box-shadow:0 0 0 3px rgba(79,70,229,.08)!important;
}

/* 11 — Semantic budget */
.good,.usage-good{color:var(--ci-success)!important}
.warn{color:var(--ci-warning)!important}
.bad,.danger{color:var(--ci-danger)!important}

/* 12 — Responsive */
@media(max-width:1100px){
  .main{padding-left:22px!important;padding-right:22px!important}
  .kpis{grid-template-columns:1fr 1fr!important}
  .grid2{grid-template-columns:1fr!important}
}
@media(max-width:860px){
  .main{padding:14px 12px 92px!important}
  .kpi{border-radius:15px!important}
  .card{border-radius:15px!important}
}
`;
}

/* This is the important part: brand-theme.css is loaded AFTER dashboard.css.
   Cache-bust THIS file, not the earlier dashboard.css. */
html = html.replace(
  /\.\/assets\/brand-theme\.css\?v=[^"']+/g,
  "./assets/brand-theme.css?v=7.90.20260819"
);

fs.writeFileSync(brandFile, css);
fs.writeFileSync(htmlFile, html);

if (!css.includes(MARK)) throw new Error("v7.90 brand CSS marker missing");
if (!html.includes("brand-theme.css?v=7.90.20260819")) throw new Error("v7.90 cache-bust missing");

console.log(`✅ ${MARK}`);
console.log("✅ override moved to the LAST loaded stylesheet: assets/brand-theme.css");
console.log("✅ overview visibly redesigned toward the supplied reference");
console.log("✅ status strip circles removed");
console.log("✅ income/reconciliation/batches returned to neutral surfaces");
console.log("✅ indigo reserved for primary action / active / chart / progress");
