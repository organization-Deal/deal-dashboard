import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "RUBJAI_CI_VISUAL_LOCK_V7_94_20260819";
const cssPath = path.join(root, "assets", "ci-lock.css");
const dashJsPath = path.join(root, "assets", "dashboard.js");

const css = `/* ${MARK}
   FINAL CI POLICY
   90% neutral / 8% indigo / 2% semantic.
   Money is neutral. Semantic colors are status signals, not decoration.
   Only primary page/section CTAs may be filled indigo.
*/

:root{
  --rj-bg:#f7f8fc;
  --rj-surface:#ffffff;
  --rj-surface-2:#fafbfc;
  --rj-soft:#f2f4f7;
  --rj-ink:#101828;
  --rj-text:#344054;
  --rj-muted:#667085;
  --rj-muted-2:#98a2b3;
  --rj-line:#e4e7ec;
  --rj-line-strong:#d0d5dd;
  --rj-primary:#4f46e5;
  --rj-primary-hover:#4338ca;
  --rj-primary-soft:#eef2ff;
  --rj-success:#16a34a;
  --rj-warning:#d97706;
  --rj-danger:#d92d20;

  /* make old design tokens follow the same CI */
  --bg:var(--rj-bg);
  --surface:var(--rj-surface);
  --surface-2:var(--rj-surface-2);
  --ink:var(--rj-ink);
  --muted:var(--rj-muted);
  --muted-2:var(--rj-muted-2);
  --line:var(--rj-line);
  --line-strong:var(--rj-line-strong);
  --blue:var(--rj-primary);
  --blue-soft:var(--rj-primary-soft);
}

/* ---------- GLOBAL BASE ---------- */
html,body{
  background:var(--rj-bg)!important;
  color:var(--rj-ink)!important;
}
body,
button,input,select,textarea{
  font-family:"IBM Plex Sans Thai",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;
}
h1,h2,h3,h4,h5,h6,strong,b{color:var(--rj-ink)}
p,small,.sub,.cs,.muted{color:var(--rj-muted)}

.card,.panel,.kpi,.metric,.health,.detail-card,
.batch-section,.accounting-worktable-v4,.expense-register-card,
.cash-position-board,.cash-account-card,.income-kpi,
.recon-account-card,.recon-account-hero,.recon-kpi,
.recon-import-card,.recon-table-card,.control-panel,
.connection-details,.billing-current,.pricing-card,
.email-item,.subscription-card,.document-card,.doc-card{
  background:#fff!important;
  border-color:var(--rj-line)!important;
}

/* Default action = quiet neutral */
.btn,.mini,.mini-btn,.ghost,.row-actions button,.row-actions a,
.button-link,.workspace-link,.income-action,.acct7-btn,.plan-action,
.control-action,.business-switcher-btn,.seg button,
.drawer-links a,.payment-proof-link{
  background:#fff!important;
  background-image:none!important;
  color:var(--rj-text)!important;
  border-color:var(--rj-line-strong)!important;
  box-shadow:none!important;
}

/* Filled primary is reserved for main actions only */
.btn.solid,
button[type="submit"],
.control-action.primary,
.income-action.primary,
.acct7-btn.primary,
.plan-action.primary,
.pricing-card.recommended .plan-action,
.system-upgrade-btn,
#manualExpenseCreate,
#batchMasterCreate,
#mobileBatchDockCreate,
#manualExpenseCreate.btn.solid{
  background:var(--rj-primary)!important;
  background-image:none!important;
  border-color:var(--rj-primary)!important;
  color:#fff!important;
  box-shadow:none!important;
}
.btn.solid:hover,
button[type="submit"]:hover,
.control-action.primary:hover,
.income-action.primary:hover,
.acct7-btn.primary:hover,
.plan-action.primary:hover,
.system-upgrade-btn:hover,
#manualExpenseCreate:hover,
#batchMasterCreate:hover,
#mobileBatchDockCreate:hover{
  background:var(--rj-primary-hover)!important;
  border-color:var(--rj-primary-hover)!important;
  color:#fff!important;
}

/* ---------- DASHBOARD: COLOR BUDGET ---------- */
body[data-rj-page="dashboard"] .main{
  background:transparent!important;
}

/* Sidebar active = one soft brand signal */
body[data-rj-page="dashboard"] .navlink.active,
body[data-rj-page="dashboard"] .subnavlink.active,
body[data-rj-page="dashboard"] .system-nav.active{
  background:var(--rj-primary-soft)!important;
  color:var(--rj-primary)!important;
  border-color:transparent!important;
  box-shadow:none!important;
}
body[data-rj-page="dashboard"] .navlink.active .ic{
  color:var(--rj-primary)!important;
}

/* Utilities stay neutral */
body[data-rj-page="dashboard"] .workspace-link,
body[data-rj-page="dashboard"] .workspace-link.drive,
body[data-rj-page="dashboard"] .company-menu,
body[data-rj-page="dashboard"] .syncstate{
  background:#fff!important;
  color:var(--rj-text)!important;
  border-color:var(--rj-line)!important;
  box-shadow:none!important;
}

/* ---------- EXPENSE REGISTER ---------- */
body[data-rj-page="dashboard"] #page-expenses .expense-status-tab{
  background:transparent!important;
  color:var(--rj-muted)!important;
  box-shadow:none!important;
}
body[data-rj-page="dashboard"] #page-expenses .expense-status-tab.active{
  background:var(--rj-primary-soft)!important;
  color:var(--rj-primary)!important;
}
body[data-rj-page="dashboard"] #page-expenses .expense-status-tab.active .count{
  background:#fff!important;
  color:var(--rj-primary)!important;
  border:1px solid #dfe3ff!important;
}
body[data-rj-page="dashboard"] #page-expenses #manualExpenseCreate,
body[data-rj-page="dashboard"] #page-expenses #manualExpenseCreate.btn.solid{
  background:var(--rj-primary)!important;
  border-color:var(--rj-primary)!important;
  color:#fff!important;
}
body[data-rj-page="dashboard"] #page-expenses #vendorRequisitionCreate{
  background:#fff!important;
  color:var(--rj-text)!important;
  border-color:var(--rj-line-strong)!important;
}

/* Status chip body is always neutral. Meaning = tiny dot only. */
body[data-rj-page="dashboard"] #page-expenses .expense-state,
body[data-rj-page="dashboard"] #page-expenses .expense-state.paid,
body[data-rj-page="dashboard"] #page-expenses .expense-state.needs-action,
body[data-rj-page="dashboard"] #page-expenses .expense-state.waiting-payment{
  background:var(--rj-soft)!important;
  color:#475467!important;
  border-color:transparent!important;
}

/* ---------- BATCH / REIMBURSEMENT ---------- */

/* Cash position: MONEY IS NOT A STATUS.
   Positive normal balances must never be bright green. */
body[data-rj-page="dashboard"] #page-batches .cash-position-summary strong,
body[data-rj-page="dashboard"] #page-batches .cash-position-summary .positive strong,
body[data-rj-page="dashboard"] #page-batches .cash-account-balance,
body[data-rj-page="dashboard"] #page-batches .cash-account-balance.positive,
body[data-rj-page="dashboard"] #page-batches .cash-account-card.positive .cash-account-balance,
body[data-rj-page="dashboard"] #page-batches .finance-balance-inline strong,
body[data-rj-page="dashboard"] #page-batches .finance-balance-inline.positive strong{
  color:var(--rj-ink)!important;
}
/* Negative balance is a true exception / attention state. */
body[data-rj-page="dashboard"] #page-batches .cash-position-summary .negative strong,
body[data-rj-page="dashboard"] #page-batches .cash-account-balance.negative,
body[data-rj-page="dashboard"] #page-batches .cash-account-card.negative .cash-account-balance,
body[data-rj-page="dashboard"] #page-batches .finance-balance-inline.negative strong{
  color:var(--rj-danger)!important;
}

/* Status navigator: white cards, indigo only on selected item */
body[data-rj-page="dashboard"] #page-batches .acct-status-strip button{
  background:#fff!important;
  color:var(--rj-muted)!important;
  border-color:var(--rj-line)!important;
  box-shadow:none!important;
}
body[data-rj-page="dashboard"] #page-batches .acct-status-strip button.active,
body[data-rj-page="dashboard"] #page-batches .acct-status-strip button.on,
body[data-rj-page="dashboard"] #page-batches .acct-status-strip button[aria-pressed="true"]{
  background:#fff!important;
  border-color:#a5b4fc!important;
  box-shadow:0 0 0 1px #c7d2fe inset!important;
}
body[data-rj-page="dashboard"] #page-batches .acct-status-strip button.active strong,
body[data-rj-page="dashboard"] #page-batches .acct-status-strip button.active span,
body[data-rj-page="dashboard"] #page-batches .acct-status-strip button.on strong,
body[data-rj-page="dashboard"] #page-batches .acct-status-strip button.on span{
  color:var(--rj-primary)!important;
}

/* Repeated row actions must be quiet.
   A table with 20 rows must not create 20 brand-colored CTAs. */
body[data-rj-page="dashboard"] #page-batches .acct-master-table .btn,
body[data-rj-page="dashboard"] #page-batches .acct-master-table .btn.solid,
body[data-rj-page="dashboard"] #page-batches .acct-master-table .btn.primary-next,
body[data-rj-page="dashboard"] #page-batches .acct-master-table .acct-next .btn.primary-next,
body[data-rj-page="dashboard"] #page-batches .acct-master-table .payment-proof-link,
body[data-rj-page="dashboard"] #page-batches .acct-master-table .drawer-links a{
  background:#fff!important;
  color:var(--rj-text)!important;
  border-color:var(--rj-line-strong)!important;
  box-shadow:none!important;
}
body[data-rj-page="dashboard"] #page-batches .acct-master-table .btn:hover,
body[data-rj-page="dashboard"] #page-batches .acct-master-table .payment-proof-link:hover,
body[data-rj-page="dashboard"] #page-batches .acct-master-table .drawer-links a:hover{
  background:#f8fafc!important;
  color:var(--rj-ink)!important;
  border-color:#b8c0cc!important;
}

/* Main page action remains the ONE filled action */
body[data-rj-page="dashboard"] #page-batches #batchMasterCreate,
body[data-rj-page="dashboard"] #page-batches #mobileBatchDockCreate{
  background:var(--rj-primary)!important;
  color:#fff!important;
  border-color:var(--rj-primary)!important;
}

/* Batch status = neutral body + semantic dot */
body[data-rj-page="dashboard"] #page-batches .master-status,
body[data-rj-page="dashboard"] #page-batches .master-status.review,
body[data-rj-page="dashboard"] #page-batches .master-status.correction,
body[data-rj-page="dashboard"] #page-batches .master-status.rejected,
body[data-rj-page="dashboard"] #page-batches .master-status.payment,
body[data-rj-page="dashboard"] #page-batches .master-status.proof,
body[data-rj-page="dashboard"] #page-batches .master-status.missing,
body[data-rj-page="dashboard"] #page-batches .master-status.paid{
  position:relative!important;
  display:inline-flex!important;
  align-items:center!important;
  gap:6px!important;
  background:var(--rj-soft)!important;
  color:#475467!important;
  border:0!important;
  box-shadow:none!important;
}
body[data-rj-page="dashboard"] #page-batches .master-status::before{
  content:""!important;
  display:inline-block!important;
  width:6px!important;
  height:6px!important;
  flex:0 0 6px!important;
  border-radius:50%!important;
  background:#98a2b3!important;
}
body[data-rj-page="dashboard"] #page-batches .master-status.review::before,
body[data-rj-page="dashboard"] #page-batches .master-status.proof::before{
  background:var(--rj-primary)!important;
}
body[data-rj-page="dashboard"] #page-batches .master-status.correction::before,
body[data-rj-page="dashboard"] #page-batches .master-status.rejected::before,
body[data-rj-page="dashboard"] #page-batches .master-status.missing::before{
  background:var(--rj-danger)!important;
}
body[data-rj-page="dashboard"] #page-batches .master-status.payment::before{
  background:var(--rj-warning)!important;
}
body[data-rj-page="dashboard"] #page-batches .master-status.paid::before{
  background:var(--rj-success)!important;
}

/* Priority = neutral body + small signal */
body[data-rj-page="dashboard"] #page-batches .acct-priority,
body[data-rj-page="dashboard"] #page-batches .acct-priority.urgent{
  background:var(--rj-soft)!important;
  color:#475467!important;
  border:0!important;
}
body[data-rj-page="dashboard"] #page-batches .acct-priority.urgent::before{
  content:""!important;
  display:inline-block!important;
  width:6px!important;
  height:6px!important;
  border-radius:50%!important;
  background:var(--rj-warning)!important;
  color:transparent!important;
}

/* Evidence links are actions, not success statuses */
body[data-rj-page="dashboard"] #page-batches .payment-proof-link{
  background:#fff!important;
  color:var(--rj-text)!important;
  border-color:var(--rj-line-strong)!important;
}
body[data-rj-page="dashboard"] #page-batches .drawer-links a.main-claim-link{
  background:var(--rj-primary-soft)!important;
  color:var(--rj-primary)!important;
  border-color:#c7d2fe!important;
}

/* Table row background never uses semantic colors */
body[data-rj-page="dashboard"] #page-batches .acct-master-table tbody tr,
body[data-rj-page="dashboard"] #page-batches .acct-master-table tbody tr td,
body[data-rj-page="dashboard"] #page-batches .acct-master-table tbody tr.row-paid td,
body[data-rj-page="dashboard"] #page-batches .acct-master-table tbody tr.row-correction td{
  background:#fff!important;
}
body[data-rj-page="dashboard"] #page-batches .acct-master-table tbody tr:hover td{
  background:#fafbff!important;
}

/* Document readiness: graphite meter; red is only the tiny error signal */
body[data-rj-page="dashboard"] #page-batches .acct-doc-meter{
  background:#edf0f4!important;
}
body[data-rj-page="dashboard"] #page-batches .acct-doc-meter i{
  background:#475467!important;
}
body[data-rj-page="dashboard"] #page-batches .acct-doc-state.bad i{
  background:#475467!important;
}
body[data-rj-page="dashboard"] #page-batches .acct-doc-state.bad span,
body[data-rj-page="dashboard"] #page-batches .acct-issue.bad,
body[data-rj-page="dashboard"] #page-batches .acct-line-fail{
  color:#475467!important;
}

/* ---------- TABLES: REPEATED ACTIONS ARE NEUTRAL EVERYWHERE ---------- */
body[data-rj-page="dashboard"] table .btn.solid,
body[data-rj-page="dashboard"] table .btn.primary-next,
body[data-rj-page="dashboard"] table .payment-proof-link{
  background:#fff!important;
  color:var(--rj-text)!important;
  border-color:var(--rj-line-strong)!important;
}

/* ---------- MODALS / DRAWERS ----------
   One main confirm action can be indigo.
   Destructive stays outline red. */
body[data-rj-page="dashboard"] .acct-drawer-footer .btn.solid,
body[data-rj-page="dashboard"] .acct-dialog-footer .btn.solid,
body[data-rj-page="dashboard"] .manual-expense-card button[type="submit"]{
  background:var(--rj-primary)!important;
  color:#fff!important;
  border-color:var(--rj-primary)!important;
}
body[data-rj-page="dashboard"] .btn.danger,
body[data-rj-page="dashboard"] .acct-drawer-footer .btn.danger,
body[data-rj-page="dashboard"] .acct-dialog-footer .btn.danger{
  background:#fff!important;
  color:var(--rj-danger)!important;
  border-color:#f0b7b2!important;
}

/* ---------- OVERVIEW ----------
   The overview is the only place allowed one large branded surface. */
body[data-rj-page="dashboard"] #page-overview .kpi.hero{
  background:linear-gradient(135deg,#4f46e5 0%,#3730a3 100%)!important;
  color:#fff!important;
  border-color:transparent!important;
}
body[data-rj-page="dashboard"] #page-overview .kpi:not(.hero){
  background:#fff!important;
}

/* ---------- STANDALONE PAGES ----------
   Keep the same product language without forcing business/bank logos. */
body:not([data-rj-page="dashboard"]) .brand-mark:not(.has-image),
body:not([data-rj-page="dashboard"]) .brandmark:not(.has-image),
body:not([data-rj-page="dashboard"]) .mark:not(.has-image){
  background:var(--rj-primary)!important;
  color:#fff!important;
}
body:not([data-rj-page="dashboard"]) table .pill,
body:not([data-rj-page="dashboard"]) .status-pill{
  background:var(--rj-soft)!important;
  color:#475467!important;
}

/* Real bank/company logos keep their own identity. */
.finance-account-icon.has-bank-logo,
.bank-logo-img,
.logo.has-image,
.company-avatar.has-image,
.business-switcher-avatar.has-image,
.who .av.has-image{
  filter:none!important;
}

/* No hover should introduce black surfaces again */
body[data-rj-page="dashboard"] .btn:not(.solid):hover,
body[data-rj-page="dashboard"] .workspace-link:hover,
body[data-rj-page="dashboard"] .drawer-links a:hover{
  background:#f8fafc!important;
  color:var(--rj-ink)!important;
  border-color:#b8c0cc!important;
  transform:none!important;
}
`;

fs.writeFileSync(cssPath, css, "utf8");

const htmlPages = [
  ["index.html","dashboard"],
  ["admin.html","admin"],
  ["billing-admin.html","billing-admin"],
  ["files.html","files"],
  ["pilot.html","pilot"],
  ["receipt.html","receipt"],
  ["checklist.html","checklist"],
];

for (const [name,page] of htmlPages) {
  const file = path.join(root,name);
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file,"utf8");

  // remove older v7.94 copies if rerun
  html = html.replace(/\s*<link[^>]+ci-lock\.css[^>]*>\s*/gi,"\n");

  // ensure page marker exists
  html = html.replace(/<body([^>]*)>/i,(m,attrs)=>{
    const clean = String(attrs||"").replace(/\sdata-rj-page=(["']).*?\1/i,"");
    return `<body${clean} data-rj-page="${page}">`;
  });

  html = html.replace(/<\/head>/i,`<link rel="stylesheet" href="./assets/ci-lock.css?v=7.94.20260819">\n</head>`);

  // dashboard JS changed by this patch: force browser refresh
  if (name === "index.html") {
    html = html.replace(
      /\.\/assets\/dashboard\.js\?v=[^"']+/g,
      "./assets/dashboard.js?v=7.94.20260819"
    );
  }

  fs.writeFileSync(file,html,"utf8");
}

/* Dashboard has many historical runtime style injectors.
   Keep CI lock physically LAST in <head>, even if a legacy patch inserts CSS later. */
if (fs.existsSync(dashJsPath)) {
  let js = fs.readFileSync(dashJsPath,"utf8");
  const runtimeMark = "RUBJAI_CI_VISUAL_LOCK_RUNTIME_V794";

  if (!js.includes(runtimeMark)) {
    js += `

/* ${runtimeMark} */
(() => {
  "use strict";
  const ID = "rubjai-ci-lock-v794";
  let moving = false;

  function ensureLast(){
    let link = document.getElementById(ID);
    if(!link){
      link = document.createElement("link");
      link.id = ID;
      link.rel = "stylesheet";
      link.href = "./assets/ci-lock.css?v=7.94.20260819";
      document.head.appendChild(link);
      return;
    }
    if(document.head.lastElementChild !== link && !moving){
      moving = true;
      document.head.appendChild(link);
      queueMicrotask(() => { moving = false; });
    }
  }

  const install = () => {
    ensureLast();
    const observer = new MutationObserver((mutations) => {
      if(moving) return;
      const addedVisualCss = mutations.some(m =>
        [...m.addedNodes].some(n =>
          n && n.nodeType === 1 &&
          (n.tagName === "STYLE" || (n.tagName === "LINK" && n.rel === "stylesheet")) &&
          n.id !== ID
        )
      );
      if(addedVisualCss) ensureLast();
    });
    observer.observe(document.head,{childList:true});
    setTimeout(ensureLast,50);
    setTimeout(ensureLast,500);
    setTimeout(ensureLast,1800);
  };

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded",install,{once:true});
  }else{
    install();
  }
})();`;
  }

  fs.writeFileSync(dashJsPath,js,"utf8");
  execFileSync(process.execPath,["--check",dashJsPath],{stdio:"inherit"});
}

console.log(`✅ ${MARK}`);
console.log("✅ positive cash balances are neutral");
console.log("✅ table row actions are neutral");
console.log("✅ only page/section primary CTA uses indigo");
console.log("✅ semantic colors reduced to status signals");
console.log("✅ ci-lock.css kept last at runtime");
