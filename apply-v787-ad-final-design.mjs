import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const htmlFile = path.join(root, "index.html");
const cssFile = path.join(root, "assets", "dashboard.css");
const MARK = "RUBJAI_AD_FINAL_DESIGN_V7_87_20260819";

if (!fs.existsSync(htmlFile)) throw new Error("v7.87 missing index.html");
if (!fs.existsSync(cssFile)) throw new Error("v7.87 missing assets/dashboard.css");

let html = fs.readFileSync(htmlFile, "utf8");
let css = fs.readFileSync(cssFile, "utf8");

/* ─────────────────────────────────────────────────────────────
   1) IBM Plex Sans Thai — โหลดไว้หลัง CSS หลักเพื่อให้ตรงทุกหน้า
   ───────────────────────────────────────────────────────────── */
const fontLinks = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet">`;

if (!html.includes("family=IBM+Plex+Sans+Thai")) {
  const anchor = `<link rel="stylesheet" href="./assets/dashboard.css`;
  const idx = html.indexOf(anchor);
  if (idx >= 0) {
    const lineEnd = html.indexOf(">", idx);
    html = html.slice(0, lineEnd + 1) + "\n" + fontLinks + html.slice(lineEnd + 1);
  } else {
    html = html.replace("</head>", fontLinks + "\n</head>");
  }
}

/* ─────────────────────────────────────────────────────────────
   2) เปลี่ยนหัวหน้าเบิกจ่ายให้สะอาดแบบโฆษณา
   ───────────────────────────────────────────────────────────── */
html = html.replace(
  `<div class="head-kicker">ACCOUNTING WORKSPACE</div>
          <h3>โต๊ะทำงานเบิกจ่าย</h3>
          <p>รายการที่ผู้เบิกยืนยันจะเดินตาม Workflow ของบริษัทอัตโนมัติ — อนุมัติค่าใช้จ่าย ตรวจเอกสาร หรือเข้าสู่รอโอนตามที่ตั้งไว้</p>`,
  `<div class="head-kicker">EXPENSE REQUISITION</div>
          <h3>ใบเบิก</h3>
          <p>ภาพรวมการยื่นขอเบิกค่าใช้จ่ายขององค์กร ตั้งแต่ส่งเรื่องจนถึงจ่ายเงินเสร็จ</p>`
);

if (!css.includes(MARK)) {
  css += `

/* ============================================================
   ${MARK}
   Final visual direction:
   clean white + soft indigo + IBM Plex Sans Thai
   inspired by the approved advertising artwork.
   ============================================================ */

:root{
  --rubjai-brand:#5b4cf6;
  --rubjai-brand-2:#6d5dfc;
  --rubjai-brand-soft:#f2efff;
  --rubjai-brand-soft-2:#f8f6ff;
  --rubjai-ink:#17172a;
  --rubjai-muted:#77758a;
  --rubjai-line:#e9e7f2;
  --rubjai-bg:#f8f8fc;
  --rubjai-success:#1f9d63;
  --rubjai-success-soft:#ebf8f1;
  --rubjai-warning:#ec8a25;
  --rubjai-warning-soft:#fff4e9;
  --rubjai-danger:#e5484d;
  --rubjai-danger-soft:#fff0f0;
  --rubjai-info:#4667e8;
  --rubjai-info-soft:#eef2ff;
}

/* ===== Global polish ===== */
html,body,button,input,select,textarea,
.sidebar,.main,.page,.card,.btn,.navlink,.subnavlink,
.master-table,.acct-dialog,.acct-drawer{
  font-family:"IBM Plex Sans Thai","Noto Sans Thai",system-ui,sans-serif!important;
}
html,body{background:var(--rubjai-bg)!important}
body{color:var(--rubjai-ink)!important;font-weight:400}
.main{max-width:none!important;padding:28px 34px 72px!important}
.btn{border-radius:10px!important;font-weight:500!important}
.btn.solid,
.acct-next .btn.primary-next{
  background:linear-gradient(135deg,var(--rubjai-brand),var(--rubjai-brand-2))!important;
  border-color:transparent!important;
  color:#fff!important;
  box-shadow:0 7px 18px rgba(91,76,246,.18)!important;
}
.btn.solid:hover,
.acct-next .btn.primary-next:hover{
  transform:translateY(-1px);
  box-shadow:0 10px 24px rgba(91,76,246,.24)!important;
}

/* ===== Sidebar — same visual language as ad ===== */
.sidebar{
  width:252px!important;
  background:#fff!important;
  border-right:1px solid #e8e7ef!important;
  box-shadow:none!important;
}
.brand{padding:20px 18px 15px!important}
.logo{
  background:linear-gradient(145deg,#6a5df7,#4d3fe8)!important;
  border-radius:14px!important;
  box-shadow:0 7px 18px rgba(91,76,246,.22)!important;
}
.brand h1{font-size:14px!important;font-weight:650!important;color:#151526!important}
.brand .sub{color:#8a8799!important;font-size:10.5px!important}
.business-switcher-primary{padding:9px 12px 13px!important}
.business-switcher-primary .business-switcher-btn{
  border:1px solid #eceaf3!important;
  box-shadow:0 5px 18px rgba(33,25,86,.045)!important;
  border-radius:15px!important;
}
.navlink{
  min-height:39px!important;
  border-radius:9px!important;
  padding:8px 10px!important;
  color:#646174!important;
  font-size:12px!important;
}
.navlink .ic{color:#77738d!important}
.navlink:hover{background:#f8f7fc!important;color:#2d2942!important}
.navlink.active{
  color:var(--rubjai-brand)!important;
  background:linear-gradient(90deg,#f0edff 0%,#f7f5ff 100%)!important;
  border-color:transparent!important;
  box-shadow:none!important;
  font-weight:600!important;
}
.navlink.active::before{
  content:"";
  position:absolute;
  left:-12px;
  top:7px;
  bottom:7px;
  width:3px;
  border-radius:0 4px 4px 0;
  background:var(--rubjai-brand);
}
.navlink.active .ic{color:var(--rubjai-brand)!important}
.subnavlink.active{
  background:#f3f0ff!important;
  color:var(--rubjai-brand)!important;
}
.setup-status-v51 .setup-line,
.onboarding .bar i{background:var(--rubjai-brand)!important}

/* ===== Top workspace header ===== */
.head{
  margin-bottom:20px!important;
}
.head h2{font-weight:600!important;color:#17172a!important}
.head-kicker{color:#918da3!important;font-weight:600!important}
.workspace-link{
  border-color:#e8e6ef!important;
  box-shadow:0 4px 14px rgba(28,21,71,.035)!important;
}
.syncstate{
  border-color:#e8e6ef!important;
  background:#fff!important;
}

/* ===== Batches page header ===== */
#page-batches{
  --batch-purple:var(--rubjai-brand);
}
#page-batches .acct-command-head{
  align-items:center!important;
  margin:2px 0 20px!important;
}
#page-batches .acct-command-head h3{
  margin:3px 0 3px!important;
  font-size:28px!important;
  line-height:1.12!important;
  font-weight:600!important;
  letter-spacing:-.035em!important;
  color:#19182a!important;
}
#page-batches .acct-command-head p{
  color:#858195!important;
  font-size:12px!important;
}
#page-batches .acct-command-head .head-kicker{
  font-size:9px!important;
  letter-spacing:.12em!important;
  color:#8d88a1!important;
}
#page-batches .acct-head-actions{
  align-self:center!important;
}
#page-batches .batch-schedule-card{
  background:#fff!important;
  border:1px solid #e9e7f0!important;
  border-radius:11px!important;
  box-shadow:0 3px 12px rgba(35,24,89,.035)!important;
}
#page-batches #batchMasterRefresh{
  min-height:38px!important;
  border-color:#e7e4f0!important;
  color:#575267!important;
  background:#fff!important;
}

/* ===== KPI status cards — โครงเดียวกับโฆษณา ===== */
#page-batches .acct-status-strip{
  display:grid!important;
  grid-template-columns:repeat(7,minmax(0,1fr))!important;
  gap:10px!important;
  margin:0 0 18px!important;
}
#page-batches .acct-status-strip button{
  position:relative!important;
  min-height:88px!important;
  padding:15px 50px 13px 15px!important;
  border:1px solid #e9e7f0!important;
  border-radius:15px!important;
  background:#fff!important;
  box-shadow:0 6px 18px rgba(33,24,82,.035)!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:flex-start!important;
  justify-content:center!important;
  gap:5px!important;
  color:#777387!important;
  transition:.18s ease!important;
  overflow:hidden!important;
}
#page-batches .acct-status-strip button:hover{
  transform:translateY(-1px)!important;
  border-color:#dcd7ff!important;
  box-shadow:0 9px 22px rgba(70,52,170,.07)!important;
}
#page-batches .acct-status-strip button span{
  font-size:10px!important;
  font-weight:500!important;
  color:#777387!important;
  line-height:1.2!important;
}
#page-batches .acct-status-strip button strong{
  font-size:24px!important;
  line-height:1!important;
  font-weight:600!important;
  letter-spacing:-.035em!important;
  color:#1c1b2f!important;
}
#page-batches .acct-status-strip button::after{
  content:"";
  position:absolute;
  right:13px;
  top:50%;
  width:34px;
  height:34px;
  transform:translateY(-50%);
  border-radius:50%;
  background-color:#f1eeff;
  background-position:center;
  background-repeat:no-repeat;
  background-size:17px 17px;
}
#page-batches .acct-status-strip button[data-batch-filter="all"]::after{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b4cf6' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 3h8l4 4v14H6z'/%3E%3Cpath d='M14 3v5h5M9 12h6M9 16h5'/%3E%3C/svg%3E");
}
#page-batches .acct-status-strip button[data-batch-filter="approval"]::after{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b4cf6' stroke-width='1.8' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3Cpath d='M12 7v5l3 2'/%3E%3C/svg%3E");
}
#page-batches .acct-status-strip button[data-batch-filter="review"]::after{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b4cf6' stroke-width='1.8'%3E%3Cpath d='M5 4h11v16H5z'/%3E%3Ccircle cx='16.5' cy='15.5' r='3.5'/%3E%3Cpath d='m19 18 2 2M8 8h5M8 11h4'/%3E%3C/svg%3E");
}
#page-batches .acct-status-strip button[data-batch-filter="correction"]::after{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b4cf6' stroke-width='1.8'%3E%3Cpath d='M4 20h4l11-11-4-4L4 16zM13.5 6.5l4 4'/%3E%3C/svg%3E");
}
#page-batches .acct-status-strip button[data-batch-filter="rejected"]::after{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b4cf6' stroke-width='1.8'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3Cpath d='m9 9 6 6m0-6-6 6'/%3E%3C/svg%3E");
}
#page-batches .acct-status-strip button[data-batch-filter="payment"]::after{
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%235b4cf6' stroke-width='1.8'%3E%3Cpath d='M3 9h18M5 9v9m4-9v9m6-9v9m4-9v9M3 18h18M12 3l9 4H3z'/%3E%3C/svg%3E");
}
#page-batches .acct-status-strip button[data-batch-filter="paid"]::after{
  background-color:#edf9f2;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231f9d63' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='8'/%3E%3Cpath d='m8.5 12 2.2 2.2 4.8-5'/%3E%3C/svg%3E");
}
#page-batches .acct-status-strip button.active{
  background:linear-gradient(145deg,#fbfaff,#f4f1ff)!important;
  border-color:#8a7cff!important;
  box-shadow:0 8px 22px rgba(91,76,246,.08)!important;
}
#page-batches .acct-status-strip button.active span,
#page-batches .acct-status-strip button.active strong{
  color:var(--rubjai-brand)!important;
}

/* ===== Main worktable card ===== */
#page-batches .accounting-worktable-v4{
  border:1px solid #e8e6ef!important;
  border-radius:18px!important;
  background:#fff!important;
  box-shadow:0 10px 30px rgba(35,24,89,.045)!important;
  overflow:hidden!important;
}
#page-batches .worktable-head{
  padding:19px 20px 17px!important;
  border-bottom:1px solid #eeecf3!important;
  background:#fff!important;
}
#page-batches .worktable-head h3{
  margin:0 0 4px!important;
  font-size:16px!important;
  font-weight:600!important;
  color:#1d1c30!important;
}
#page-batches .worktable-head p{
  margin:0!important;
  color:#9691a3!important;
  font-size:10.5px!important;
}
#page-batches .worktable-tools{
  gap:8px!important;
}
#page-batches .worktable-tools input,
#page-batches .worktable-tools select{
  min-height:40px!important;
  border:1px solid #e6e3ed!important;
  border-radius:10px!important;
  background:#fff!important;
  color:#575267!important;
  font-size:11px!important;
  box-shadow:none!important;
}
#page-batches .worktable-tools input{
  min-width:300px!important;
  padding-left:35px!important;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23928da3' stroke-width='1.8'%3E%3Ccircle cx='11' cy='11' r='6'/%3E%3Cpath d='m16 16 4 4'/%3E%3C/svg%3E")!important;
  background-position:12px center!important;
  background-repeat:no-repeat!important;
  background-size:15px!important;
}
#page-batches .worktable-tools input:focus,
#page-batches .worktable-tools select:focus{
  border-color:#9a8fff!important;
  box-shadow:0 0 0 3px rgba(91,76,246,.08)!important;
  outline:0!important;
}

#page-batches .acct-bulkbar{
  min-height:0!important;
  padding:9px 18px!important;
  background:#fbfaff!important;
  border-bottom:1px solid #eeecf3!important;
}
#page-batches .acct-bulkbar strong{font-size:10.5px!important;color:#575267!important}
#page-batches .acct-bulkbar span{font-size:9.5px!important;color:#9691a3!important}

/* ===== Table ===== */
#page-batches .acct-master-wrap{
  background:#fff!important;
}
#page-batches .acct-master-table{
  color:#373449!important;
}
#page-batches .acct-master-table thead th{
  background:#fbfaff!important;
  color:#827d91!important;
  border-bottom:1px solid #ebe8f1!important;
  padding:11px 10px!important;
  font-size:9.5px!important;
  font-weight:600!important;
  letter-spacing:0!important;
}
#page-batches .acct-master-table tbody td{
  padding:13px 10px!important;
  border-bottom:1px solid #efedf4!important;
  font-size:10.5px!important;
  background:#fff!important;
}
#page-batches .acct-master-table tbody tr:hover td{
  background:#fbfaff!important;
}
#page-batches .acct-master-table .master-primary{
  color:#2a283e!important;
  font-weight:600!important;
}
#page-batches .acct-master-table .master-secondary{
  color:#9691a3!important;
}
#page-batches .acct-master-table .master-money{
  color:#232137!important;
  font-weight:600!important;
}
#page-batches .master-checkbox{
  accent-color:var(--rubjai-brand)!important;
}

/* ===== Status chips ===== */
#page-batches .master-status{
  border-radius:999px!important;
  padding:5px 9px!important;
  font-size:9px!important;
  font-weight:600!important;
  border:0!important;
}
#page-batches .master-status.approval{
  background:var(--rubjai-warning-soft)!important;
  color:#d66b12!important;
}
#page-batches .master-status.review{
  background:var(--rubjai-info-soft)!important;
  color:#4667e8!important;
}
#page-batches .master-status.correction{
  background:#fff3e8!important;
  color:#d96a12!important;
}
#page-batches .master-status.rejected{
  background:var(--rubjai-danger-soft)!important;
  color:var(--rubjai-danger)!important;
}
#page-batches .master-status.payment{
  background:#f0edff!important;
  color:var(--rubjai-brand)!important;
}
#page-batches .master-status.paid{
  background:var(--rubjai-success-soft)!important;
  color:var(--rubjai-success)!important;
}

/* อย่าย้อมทั้งแถวแรง ๆ แบบระบบเก่า */
#page-batches .acct-master-table tbody tr.row-paid td,
#page-batches .acct-master-table tbody tr.row-correction td{
  background:#fff!important;
}
#page-batches .acct-master-table tbody tr.row-paid:hover td,
#page-batches .acct-master-table tbody tr.row-correction:hover td{
  background:#fbfaff!important;
}

/* Document progress */
#page-batches .acct-doc-meter{
  background:#efedf4!important;
}
#page-batches .acct-doc-meter i{
  background:linear-gradient(90deg,var(--rubjai-brand),#8a7cff)!important;
}
#page-batches .acct-doc-state.bad i{
  background:var(--rubjai-danger)!important;
}

/* Action buttons */
#page-batches .acct-next .btn{
  min-height:32px!important;
  border-radius:8px!important;
  border-color:#dfdbea!important;
  color:#504b63!important;
  background:#fff!important;
  font-size:9.5px!important;
  font-weight:500!important;
  box-shadow:none!important;
}
#page-batches .acct-next .btn.primary-next{
  background:#1f1d3a!important;
  color:#fff!important;
  border-color:#1f1d3a!important;
  box-shadow:none!important;
}
#page-batches .acct-next .btn:hover{
  border-color:#a89fff!important;
  color:var(--rubjai-brand)!important;
}

/* ===== Dialog / Drawer ===== */
.acct-dialog,.acct-drawer{
  border-color:#e7e4ef!important;
  box-shadow:0 26px 80px rgba(36,25,87,.15)!important;
}
.acct-dialog-head,.acct-drawer-head{
  background:#fbfaff!important;
  border-color:#ece9f2!important;
}
.acct-dialog input,.acct-dialog select,.acct-dialog textarea,
.acct-drawer input,.acct-drawer select,.acct-drawer textarea{
  border-color:#e3e0ec!important;
}
.acct-dialog input:focus,.acct-dialog select:focus,.acct-dialog textarea:focus,
.acct-drawer input:focus,.acct-drawer select:focus,.acct-drawer textarea:focus{
  border-color:#968aff!important;
  box-shadow:0 0 0 3px rgba(91,76,246,.08)!important;
}

/* ===== Settings ===== */
#page-batches .acct-settings-wrap{
  border-color:#e8e6ef!important;
  border-radius:15px!important;
  background:#fff!important;
}
#page-batches .acct-settings-wrap summary{
  color:#514d61!important;
}

/* ===== Desktop responsive ===== */
@media(max-width:1260px){
  #page-batches .acct-status-strip{
    grid-template-columns:repeat(4,minmax(0,1fr))!important;
  }
}
@media(max-width:860px){
  .main{padding:18px 16px 92px!important}
  #page-batches .acct-status-strip{
    display:flex!important;
    overflow:auto!important;
    gap:8px!important;
    padding-bottom:3px!important;
  }
  #page-batches .acct-status-strip button{
    flex:0 0 150px!important;
    min-width:150px!important;
  }
  #page-batches .worktable-tools input{min-width:0!important}
}
@media(max-width:600px){
  #page-batches .acct-command-head h3{font-size:25px!important}
  #page-batches .acct-status-strip button{
    flex-basis:138px!important;
    min-width:138px!important;
    min-height:80px!important;
  }
  #page-batches .accounting-worktable-v4{
    border-radius:15px!important;
  }
}
`;
}

/* Ensure the browser sees a new CSS revision even behind CDN cache */
html = html.replace(
  /<link rel="stylesheet" href="\.\/assets\/dashboard\.css(?:\?v=[^"]*)?">/,
  `<link rel="stylesheet" href="./assets/dashboard.css?v=7.87.20260819">`
);

fs.writeFileSync(htmlFile, html);
fs.writeFileSync(cssFile, css);

if (!html.includes("EXPENSE REQUISITION")) throw new Error("v7.87 heading patch failed");
if (!css.includes(MARK)) throw new Error("v7.87 CSS patch failed");

console.log(`✅ ${MARK}`);
console.log("✅ IBM Plex Sans Thai");
console.log("✅ Indigo/white sidebar matching ad direction");
console.log("✅ KPI status cards with icons");
console.log("✅ Clean SaaS worktable / status chips / dialogs");
console.log("✅ functionality untouched — visual patch only");
