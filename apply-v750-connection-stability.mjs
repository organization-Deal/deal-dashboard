import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const dashboardFile=path.join(root,"assets","dashboard.js");
const MARK="CONNECTION_STABILITY_V7_50_20260815";

if(!fs.existsSync(dashboardFile)) throw new Error("ไม่พบ assets/dashboard.js");
let src=fs.readFileSync(dashboardFile,"utf8");

if(src.includes(MARK)){
  console.log("ℹ️ "+MARK+" already present");
  process.exit(0);
}

/* 1) เพิ่ม last-known-good ของ core connection */
const healthAnchor='let CONNECTION_HEALTH={checked:false,business:false,workspace:false,gmail:false,gmailReconnect:false};';
if(!src.includes(healthAnchor)) throw new Error("หา CONNECTION_HEALTH anchor ไม่เจอ");

src=src.replace(healthAnchor, healthAnchor + `
/* ${MARK}
   Core connection ต้องไม่ถูกตัดเพราะ health probe พลาดครั้งเดียว
   เก็บ last-known-good หลัง API หลักโหลดสำเร็จ แล้วให้ grace period กับ transient failure */
const CORE_READY_LKG_KEY=\`dashboard:core-ready-lkg:\${TENANT}\`;
const CORE_READY_GRACE_MS=24*60*60*1000;
function coreReadyLastGood(){
  try{
    const n=Number(localStorage.getItem(CORE_READY_LKG_KEY)||0);
    return Number.isFinite(n)?n:0;
  }catch{return 0;}
}
function coreReadyGraceActive(){
  const last=coreReadyLastGood();
  return last>0&&(Date.now()-last)<CORE_READY_GRACE_MS;
}
function markCoreReady(){
  try{localStorage.setItem(CORE_READY_LKG_KEY,String(Date.now()));}catch{}
}
`);

/* 2) health probe: ถ้าเคยใช้งานได้และ primary API ยังไม่ได้ fail 3 รอบ
      ให้ถือ core connection ว่ายังพร้อม ไม่ตีเป็น disconnected */
const healthAssign = `  CONNECTION_HEALTH={
    checked:true,
    business:Boolean(businessOk&&currentBusinessConnected()&&settingsOk),
    workspace:Boolean(workspaceOk),
    gmail:Boolean(gmailOk),
    gmailReconnect:gmailNeedsReconnect(),
  };`;

const healthAssignReplacement = `  const probedBusiness=Boolean(businessOk&&currentBusinessConnected()&&settingsOk);
  const probedWorkspace=Boolean(workspaceOk);
  const probedCoreReady=probedBusiness&&probedWorkspace;
  if(probedCoreReady)markCoreReady();
  const keepCoreReady=probedCoreReady||(coreReadyGraceActive()&&DASH_FAILURE_COUNT<3);
  CONNECTION_HEALTH={
    checked:true,
    business:keepCoreReady?true:probedBusiness,
    workspace:keepCoreReady?true:probedWorkspace,
    gmail:Boolean(gmailOk),
    gmailReconnect:gmailNeedsReconnect(),
  };`;

let replacedHealth=0;
src=src.replaceAll(healthAssign,()=>{
  replacedHealth++;
  return healthAssignReplacement;
});
if(replacedHealth<2) throw new Error("แก้ health assignment ไม่ครบ");

/* 3) API หลักโหลดสำเร็จ = พิสูจน์แล้วว่า business/workspace ใช้งานได้
      ให้ซ่อน false critical ทันที */
const successAnchor = `    if(changed){ALL=next;LAST_SIGNATURE=sig;CONNECTED=true;drawAll();}
    else CONNECTED=true;

    HAS_LOADED=true;DASH_FAILURE_COUNT=0;`;

if(!src.includes(successAnchor)) throw new Error("หา refresh success anchor ไม่เจอ");

src=src.replace(successAnchor, `    if(changed){ALL=next;LAST_SIGNATURE=sig;CONNECTED=true;drawAll();}
    else CONNECTED=true;

    markCoreReady();
    CONNECTION_HEALTH={...CONNECTION_HEALTH,checked:true,business:true,workspace:true};
    renderConnectionHealthBanner();

    HAS_LOADED=true;DASH_FAILURE_COUNT=0;`);

/* 4) จุดสำคัญที่สุด:
      ตอน load() ห้าม ALL=[] และห้าม block primary API เพราะ health probe fail
      ให้ลอง API รายการจริงก่อนเสมอ */
const destructiveGate = `  let primaryOk=true;
  if(!CONNECTED){
    // ไม่ยิง API รายการซ้ำ ๆ ถ้าธุรกิจ/Google ยังไม่พร้อม — แจ้งสาเหตุและทางแก้ให้ตรงจุด
    ALL=[];HAS_LOADED=true;
    try{drawAll();}catch(err){console.debug("setup placeholder render skipped",err);}
    syncStatus("error","ต้องเชื่อมธุรกิจก่อน");
    hideNetworkBanner();
    primaryOk=false;
  }else if(EXPENSE_DATA_PAGES.has(target)){
    primaryOk=await refreshData({initial:true});
  }else{`;

if(!src.includes(destructiveGate)) throw new Error("หา destructive load gate ไม่เจอ");

src=src.replace(destructiveGate, `  let primaryOk=true;
  // ${MARK}: health probe เป็นเพียงสัญญาณ ไม่ใช่สิทธิ์ล้างข้อมูล
  // หน้า core ต้องลอง API จริงก่อนเสมอ
  if(EXPENSE_DATA_PAGES.has(target)){
    primaryOk=await refreshData({initial:true});
  }else{`);

/* 5) ถ้า primary endpoint ของหน้าโหลดสำเร็จ ให้ยืนยัน core ready
      แต่ไม่ผูก Gmail เข้ากับความพร้อมหลัก */
const oauthAnchor = `  if(QS.get("gmail")==="connected")await confirmGmailOAuthReturn();`;
if(!src.includes(oauthAnchor)) throw new Error("หา OAuth return anchor ไม่เจอ");

src=src.replace(oauthAnchor, `  if(primaryOk===true&&["overview","expenses","reports","bills","activity","settings","business","batches","reconciliation","income"].includes(target)){
    markCoreReady();
    CONNECTION_HEALTH={...CONNECTION_HEALTH,checked:true,business:true,workspace:true};
    CONNECTED=true;
    renderConnectionHealthBanner();
  }

  ${oauthAnchor}`);

/* 6) ถ้า health probe พลาดชั่วคราว แต่มี LKG อยู่
      อย่าเปลี่ยนข้อความเป็น “ต้องเชื่อมธุรกิจ” ตั้งแต่รอบแรก */
const setupFailBlock = `      if(setupReady===false){
        hideNetworkBanner();
        syncStatus("error","ต้องเชื่อมธุรกิจก่อน");
        return false;
      }`;

if(!src.includes(setupFailBlock)) throw new Error("หา setup failure block ไม่เจอ");

src=src.replace(setupFailBlock, `      if(setupReady===false&&(!coreReadyGraceActive()||DASH_FAILURE_COUNT>=3)){
        hideNetworkBanner();
        syncStatus("error","ต้องเชื่อมธุรกิจก่อน");
        return false;
      }
      if(setupReady===false&&coreReadyGraceActive()){
        showNetworkBanner("warn","การเชื่อมต่อไม่เสถียร","ข้อมูลเดิมยังอยู่ · ระบบกำลังลองเชื่อมต่อธุรกิจอีกครั้งอัตโนมัติ");
      }`);

/* 7) ป้องกัน pagehide ล้าง ALL ก่อน browser snapshot/back-forward cache */
const pagehideOld='window.addEventListener("pagehide",()=>{clearDashboardRetry();if(REFRESH_TIMER){clearInterval(REFRESH_TIMER);REFRESH_TIMER=null;}if(BUSINESS_PAIR_POLL){clearInterval(BUSINESS_PAIR_POLL);BUSINESS_PAIR_POLL=null;}releaseImageNodes(document);ALL=[];EMAIL_DOCS=[];SUBSCRIPTIONS=[];BATCH_DATA={pending:{groups:[],itemCount:0,total:0,urgentCount:0,people:0},batches:[],settings:{}};RECON_DATA={rows:[],paidBatches:[],summary:{}};INCOME_DATA={ok:true,records:[],payments:[],reconciliation:[],reconciliationSummary:{},summary:{},categories:[]};});';

if(src.includes(pagehideOld)){
  src=src.replace(pagehideOld, `window.addEventListener("pagehide",event=>{
  clearDashboardRetry();
  if(REFRESH_TIMER){clearInterval(REFRESH_TIMER);REFRESH_TIMER=null;}
  if(BUSINESS_PAIR_POLL){clearInterval(BUSINESS_PAIR_POLL);BUSINESS_PAIR_POLL=null;}
  // ห้ามล้าง state ตอน browser เก็บหน้าไว้ใน BFCache
  if(event.persisted)return;
  releaseImageNodes(document);
  EMAIL_DOCS=[];SUBSCRIPTIONS=[];
});`);
}

fs.writeFileSync(dashboardFile,src);
execFileSync(process.execPath,["--check",dashboardFile],{stdio:"inherit"});
console.log("✅ "+MARK+" ready");
console.log("✅ transient health probe no longer clears dashboard data");
console.log("✅ last-known-good core connection enabled");
