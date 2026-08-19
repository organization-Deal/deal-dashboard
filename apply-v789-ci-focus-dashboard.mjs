import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cssFile = path.join(root, "assets", "dashboard.css");
const htmlFile = path.join(root, "index.html");
const MARK = "RUBJAI_CI_FOCUS_V7_89_20260819";

if (!fs.existsSync(cssFile)) throw new Error("v7.89 missing assets/dashboard.css");

let css = fs.readFileSync(cssFile, "utf8");
let html = fs.existsSync(htmlFile) ? fs.readFileSync(htmlFile, "utf8") : "";

if (!css.includes(MARK)) {
  css += `

/* ============================================================
   ${MARK}
   Direction: clean accounting SaaS / corporate CI
   90% neutral surfaces, Indigo only for brand interaction,
   semantic colors only for statuses.
   ============================================================ */

:root{
  --ci-indigo:#4f46e5;
  --ci-indigo-strong:#4338ca;
  --ci-indigo-soft:#eef2ff;
  --ci-indigo-soft-2:#f7f7ff;
  --ci-navy:#111827;
  --ci-navy-2:#0f172a;
  --ci-bg:#f7f8fb;
  --ci-surface:#ffffff;
  --ci-surface-2:#f8fafc;
  --ci-line:#e6e9f0;
  --ci-line-strong:#d8dde8;
  --ci-text:#111827;
  --ci-muted:#667085;
  --ci-muted-2:#98a2b3;
  --ci-success:#16a34a;
  --ci-success-soft:#effaf3;
  --ci-warning:#d97706;
  --ci-warning-soft:#fff8eb;
  --ci-danger:#dc2626;
  --ci-danger-soft:#fff4f4;
  --ci-shadow:0 8px 28px rgba(15,23,42,.045);
  --ci-shadow-soft:0 3px 12px rgba(15,23,42,.025);
}

/* ---------- Global shell ---------- */
html,body{background:var(--ci-bg)!important;color:var(--ci-text)!important}
body{font-weight:400!important}
.main{max-width:1680px!important;padding:28px 32px 72px!important}
.sidebar{background:#fff!important;border-right:1px solid var(--ci-line)!important;box-shadow:none!important}
.business-switcher-primary .business-switcher-btn,
.company-menu,.syncstate,.workspace-link{
  background:#fff!important;border-color:var(--ci-line)!important;box-shadow:var(--ci-shadow-soft)!important
}
.workspace-link.drive{background:var(--ci-navy)!important;border-color:var(--ci-navy)!important;color:#fff!important}

/* ---------- Typography / hierarchy ---------- */
.head h2,.income-head h3,.recon-command-head h3,#page-batches .acct-command-head h3{
  color:var(--ci-text)!important;font-weight:650!important;letter-spacing:-.035em!important
}
.head-kicker{color:var(--ci-muted-2)!important;letter-spacing:.08em!important}
.card h3,.worktable-head h3,.recon-table-head h3{font-weight:650!important;color:var(--ci-text)!important}

/* ---------- Navigation: CI only here ---------- */
.navlink,.subnavlink{color:#667085!important}
.navlink:hover,.subnavlink:hover{background:#f6f7fa!important;color:var(--ci-text)!important}
.navlink.active,.subnavlink.active{
  background:var(--ci-indigo-soft)!important;color:var(--ci-indigo-strong)!important;
  border-color:transparent!important;box-shadow:none!important
}
.navlink.active .ic{color:var(--ci-indigo)!important}
.navlink.active::before{background:var(--ci-indigo)!important}

/* ---------- Buttons ---------- */
.btn,.control-action,.income-action,.acct7-btn{
  border-color:var(--ci-line-strong)!important;box-shadow:none!important
}
.btn.solid,.control-action.primary,.income-action.primary,.acct7-btn.primary,
.simple-create-v739,.plan-action.primary,button[type="submit"].primary,
#page-overview .btn.primary,#page-income .btn.primary,#page-reconciliation .btn.primary{
  background:var(--ci-indigo)!important;border-color:var(--ci-indigo)!important;color:#fff!important;
  box-shadow:0 6px 16px rgba(79,70,229,.14)!important
}
.btn.solid:hover,.control-action.primary:hover,.income-action.primary:hover,.acct7-btn.primary:hover,
.plan-action.primary:hover{background:var(--ci-indigo-strong)!important;border-color:var(--ci-indigo-strong)!important}

/* ---------- Cards: neutral by default ---------- */
.card,.kpi,.batch-section,.accounting-worktable-v4,.worktable-head,.worktable-actions,
.acct-bulkbar,.income-kpi,.income-table-wrap,.recon-account-hero,.recon-import-card,
.recon-table-card,.finance-account-card,.billing-current,.pricing-card,.usage784-card,
.workspace-status-panel,.control-panel{
  background:#fff!important;border-color:var(--ci-line)!important;box-shadow:var(--ci-shadow)!important
}
.card,.kpi,.batch-section,.income-kpi,.recon-account-hero,.recon-import-card,.recon-table-card{
  border-radius:18px!important
}

/* ---------- Overview: match approved direction ---------- */
#page-overview .kpis{gap:12px!important}
#page-overview .kpi{
  min-height:132px!important;padding:20px!important;background:#fff!important;border:1px solid var(--ci-line)!important
}
#page-overview .kpi.hero{
  background:linear-gradient(135deg,#1e1b4b 0%,#3730a3 58%,#4338ca 100%)!important;
  border-color:transparent!important;color:#fff!important;box-shadow:0 12px 30px rgba(49,46,129,.18)!important
}
#page-overview .kpi.hero .lb,#page-overview .kpi.hero .foot{color:rgba(255,255,255,.72)!important}
#page-overview .kpi.hero .big{color:#fff!important}
#page-overview .kpi:not(.hero) .big{color:var(--ci-text)!important}
#page-overview .card{box-shadow:var(--ci-shadow)!important}
#page-overview .catrow .track,#page-overview .merchant-row .track{background:#eef0f4!important}
#page-overview .catrow .fill,#page-overview .merchant-row .fill,#page-overview .track .fill{background:var(--ci-indigo)!important}
#page-overview .trend path:not([fill="none"]){fill:rgba(79,70,229,.08)!important}
#page-overview .trend polyline,#page-overview .trend path[fill="none"]{stroke:var(--ci-indigo)!important}

/* ---------- Batches / reimbursement: no rainbow ---------- */
#page-batches .acct-status-strip{gap:10px!important}
#page-batches .acct-status-strip button{
  background:#fff!important;border:1px solid var(--ci-line)!important;box-shadow:none!important;color:var(--ci-muted)!important
}
#page-batches .acct-status-strip button:hover{border-color:#cfd5e1!important;background:#fbfcfe!important;transform:none!important;box-shadow:none!important}
#page-batches .acct-status-strip button.active,
#page-batches .acct-status-strip button[aria-pressed="true"]{
  background:#fff!important;border-color:#a5b4fc!important;box-shadow:0 0 0 1px #c7d2fe inset!important
}
#page-batches .acct-status-strip button span{color:var(--ci-muted)!important}
#page-batches .acct-status-strip button strong{color:var(--ci-text)!important}
#page-batches .acct-status-strip button::after{background-color:#f2f4f7!important}
#page-batches .acct-status-strip button[data-batch-filter="paid"]::after{background-color:var(--ci-success-soft)!important}
#page-batches .acct-status-strip button[data-batch-filter="rejected"]::after,
#page-batches .acct-status-strip button[data-batch-filter="correction"]::after{background-color:#f7f7f8!important}
#page-batches .acct-master-table tbody tr,
#page-batches .acct-master-table tbody tr.row-paid,
#page-batches .acct-master-table tbody tr.row-correction{
  background:#fff!important;border-color:var(--ci-line)!important
}
#page-batches .acct-master-table tbody tr:hover td{background:#fbfcfe!important}
#page-batches .badge,#page-batches .batch-status{box-shadow:none!important}
#page-batches .badge.paid,#page-batches .batch-status.done{background:var(--ci-success-soft)!important;color:var(--ci-success)!important}
#page-batches .badge.pending,#page-batches .batch-status.waiting{background:#f5f6f8!important;color:#596273!important}
#page-batches .badge.rejected,#page-batches .status-rejected{background:var(--ci-danger-soft)!important;color:var(--ci-danger)!important}

/* ---------- Expenses ---------- */
#page-expenses .expenses-shell,#page-expenses .card{background:#fff!important}
#page-expenses table tbody tr{background:#fff!important}
#page-expenses table tbody tr:hover td{background:#fbfcfe!important}
#page-expenses .badge.paid{background:var(--ci-success-soft)!important;color:var(--ci-success)!important}
#page-expenses .badge.pending{background:#f5f6f8!important;color:#596273!important}
#page-expenses .badge.rejected{background:var(--ci-danger-soft)!important;color:var(--ci-danger)!important}

/* ---------- Income: all KPI cards neutral ---------- */
#page-income .income-kpi,
#page-income .income-kpi.received,
#page-income .income-kpi.overdue{
  background:#fff!important;border:1px solid var(--ci-line)!important;box-shadow:none!important
}
#page-income .income-kpi strong{color:var(--ci-text)!important}
#page-income .income-kpi.received strong{color:var(--ci-text)!important}
#page-income .income-kpi.overdue strong{color:var(--ci-danger)!important}
#page-income .income-kpi.received small{color:var(--ci-success)!important}
#page-income .income-tax-note{background:#fff!important;border-color:var(--ci-line)!important;color:var(--ci-muted)!important}
#page-income .income-status{background:#f5f6f8!important;color:#596273!important}
#page-income .income-status.paid{background:var(--ci-success-soft)!important;color:var(--ci-success)!important}
#page-income .income-status.overdue{background:var(--ci-danger-soft)!important;color:var(--ci-danger)!important}
#page-income .income-status.partial{background:var(--ci-warning-soft)!important;color:var(--ci-warning)!important}
#page-income .income-table th{background:#fafbfc!important}

/* ---------- Reconciliation: only selected / status gets color ---------- */
#page-reconciliation .recon-account-card{background:#fff!important;border:1px solid var(--ci-line)!important;color:var(--ci-text)!important;box-shadow:none!important}
#page-reconciliation .recon-account-card.active{
  background:var(--ci-navy)!important;border-color:var(--ci-navy)!important;color:#fff!important
}
#page-reconciliation .recon-account-card.active small{color:rgba(255,255,255,.68)!important}
#page-reconciliation .recon-kpi{background:#fff!important;border-color:var(--ci-line)!important;color:var(--ci-text)!important;box-shadow:none!important}
#page-reconciliation .recon-kpi.active{background:var(--ci-navy)!important;border-color:var(--ci-navy)!important;color:#fff!important}
#page-reconciliation .recon-warning{
  background:#fff!important;border:1px solid var(--ci-line)!important;border-left:3px solid var(--ci-warning)!important;
  color:#6b7280!important;box-shadow:none!important
}
#page-reconciliation .recon-table tbody tr.reconciled td,
#page-reconciliation .recon-table tbody tr.unmatched td,
#page-reconciliation .recon-table tbody tr.review td{background:#fff!important}
#page-reconciliation .recon-table tbody tr:hover td{background:#fbfcfe!important}
#page-reconciliation .recon-status.reconciled{background:var(--ci-success-soft)!important;color:var(--ci-success)!important}
#page-reconciliation .recon-status.suggested{background:var(--ci-indigo-soft)!important;color:var(--ci-indigo-strong)!important}
#page-reconciliation .recon-status.review{background:var(--ci-warning-soft)!important;color:var(--ci-warning)!important}
#page-reconciliation .recon-status.unmatched{background:var(--ci-danger-soft)!important;color:var(--ci-danger)!important}

/* ---------- Settings / billing ---------- */
#page-billing .pricing-card.recommended{border-color:#a5b4fc!important;box-shadow:0 0 0 1px #c7d2fe inset!important}
#page-billing .pricing-card.featured{transform:none!important}
#page-settings .workspace-status-panel{background:var(--ci-navy)!important;border-color:var(--ci-navy)!important;color:#fff!important}

/* ---------- Inputs / tables ---------- */
input,select,textarea,.acct7-input,.acct7-select,.acct7-textarea,
.income-toolbar input,.income-toolbar select,.recon-table-tools input,.recon-table-tools select{
  border-color:var(--ci-line-strong)!important;background:#fff!important;box-shadow:none!important
}
input:focus,select:focus,textarea:focus,.acct7-input:focus,.acct7-select:focus,.acct7-textarea:focus{
  border-color:#818cf8!important;box-shadow:0 0 0 3px rgba(79,70,229,.09)!important
}
table th{color:#667085!important;background:#fafbfc!important}
table td{border-color:#edf0f4!important}

/* ---------- Remove decorative color where CI is not needed ---------- */
.operation-bar i,.billing-progress>i,.track .fill{background:var(--ci-indigo)!important}
.good,.usage-good{color:var(--ci-success)!important}
.warn{color:var(--ci-warning)!important}.bad,.danger{color:var(--ci-danger)!important}

/* ---------- Mobile: keep same restrained system ---------- */
@media(max-width:760px){
  .main{padding:18px 12px 88px!important}
  #page-overview .kpis{grid-template-columns:1fr 1fr!important}
  #page-overview .kpi.hero{grid-column:1/-1!important}
  #page-batches .acct-status-strip{display:flex!important;overflow-x:auto!important}
  #page-batches .acct-status-strip button{min-width:126px!important}
}
`;
  fs.writeFileSync(cssFile, css, "utf8");
}

if (html && !html.includes(MARK)) {
  html = html.replace("</head>", `<!-- ${MARK} -->\n</head>`);
  fs.writeFileSync(htmlFile, html, "utf8");
}

console.log("v7.89 CI focus dashboard applied");
