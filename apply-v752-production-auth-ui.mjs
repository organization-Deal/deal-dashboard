import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const file=path.join(root,"assets","dashboard.js");
const MARK="PRODUCTION_AUTH_UI_GUARD_V7_52_20260815";
if(!fs.existsSync(file))throw new Error("ไม่พบ assets/dashboard.js");
let src=fs.readFileSync(file,"utf8");
if(src.includes(MARK)){
  console.log("ℹ️ "+MARK+" already present");
  process.exit(0);
}
function mustReplace(from,to,label){
  if(!src.includes(from))throw new Error("หา anchor ไม่เจอ: "+label);
  src=src.replace(from,to);
}

const healthLine="let CONNECTION_HEALTH={checked:false,business:false,workspace:false,gmail:false,gmailReconnect:false};";
const insertBlock="// PRODUCTION_AUTH_UI_GUARD_V7_52_20260815\nlet GOOGLE_CORE_INFO={connected:false,reconnectRequired:false,reason:\"unknown\",detail:\"\"};\nasync function refreshGoogleCoreStatus(){\n  try{\n    const res=await fetch(apiUrl(\"/api/google-status\")+`&_=${Date.now()}`,{cache:\"no-store\",headers:{\"cache-control\":\"no-cache\"}});\n    const data=await res.json().catch(()=>({}));\n    if(!res.ok||data.ok===false)throw new Error(data.message||data.error||`HTTP ${res.status}`);\n    GOOGLE_CORE_INFO={...GOOGLE_CORE_INFO,...data};\n    return data.connected===true;\n  }catch(err){\n    console.warn(\"google core status\",err);\n    GOOGLE_CORE_INFO={...GOOGLE_CORE_INFO,connected:false,reason:\"status_unavailable\",detail:String(err?.message||err)};\n    return false;\n  }\n}\nfunction showCoreDataUnavailable(message=\"ยังอ่านข้อมูลจาก Google Sheet ไม่ได้\"){\n  [\"kSpend\",\"kCount\",\"kPending\",\"kPaid\"].forEach(id=>{const node=el(id);if(node)node.textContent=\"—\";});\n  [\"kPendingCount\",\"kPaidCount\"].forEach(id=>{const node=el(id);if(node)node.textContent=\"รอเชื่อมต่อ\";});\n  const trend=el(\"trend\");\n  if(trend)trend.innerHTML='<text x=\"300\" y=\"80\" text-anchor=\"middle\" fill=\"#86868b\" font-size=\"13\">ข้อมูลยังไม่พร้อม — ไม่ได้หมายถึงยอดเป็น 0</text>';\n  [\"cats\",\"vendors\",\"recent\"].forEach(id=>{const node=el(id);if(node)node.innerHTML=`<div class=\"empty\">${message}</div>`;});\n}";
mustReplace(healthLine,healthLine+"\n"+insertBlock,"health vars");

mustReplace(
  "const [settingsOk,businessOk,workspaceOk,gmailOk]=await Promise.all([",
  "const [googleOk,settingsOk,businessOk,workspaceOk,gmailOk]=await Promise.all([refreshGoogleCoreStatus(),",
  "health Promise"
);

src=src.replaceAll(
  "const probedCoreReady=probedBusiness&&probedWorkspace;",
  "const probedCoreReady=Boolean(googleOk&&probedBusiness&&probedWorkspace);"
);
src=src.replaceAll(
  "const probedWorkspace=Boolean(workspaceOk);",
  "const probedWorkspace=Boolean(googleOk&&workspaceOk);"
);

mustReplace(
  "  const critical=!businessReady||!workspaceReady;",
  '  const googleReady=GOOGLE_CORE_INFO.connected===true;\n  const critical=!googleReady||!workspaceReady;',
  "critical rule"
);
mustReplace(
  "if(title)title.textContent=critical?\"การเชื่อมต่อธุรกิจยังไม่พร้อม\":(CONNECTION_HEALTH.gmailReconnect?\"ต้องเชื่อม Gmail ใหม่\":\"Gmail ยังไม่ได้เชื่อม\");",
  "if(title)title.textContent=critical?(GOOGLE_CORE_INFO.reconnectRequired?\"Google Sheet / Drive ต้องเชื่อมใหม่\":\"กำลังตรวจ Google Sheet / Drive\"):(CONNECTION_HEALTH.gmailReconnect?\"ต้องเชื่อม Gmail ใหม่\":\"Gmail ยังไม่ได้เชื่อม\");",
  "banner title"
);
mustReplace(
  "if(detail)detail.textContent=critical?\"Dashboard ยังอ่าน Google Sheet / Drive ของธุรกิจนี้ไม่ได้ จึงยังโหลดข้อมูลรายการไม่ได้\":\"Dashboard ใช้งานได้ตามปกติ แต่เอกสารจากอีเมลจะยังไม่เข้าระบบอัตโนมัติ\";",
  "if(detail)detail.textContent=critical?\"ข้อมูลเดิมไม่ได้ถูกลบ แต่ระบบยังอ่าน Sheet / Drive ไม่ได้ จึงจะไม่แสดงยอดเป็น 0\":\"Dashboard ใช้งานได้ตามปกติ แต่เอกสารจากอีเมลจะยังไม่เข้าระบบอัตโนมัติ\";",
  "banner detail"
);

const oldAuth="    if(res.status===401||res.status===403){\n      DASH_AUTH_BLOCKED=true;clearDashboardRetry();\n      recoverDashboardShell(\"auth\");\n      showNetworkBanner(\"auth\",\"ลิงก์ Dashboard หมดอายุ\",\"ข้อมูลเดิมยังแสดงได้ แต่ต้องเปิด Dashboard จาก LINE ใหม่ก่อนอัปเดตข้อมูล\",\"เปิดใหม่\");\n      syncStatus(\"error\",\"ลิงก์หมดอายุ\");\n      return false;\n    }\n    if(!res.ok) throw new Error(\"HTTP \"+res.status);\n\n    const rows=await res.json();";
const newAuth="    const responseData=await res.json().catch(()=>null);\n    if((res.status===401||res.status===403)&&responseData?.error===\"google_reconnect_required\"){\n      DASH_AUTH_BLOCKED=false;clearDashboardRetry();\n      GOOGLE_CORE_INFO={...GOOGLE_CORE_INFO,...(responseData.google||{}),connected:false,reconnectRequired:true};\n      const recovered=recoverDashboardShell(\"google-auth\");\n      if(!recovered)showCoreDataUnavailable(\"Google Sheet / Drive ต้องเชื่อมใหม่\");\n      CONNECTION_HEALTH={...CONNECTION_HEALTH,checked:true,workspace:false};\n      renderConnectionHealthBanner();\n      showNetworkBanner(\"warn\",\"Google Sheet / Drive ต้องเชื่อมใหม่\",\"ข้อมูลเดิมยังอยู่ · ระบบหยุดแสดงตัวเลขแทนค่าเพื่อป้องกันความเข้าใจผิด\");\n      syncStatus(\"error\",\"ต้องเชื่อม Google Sheet / Drive ใหม่\");\n      return false;\n    }\n    if(res.status===401||res.status===403){\n      DASH_AUTH_BLOCKED=true;clearDashboardRetry();\n      recoverDashboardShell(\"auth\");\n      showNetworkBanner(\"auth\",\"ลิงก์ Dashboard หมดอายุ\",\"ข้อมูลเดิมยังแสดงได้ แต่ต้องเปิด Dashboard จาก LINE ใหม่ก่อนอัปเดตข้อมูล\",\"เปิดใหม่\");\n      syncStatus(\"error\",\"ลิงก์หมดอายุ\");\n      return false;\n    }\n    if(!res.ok)throw new Error(responseData?.message||responseData?.error||(\"HTTP \"+res.status));\n\n    const rows=responseData;";
mustReplace(oldAuth,newAuth,"refreshData auth branch");

// v7.52.1 — current dashboard already validates payloads as `invalid response`.
const oldPayloadFallback="    const next=Array.isArray(rows)?rows:[];";
const currentPayloadValidation='    if(!Array.isArray(rows)) throw new Error("invalid response");';
const hardenedPayloadValidation='    if(!Array.isArray(rows)) throw new Error("invalid_expense_payload");';

if(src.includes(oldPayloadFallback)){
  src=src.replace(oldPayloadFallback,hardenedPayloadValidation+"\\n    const next=rows;");
}else if(src.includes(currentPayloadValidation)){
  src=src.replace(currentPayloadValidation,hardenedPayloadValidation);
}else if(!src.includes("invalid_expense_payload")){
  throw new Error("หา expense payload validation ไม่เจอ — หยุดก่อนเพื่อไม่แก้ผิดเวอร์ชัน");
}

fs.writeFileSync(file,src);
execFileSync(process.execPath,["--check",file],{stdio:"inherit"});
console.log("✅ "+MARK+" ready");
console.log("✅ Google Sheet/Drive and Gmail shown as separate auth states");
console.log("✅ google_reconnect_required preserves cache / shows — instead of ฿0");
console.log("✅ 401 dashboard-link auth no longer confused with Google OAuth expiry");
console.log("✅ V7_52_1 current/legacy expense payload anchors supported");
