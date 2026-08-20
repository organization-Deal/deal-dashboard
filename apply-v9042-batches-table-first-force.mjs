import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const indexFile = path.join(root, "index.html");
const dashboardFile = path.join(root, "assets", "dashboard.js");
const batchFile = path.join(root, "assets", "reimbursement-batch-lock.js");
const packageFile = path.join(root, "package.json");
const SELF = "apply-v9042-batches-table-first-force.mjs";
const MARK = "RUBJAI_BATCHES_TABLE_FIRST_FORCE_V9042_20260820";

for (const file of [indexFile, dashboardFile, batchFile]) {
  if (!fs.existsSync(file)) throw new Error(`v9.04.2 missing ${path.relative(root, file)}`);
}

let html = fs.readFileSync(indexFile, "utf8");
let dashboard = fs.readFileSync(dashboardFile, "utf8");
let batches = fs.readFileSync(batchFile, "utf8");

/* ---------- destination menus / mounts ---------- */
if (!html.includes('data-biz="line"')) {
  const re = /(<button[^>]+data-biz="workflow"[^>]*>[\s\S]*?<\/button>)/;
  if (!re.test(html)) throw new Error("v9042 workflow menu anchor not found");
  html = html.replace(re, `$1
          <button class="subnavlink" data-biz="line">กลุ่ม LINE</button>`);
}

if (!html.includes('id="biz-line"')) {
  const re = /(\s*<div class="business-tab" id="biz-finance">)/;
  if (!re.test(html)) throw new Error("v9042 finance tab anchor not found");
  html = html.replace(re, `
      <div class="business-tab" id="biz-line">
        <div id="lineGroupBusinessMount"></div>
      </div>
$1`);
}

if (!html.includes('id="lineGroupBusinessMount"')) {
  html = html.replace(
    '<div class="business-tab" id="biz-line">',
    '<div class="business-tab" id="biz-line">\n        <div id="lineGroupBusinessMount"></div>'
  );
}

if (!html.includes('id="cashPositionBusinessMount"')) {
  const needle = '<div class="business-tab" id="biz-finance">';
  if (!html.includes(needle)) throw new Error("v9042 exact finance mount anchor not found");
  html = html.replace(
    needle,
    `${needle}
        <div id="cashPositionBusinessMount"></div>`
  );
}

/* Operational page copy */
html = html.replace(
  /<div class="head-kicker">ACCOUNTING WORKSPACE<\/div>\s*<h3>โต๊ะทำงานเบิกจ่าย<\/h3>\s*<p>[\s\S]*?<\/p>/,
  '<div class="head-kicker">EXPENSE REQUISITION</div><h3>เบิกจ่าย</h3><p>ตรวจ อนุมัติ และจ่ายรายการเบิกของบริษัทจากตารางเดียว</p>'
);

/* ---------- business tab routing ---------- */
dashboard = dashboard.replace(
  /if\(!opts\.bypassSetup&&!\["profile","approver","workflow","finance"\]\.includes\(tab\)&&requireCompanySetup\("business"\)\)return;/,
  'if(!opts.bypassSetup&&!["profile","approver","workflow","finance","line"].includes(tab)&&requireCompanySetup("business"))return;'
);

if (!dashboard.includes('line:"กลุ่ม LINE"')) {
  dashboard = dashboard.replace(
    /\{profile:"ข้อมูลธุรกิจ",approver:"ผู้อนุมัติค่าใช้จ่าย",workflow:"Workflow เบิกจ่าย",categories:"หมวดหมู่",finance:"ช่องทางการเงิน",team:"ทีมของฉัน"\}/,
    '{profile:"ข้อมูลธุรกิจ",approver:"ผู้อนุมัติค่าใช้จ่าย",workflow:"Workflow เบิกจ่าย",line:"กลุ่ม LINE",categories:"หมวดหมู่",finance:"ช่องทางการเงิน",team:"ทีมของฉัน"}'
  );
}

/* ---------- runtime force relocation ---------- */
if (!batches.includes(MARK)) {
  batches += `

/* ============================================================
   ${MARK}
   ============================================================ */
(() => {
  const move = (nodeId, mountId) => {
    const node = document.getElementById(nodeId);
    const mount = document.getElementById(mountId);
    if (!node || !mount || node.parentElement === mount) return false;
    mount.appendChild(node);
    node.style.removeProperty("display");
    node.removeAttribute("hidden");
    return true;
  };

  const enforce = () => {
    move("lineGroupMonitor", "lineGroupBusinessMount");
    move("cashPositionBoard", "cashPositionBusinessMount");

    const page = document.getElementById("page-batches");
    if (!page) return;

    page.querySelectorAll("#lineGroupMonitor,#cashPositionBoard").forEach(node => {
      node.style.setProperty("display","none","important");
    });

    const command = page.querySelector(".acct-command-head");
    const status = page.querySelector(".acct-status-strip");
    const table = page.querySelector(".accounting-worktable");

    if (command && status && command.nextElementSibling !== status) {
      command.insertAdjacentElement("afterend", status);
    }
    if (status && table && status.nextElementSibling !== table) {
      status.insertAdjacentElement("afterend", table);
    }
  };

  const queue = () => {
    requestAnimationFrame(enforce);
    setTimeout(enforce, 80);
    setTimeout(enforce, 400);
  };

  const start = () => {
    queue();

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes || []) {
          if (!(node instanceof Element)) continue;
          if (
            node.id === "lineGroupMonitor" ||
            node.id === "cashPositionBoard" ||
            node.querySelector?.("#lineGroupMonitor,#cashPositionBoard")
          ) {
            queue();
            return;
          }
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});

    document.addEventListener("click", event => {
      if (
        event.target.closest('[data-p="batches"]') ||
        event.target.closest('[data-biz="line"]') ||
        event.target.closest('[data-biz="finance"]') ||
        event.target.closest("#lineGroupRefresh") ||
        event.target.closest("#batchRefresh") ||
        event.target.closest("#refreshBtn")
      ) queue();
    }, true);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, {once:true});
  } else {
    start();
  }

  const style = document.createElement("style");
  style.id = "rubjai-v9042-table-first-style";
  style.textContent = \`
    #page-batches #lineGroupMonitor,
    #page-batches #cashPositionBoard{
      display:none!important;
    }
    #page-batches .acct-command-head{margin-bottom:12px!important}
    #page-batches .acct-status-strip{margin-top:0!important;margin-bottom:12px!important}
    #page-batches .accounting-worktable{margin-top:0!important}
    #biz-line #lineGroupMonitor,
    #biz-finance #cashPositionBoard{
      display:block!important;
      margin-top:0!important;
      margin-bottom:18px!important;
    }
    #lineGroupBusinessMount:empty::before,
    #cashPositionBusinessMount:empty::before{
      content:"กำลังโหลดข้อมูล…";
      display:block;
      padding:24px;
      border:1px solid #E4E7EC;
      border-radius:16px;
      background:#fff;
      color:#98A2B3;
      text-align:center;
      font-size:12px;
    }
  \`;
  document.head.appendChild(style);

  window.__RUBJAI_V9042_TABLE_FIRST__ = true;
})();
`;
}

/* ---------- cache bust ---------- */
html = html.replace(
  /(\.\/assets\/dashboard\.js)\?v=[^"'<>]+/g,
  "$1?v=9.04.2.20260820"
);
html = html.replace(
  /(\.\/assets\/reimbursement-batch-lock\.js)\?v=[^"'<>]+/g,
  "$1?v=9.04.2.20260820"
);
html = html.replace(
  /src="\.\/assets\/dashboard\.js"/g,
  'src="./assets/dashboard.js?v=9.04.2.20260820"'
);
html = html.replace(
  /src="\.\/assets\/reimbursement-batch-lock\.js"/g,
  'src="./assets/reimbursement-batch-lock.js?v=9.04.2.20260820"'
);

fs.writeFileSync(indexFile, html, "utf8");
fs.writeFileSync(dashboardFile, dashboard, "utf8");
fs.writeFileSync(batchFile, batches, "utf8");

/* ---------- permanent npm deploy hook ---------- */
if (fs.existsSync(packageFile)) {
  const pkg = JSON.parse(fs.readFileSync(packageFile,"utf8"));
  if (pkg?.scripts?.deploy && !pkg.scripts.deploy.includes(SELF)) {
    const hook = `node ${SELF}`;
    const deploy = String(pkg.scripts.deploy);
    const wranglerAt = deploy.lastIndexOf("wrangler deploy");
    if (wranglerAt >= 0) {
      const before = deploy.slice(0,wranglerAt).replace(/\s*&&\s*$/,"").trimEnd();
      const after = deploy.slice(wranglerAt);
      pkg.scripts.deploy = `${before} && ${hook} && ${after}`;
    } else {
      pkg.scripts.deploy = `${deploy} && ${hook}`;
    }
    fs.writeFileSync(packageFile, JSON.stringify(pkg,null,2) + "\n", "utf8");
  }
}

/* ---------- audit ---------- */
execFileSync(process.execPath,["--check",dashboardFile],{stdio:"pipe"});
execFileSync(process.execPath,["--check",batchFile],{stdio:"pipe"});

const fh=fs.readFileSync(indexFile,"utf8");
const fj=fs.readFileSync(dashboardFile,"utf8");
const fb=fs.readFileSync(batchFile,"utf8");

const checks={
  lineMenu:fh.includes('data-biz="line"'),
  lineMount:fh.includes('id="lineGroupBusinessMount"'),
  cashMount:fh.includes('id="cashPositionBusinessMount"'),
  titleMap:fj.includes('line:"กลุ่ม LINE"'),
  runtime:fb.includes(MARK),
  observer:fb.includes("new MutationObserver"),
  hardHide:fb.includes("#page-batches #lineGroupMonitor"),
  cacheBust:fh.includes("9.04.2.20260820"),
};
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
if(failed.length)throw new Error("v9042 audit failed: "+failed.join(", "));

console.log("✅ V9.04.2 FORCE TABLE FIRST");
console.log("✅ กลุ่ม LINE ออกจากหน้าเบิกจ่าย");
console.log("✅ ยอดเงินแต่ละบัญชีออกจากหน้าเบิกจ่าย");
console.log("✅ MutationObserver บังคับย้ายหลัง async render");
console.log("✅ package.json เพิ่ม v9042 เข้า deploy chain แล้ว");
console.log("✅ cache bust 9.04.2");
