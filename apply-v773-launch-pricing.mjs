import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "LAUNCH_PRICING_V7_73_20260817";
const indexFile = path.join(root, "index.html");
const dashboardFile = path.join(root, "assets", "dashboard.js");
const billingFile = path.join(root, "assets", "reimbursement-batch-lock.js");
for (const file of [indexFile, dashboardFile, billingFile]) if (!fs.existsSync(file)) throw new Error(`v7.73 missing ${file}`);

let index = fs.readFileSync(indexFile, "utf8");
index = index.replace('<div class="l">เอกสารเดือนนี้</div>', '<div class="l">รายการเดือนนี้</div>');
index = index.replace('<span>ธุรกิจในบัญชี</span>', '<span>บริษัทที่ใช้งาน</span>');
index = index.replace(
  'ผู้ใช้งาน LINE ไม่จำกัดทุกแพ็กเกจเสียเงิน · คิดโควตาตามเอกสารที่บันทึกเข้าระบบ',
  'ทุกแพ็กใช้ฟีเจอร์หลักเหมือนกัน · ต่างกันที่จำนวนรายการ จำนวนเอกสารที่ระบบอ่านให้อัตโนมัติ และจำนวนบริษัทที่ใช้งาน'
);
index = index.split('Gmail เจ้าของธุรกิจ').join('อีเมลสำหรับดึงใบเสร็จ');
index = index.split('เชื่อม อีเมลสำหรับดึงใบเสร็จ').join('เชื่อมอีเมลสำหรับดึงใบเสร็จ');
index = index.replace('ใช้รับใบเสร็จ ใบกำกับภาษี และเอกสารจากอีเมล', 'เชื่อมอีเมลของบริษัท 1 บัญชี เพื่อดึงใบเสร็จและเอกสารเข้าระบบอัตโนมัติ');
index = index.replace('>เชื่อม Gmail</button>', '>เชื่อมอีเมล</button>');
index = index.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, './assets/dashboard.js?v=7.73.20260817');
index = index.replace(/\.\/assets\/reimbursement-batch-lock\.js\?v=[^"]+/, './assets/reimbursement-batch-lock.js?v=7.73.20260817');
fs.writeFileSync(indexFile, index);

let dash = fs.readFileSync(dashboardFile, "utf8");
dash = dash.replace('"เพิ่มธุรกิจ · ต้องใช้ Pro"', '"เพิ่มบริษัท · ต้องใช้ Business"');
dash = dash.replace('Pro รองรับสูงสุด ${data.businessLimit||3} ธุรกิจ', 'Business รองรับสูงสุด ${data.businessLimit||2} บริษัท');
dash = dash.replace('Workspace นี้ต้องใช้แพ็กเกจ Pro ขึ้นไป', 'Workspace นี้ต้องใช้แพ็กเกจ Business');
fs.writeFileSync(dashboardFile, dash);
execFileSync(process.execPath, ["--check", dashboardFile], { stdio: "inherit" });

let billing = fs.readFileSync(billingFile, "utf8");
if (!billing.includes(MARK)) {
  billing += `\n\n/* ${MARK} — launch pricing + customer-friendly package copy */\n(() => {\n  "use strict";\n  const MARK = "${MARK}";\n  if (typeof PLAN_CATALOG === "undefined") return;\n\n  const COMMON = [\n    "รับ–จ่ายและตั้งเบิกผ่าน LINE",\n    "ส่งให้ผู้อนุมัติ → ฝ่ายบัญชีตรวจ → บันทึกจ่าย",\n    "สร้างใบเบิก / ใบแทน และแจ้งผลการโอน",\n    "ดึงใบเสร็จจากอีเมลอัตโนมัติ",\n    "ตรวจรายการซ้ำ · กระทบยอด · ดูยอดเงิน",\n    "รายงาน · เอกสาร · Export ข้อมูล",\n    "ผู้ใช้งาน LINE ไม่จำกัด"\n  ];\n\n  const LAUNCH = {\n    free:     { name:"ฟรี", monthly:0,    annual:0,     documents:20,   aiDocuments:5,    businesses:1, recommended:false },\n    starter:  { name:"Lite", monthly:199,  annual:1990,  documents:200,  aiDocuments:30,   businesses:1, recommended:false },\n    pro:      { name:"Pro", monthly:399,  annual:3990,  documents:1000, aiDocuments:150,  businesses:1, recommended:true },\n    business: { name:"Business", monthly:1290, annual:12900, documents:3000, aiDocuments:1000, businesses:2, recommended:false },\n  };\n\n  Object.entries(LAUNCH).forEach(([id, cfg]) => {\n    if (!PLAN_CATALOG[id]) return;\n    Object.assign(PLAN_CATALOG[id], cfg, {\n      features: [\n        \`บันทึกรายการรับ–จ่ายได้สูงสุด \${Number(cfg.documents).toLocaleString("th-TH")} รายการ/เดือน\`,\n        \`AI อ่านใบเสร็จและเอกสารอัตโนมัติ \${Number(cfg.aiDocuments).toLocaleString("th-TH")} ใบ/เดือน\`,\n        cfg.businesses > 1 ? \`ใช้ได้สูงสุด \${cfg.businesses} บริษัท\` : "ใช้ได้ 1 บริษัท",\n        ...COMMON\n      ]\n    });\n  });\n\n  renderPricing = function renderPricingV773() {\n    const grid = el("pricingGrid"); if (!grid) return;\n    const requested = String(PLAN_INFO.requestedPlan || "");\n    const current = String(PLAN_INFO.effectivePlan || "");\n    grid.innerHTML = Object.values(PLAN_CATALOG).map((p) => {\n      const price = PLAN_CYCLE === "annual" ? p.annual : p.monthly;\n      const perMonth = PLAN_CYCLE === "annual" && price ? Math.round(price / 12) : price;\n      const selected = requested === p.id && String(PLAN_INFO.requestedCycle || "monthly") === PLAN_CYCLE;\n      const active = !PLAN_INFO.betaActive && PLAN_INFO.status === "active" && current === p.id;\n      let action = PLAN_INFO.betaActive ? (p.id === "free" ? "เลือก Free หลังทดลองใช้ฟรี" : "เลือกแพ็กเกจนี้หลังทดลองใช้ฟรี") : (active ? "แพ็กเกจปัจจุบัน" : "เลือกแพ็กเกจนี้");\n      if (selected) action = "เลือกไว้แล้ว";\n      const billed = PLAN_CYCLE === "annual" && price\n        ? \`ชำระ \${planMoney(price)} บาท/ปี · เฉลี่ย \${planMoney(perMonth)} บาท/เดือน\`\n        : (p.id === "free" ? "ไม่มีค่าบริการ" : "ชำระรายเดือน · ยกเลิกการต่ออายุได้ก่อนรอบถัดไป");\n      const ribbon = p.recommended ? '<span class="pricing-ribbon">แนะนำ</span>' : "";\n      return \`<article class="pricing-card \${p.recommended ? "recommended" : ""}">\${ribbon}<div class="pricing-name">แพ็กเกจ</div><h4>\${esc(p.name)}</h4><div class="pricing-price"><strong>\${price ? planMoney(price) : "0"} บาท</strong><span>/\${PLAN_CYCLE === "annual" ? "ปี" : "เดือน"}</span></div><div class="pricing-billed">\${esc(billed)}</div><div class="pricing-docs"><strong>\${planMoney(p.aiDocuments)} ใบ/เดือน</strong><span>AI อ่านใบเสร็จและเอกสารอัตโนมัติ</span><div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e5ea;font-size:11px"><b>\${planMoney(p.documents)} รายการ/เดือน</b> · รายรับ–รายจ่ายในระบบ</div></div><ul class="pricing-features">\${p.features.slice(2).map((x) => \`<li>\${esc(x)}</li>\`).join("")}</ul><button type="button" class="plan-action \${p.recommended ? "primary" : ""}" data-select-plan="\${p.id}" \${active || selected ? "disabled" : ""}>\${esc(action)}</button></article>\`;\n    }).join("");\n  };\n\n  const renderSubscriptionBeforeV773 = renderSubscription;\n  renderSubscription = function renderSubscriptionV773(...args) {\n    const result = renderSubscriptionBeforeV773.apply(this, args);\n    if (!PLAN_INFO || PLAN_INFO.ok !== true) return result;\n    const used = Number(PLAN_INFO.usage?.documents || 0);\n    const limit = Number(PLAN_INFO.documentLimit || 0);\n    const aiUsed = Number(PLAN_INFO.aiUsage?.documents || 0);\n    const aiLimit = Number(PLAN_INFO.aiDocumentLimit || (PLAN_INFO.betaActive ? 100 : (PLAN_CATALOG[PLAN_INFO.effectivePlan]?.aiDocuments || 0)));\n    if (el("billingUsageSub")) el("billingUsageSub").textContent = \`รายการรับ–จ่ายที่บันทึกเดือนนี้ · AI อ่านเอกสาร \${aiUsed}/\${aiLimit || "—"} ใบ\`;\n    if (el("billingBusinessUsage")) el("billingBusinessUsage").textContent = \`\${PLAN_INFO.businessCount || 1} / \${PLAN_INFO.businessLimit || (PLAN_INFO.betaActive ? 2 : 1)}\`;\n    if (PLAN_INFO.betaActive) {\n      if (el("betaPlanBadge")) el("betaPlanBadge").textContent = "30-DAY FREE TRIAL";\n      if (el("billingCurrentName")) el("billingCurrentName").textContent = "ทดลองใช้ Business ฟรี 30 วัน";\n      if (el("billingCurrentDesc")) el("billingCurrentDesc").textContent = "ใช้ฟีเจอร์ Business ได้ครบ · สูงสุด 1,000 รายการ/เดือน · AI อ่านเอกสารอัตโนมัติ 100 ใบ · ไม่มีการตัดเงินอัตโนมัติ";\n      if (el("billingUsageState")) el("billingUsageState").textContent = \`ทดลองใช้ Business · รายการ \${used}/\${limit || 1000} · AI อ่านเอกสาร \${aiUsed}/\${aiLimit || 100} ใบ · ยังไม่มีการเรียกเก็บเงิน\`;\n    }\n    renderPricing();\n    return result;\n  };\n\n  console.info(MARK);\n})();\n`;
}
fs.writeFileSync(billingFile, billing);
execFileSync(process.execPath, ["--check", billingFile], { stdio: "inherit" });

const finalBilling = fs.readFileSync(billingFile, "utf8");
const finalIndex = fs.readFileSync(indexFile, "utf8");
for (const needle of ["monthly:1290", "aiDocuments:1000", 'name:"Lite"', "LAUNCH_PRICING_V7_73_20260817"]) {
  if (!finalBilling.includes(needle)) throw new Error(`v7.73 audit missing ${needle}`);
}
if (!finalIndex.includes("ทุกแพ็กใช้ฟีเจอร์หลักเหมือนกัน")) throw new Error("v7.73 pricing explanation missing");
if (!finalIndex.includes("อีเมลสำหรับดึงใบเสร็จ")) throw new Error("v7.73 customer-friendly email copy missing");

console.log("✅ " + MARK + " ready");
console.log("✅ Free 0 / Lite 199 / Pro 399 / Business 1,290");
console.log("✅ AI reads 5 / 30 / 150 / 1,000 documents per month");
console.log("✅ transaction limits 20 / 200 / 1,000 / 3,000 per month");
console.log("✅ Pro is recommended; all plans show the same core features");
console.log("✅ Gmail copy changed to customer language: ดึงใบเสร็จจากอีเมลอัตโนมัติ");
