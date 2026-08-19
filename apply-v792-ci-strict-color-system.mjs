import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const dashboardFile = path.join(root, "assets", "dashboard.js");
const indexFile = path.join(root, "index.html");
const MARK = "RUBJAI_CI_STRICT_COLOR_SYSTEM_V7_92_20260819";

for (const f of [dashboardFile, indexFile]) {
  if (!fs.existsSync(f)) throw new Error(`v7.92 missing ${f}`);
}

let js = fs.readFileSync(dashboardFile, "utf8");
let html = fs.readFileSync(indexFile, "utf8");

if (!js.includes(MARK)) {
  js += `

/* ${MARK} */
(() => {
  "use strict";

  /* IMPORTANT:
     Several older UI patches inject <style> tags at runtime.
     This IIFE is appended LAST in dashboard.js, so this stylesheet
     is also appended LAST and becomes the final visual authority.
  */
  const old = document.getElementById("rubjai-ci-strict-v792");
  if (old) old.remove();

  const style = document.createElement("style");
  style.id = "rubjai-ci-strict-v792";
  style.textContent = \`
    :root{
      --rj-primary:#4f46e5;
      --rj-primary-hover:#4338ca;
      --rj-primary-soft:#eef2ff;
      --rj-ink:#101828;
      --rj-text:#344054;
      --rj-muted:#667085;
      --rj-line:#e4e7ec;
      --rj-soft:#f2f4f7;
      --rj-success:#16a34a;
      --rj-warning:#d97706;
      --rj-danger:#dc2626;
    }

    /* =========================================================
       GLOBAL COLOR BUDGET
       Black = typography only. Never a permanent UI surface.
       ========================================================= */

    /* Primary actions = one CI color */
    .btn.solid,
    #manualExpenseCreate,
    .control-action.primary,
    .system-upgrade-btn,
    .connbtn:not(.ok),
    .manual-expense-pay-btn,
    .manual800-paid,
    .acct-next .btn.primary-next,
    .acct-bulk-actions .btn.solid,
    .income-action.primary,
    .acct7-btn.primary{
      background:var(--rj-primary)!important;
      background-image:none!important;
      border-color:var(--rj-primary)!important;
      color:#fff!important;
      box-shadow:none!important;
    }
    .btn.solid:hover,
    #manualExpenseCreate:hover,
    .control-action.primary:hover,
    .system-upgrade-btn:hover,
    .connbtn:not(.ok):hover,
    .manual-expense-pay-btn:hover,
    .manual800-paid:hover{
      background:var(--rj-primary-hover)!important;
      border-color:var(--rj-primary-hover)!important;
      color:#fff!important;
      transform:none!important;
    }

    /* Drive is a utility, not a primary CTA */
    .workspace-link.drive,
    .workspace-link.drive:hover{
      background:#fff!important;
      color:var(--rj-text)!important;
      border-color:#d0d5dd!important;
      box-shadow:none!important;
      transform:none!important;
    }
    .workspace-link.drive:hover{
      background:#f8fafc!important;
      border-color:#b8c0cc!important;
    }

    /* The approved overview may have ONE branded focus card.
       It must be indigo, never black. */
    .kpi.hero{
      background:linear-gradient(135deg,#4f46e5 0%,#3730a3 100%)!important;
      border-color:transparent!important;
      color:#fff!important;
    }

    /* Large dark panels from older settings UI -> white */
    .workspace-status-panel,
    .batch-hero,
    .doc-kpi.attention{
      background:#fff!important;
      background-image:none!important;
      color:var(--rj-ink)!important;
      border:1px solid var(--rj-line)!important;
      box-shadow:none!important;
    }
    .workspace-status-panel h3,
    .workspace-status-panel strong,
    .workspace-status-panel .workspace-owner-note strong{
      color:var(--rj-ink)!important;
    }
    .workspace-status-panel span,
    .workspace-status-panel p,
    .workspace-status-panel .workspace-paths{
      color:var(--rj-muted)!important;
    }
    .workspace-status-head,
    .workspace-status-facts>div{
      border-color:#edf0f4!important;
    }
    .workspace-owner-note{
      background:#f8fafc!important;
    }

    /* Small old black brand blocks -> neutral or CI soft */
    .gmail-mark,
    .integration-icon,
    .integration-icon.line,
    .integration-icon.gmail,
    .control-brand,
    .control-brand.finance{
      background:var(--rj-primary-soft)!important;
      color:var(--rj-primary)!important;
      border:1px solid #e0e7ff!important;
      box-shadow:none!important;
    }
    .integration-icon.google,
    .control-brand.google{
      background:#fff!important;
      color:var(--rj-text)!important;
      border-color:var(--rj-line)!important;
    }

    .new-badge.beta,
    .sidebar-plan span,
    .business-add-btn span:last-child,
    .business-link-step b,
    .business-menu-item.current .business-menu-mark{
      background:var(--rj-primary-soft)!important;
      color:var(--rj-primary)!important;
      border-color:#e0e7ff!important;
    }
    .system-nav.active .system-dot,
    .setup-status-v51 .onboarding-progress span{
      background:var(--rj-primary)!important;
    }

    /* =========================================================
       EXPENSE REGISTER
       ========================================================= */

    /* Active tab: soft CI, not black */
    #page-expenses .expense-status-tab.active{
      background:var(--rj-primary-soft)!important;
      color:var(--rj-primary-hover)!important;
      box-shadow:none!important;
    }
    #page-expenses .expense-status-tab.active .count{
      background:#fff!important;
      color:var(--rj-primary)!important;
      border:1px solid #dfe3ff!important;
    }
    #page-expenses .expense-status-tab:hover{
      background:#f5f7fa!important;
      color:var(--rj-ink)!important;
    }

    /* Repeated green/red pills create visual noise.
       Keep the chip neutral; meaning lives in the 5px dot. */
    #page-expenses .expense-state,
    #page-expenses .expense-state.paid,
    #page-expenses .expense-state.needs-action,
    #page-expenses .expense-state.waiting-payment{
      background:var(--rj-soft)!important;
      color:#475467!important;
      border-color:transparent!important;
    }
    #page-expenses .expense-state:before{
      background:#98a2b3!important;
    }
    #page-expenses .expense-state.paid:before{
      background:var(--rj-success)!important;
    }
    #page-expenses .expense-state.needs-action:before{
      background:var(--rj-danger)!important;
    }
    #page-expenses .expense-state.waiting-payment:before{
      background:var(--rj-warning)!important;
    }

    /* Manual expense modal/runtime styles */
    .manual800-paid,
    .manual-expense-pay-btn{
      background:var(--rj-primary)!important;
      border-color:var(--rj-primary)!important;
      color:#fff!important;
    }
    .simple7792-choice.active{
      border-color:#a5b4fc!important;
      background:var(--rj-primary-soft)!important;
    }
    .simple7792-field input:focus,
    .simple7792-field select:focus,
    .simple7792-field textarea:focus,
    .manual800-field input:focus,
    .manual800-field select:focus,
    .manual800-field textarea:focus{
      border-color:#818cf8!important;
      box-shadow:0 0 0 3px rgba(79,70,229,.08)!important;
    }
    .manual-expense-toast,
    .manual800-toast{
      background:var(--rj-primary)!important;
      color:#fff!important;
    }

    /* =========================================================
       BATCHES / REQUISITION
       Included here so v7.91 is NOT required.
       ========================================================= */

    #page-batches .good,
    #page-batches .usage-good,
    #page-batches [class*="balance"] .good,
    #page-batches [class*="cash"] .good{
      color:var(--rj-ink)!important;
    }

    #page-batches .acct-status-strip button{
      background:#fff!important;
      color:var(--rj-muted)!important;
      border-color:var(--rj-line)!important;
      box-shadow:none!important;
    }
    #page-batches .acct-status-strip button::after{
      display:none!important;
      content:none!important;
    }
    #page-batches .acct-status-strip button.active,
    #page-batches .acct-status-strip button.on,
    #page-batches .acct-status-strip button[aria-pressed="true"]{
      background:#fff!important;
      border-color:#a5b4fc!important;
      box-shadow:0 0 0 1px #c7d2fe inset!important;
    }
    #page-batches .acct-status-strip button.active strong,
    #page-batches .acct-status-strip button.on strong,
    #page-batches .acct-status-strip button[aria-pressed="true"] strong,
    #page-batches .acct-status-strip button.active span,
    #page-batches .acct-status-strip button.on span,
    #page-batches .acct-status-strip button[aria-pressed="true"] span{
      color:var(--rj-primary)!important;
    }

    #page-batches .acct-priority,
    #page-batches .acct-priority.urgent{
      background:var(--rj-soft)!important;
      color:#475467!important;
      border:0!important;
    }
    #page-batches .acct-priority.urgent:before{
      content:""!important;
      width:6px!important;
      height:6px!important;
      border-radius:50%!important;
      background:var(--rj-warning)!important;
      display:inline-block!important;
      margin-right:5px!important;
    }

    #page-batches .master-status,
    #page-batches .master-status.review,
    #page-batches .master-status.correction,
    #page-batches .master-status.rejected,
    #page-batches .master-status.payment,
    #page-batches .master-status.proof,
    #page-batches .master-status.missing,
    #page-batches .master-status.paid{
      position:relative!important;
      display:inline-flex!important;
      align-items:center!important;
      gap:6px!important;
      background:var(--rj-soft)!important;
      color:#475467!important;
      border:0!important;
      box-shadow:none!important;
    }
    #page-batches .master-status::before{
      content:""!important;
      width:6px!important;
      height:6px!important;
      border-radius:50%!important;
      flex:0 0 6px!important;
      background:#98a2b3!important;
    }
    #page-batches .master-status.review::before{background:var(--rj-primary)!important}
    #page-batches .master-status.correction::before,
    #page-batches .master-status.rejected::before,
    #page-batches .master-status.missing::before{background:var(--rj-danger)!important}
    #page-batches .master-status.payment::before{background:var(--rj-warning)!important}
    #page-batches .master-status.paid::before{background:var(--rj-success)!important}

    #page-batches .acct-doc-meter{
      background:#edf0f4!important;
    }
    #page-batches .acct-doc-meter i,
    #page-batches .track .fill,
    #page-batches .operation-bar i{
      background:#475467!important;
    }

    #page-batches .acct-master-table tbody tr,
    #page-batches .acct-master-table tbody tr.row-paid,
    #page-batches .acct-master-table tbody tr.row-correction,
    #page-batches .acct-master-table tbody tr td,
    #page-batches .acct-master-table tbody tr.row-paid td,
    #page-batches .acct-master-table tbody tr.row-correction td{
      background:#fff!important;
    }
    #page-batches .acct-master-table tbody tr:hover td{
      background:#fafbfc!important;
    }

    #page-batches .acct-issue.bad,
    #page-batches .acct-line-fail{
      color:#475467!important;
      font-weight:500!important;
    }
    #page-batches .acct-issue.bad::before,
    #page-batches .acct-line-fail::before{
      content:""!important;
      display:inline-block!important;
      width:6px!important;
      height:6px!important;
      border-radius:50%!important;
      background:var(--rj-danger)!important;
      margin-right:6px!important;
      vertical-align:1px!important;
    }

    /* =========================================================
       SETTINGS / INTEGRATIONS
       ========================================================= */

    #page-settings .control-action.primary,
    #page-settings .system-upgrade-btn{
      background:var(--rj-primary)!important;
      border-color:var(--rj-primary)!important;
      color:#fff!important;
    }
    #page-settings .workspace-status-panel{
      background:#fff!important;
      color:var(--rj-ink)!important;
    }

    /* Mobile expense segmented control stays light */
    @media(max-width:820px){
      #page-expenses .expense-status-tabs{
        background:#eef0f4!important;
      }
      #page-expenses .expense-status-tab.active{
        background:#fff!important;
        color:var(--rj-primary)!important;
        box-shadow:0 1px 4px rgba(16,24,40,.06)!important;
      }
    }
  \`;

  document.head.appendChild(style);
  console.info("${MARK}");
})();`;
}

/* dashboard.js changed, so force browsers/Cloudflare to request the new JS */
html = html.replace(
  /\.\/assets\/dashboard\.js\?v=[^"']+/g,
  "./assets/dashboard.js?v=7.92.20260819"
);

fs.writeFileSync(dashboardFile, js);
fs.writeFileSync(indexFile, html);

execFileSync(process.execPath, ["--check", dashboardFile], { stdio:"inherit" });

if (!js.includes(MARK)) throw new Error("v7.92 runtime marker missing");
if (!html.includes("dashboard.js?v=7.92.20260819")) throw new Error("v7.92 JS cache-bust missing");

console.log(`✅ ${MARK}`);
console.log("✅ runtime stylesheet is appended LAST");
console.log("✅ black permanent UI surfaces removed");
console.log("✅ expense active tab + primary button now CI indigo");
console.log("✅ Drive utility button is neutral white");
console.log("✅ batch monochrome cleanup included; v7.91 not required");
