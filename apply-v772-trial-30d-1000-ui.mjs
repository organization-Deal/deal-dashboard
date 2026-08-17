import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "TRIAL_UI_30D_1000_V7_72_2_20260817";
const files = {
  pilot: path.join(root, "pilot.html"),
  index: path.join(root, "index.html"),
  dashboard: path.join(root, "assets", "dashboard.js"),
  admin: path.join(root, "assets", "admin.js"),
  adminHtml: path.join(root, "admin.html"),
  reimbursement: path.join(root, "assets", "reimbursement-batch-lock.js"),
};

for (const [name, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) throw new Error(`v7.72: missing ${name}: ${file}`);
}

function rep(text, from, to) {
  return text.split(from).join(to);
}

/* Public Pilot Form */
let pilot = fs.readFileSync(files.pilot, "utf8");
pilot = rep(pilot, '<div class="trial-icon">60</div>', '<div class="trial-icon">30</div>');
pilot = rep(pilot, "ทดลองใช้แพ็กเกจ Business ฟรี 60 วัน", "ทดลองใช้แพ็กเกจ Business ฟรี 30 วัน");
pilot = rep(pilot, "รองรับสูงสุด 1,500 รายการ/เดือน", "รองรับสูงสุด 1,000 รายการ/เดือน");
pilot = rep(pilot, "สูงสุด 1,500 รายการ/เดือน", "สูงสุด 1,000 รายการ/เดือน");
pilot = rep(pilot, "60 วันจะเริ่มนับ", "30 วันจะเริ่มนับ");
pilot = rep(pilot, "ไม่เริ่มนับ 60 วัน", "ไม่เริ่มนับ 30 วัน");
fs.writeFileSync(files.pilot, pilot);

/* Dashboard static fallback */
let index = fs.readFileSync(files.index, "utf8");
index = rep(index, "60-DAY FREE TRIAL", "30-DAY FREE TRIAL");
index = rep(index, "60 DAY FREE TRIAL", "30 DAY FREE TRIAL");
index = rep(index, ">BETA FREE<", ">30-DAY FREE TRIAL<");
index = rep(index, "ทดลองใช้แพ็กเกจ Business ฟรี 60 วัน", "ทดลองใช้แพ็กเกจ Business ฟรี 30 วัน");
// Keep the static fallback aligned with the live 30-day Business Trial policy.
index = rep(index, '>Beta ฟรี</h3>', '>ทดลองใช้ Business ฟรี</h3>');
index = rep(
  index,
  "ช่วงทดสอบระบบ ใช้งานฟีเจอร์ Pro ได้โดยไม่คิดค่าบริการ และไม่มีการตัดบัตรอัตโนมัติ",
  "ช่วงทดลอง 30 วัน · ใช้ Workflow Business ได้ฟรี · สูงสุด 1,000 เอกสาร/เดือน · ไม่มีการตัดเงินอัตโนมัติ"
);
index = rep(
  index,
  "ช่วง Beta ไม่จำกัดจำนวนเอกสาร",
  "Trial Business · สูงสุด 1,000 เอกสาร/เดือน · ยังไม่มีการเรียกเก็บเงิน"
);
index = rep(index, "เลือกแพ็กเกจหลังช่วง Beta", "เลือกแพ็กเกจหลังช่วงทดลอง");
index = rep(index, "ช่วง Beta ยังไม่เรียกเก็บเงินจริง", "ช่วงทดลองยังไม่เรียกเก็บเงินจริง");
index = rep(index, "100% หลังพ้น Beta", "100% หลังพ้นช่วงทดลอง");
fs.writeFileSync(files.index, index);

/* Dashboard subscription/trial copy */
let dash = fs.readFileSync(files.dashboard, "utf8");
dash = rep(dash, '"BETA FREE"', '"30-DAY FREE TRIAL"');
dash = rep(dash, "60-DAY FREE TRIAL", "30-DAY FREE TRIAL");
dash = rep(dash, "ใช้ฟรีทุกฟีเจอร์ Pro อีก ", "ทดลองใช้ Business ฟรี อีก ");
dash = rep(dash, "Beta ฟรีถึง ", "ทดลองใช้ฟรีถึง ");
dash = rep(dash, '"Beta ฟรี · สิทธิ์ Pro"', '"ทดลองใช้ Business ฟรี"');
dash = rep(
  dash,
  '"ช่วงทดสอบระบบ ใช้ Workflow Pro ได้ฟรี ไม่มีการตัดเงิน และไม่จำกัดจำนวนเอกสารจนกว่าจะสิ้นสุด Beta"',
  '"ช่วงทดลอง 30 วัน · ใช้ Workflow Business ได้ฟรี · สูงสุด 1,000 เอกสาร/เดือน · ไม่มีการตัดเงิน"'
);
dash = rep(
  dash,
  '"เอกสารที่บันทึกเดือนนี้ · Beta ไม่จำกัด"',
  '"เอกสารที่บันทึกเดือนนี้ · Trial สูงสุด 1,000 เอกสาร"'
);
dash = rep(
  dash,
  '"ช่วง Beta ไม่จำกัดจำนวนเอกสาร และยังไม่มีการเรียกเก็บเงิน"',
  '"Trial Business · สูงสุด 1,000 เอกสาร/เดือน · ยังไม่มีการเรียกเก็บเงิน"'
);
dash = rep(dash, "ทดลองใช้ Business ฟรี 60 วัน", "ทดลองใช้ Business ฟรี 30 วัน");
fs.writeFileSync(files.dashboard, dash);
execFileSync(process.execPath, ["--check", files.dashboard], { stdio: "inherit" });

/* Billing overlay — this file redefines renderSubscription after dashboard.js,
   so it must use the same Trial truth or it will visually overwrite v7.72. */
let reimbursement = fs.readFileSync(files.reimbursement, "utf8");
reimbursement = rep(reimbursement, "Trial = Business 60 วันต่อบัญชี, 1,500 รายการ/เดือน, 10 ธุรกิจ", "Trial = Business 30 วันต่อบัญชี, 1,000 รายการ/เดือน, 10 ธุรกิจ");
reimbursement = rep(reimbursement, "60-DAY FREE TRIAL", "30-DAY FREE TRIAL");
reimbursement = rep(reimbursement, "ทดลองใช้ Business ฟรี 60 วัน", "ทดลองใช้ Business ฟรี 30 วัน");
reimbursement = rep(reimbursement, "ทดลองใช้สิทธิ์ระดับ Business เต็ม 60 วัน ไม่มีการตัดเงินอัตโนมัติ · 1,500 รายการ/เดือน · สูงสุด 10 ธุรกิจ", "ทดลองใช้สิทธิ์ระดับ Business เต็ม 30 วัน ไม่มีการตัดเงินอัตโนมัติ · 1,000 รายการ/เดือน · สูงสุด 10 ธุรกิจ");
reimbursement = rep(reimbursement, "${used}/${limit || 1500} รายการ", "${used}/${limit || 1000} รายการ");
reimbursement = rep(reimbursement, "หลังทดลองใช้ฟรี 60 วัน?", "หลังทดลองใช้ฟรี 30 วัน?");
reimbursement = rep(reimbursement, "ทดลองใช้ฟรี Business ต่อจนครบ 60 วัน", "ทดลองใช้ฟรี Business ต่อจนครบ 30 วัน");
fs.writeFileSync(files.reimbursement, reimbursement);
execFileSync(process.execPath, ["--check", files.reimbursement], { stdio: "inherit" });

// Force browsers to request the corrected billing overlay even if an older asset was cached.
index = fs.readFileSync(files.index, "utf8");
index = index.replace(/\.\/assets\/reimbursement-batch-lock\.js\?v=[^"]+/, "./assets/reimbursement-batch-lock.js?v=7.72.2.20260817");
fs.writeFileSync(files.index, index);

/* Internal Ops is dynamic from backend, but remove any stale hard-coded public copy if present. */
for (const file of [files.admin, files.adminHtml]) {
  let s = fs.readFileSync(file, "utf8");
  s = rep(s, "60-DAY FREE TRIAL", "30-DAY FREE TRIAL");
  s = rep(s, "ทดลองใช้ Business ฟรี 60 วัน", "ทดลองใช้ Business ฟรี 30 วัน");
  s = rep(s, "Trial Business 60 วัน", "Trial Business 30 วัน");
  fs.writeFileSync(file, s);
}
execFileSync(process.execPath, ["--check", files.admin], { stdio: "inherit" });

/* Build guard — check only live customer/admin runtime surfaces, not historical README/migrations. */
const forbidden = [
  [/60-DAY\s+FREE\s+TRIAL/i, "60-DAY FREE TRIAL"],
  [/ทดลองใช้(?:แพ็กเกจ\s*)?Business ฟรี 60 วัน/, "Business free 60 days"],
  [/Beta ฟรี.*ไม่จำกัดจำนวนเอกสาร/, "unlimited Beta copy"],
  [/ช่วง Beta ไม่จำกัดจำนวนเอกสาร/, "unlimited Beta status"],
  [/ทดลองใช้สิทธิ์ระดับ Business เต็ม 60 วัน/, "billing overlay 60-day description"],
  [/หลังทดลองใช้ฟรี 60 วัน/, "billing overlay 60-day upgrade copy"],
];

for (const file of Object.values(files)) {
  const s = fs.readFileSync(file, "utf8");
  for (const [rx, label] of forbidden) {
    if (rx.test(s)) throw new Error(`v7.72 UI audit failed: ${label} remains in ${path.relative(root, file)}`);
  }
}

const finalReimbursement = fs.readFileSync(files.reimbursement, "utf8");
if (/\$\{used\}\/\$\{limit \|\| 1500\}/.test(finalReimbursement)) throw new Error("v7.72: billing Trial fallback still uses 1500");
if (!finalReimbursement.includes("30-DAY FREE TRIAL")) throw new Error("v7.72: billing overlay 30-day badge missing");
if (!finalReimbursement.includes("เต็ม 30 วัน ไม่มีการตัดเงินอัตโนมัติ · 1,000 รายการ/เดือน")) throw new Error("v7.72: billing overlay 30-day/1000 description missing");
if (!finalReimbursement.includes('features: ["1,500 รายการ/เดือน"')) throw new Error("v7.72: paid Business 1,500 package was changed unexpectedly");

const finalPilot = fs.readFileSync(files.pilot, "utf8");
if (/1,500 รายการ\/เดือน/.test(finalPilot)) throw new Error("v7.72 UI audit failed: Pilot 1,500 trial copy remains in pilot.html");
if (!finalPilot.includes("Business ฟรี 30 วัน")) throw new Error("v7.72: Pilot 30-day copy missing");
if (!finalPilot.includes("1,000 รายการ/เดือน")) throw new Error("v7.72: Pilot 1,000 limit copy missing");

console.log("✅ " + MARK + " ready");
console.log("✅ Pilot Form shows Business Trial 30 days / 1,000 documents per month");
console.log("✅ Dashboard Trial copy no longer says Pro or unlimited documents");
console.log("✅ Dashboard shows 30-day Trial copy and uses backend 1,000 quota");
console.log("✅ Billing overlay now matches Trial 30 days / 1,000 documents");
console.log("✅ paid Business package remains 1,500 documents/month");
console.log("✅ reimbursement-batch-lock cache key bumped to v7.72.2");
console.log("✅ Internal Ops has no hard-coded 60-day Trial copy");
console.log("✅ live UI audit found no 60-day / unlimited Trial copy");
