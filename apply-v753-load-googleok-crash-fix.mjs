import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const file=path.join(root,"assets","dashboard.js");
const MARK="LOAD_GOOGLEOK_CRASH_FIX_V7_53_20260815";

if(!fs.existsSync(file))throw new Error("ไม่พบ assets/dashboard.js");
let src=fs.readFileSync(file,"utf8");

if(src.includes(MARK)){
  console.log("ℹ️ "+MARK+" already present");
  process.exit(0);
}
if(!src.includes("PRODUCTION_AUTH_UI_GUARD_V7_52_20260815")){
  throw new Error("ไม่พบ v7.52 ใน dashboard.js — หยุดก่อนเพื่อไม่แก้ผิดลำดับ");
}
if(!src.includes("async function refreshGoogleCoreStatus()")){
  throw new Error("ไม่พบ refreshGoogleCoreStatus — หยุดก่อนเพื่อไม่แก้ผิดเวอร์ชัน");
}

// v7.52 เดิม patch Promise.all occurrence แรกเท่านั้น แต่ replaceAll logic ทั้งไฟล์
// จึงทำให้ load() ใช้ googleOk โดยไม่ได้ประกาศตัวแปร
const oldPromise='const [settingsOk,businessOk,workspaceOk,gmailOk]=await Promise.all([';
const newPromise='const [googleOk,settingsOk,businessOk,workspaceOk,gmailOk]=await Promise.all([refreshGoogleCoreStatus(),';

let fixed=0;
while(src.includes(oldPromise)){
  src=src.replace(oldPromise,newPromise);
  fixed++;
}

if(fixed<1){
  // ถ้าไม่มี occurrence เก่าแล้ว ต้องแน่ใจว่าทั้ง health + load มี googleOk อย่างน้อย 2 จุด
  const matches=src.match(/const \[googleOk,settingsOk,businessOk,workspaceOk,gmailOk\]=await Promise\.all\(\[refreshGoogleCoreStatus\(\),/g)||[];
  if(matches.length<2)throw new Error("โครง load() ยังไม่ถูกต้อง และไม่พบ anchor ที่ปลอดภัยสำหรับแก้");
}

// ใส่ marker โดยไม่เปลี่ยน runtime logic เพิ่ม
src=src.replace(
  "async function refreshGoogleCoreStatus(){",
  `/* ${MARK} */\nasync function refreshGoogleCoreStatus(){`
);

fs.writeFileSync(file,src);
execFileSync(process.execPath,["--check",file],{stdio:"inherit"});

// Static assertion: googleOk declarations must cover both refreshConnectionHealth + load.
const finalText=fs.readFileSync(file,"utf8");
const declarationCount=(finalText.match(/const \[googleOk,settingsOk,businessOk,workspaceOk,gmailOk\]=await Promise\.all\(\[refreshGoogleCoreStatus\(\),/g)||[]).length;
if(declarationCount<2)throw new Error(`googleOk declaration ไม่ครบ: ${declarationCount}/2`);

console.log("✅ "+MARK+" ready");
console.log(`✅ googleOk declarations verified: ${declarationCount}`);
console.log("✅ load() no longer crashes before primary dashboard fetch");
