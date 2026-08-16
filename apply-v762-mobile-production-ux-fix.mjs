import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const dashboardFile=path.join(root,"assets","dashboard.js");
const permissionAsset=path.join(root,"assets","employee-permission-split-v747.js");
const indexFile=path.join(root,"index.html");
const MARK="MOBILE_PRODUCTION_UX_FIX_V7_62_20260816";

if(!fs.existsSync(dashboardFile))throw new Error("ไม่พบ assets/dashboard.js");
if(!fs.existsSync(permissionAsset))throw new Error("ไม่พบ assets/employee-permission-split-v747.js — ต้องรัน v7.47 ก่อน");

let dash=fs.readFileSync(dashboardFile,"utf8");
let perm=fs.readFileSync(permissionAsset,"utf8");

if(dash.includes(MARK) || perm.includes(MARK)){
  console.log("ℹ️ "+MARK+" already present");
  process.exit(0);
}

/* ═══════════════════════════════════════════════════════
   A) v7.47 dynamic mobile navigation
   ═══════════════════════════════════════════════════════ */

// 1) แก้ textNode: เดิม button.querySelector("span:last-child") ไม่เจอ
// เพราะ <b>›</b> เป็น last-child -> โค้ด fallback ไป button.textContent=...
// ผลคือทำลาย span + chevron ของปุ่ม mobile.
const oldTextNode=`  function textNode(button,label){
    if(!button) return;
    const span=button.querySelector("span:last-child");
    if(span) span.textContent=label;
    else button.textContent=label;
  }`;

const newTextNode=`  function textNode(button,label){
    if(!button) return;
    const span=button.querySelector("span");
    if(span){
      span.textContent=label;
      return;
    }
    button.textContent=label;
  }`;

if(!perm.includes(oldTextNode))throw new Error("v7.62: หา textNode ของ v7.47 ไม่เจอ");
perm=perm.replace(oldTextNode,newTextNode);

// 2) ปุ่ม permission เดิม:
// - capture click
// - stop router
// - showView() อย่างเดียว
// - sheet.hidden=true แต่ไม่ closeMobileMore()
// ทำให้ body.mobile-more-open ค้าง => iPhone scroll ไม่ได้.
const oldPermissionClick=`    if(permission){
      e.preventDefault();
      e.stopImmediatePropagation();
      showView("permissions");
      const sheet=$("#mobileMoreBackdrop");
      if(sheet) sheet.hidden=true;
      return;
    }`;

const newPermissionClick=`    if(permission){
      e.preventDefault();
      e.stopImmediatePropagation();

      // ${MARK}
      // ต้องปิด mobile sheet ผ่าน function หลักเพื่อคืน scroll lock เสมอ.
      try{
        if(typeof closeMobileMore==="function") closeMobileMore();
        else{
          const sheet=$("#mobileMoreBackdrop");
          if(sheet) sheet.hidden=true;
          document.body.classList.remove("mobile-more-open");
          document.documentElement.classList.remove("mobile-more-open");
        }
      }catch{}

      // ต้องเข้าผ่าน business router จริง ไม่ใช่แค่สลับ panel ที่ซ่อนอยู่หลังหน้า Overview.
      if(typeof openBusiness==="function"){
        openBusiness("permissions",document.querySelector('[data-biz="permissions"]'));
      }else{
        showView("permissions");
      }
      return;
    }`;

if(!perm.includes(oldPermissionClick))throw new Error("v7.62: หา permission click handler ของ v7.47 ไม่เจอ");
perm=perm.replace(oldPermissionClick,newPermissionClick);

// Safari ใช้ behavior:auto ได้แน่นอนกว่า instant.
perm=perm.replaceAll('window.scrollTo({top:0,behavior:"instant"});','window.scrollTo({top:0,behavior:"auto"});');

// 3) Mobile UX overrides ต้องมาหลัง v7.43/v7.44/v7.47 runtime styles.
const mobileRuntime=String.raw`

/* ${MARK} — iPhone / LINE in-app browser mobile safety */
(()=>{
  "use strict";

  function installMobileStyle(){
    if(document.getElementById("mobileProductionUxV762Style"))return;
    const style=document.createElement("style");
    style.id="mobileProductionUxV762Style";
    style.textContent=\`
      @media(max-width:820px){
        body.mobile-more-open{
          overflow:hidden!important;
          overscroll-behavior:none;
        }

        .mobile-more-backdrop{
          touch-action:none;
        }

        .mobile-more-sheet{
          max-height:min(84dvh,760px)!important;
          overflow-y:auto!important;
          overflow-x:hidden!important;
          -webkit-overflow-scrolling:touch;
          overscroll-behavior:contain;
          touch-action:pan-y;
          padding-left:12px!important;
          padding-right:12px!important;
        }

        .mobile-more-head{
          position:sticky;
          top:-9px;
          z-index:3;
          padding-top:9px!important;
          background:rgba(247,247,248,.94);
          -webkit-backdrop-filter:blur(14px);
          backdrop-filter:blur(14px);
        }

        .mobile-more-list{
          border-radius:18px!important;
        }

        .mobile-more-list button{
          min-height:54px!important;
          padding:0 16px!important;
          font-size:14px!important;
          touch-action:manipulation;
          -webkit-tap-highlight-color:transparent;
        }

        .mobile-more-list button span{
          min-width:0;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
        }

        .mobile-more-list button b{
          flex:0 0 auto;
          margin-left:12px;
          min-width:18px;
          text-align:center;
        }

        .mobile-more-list button:active,
        .mobile-more-grid button:active{
          background:#f1f1f3!important;
          transform:scale(.995);
        }

        .mobile-more-list button.is-unavailable-v762{
          color:#8e8e93!important;
          background:#fafafa!important;
        }

        .mobile-more-list button.is-connected-v762{
          color:#16713b!important;
        }

        .mobile-more-grid button{
          touch-action:manipulation;
          -webkit-tap-highlight-color:transparent;
        }

        /* Permission page: no desktop-width form inside iPhone */
        #biz-team[data-team-view="permissions"],
        #biz-team[data-team-view="permissions"] #dashboardAccessCard,
        #biz-team[data-team-view="permissions"] .team-access-layout-v744,
        #biz-team[data-team-view="permissions"] .team-access-main-v744,
        #biz-team[data-team-view="permissions"] .team-access-core-v743,
        #biz-team[data-team-view="permissions"] .team-step-v743{
          min-width:0!important;
          width:100%!important;
          max-width:100%!important;
        }

        #biz-team[data-team-view="permissions"] .team-access-layout-v744{
          display:block!important;
        }

        #biz-team[data-team-view="permissions"] .team-access-summary-v744{
          position:static!important;
          width:100%!important;
          margin:0 0 12px!important;
        }

        #biz-team[data-team-view="permissions"] .team-step-v743{
          padding:14px 12px!important;
          border-radius:15px!important;
        }

        #biz-team[data-team-view="permissions"] #simpleRoleGridV739{
          grid-template-columns:1fr!important;
        }

        /* v7.43 เคย force 9–11px ด้วย !important ซึ่งทำให้ iOS zoom ตอนแตะ field */
        #biz-team[data-team-view="permissions"] input,
        #biz-team[data-team-view="permissions"] select,
        #biz-team[data-team-view="permissions"] textarea,
        #dashboardAccessLineFieldV726 select,
        .team-name-details-v743 input{
          font-size:16px!important;
        }

        #biz-team[data-team-view="permissions"] select,
        #biz-team[data-team-view="permissions"] input{
          min-height:48px!important;
        }

        #dashboardAccessCreate.team-submit-btn-v743{
          width:100%!important;
          min-width:0!important;
          min-height:48px!important;
          font-size:14px!important;
        }

        .employee-permission-title-v747{
          margin-bottom:12px!important;
          padding-bottom:12px!important;
        }

        .employee-permission-title-v747 h2{
          font-size:22px!important;
        }

        .employee-permission-title-v747 p{
          font-size:12px!important;
          line-height:1.55!important;
        }

        /* Employee page */
        #biz-team[data-team-view="employees"] .team-toolbar-v740 button,
        #biz-team[data-team-view="employees"] .team-toolbar-v740 select{
          min-height:48px!important;
          font-size:14px!important;
        }

        #biz-team[data-team-view="employees"] .team-person-v740 strong{
          font-size:14px!important;
        }

        #biz-team[data-team-view="employees"] .team-person-v740 small{
          font-size:11px!important;
        }
      }
    \`;
    document.head.appendChild(style);
  }

  function clearStaleMobileLock(){
    const sheet=document.getElementById("mobileMoreBackdrop");
    if(!sheet || sheet.hidden){
      document.body.classList.remove("mobile-more-open");
      document.documentElement.classList.remove("mobile-more-open");
    }
  }

  installMobileStyle();
  window.addEventListener("pageshow",()=>setTimeout(clearStaleMobileLock,0));
  window.addEventListener("orientationchange",()=>setTimeout(clearStaleMobileLock,120));
  document.addEventListener("visibilitychange",()=>{
    if(!document.hidden)setTimeout(clearStaleMobileLock,0);
  });

  setTimeout(clearStaleMobileLock,0);
})();
`;

perm += mobileRuntime;

/* ═══════════════════════════════════════════════════════
   B) Core mobile-more behavior
   ═══════════════════════════════════════════════════════ */

// ปิด sheet ต้องคืน class lock ทั้ง body/html ทุกครั้ง.
const oldClose='function closeMobileMore(){const box=el("mobileMoreBackdrop");if(box)box.hidden=true;document.body.classList.remove("mobile-more-open");}';
const newClose=`function closeMobileMore(){
  const box=el("mobileMoreBackdrop");
  if(box)box.hidden=true;
  document.body.classList.remove("mobile-more-open");
  document.documentElement.classList.remove("mobile-more-open");
}`;

if(!dash.includes(oldClose))throw new Error("v7.62: หา closeMobileMore ไม่เจอ");
dash=dash.replace(oldClose,newClose);

// open sheet: sync visible status before user chooses an action.
const oldOpen='function openMobileMore(){const box=el("mobileMoreBackdrop");if(!box)return;closeBusinessSwitcher();box.hidden=false;document.body.classList.add("mobile-more-open");}';
const newOpen=`function openMobileMore(){
  const box=el("mobileMoreBackdrop");
  if(!box)return;
  closeBusinessSwitcher();
  syncMobileMoreStateV762();
  box.hidden=false;
  document.body.classList.add("mobile-more-open");
  document.documentElement.classList.add("mobile-more-open");
}`;

if(!dash.includes(oldOpen))throw new Error("v7.62: หา openMobileMore ไม่เจอ");
dash=dash.replace(oldOpen,newOpen);

// Mobile external commands:
// - Google connected => ไปหน้า settings, ห้าม OAuth ใหม่
// - Google unknown => ไป settings + ตรวจใหม่, ห้าม OAuth ใหม่
// - Sheet/Drive ยังไม่มี href => บอกเหตุผล ไม่ใช่กดแล้วเงียบ
const oldExternal=`document.querySelectorAll("[data-mobile-external]").forEach(b=>b.addEventListener("click",()=>{
  const kind=b.dataset.mobileExternal;
  const target=kind==="files"?el("filesLink"):kind==="receipt"?el("receiptLink"):kind==="google"?el("connBtn"):kind==="sheet"?el("openSheetLink"):kind==="drive"?el("openDriveLink"):null;
  const href=target?.getAttribute("href")||"";
  if(!href||href==="#")return;
  closeMobileMore();
  if(kind==="sheet"||kind==="drive")window.open(href,"_blank","noopener,noreferrer");else location.href=href;
}));`;

const newExternal=`document.querySelectorAll("[data-mobile-external]").forEach(b=>b.addEventListener("click",async()=>{
  const kind=b.dataset.mobileExternal;

  if(kind==="google"){
    const state=mobileGoogleStateV762();
    closeMobileMore();

    if(state==="connected"){
      openPage("settings",document.querySelector('[data-p="settings"]'));
      return;
    }

    if(state==="unknown"){
      openPage("settings",document.querySelector('[data-p="settings"]'));
      setTimeout(()=>refreshConnectionHealth({manual:true,loadAfter:false}),0);
      return;
    }

    location.href=WORKER+"/oauth/connect?tenant="+encodeURIComponent(TENANT);
    return;
  }

  const target=kind==="files"?el("filesLink"):kind==="receipt"?el("receiptLink"):kind==="sheet"?el("openSheetLink"):kind==="drive"?el("openDriveLink"):null;
  const href=target?.getAttribute("href")||"";

  if(!href||href==="#"){
    if(kind==="sheet"||kind==="drive"){
      alert(kind==="sheet"
        ?"Google Sheet ของธุรกิจนี้ยังไม่พร้อม กรุณาตรวจสถานะ Google ก่อน"
        :"Google Drive ของธุรกิจนี้ยังไม่พร้อม กรุณาตรวจสถานะ Google ก่อน");
    }
    return;
  }

  closeMobileMore();
  if(kind==="sheet"||kind==="drive")window.open(href,"_blank","noopener,noreferrer");
  else location.href=href;
}));`;

if(!dash.includes(oldExternal))throw new Error("v7.62: หา data-mobile-external handler ไม่เจอ");
dash=dash.replace(oldExternal,newExternal);

// Runtime helper ถูกประกาศก่อน load(); function declaration ถูก hoist และใช้จาก openMobileMore ได้.
const helper=String.raw`

/* ${MARK} */
function mobileGoogleStateV762(){
  try{
    if(typeof v761GoogleState==="function")return v761GoogleState();
  }catch{}
  if(typeof GOOGLE_CORE_INFO!=="undefined"){
    if(GOOGLE_CORE_INFO?.reconnectRequired===true)return "reconnect";
    if(GOOGLE_CORE_INFO?.connected===true)return "connected";
  }
  if(CONNECTED===true)return "connected";
  return CONNECTION_HEALTH?.checked===true?"never":"unknown";
}

function syncMobileMoreStateV762(){
  const google=document.querySelector('[data-mobile-external="google"]');
  const sheet=document.querySelector('[data-mobile-external="sheet"]');
  const drive=document.querySelector('[data-mobile-external="drive"]');

  if(google){
    const state=mobileGoogleStateV762();
    const label=google.querySelector("span");
    const icon=google.querySelector("b");
    google.classList.remove("is-connected-v762","is-unavailable-v762");

    if(state==="connected"){
      if(label)label.textContent="Google เชื่อมต่อแล้ว";
      if(icon)icon.textContent="✓";
      google.classList.add("is-connected-v762");
    }else if(state==="unknown"){
      if(label)label.textContent="ตรวจสถานะ Google";
      if(icon)icon.textContent="›";
    }else if(state==="reconnect"){
      if(label)label.textContent="เชื่อม Google ใหม่";
      if(icon)icon.textContent="↗";
    }else{
      if(label)label.textContent="เชื่อมต่อ Google";
      if(icon)icon.textContent="↗";
    }
  }

  const setResource=(button,targetId,readyText,missingText)=>{
    if(!button)return;
    const href=el(targetId)?.getAttribute("href")||"";
    const ready=Boolean(href&&href!=="#");
    const label=button.querySelector("span");
    const icon=button.querySelector("b");
    button.classList.toggle("is-unavailable-v762",!ready);
    if(label)label.textContent=ready?readyText:missingText;
    if(icon)icon.textContent=ready?"↗":"—";
  };

  setResource(sheet,"openSheetLink","เปิด Google Sheet","Google Sheet ยังไม่พร้อม");
  setResource(drive,"openDriveLink","เปิด Google Drive","Google Drive ยังไม่พร้อม");
}
`;

const loadAnchor="\nload();";
const loadPos=dash.lastIndexOf(loadAnchor);
if(loadPos<0)throw new Error("v7.62: หา final load(); ไม่เจอ");
dash=dash.slice(0,loadPos)+helper+"\n"+dash.slice(loadPos);

// Cache-bust source markers.
if(fs.existsSync(indexFile)){
  let html=fs.readFileSync(indexFile,"utf8");
  html=html.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, "./assets/dashboard.js?v=7.62.20260816");
  html=html.replace(/\.\/assets\/dashboard\.css\?v=[^"]+/, "./assets/dashboard.css?v=7.62.20260816");
  html=html.replace(/\.\/assets\/employee-permission-split-v747\.js\?v=[^"]+/, "./assets/employee-permission-split-v747.js?v=7.62.20260816");
  fs.writeFileSync(indexFile,html);
}

fs.writeFileSync(dashboardFile,dash);
fs.writeFileSync(permissionAsset,perm);

execFileSync(process.execPath,["--check",dashboardFile],{stdio:"inherit"});
execFileSync(process.execPath,["--check",permissionAsset],{stdio:"inherit"});

// Static assertions: deploy must stop if a critical fix disappeared.
const finalDash=fs.readFileSync(dashboardFile,"utf8");
const finalPerm=fs.readFileSync(permissionAsset,"utf8");

for(const check of [
  [finalDash.includes(MARK),"dashboard marker"],
  [finalDash.includes("syncMobileMoreStateV762"),"mobile menu state"],
  [finalDash.includes('if(kind==="google")'),"mobile Google guard"],
  [finalDash.includes('document.documentElement.classList.remove("mobile-more-open")'),"scroll unlock"],
  [finalPerm.includes(MARK),"permission marker"],
  [finalPerm.includes('openBusiness("permissions"'),"permission router"],
  [finalPerm.includes('const span=button.querySelector("span");'),"chevron-safe label"],
  [finalPerm.includes("font-size:16px!important"),"iOS input size"],
]){
  if(!check[0])throw new Error("v7.62 static assertion failed: "+check[1]);
}

console.log("✅ "+MARK+" ready");
console.log("✅ mobile permission now uses the real business router");
console.log("✅ closing More always releases mobile scroll lock");
console.log("✅ employee / permission chevrons preserved");
console.log("✅ connected Google no longer sends mobile users to OAuth again");
console.log("✅ unavailable Sheet/Drive no longer fail silently");
console.log("✅ permission/team controls are iPhone-sized and scrollable");
