import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "RUBJAI_CI_AUDIT_FIX_V7_95_20260819";
const cssPath = path.join(root, "assets", "ci-final.css");
const dashJsPath = path.join(root, "assets", "dashboard.js");

const css = `/* ${MARK} */
:root{
  --rj-bg:#f7f8fc;--rj-surface:#fff;--rj-soft:#f2f4f7;--rj-ink:#101828;
  --rj-text:#344054;--rj-muted:#667085;--rj-muted-2:#98a2b3;--rj-line:#e4e7ec;
  --rj-line-strong:#d0d5dd;--rj-primary:#4f46e5;--rj-primary-hover:#4338ca;
  --rj-primary-soft:#eef2ff;--rj-success:#16a34a;--rj-warning:#d97706;--rj-danger:#d92d20;
}
html,body{background:var(--rj-bg)!important;color:var(--rj-ink)!important}
body,button,input,select,textarea{font-family:"IBM Plex Sans Thai",-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}
.head-kicker,.company-eyebrow,.billing-kicker,.pricing-name{color:var(--rj-muted)!important}
.workspace-link.drive,.connbtn:not(.ok),.company-menu,.syncstate,.btn:not(.solid):not(.primary):not(.danger){background:#fff!important;color:var(--rj-text)!important;border-color:var(--rj-line-strong)!important;box-shadow:none!important}
.btn.solid,.btn.primary,button[type="submit"],.control-action.primary,.income-action.primary,.acct7-btn.primary,.plan-action.primary,.system-upgrade-btn,#manualExpenseCreate,#batchMasterCreate,#mobileBatchDockCreate{background:var(--rj-primary)!important;background-image:none!important;border-color:var(--rj-primary)!important;color:#fff!important;box-shadow:none!important}
.btn.solid:hover,.btn.primary:hover,button[type="submit"]:hover,.control-action.primary:hover,.income-action.primary:hover,.acct7-btn.primary:hover,.plan-action.primary:hover,.system-upgrade-btn:hover,#manualExpenseCreate:hover,#batchMasterCreate:hover,#mobileBatchDockCreate:hover{background:var(--rj-primary-hover)!important;border-color:var(--rj-primary-hover)!important;color:#fff!important}

/* Sidebar */
.sidebar{background:#fbfcfe!important;border-color:var(--rj-line)!important}
.navlink.active,.subnavlink.active,.system-nav.active{background:var(--rj-primary-soft)!important;color:var(--rj-primary)!important;border-color:transparent!important;box-shadow:none!important}
.navlink.active .ic{color:var(--rj-primary)!important}
.business-group .ci-neutral-badge,.business-group [class*="badge"],.business-group [class*="pill"]{background:var(--rj-soft)!important;color:#475467!important;border-color:transparent!important;box-shadow:none!important}

/* Overview trial banner */
.beta-plan-banner{background:#fff!important;border-color:var(--rj-line)!important;box-shadow:none!important}
.beta-plan-badge{background:var(--rj-primary-soft)!important;color:var(--rj-primary)!important;border:1px solid #dfe3ff!important;box-shadow:none!important}

/* Billing: fix old white text left over from dark hero */
.billing-hero,.billing-current,.billing-usage-card{background:#fff!important;color:var(--rj-ink)!important;border-color:var(--rj-line)!important;box-shadow:0 1px 2px rgba(16,24,40,.02),0 8px 24px rgba(16,24,40,.035)!important}
.billing-current{min-height:176px!important;padding:24px 26px!important;background-image:none!important}
.billing-current::after{display:none!important;content:none!important}
.billing-current h3,.billing-current .billing-trial strong{color:var(--rj-ink)!important}
.billing-current p,.billing-current .billing-kicker,.billing-current .billing-trial,.billing-current .billing-trial span{color:var(--rj-muted)!important}
.billing-current .billing-request{background:#fafbfc!important;border-color:var(--rj-line)!important;color:var(--rj-muted)!important}
.billing-meter{background:#edf0f4!important}.billing-meter span{background:var(--rj-primary)!important}

/* Pricing */
.pricing-card{background:#fff!important;border:1px solid var(--rj-line)!important;box-shadow:0 1px 2px rgba(16,24,40,.02),0 8px 24px rgba(16,24,40,.035)!important}
.pricing-card.recommended{border:1.5px solid #a5b4fc!important;box-shadow:0 0 0 1px #e0e7ff inset!important}
.pricing-ribbon{background:var(--rj-primary-soft)!important;color:var(--rj-primary)!important;border:1px solid #dfe3ff!important}
.pricing-docs{background:#f7f8fa!important}.pricing-features li::before{color:var(--rj-muted)!important}
.pricing-card .plan-action{background:#fff!important;color:var(--rj-text)!important;border-color:var(--rj-line-strong)!important}
.pricing-card.recommended .plan-action,.pricing-card .plan-action.primary{background:var(--rj-primary)!important;color:#fff!important;border-color:var(--rj-primary)!important}
.pricing-card .plan-action:disabled{background:#f8fafc!important;color:var(--rj-muted-2)!important;border-color:var(--rj-line)!important}

/* Finance channel master */
.finance-master-intro,.finance-account-card,.finance-empty{background:#fff!important;border-color:var(--rj-line)!important;box-shadow:none!important}
.finance-flow span{background:var(--rj-soft)!important;color:#475467!important;border-color:var(--rj-line)!important}
.finance-account-icon:not(.has-bank-logo),.recon-account-logo:not(.has-bank-logo){background:var(--rj-primary-soft)!important;color:var(--rj-primary)!important;border:1px solid #dfe3ff!important;box-shadow:none!important}
.finance-badge{background:var(--rj-soft)!important;color:#475467!important;border:0!important}.finance-badge.default{background:var(--rj-primary-soft)!important;color:var(--rj-primary)!important}
.finance-balance-inline{background:#f7f8fa!important}
.finance-balance-inline strong,.finance-balance-inline.positive strong,.cash-position-summary strong,.cash-position-summary .positive strong,.cash-account-balance,.cash-account-balance.positive,.cash-account-card.positive .cash-account-balance{color:var(--rj-ink)!important}
.finance-balance-inline.negative strong,.cash-position-summary .negative strong,.cash-account-balance.negative,.cash-account-card.negative .cash-account-balance{color:var(--rj-danger)!important}

/* Reconciliation */
.recon-account-card,.recon-account-card.active,.recon-account-hero,.recon-kpi,.recon-kpi.active,.recon-import-card,.recon-table-card{background:#fff!important;color:var(--rj-ink)!important;border-color:var(--rj-line)!important;box-shadow:none!important}
.recon-account-card.active,.recon-kpi.active{border-color:#a5b4fc!important;box-shadow:0 0 0 1px #c7d2fe inset!important}
.recon-account-card small,.recon-account-card.active small,.recon-account-card.active p,.recon-account-card.active span:not(.count){color:var(--rj-muted)!important}
.recon-account-card .count,.recon-account-card.active .count{background:var(--rj-soft)!important;color:#475467!important}
.recon-account-card.active .count{background:var(--rj-primary-soft)!important;color:var(--rj-primary)!important}
.recon-kpi.active span,.recon-kpi.active strong{color:var(--rj-primary)!important}
.recon-warning{background:#fff!important;color:var(--rj-muted)!important;border:1px solid var(--rj-line)!important;border-left:1px solid var(--rj-line)!important;box-shadow:none!important}
.recon-warning::before{content:""!important;width:6px!important;height:6px!important;border-radius:50%!important;background:var(--rj-warning)!important;flex:0 0 6px!important}

/* Repeated status language */
.status-pill,.pill,.badge,.master-status,.expense-state,.batch-status,.chip{background:var(--rj-soft)!important;color:#475467!important;border-color:transparent!important;box-shadow:none!important}

/* Table actions stay quiet */
.acct-master-table tbody tr,.acct-master-table tbody tr td,.acct-master-table tbody tr.row-paid td,.acct-master-table tbody tr.row-correction td{background:#fff!important}
.acct-master-table tbody tr:hover td{background:#fafbff!important}
.acct-master-table .btn,.acct-master-table .btn.solid,.acct-master-table .btn.primary-next,.acct-master-table .payment-proof-link{background:#fff!important;color:var(--rj-text)!important;border-color:var(--rj-line-strong)!important;box-shadow:none!important}
.acct-master-table .btn:hover,.acct-master-table .payment-proof-link:hover{background:#f8fafc!important;color:var(--rj-ink)!important;border-color:#b8c0cc!important}

/* Keep true logos untouched */
.finance-account-icon.has-bank-logo,.bank-logo-img,.logo.has-image,.company-avatar.has-image,.business-switcher-avatar.has-image,.who .av.has-image{filter:none!important}
`;

fs.writeFileSync(cssPath, css, "utf8");

const htmlPages = [["index.html","dashboard"],["admin.html","admin"],["billing-admin.html","billing-admin"],["files.html","files"],["pilot.html","pilot"],["receipt.html","receipt"],["checklist.html","checklist"]];
for (const [name,page] of htmlPages) {
  const file = path.join(root,name); if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file,"utf8");
  html = html.replace(/\s*<link[^>]+ci-final\.css[^>]*>\s*/gi,"\n");
  html = html.replace(/<body([^>]*)>/i,(m,attrs)=>{const clean=String(attrs||"").replace(/\sdata-rj-page=(["']).*?\1/i,"");return `<body${clean} data-rj-page="${page}">`;});
  html = html.replace(/<\/head>/i,`<link rel="stylesheet" href="./assets/ci-final.css?v=7.95.20260819">\n</head>`);
  if(name==="index.html") html = html.replace(/\.\/assets\/dashboard\.js\?v=[^"']+/g,"./assets/dashboard.js?v=7.95.20260819");
  fs.writeFileSync(file,html,"utf8");
}

if (fs.existsSync(dashJsPath)) {
  let js = fs.readFileSync(dashJsPath,"utf8");
  const runtimeMark = "RUBJAI_CI_AUDIT_RUNTIME_V795";
  if(!js.includes(runtimeMark)){
    js += `\n\n/* ${runtimeMark} */\n(()=>{\n  \"use strict\";\n  const STYLE_ID=\"rubjai-ci-final-v795\";let moving=false;\n  function ensureLast(){let link=document.getElementById(STYLE_ID);if(!link){link=document.createElement(\"link\");link.id=STYLE_ID;link.rel=\"stylesheet\";link.href=\"./assets/ci-final.css?v=7.95.20260819\";document.head.appendChild(link);return;}if(document.head.lastElementChild!==link&&!moving){moving=true;document.head.appendChild(link);queueMicrotask(()=>moving=false);}}\n  function auditDom(){\n    const businessMenu=document.getElementById(\"businessMenu\");\n    if(businessMenu) businessMenu.querySelectorAll(\"span,b,small,i\").forEach(n=>{if(String(n.textContent||\"\").trim()===\"หลายกลุ่ม\")n.classList.add(\"ci-neutral-badge\");});\n    const warning=document.querySelector(\"#page-reconciliation .recon-warning\");\n    if(warning){const copy=String(warning.textContent||\"\").replace(/ไปหน้าเบิกจ่าย/g,\"\").replace(/\\s+/g,\" \" ).trim();warning.hidden=!copy;}\n  }\n  function install(){ensureLast();auditDom();new MutationObserver(m=>{if(moving)return;const added=m.some(x=>[...x.addedNodes].some(n=>n&&n.nodeType===1&&(n.tagName===\"STYLE\"||(n.tagName===\"LINK\"&&n.rel===\"stylesheet\"))&&n.id!==STYLE_ID));if(added)ensureLast();}).observe(document.head,{childList:true});new MutationObserver(auditDom).observe(document.body,{childList:true,subtree:true});[50,300,900,1800].forEach(ms=>setTimeout(()=>{ensureLast();auditDom();},ms));}\n  if(document.readyState===\"loading\")document.addEventListener(\"DOMContentLoaded\",install,{once:true});else install();\n  console.info(\"${runtimeMark}\");\n})();`;
  }
  fs.writeFileSync(dashJsPath,js,"utf8");
  execFileSync(process.execPath,["--check",dashJsPath],{stdio:"inherit"});
}

console.log(`✅ ${MARK}`);
console.log("✅ fixed billing white-on-white");
console.log("✅ fixed reconciliation active detail");
console.log("✅ neutralized finance balances/badges");
console.log("✅ removed black trial/recommended badges");
console.log("✅ hides orphan recon warning");
