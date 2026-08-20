import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const file=path.join(process.cwd(),"assets","dashboard.js");
const MARK="RUBJAI_RECON_RAW_STATEMENT_UPLOAD_V9051_20260820";
if(!fs.existsSync(file))throw new Error("v9.05.1 missing assets/dashboard.js");
let src=fs.readFileSync(file,"utf8");
const REPLACEMENT="async function importStatementFile(file){\n  if(!file)return;\n  if(!RECON_CHANNEL_ID){alert(\"เลือกช่องทางการเงินก่อนนำเข้า Statement\");el(\"reconFile\").value=\"\";return;}\n  if(Number(file.size||0)>15*1024*1024){alert(\"Statement ต้องไม่เกิน 15 MB\");el(\"reconFile\").value=\"\";return;}\n  el(\"reconFileName\").value=file.name;\n  try{\n    const rows=await parseStatementFile(file);\n    if(!rows.length)throw new Error(\"ไม่พบรายการเงินออกในไฟล์นี้\");\n    const total=rows.reduce((s,r)=>s+r.amount,0),channel=RECON_DATA.selectedChannel||{};\n    if(!confirm(`นำเข้า Statement ของ ${financeChannelTitle(channel)}\nพบเงินออก ${rows.length} รายการ รวม ${baht(total)}\n\nระบบจะเก็บไฟล์ Statement ต้นฉบับไว้ใน Google Drive เป็นหลักฐานด้วย\nเริ่มกระทบยอดบัญชีนี้เลยไหม?`))return;\n    const form=new FormData();\n    form.append(\"file\",file,file.name);\n    form.append(\"fileName\",file.name);\n    form.append(\"sourceChannelId\",RECON_CHANNEL_ID);\n    form.append(\"rows\",JSON.stringify(rows));\n    const res=await fetch(apiUrl(\"/api/reconciliation-import\"),{method:\"POST\",body:form});\n    const out=await res.json().catch(()=>({}));\n    if(!res.ok||out.ok===false)throw new Error(reconApiError(out,res));\n    await refreshReconciliation({quiet:true});\n    alert(`นำเข้าแล้ว ${out.imported} รายการ\n✓ เก็บ Statement ต้นฉบับใน Google Drive แล้ว${out.skippedDuplicate?`\\nข้ามรายการซ้ำ ${out.skippedDuplicate}`:\"\"}${out.skippedInvalid?`\\nข้ามข้อมูลไม่ครบ ${out.skippedInvalid}`:\"\"}`);\n  }catch(err){\n    alert(\"นำเข้า Statement ไม่สำเร็จ: \"+err.message);\n  }finally{\n    el(\"reconFile\").value=\"\";\n  }\n}\n/* RUBJAI_RECON_RAW_STATEMENT_UPLOAD_V9051_20260820 */";
if(!src.includes(MARK)){
  const start=src.indexOf("async function importStatementFile(file){");
  const end=src.indexOf("\n\n\n/* ---------- SETTINGS ---------- */",start);
  if(start<0||end<0)throw new Error("v9.05.1 import function boundary not found");
  src=src.slice(0,start)+REPLACEMENT+src.slice(end);
  fs.writeFileSync(file,src,"utf8");
}
execFileSync(process.execPath,["--check",file],{stdio:"pipe"});
if(!fs.readFileSync(file,"utf8").includes(MARK))throw new Error("v9.05.1 audit failed");
console.log("✅ V9.05.1 raw Statement multipart upload");
