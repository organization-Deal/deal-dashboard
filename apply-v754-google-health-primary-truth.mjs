import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const file=path.join(root,"assets","dashboard.js");
const MARK="GOOGLE_HEALTH_PRIMARY_TRUTH_V7_54_20260815";
if(!fs.existsSync(file))throw new Error("ไม่พบ assets/dashboard.js");
let src=fs.readFileSync(file,"utf8");

if(src.includes(MARK)){
  console.log("ℹ️ "+MARK+" already present");
  process.exit(0);
}
if(!src.includes("PRODUCTION_AUTH_UI_GUARD_V7_52_20260815"))throw new Error("ต้องมี v7.52 ก่อน");
if(!src.includes("LOAD_GOOGLEOK_CRASH_FIX_V7_53_20260815"))throw new Error("ต้องมี v7.53 ก่อน");

/* ถ้า status endpoint พลาด/404 ชั่วคราว แต่ primary accounting API เคยพิสูจน์แล้วว่าอ่าน Sheet ได้
   ห้ามเปลี่ยนหน้ากลับเป็น critical false-positive */
const oldCatch=`  }catch(err){
    console.warn("google core status",err);
    GOOGLE_CORE_INFO={...GOOGLE_CORE_INFO,connected:false,reason:"status_unavailable",detail:String(err?.message||err)};
    return false;
  }
}`;
const newCatch=`  }catch(err){
    console.warn("google core status",err);
    if(CONNECTED||coreReadyGraceActive()){
      GOOGLE_CORE_INFO={
        ...GOOGLE_CORE_INFO,
        connected:true,
        reconnectRequired:false,
        reason:"verified_by_primary_data",
        detail:""
      };
      return true;
    }
    GOOGLE_CORE_INFO={...GOOGLE_CORE_INFO,connected:false,reason:"status_unavailable",detail:String(err?.message||err)};
    return false;
  }
}`;
if(!src.includes(oldCatch))throw new Error("หา refreshGoogleCoreStatus catch ไม่เจอ");
src=src.replace(oldCatch,newCatch);

/* /api/expenses สำเร็จ = หลักฐานจริงว่า Core Google ใช้งานได้
   ต้อง sync GOOGLE_CORE_INFO ด้วย ไม่ใช่ sync แค่ CONNECTION_HEALTH */
const successAnchor=`    markCoreReady();
    CONNECTION_HEALTH={...CONNECTION_HEALTH,checked:true,business:true,workspace:true};
    renderConnectionHealthBanner();`;
const successReplacement=`    markCoreReady();
    GOOGLE_CORE_INFO={
      ...GOOGLE_CORE_INFO,
      connected:true,
      reconnectRequired:false,
      reason:"verified_by_primary_data",
      detail:""
    };
    CONNECTION_HEALTH={...CONNECTION_HEALTH,checked:true,business:true,workspace:true};
    renderConnectionHealthBanner();`;
const successCount=src.split(successAnchor).length-1;
if(successCount<1)throw new Error("หา primary success anchor ไม่เจอ");
src=src.replace(successAnchor,successReplacement);

/* load() ยังมี success branch อีกจุด: sync Google state ด้วยก่อน render */
const loadSuccess=`    markCoreReady();
    CONNECTION_HEALTH={...CONNECTION_HEALTH,checked:true,business:true,workspace:true};
    CONNECTED=true;
    renderConnectionHealthBanner();`;
if(src.includes(loadSuccess)){
  src=src.replace(loadSuccess,`    markCoreReady();
    GOOGLE_CORE_INFO={
      ...GOOGLE_CORE_INFO,
      connected:true,
      reconnectRequired:false,
      reason:"verified_by_primary_data",
      detail:""
    };
    CONNECTION_HEALTH={...CONNECTION_HEALTH,checked:true,business:true,workspace:true};
    CONNECTED=true;
    renderConnectionHealthBanner();`);
}

/* แก้ UI inconsistency: title ห้ามบอก Google มีปัญหาแต่ chip Sheet/Drive เป็นสีเขียว */
const checksOld=`if(checks)checks.innerHTML=\`<span class="\${businessReady?'ok':'bad'}">\${businessReady?'✓':'!'} ธุรกิจ</span><span class="\${workspaceReady?'ok':'bad'}">\${workspaceReady?'✓':'!'} Sheet / Drive</span><span class="\${gmailReady?'ok':'warn'}">\${gmailReady?'✓':'!'} Gmail</span>\`;`;
const checksNew=`if(checks)checks.innerHTML=\`<span class="\${businessReady?'ok':'bad'}">\${businessReady?'✓':'!'} ธุรกิจ</span><span class="\${googleReady&&workspaceReady?'ok':'bad'}">\${googleReady&&workspaceReady?'✓':'!'} Sheet / Drive</span><span class="\${gmailReady?'ok':'warn'}">\${gmailReady?'✓':'!'} Gmail</span>\`;`;
if(src.includes(checksOld))src=src.replace(checksOld,checksNew);

src=src.replace(
  "async function refreshGoogleCoreStatus(){",
  `/* ${MARK} */\nasync function refreshGoogleCoreStatus(){`
);

fs.writeFileSync(file,src);
execFileSync(process.execPath,["--check",file],{stdio:"inherit"});

/* Static assertions */
const out=fs.readFileSync(file,"utf8");
if(!out.includes('reason:"verified_by_primary_data"'))throw new Error("primary truth state ไม่ถูกเพิ่ม");
if(!out.includes(MARK))throw new Error("marker หาย");

console.log("✅ "+MARK+" ready");
console.log("✅ successful accounting data now proves Google Sheet/Drive healthy");
console.log("✅ status-endpoint transient failure no longer leaves a false red banner");
console.log("✅ Sheet/Drive chip and banner title now use the same health truth");
