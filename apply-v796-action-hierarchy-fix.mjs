import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "RUBJAI_ACTION_HIERARCHY_V7_96_20260819";
const indexPath = path.join(root, "index.html");
const jsPath = path.join(root, "assets", "dashboard.js");
const cssPath = path.join(root, "assets", "ci-actions-v796.css");

if (!fs.existsSync(indexPath)) throw new Error("v7.96 missing index.html");
if (!fs.existsSync(jsPath)) throw new Error("v7.96 missing assets/dashboard.js");

const css = `
/* ${MARK}
   Button hierarchy:
   - Indigo = one primary page-level action
   - Outline = secondary/repeated table actions
   - No navy/black filled controls
*/
:root{
  --rj-primary:#4f46e5;
  --rj-primary-hover:#4338ca;
  --rj-primary-soft:#eef2ff;
  --rj-ink:#101828;
  --rj-text:#344054;
  --rj-line:#d0d5dd;
}

/* 1) EXPENSE PAGE — page-level primary CTA */
html body #page-expenses #manualExpenseCreate,
html body #manualExpenseCreate{
  background:#4f46e5 !important;
  background-image:none !important;
  color:#fff !important;
  border:1px solid #4f46e5 !important;
  box-shadow:none !important;
}
html body #page-expenses #manualExpenseCreate:hover,
html body #manualExpenseCreate:hover{
  background:#4338ca !important;
  border-color:#4338ca !important;
  color:#fff !important;
}

/* Secondary CTA beside it stays quiet */
html body #page-expenses #vendorRequisitionCreate,
html body #vendorRequisitionCreate{
  background:#fff !important;
  background-image:none !important;
  color:#344054 !important;
  border:1px solid #d0d5dd !important;
  box-shadow:none !important;
}
html body #vendorRequisitionCreate:hover{
  background:#f8fafc !important;
  color:#101828 !important;
  border-color:#b8c0cc !important;
}

/* 2) BATCH TABLE — repeated row actions must NOT look like the page primary */
html body #page-batches .acct-master-table .acct-next .primary-next,
html body #page-batches .acct-master-table .acct-next .btn.solid.primary-next,
html body #page-batches .acct-next .primary-next{
  background:#fff !important;
  background-image:none !important;
  color:#344054 !important;
  border:1px solid #d0d5dd !important;
  box-shadow:none !important;
}
html body #page-batches .acct-master-table .acct-next .primary-next:hover,
html body #page-batches .acct-next .primary-next:hover{
  background:#f8fafc !important;
  color:#101828 !important;
  border-color:#b8c0cc !important;
}

/* Important action stays visible through text/weight, not a black fill */
html body #page-batches .acct-next button{
  font-weight:600 !important;
}

/* 3) HELP / HOW-TO — neutral utility control */
html body .ci-help-trigger-v796{
  background:#fff !important;
  background-image:none !important;
  color:#101828 !important;
  border:1px solid #d0d5dd !important;
  box-shadow:none !important;
}
html body .ci-help-trigger-v796:hover{
  background:#f8fafc !important;
  border-color:#b8c0cc !important;
}
html body .ci-help-trigger-v796::before{
  background:#eef2ff !important;
  color:#4f46e5 !important;
  border-color:#dfe3ff !important;
}
html body .ci-help-trigger-v796 .ci-help-icon-v796,
html body .ci-help-trigger-v796 > span:first-child{
  background:#eef2ff !important;
  color:#4f46e5 !important;
  border-color:#dfe3ff !important;
  box-shadow:none !important;
}

/* Usage guide modal itself: active state uses brand, not black */
html body .usage-guide-tab-v746.active{
  background:#eef2ff !important;
  color:#4f46e5 !important;
  border-color:transparent !important;
  box-shadow:none !important;
}

/* Safety net: old dark page action selectors */
html body #page-expenses .manual-expense-head-actions .btn.solid{
  background:#4f46e5 !important;
  border-color:#4f46e5 !important;
  color:#fff !important;
}
`;

fs.writeFileSync(cssPath, css, "utf8");

/* Inject stylesheet after all older CI layers. */
let html = fs.readFileSync(indexPath, "utf8");
html = html.replace(/\s*<link[^>]+ci-actions-v796\.css[^>]*>\s*/gi, "\n");
html = html.replace(
  /<\/head>/i,
  `<link rel="stylesheet" href="./assets/ci-actions-v796.css?v=7.96.20260819">\n</head>`
);
html = html.replace(
  /\.\/assets\/dashboard\.js\?v=[^"']+/g,
  "./assets/dashboard.js?v=7.96.20260819"
);
fs.writeFileSync(indexPath, html, "utf8");

/* Runtime audit for dynamic buttons whose markup is regenerated. */
let js = fs.readFileSync(jsPath, "utf8");
const RUNTIME = "RUBJAI_ACTION_HIERARCHY_RUNTIME_V796";

if (!js.includes(RUNTIME)) {
  js += `

/* ${RUNTIME} */
(() => {
  "use strict";

  const PRIMARY = "#4f46e5";
  const PRIMARY_HOVER = "#4338ca";
  const TEXT = "#344054";
  const LINE = "#d0d5dd";

  function important(node, prop, value){
    try{ node?.style?.setProperty(prop, value, "important"); }catch{}
  }

  function outline(node){
    if(!node) return;
    important(node,"background","#fff");
    important(node,"background-image","none");
    important(node,"color",TEXT);
    important(node,"border","1px solid "+LINE);
    important(node,"box-shadow","none");
  }

  function primary(node){
    if(!node) return;
    important(node,"background",PRIMARY);
    important(node,"background-image","none");
    important(node,"color","#fff");
    important(node,"border","1px solid "+PRIMARY);
    important(node,"box-shadow","none");
  }

  function text(node){
    return String(node?.textContent || node?.value || node?.getAttribute?.("aria-label") || "")
      .replace(/\\s+/g," ")
      .trim();
  }

  function audit(){
    /* Page-level expense actions */
    primary(document.getElementById("manualExpenseCreate"));
    outline(document.getElementById("vendorRequisitionCreate"));

    /* Every repeated action in accounting table is secondary. */
    document.querySelectorAll("#page-batches .acct-next button, #page-batches .acct-next a")
      .forEach(outline);

    /* Help control in the header: remove dark/navy icon/button treatment. */
    document.querySelectorAll("button,a,[role=button]").forEach(node=>{
      const t=text(node);
      if(/วิธีใช้(?:งาน)?(?:หน้านี้|งานนี้)?|วิธีใช้งาน/.test(t)){
        node.classList.add("ci-help-trigger-v796");
        outline(node);

        const candidates=[...node.querySelectorAll("span,i,b,svg")];
        const first=candidates[0];
        if(first){
          first.classList.add("ci-help-icon-v796");
          important(first,"background","#eef2ff");
          important(first,"color",PRIMARY);
          important(first,"box-shadow","none");
        }
      }
    });
  }

  function install(){
    audit();
    const obs = new MutationObserver(()=>audit());
    obs.observe(document.body,{subtree:true,childList:true});
    [50,250,700,1500,3000].forEach(ms=>setTimeout(audit,ms));
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",install,{once:true});
  }else{
    install();
  }

  console.info("${RUNTIME}");
})();`;
}

fs.writeFileSync(jsPath, js, "utf8");
execFileSync(process.execPath, ["--check", jsPath], {stdio:"inherit"});

console.log("✅ " + MARK);
console.log("✅ + บันทึกรายจ่าย = Indigo primary");
console.log("✅ + ตั้งเบิก = neutral outline");
console.log("✅ ตรวจเอกสาร / เพิ่มข้อมูลบัญชี / ดูรายละเอียด = neutral outline");
console.log("✅ วิธีใช้หน้านี้ = neutral utility + Indigo-soft icon");
console.log("✅ usage guide active tab no longer black");
