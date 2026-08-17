import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const dashboardFile = path.join(root, "assets", "dashboard.js");
const billingFile = path.join(root, "assets", "reimbursement-batch-lock.js");
const indexFile = path.join(root, "index.html");
const MARK = "STRIPE_PAY_NOW_UI_V7_75_20260817";
for (const file of [dashboardFile,billingFile,indexFile]) if (!fs.existsSync(file)) throw new Error(`v7.75 missing ${file}`);

let dash = fs.readFileSync(dashboardFile, "utf8");
const v774 = `async function requestUpgrade(plan){\n  // STRIPE_CHECKOUT_UI_V7_74_20260817\n  const p=PLAN_CATALOG[plan];if(!p)return;\n  const label=PLAN_CYCLE==="annual"?\`\${planMoney(p.annual)} บาท/ปี\`:\`\${planMoney(p.monthly)} บาท/เดือน\`;\n  const inTrial=PLAN_INFO?.betaActive===true;\n  const message=inTrial\n    ? \`เลือกแพ็กเกจ \${p.name} (\${label}) ไว้ใช้หลังทดลองใช้ฟรี?\\n\\nช่วงทดลองจะยังไม่ตัดเงินและยังไม่ขอบัตร\`\n    : (plan==="free"\n      ? "ต้องการจัดการหรือยกเลิกแพ็กเกจปัจจุบันผ่านหน้าการชำระเงินที่ปลอดภัยของ Stripe?"\n      : \`ไปหน้าชำระเงิน Stripe เพื่อสมัครแพ็กเกจ \${p.name} (\${label})?\`);\n  if(!confirm(message))return;\n  try{\n    const res=await fetch(apiUrl("/api/subscription/request-upgrade"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({plan,cycle:PLAN_CYCLE})});\n    const data=await res.json().catch(()=>({}));\n    if(!res.ok||data.ok!==true){\n      if(data.reason==="stripe_not_configured")throw new Error("ยังไม่ได้ตั้งค่า Stripe Secret ใน Cloudflare");\n      throw new Error(data.detail||data.reason||data.error||("HTTP "+res.status));\n    }\n    if(data.portalUrl){location.assign(data.portalUrl);return;}\n    if(data.checkoutUrl){location.assign(data.checkoutUrl);return;}\n    PLAN_INFO=data;renderSubscription();\n    if(inTrial)alert(\`เลือกแพ็กเกจ \${p.name} ไว้แล้ว\\nทดลองใช้ฟรีต่อได้จนจบ 30 วัน และยังไม่มีการตัดเงินอัตโนมัติ\`);\n  }catch(err){console.error(err);alert(\`ดำเนินการแพ็กเกจไม่สำเร็จ\\n\${err?.message||"กรุณาลองใหม่"}\`);}\n}`;
const v773 = `async function requestUpgrade(plan){\n  const p=PLAN_CATALOG[plan];if(!p)return;\n  const label=PLAN_CYCLE==="annual"?\`\${planMoney(p.annual)} บาท/ปี\`:\`\${planMoney(p.monthly)} บาท/เดือน\`;\n  if(!confirm(\`เลือกแพ็กเกจ \${p.name} (\${label}) ไว้หลังช่วง Beta?\\n\\nตอนนี้ยังไม่มีการเรียกเก็บเงินจริง\`))return;\n  try{\n    const res=await fetch(apiUrl("/api/subscription/request-upgrade"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({plan,cycle:PLAN_CYCLE})});\n    const data=await res.json().catch(()=>({}));\n    if(!res.ok||data.ok!==true)throw new Error(data.reason||data.error||("HTTP "+res.status));\n    PLAN_INFO=data;renderSubscription();\n    alert(\`บันทึกแพ็กเกจ \${p.name} ไว้แล้ว\\nช่วง Beta ยังใช้ฟรีเหมือนเดิม และจะไม่มีการตัดเงินอัตโนมัติ\`);\n  }catch(err){console.error(err);alert("บันทึกแพ็กเกจไม่สำเร็จ กรุณาลองใหม่");}\n}`;
const finalFn = `async function requestUpgrade(plan){\n  // ${MARK}\n  const p=PLAN_CATALOG[plan];if(!p)return;\n  const label=PLAN_CYCLE==="annual"?\`\${planMoney(p.annual)} บาท/ปี\`:\`\${planMoney(p.monthly)} บาท/เดือน\`;\n  const inTrial=PLAN_INFO?.betaActive===true;\n  const paid=plan!=="free";\n  const message=paid\n    ? \`ชำระเงินและเริ่มแพ็กเกจ \${p.name} (\${label}) ตอนนี้?\\n\\nหลังชำระสำเร็จ ระบบจะเปิดแพ็กทันที และช่วงทดลองใช้ฟรีจะสิ้นสุด\`\n    : (inTrial ? "เลือก Free หลังช่วงทดลองใช้ฟรี?" : "ต้องการจัดการแพ็กเกจปัจจุบันผ่าน Stripe?");\n  if(!confirm(message))return;\n  try{\n    const res=await fetch(apiUrl("/api/subscription/request-upgrade"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({plan,cycle:PLAN_CYCLE,payNow:paid})});\n    const data=await res.json().catch(()=>({}));\n    if(!res.ok||data.ok!==true){\n      if(data.reason==="stripe_not_configured")throw new Error("ระบบชำระเงินยังตั้งค่าไม่ครบ");\n      throw new Error(data.detail||data.reason||data.error||("HTTP "+res.status));\n    }\n    if(data.portalUrl){location.assign(data.portalUrl);return;}\n    if(data.checkoutUrl){location.assign(data.checkoutUrl);return;}\n    PLAN_INFO=data;renderSubscription();\n    if(inTrial&&plan==="free")alert("เลือก Free ไว้หลังช่วงทดลองใช้ฟรีแล้ว");\n  }catch(err){console.error(err);alert(\`ดำเนินการแพ็กเกจไม่สำเร็จ\\n\${err?.message||"กรุณาลองใหม่"}\`);}\n}`;
if (!dash.includes(MARK)) {
  if (dash.includes(v774)) dash = dash.replace(v774, finalFn);
  else if (dash.includes(v773)) dash = dash.replace(v773, finalFn);
  else throw new Error("v7.75 requestUpgrade anchor missing");
}
fs.writeFileSync(dashboardFile,dash);
execFileSync(process.execPath,["--check",dashboardFile],{stdio:"inherit"});

let billing=fs.readFileSync(billingFile,"utf8");
billing=billing.replace('PLAN_INFO.betaActive ? (p.id === "free" ? "เลือก Free หลังทดลองใช้ฟรี" : "เลือกแพ็กเกจนี้หลังทดลองใช้ฟรี") : (active ? "แพ็กเกจปัจจุบัน" : "เลือกแพ็กเกจนี้")', 'PLAN_INFO.betaActive ? (p.id === "free" ? "เลือก Free หลังทดลองใช้ฟรี" : "ชำระและเริ่มใช้แพ็กนี้") : (active ? "แพ็กเกจปัจจุบัน" : "เลือกแพ็กเกจนี้")');
billing=billing.replace('PLAN_INFO.betaActive ? (p.id === "free" ? "เลือก Free หลังทดลองใช้ฟรี" : "เลือกแพ็กเกจนี้หลังทดลองใช้ฟรี")', 'PLAN_INFO.betaActive ? (p.id === "free" ? "เลือก Free หลังทดลองใช้ฟรี" : "ชำระและเริ่มใช้แพ็กนี้")');
if(!billing.includes(MARK)) billing += `\n\n/* ${MARK} */\nconsole.info("${MARK}");\n`;
fs.writeFileSync(billingFile,billing);
execFileSync(process.execPath,["--check",billingFile],{stdio:"inherit"});

let index=fs.readFileSync(indexFile,"utf8");
index=index.replace(/ช่วงทดลองยังไม่มีการเก็บเงินจริง[^<]*/g,'ช่วงทดลองใช้ไม่มีการตัดเงินอัตโนมัติ · หากต้องการเริ่มแพ็กเสียเงินทันที กดแพ็กที่ต้องการแล้วชำระผ่าน Stripe ได้เลย');
index=index.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, './assets/dashboard.js?v=7.75.20260817');
index=index.replace(/\.\/assets\/reimbursement-batch-lock\.js\?v=[^"]+/, './assets/reimbursement-batch-lock.js?v=7.75.20260817');
fs.writeFileSync(indexFile,index);

if(!dash.includes(MARK)||!dash.includes('payNow:paid')) throw new Error("v7.75 dashboard audit failed");
console.log(`✅ ${MARK} ready`);
console.log("✅ Trial paid-plan button now opens Stripe Checkout immediately");
console.log("✅ No admin-contact/manual-upgrade path in the payment action");
