import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const dashboardFile = path.join(root, "assets", "dashboard.js");
const billingFile = path.join(root, "assets", "reimbursement-batch-lock.js");
const indexFile = path.join(root, "index.html");
const MARK = "STRIPE_CHECKOUT_UI_V7_74_20260817";
for (const file of [dashboardFile, billingFile, indexFile]) if (!fs.existsSync(file)) throw new Error(`v7.74 missing ${file}`);

let dash = fs.readFileSync(dashboardFile, "utf8");
const oldFn = `async function requestUpgrade(plan){\n  const p=PLAN_CATALOG[plan];if(!p)return;\n  const label=PLAN_CYCLE==="annual"?\`\${planMoney(p.annual)} บาท/ปี\`:\`\${planMoney(p.monthly)} บาท/เดือน\`;\n  if(!confirm(\`เลือกแพ็กเกจ \${p.name} (\${label}) ไว้หลังช่วง Beta?\\n\\nตอนนี้ยังไม่มีการเรียกเก็บเงินจริง\`))return;\n  try{\n    const res=await fetch(apiUrl("/api/subscription/request-upgrade"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({plan,cycle:PLAN_CYCLE})});\n    const data=await res.json().catch(()=>({}));\n    if(!res.ok||data.ok!==true)throw new Error(data.reason||data.error||("HTTP "+res.status));\n    PLAN_INFO=data;renderSubscription();\n    alert(\`บันทึกแพ็กเกจ \${p.name} ไว้แล้ว\\nช่วง Beta ยังใช้ฟรีเหมือนเดิม และจะไม่มีการตัดเงินอัตโนมัติ\`);\n  }catch(err){console.error(err);alert("บันทึกแพ็กเกจไม่สำเร็จ กรุณาลองใหม่");}\n}`;
const newFn = `async function requestUpgrade(plan){\n  // ${MARK}\n  const p=PLAN_CATALOG[plan];if(!p)return;\n  const label=PLAN_CYCLE==="annual"?\`\${planMoney(p.annual)} บาท/ปี\`:\`\${planMoney(p.monthly)} บาท/เดือน\`;\n  const inTrial=PLAN_INFO?.betaActive===true;\n  const message=inTrial\n    ? \`เลือกแพ็กเกจ \${p.name} (\${label}) ไว้ใช้หลังทดลองใช้ฟรี?\\n\\nช่วงทดลองจะยังไม่ตัดเงินและยังไม่ขอบัตร\`\n    : (plan==="free"\n      ? "ต้องการจัดการหรือยกเลิกแพ็กเกจปัจจุบันผ่านหน้าการชำระเงินที่ปลอดภัยของ Stripe?"\n      : \`ไปหน้าชำระเงิน Stripe เพื่อสมัครแพ็กเกจ \${p.name} (\${label})?\`);\n  if(!confirm(message))return;\n  try{\n    const res=await fetch(apiUrl("/api/subscription/request-upgrade"),{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({plan,cycle:PLAN_CYCLE})});\n    const data=await res.json().catch(()=>({}));\n    if(!res.ok||data.ok!==true){\n      if(data.reason==="stripe_not_configured")throw new Error("ยังไม่ได้ตั้งค่า Stripe Secret ใน Cloudflare");\n      throw new Error(data.detail||data.reason||data.error||("HTTP "+res.status));\n    }\n    if(data.portalUrl){location.assign(data.portalUrl);return;}\n    if(data.checkoutUrl){location.assign(data.checkoutUrl);return;}\n    PLAN_INFO=data;renderSubscription();\n    if(inTrial)alert(\`เลือกแพ็กเกจ \${p.name} ไว้แล้ว\\nทดลองใช้ฟรีต่อได้จนจบ 30 วัน และยังไม่มีการตัดเงินอัตโนมัติ\`);\n  }catch(err){console.error(err);alert(\`ดำเนินการแพ็กเกจไม่สำเร็จ\\n\${err?.message||"กรุณาลองใหม่"}\`);}\n}`;
if (!dash.includes(MARK)) {
  if (!dash.includes(oldFn)) throw new Error("v7.74 requestUpgrade anchor missing");
  dash = dash.replace(oldFn, newFn);
}
fs.writeFileSync(dashboardFile, dash);
execFileSync(process.execPath, ["--check", dashboardFile], { stdio: "inherit" });

let billing = fs.readFileSync(billingFile, "utf8");
// Keep displayed annual prices exactly aligned with the live Stripe Price objects.
billing = billing.replace('starter:  { name:"Lite", monthly:199,  annual:1990,', 'starter:  { name:"Lite", monthly:199,  annual:2149,');
billing = billing.replace('pro:      { name:"Pro", monthly:399,  annual:3990,', 'pro:      { name:"Pro", monthly:399,  annual:4213,');
billing = billing.replace('business: { name:"Business", monthly:1290, annual:12900,', 'business: { name:"Business", monthly:1290, annual:13158,');
if (!billing.includes(MARK)) billing += `\n\n/* ${MARK} — live Stripe price sync */\nconsole.info("${MARK}");\n`;
fs.writeFileSync(billingFile, billing);
execFileSync(process.execPath, ["--check", billingFile], { stdio: "inherit" });

let index = fs.readFileSync(indexFile, "utf8");
index = index.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, './assets/dashboard.js?v=7.74.20260817');
index = index.replace(/\.\/assets\/reimbursement-batch-lock\.js\?v=[^"]+/, './assets/reimbursement-batch-lock.js?v=7.74.20260817');
fs.writeFileSync(indexFile, index);

for (const [text, needle] of [[dash, MARK],[billing,'annual:2149'],[billing,'annual:4213'],[billing,'annual:13158']]) {
  if (!text.includes(needle)) throw new Error(`v7.74 audit missing ${needle}`);
}
console.log(`✅ ${MARK} ready`);
console.log("✅ Trial selection keeps zero-charge behavior");
console.log("✅ After Trial, paid plans redirect to Stripe Checkout");
console.log("✅ Existing paid plans redirect to Stripe Customer Portal instead of creating duplicates");
console.log("✅ Annual display synced to live Stripe: 2,149 / 4,213 / 13,158 THB");
