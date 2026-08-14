import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const dashboardFile=path.join(root,"assets","dashboard.js");
const MARK="NETWORK_FALSE_OFFLINE_FIX_V7_48_20260814";

if(!fs.existsSync(dashboardFile)) throw new Error("ไม่พบ assets/dashboard.js");

let src=fs.readFileSync(dashboardFile,"utf8");

if(src.includes(MARK)){
  console.log("ℹ️ "+MARK+" already present");
  process.exit(0);
}

const oldGate=`  if(!navigator.onLine){
    syncStatus("error","ออฟไลน์ — รอเชื่อมต่อ");
    recoverDashboardShell("offline");
    showNetworkBanner("offline","ตอนนี้ออฟไลน์","ยังดูข้อมูลล่าสุดที่มีอยู่ได้ ระบบจะอัปเดตเองเมื่ออินเทอร์เน็ตกลับมา");
    return false;
  }`;

const newGate=`  // ${MARK}
  // navigator.onLine เป็นแค่ hint และอาจ false-positive ได้
  // ต้องลอง API จริงก่อนเสมอ ห้ามล้าง Dashboard หรือหยุดโหลดเพราะค่านี้อย่างเดียว
  if(!navigator.onLine){
    syncStatus("syncing",manual?"กำลังลองเชื่อมต่อ…":"กำลังตรวจการเชื่อมต่อ…");
  }`;

if(!src.includes(oldGate)){
  throw new Error("หา offline gate เดิมไม่เจอ — หยุดก่อนเพื่อไม่แก้ผิดเวอร์ชัน");
}
src=src.replace(oldGate,newGate);

const oldOfflineListener=`window.addEventListener("offline",()=>{clearDashboardRetry();recoverDashboardShell("offline");showNetworkBanner("offline","ตอนนี้ออฟไลน์","ยังดูข้อมูลล่าสุดที่มีอยู่ได้ ระบบจะอัปเดตเองเมื่ออินเทอร์เน็ตกลับมา");syncStatus("error","ออฟไลน์ — รอเชื่อมต่อ");});`;

const newOfflineListener=`window.addEventListener("offline",()=>{
  // Browser/OS อาจแจ้ง offline ชั่วคราวทั้งที่ Worker ยังเข้าถึงได้
  // เก็บข้อมูลเดิมไว้ และให้ refreshData เป็นคนพิสูจน์ด้วย request จริง
  showNetworkBanner("warn","การเชื่อมต่อไม่เสถียร","กำลังตรวจสอบกับระบบจริง ข้อมูลเดิมบนหน้าจะไม่ถูกล้าง");
  syncStatus("syncing","กำลังตรวจการเชื่อมต่อ…");
  setTimeout(()=>{ if(!REFRESHING) refreshData({manual:true}); },900);
});`;

if(!src.includes(oldOfflineListener)){
  throw new Error("หา offline listener เดิมไม่เจอ — หยุดก่อนเพื่อไม่แก้ผิดเวอร์ชัน");
}
src=src.replace(oldOfflineListener,newOfflineListener);

fs.writeFileSync(dashboardFile,src);
execFileSync(process.execPath,["--check",dashboardFile],{stdio:"inherit"});

console.log("✅ "+MARK+" ready");
