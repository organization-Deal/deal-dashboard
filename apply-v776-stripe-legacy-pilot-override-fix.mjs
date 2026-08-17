import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const billingFile = path.join(root, "assets", "reimbursement-batch-lock.js");
const indexFile = path.join(root, "index.html");
const MARK = "STRIPE_LEGACY_PILOT_OVERRIDE_FIX_V7_76_20260818";

for (const file of [billingFile, indexFile]) {
  if (!fs.existsSync(file)) throw new Error(`v7.76 missing ${file}`);
}

let billing = fs.readFileSync(billingFile, "utf8");

const legacyRequestUpgrade = /\n\s*requestUpgrade\s*=\s*async function requestUpgradePilot\(plan\)\s*\{[\s\S]*?\n\s*\};/;
if (legacyRequestUpgrade.test(billing)) {
  billing = billing.replace(
    legacyRequestUpgrade,
    `\n\n  // ${MARK}: removed legacy Pilot requestUpgrade override.\n  // The Stripe-aware requestUpgrade from assets/dashboard.js remains the single source of truth.`
  );
}

if (!billing.includes(MARK)) {
  billing += `\n\n/* ${MARK} */\nconsole.info("${MARK}");\n`;
}

if (billing.includes("requestUpgradePilot")) {
  throw new Error("v7.76 legacy requestUpgradePilot still present");
}
if (billing.includes("ทีมงานจะติดต่อยืนยันการชำระเงินก่อนเปิดแพ็กเกจ")) {
  throw new Error("v7.76 legacy manual-payment copy still present");
}

fs.writeFileSync(billingFile, billing);
execFileSync(process.execPath, ["--check", billingFile], { stdio: "inherit" });

let index = fs.readFileSync(indexFile, "utf8");
index = index.replace(
  /ช่วงทดลองยังไม่เรียกเก็บเงินจริง[^<]*/g,
  "ช่วงทดลองใช้ไม่มีการตัดเงินอัตโนมัติ · หากต้องการเริ่มแพ็กเสียเงินทันที ให้กดแพ็กที่ต้องการและชำระผ่าน Stripe"
);
index = index.replace(/\.\/assets\/reimbursement-batch-lock\.js\?v=[^"]+/, "./assets/reimbursement-batch-lock.js?v=7.76.20260818");
index = index.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, "./assets/dashboard.js?v=7.76.20260818");
fs.writeFileSync(indexFile, index);

console.log(`✅ ${MARK} ready`);
console.log("✅ Removed legacy Pilot requestUpgrade override");
console.log("✅ Paid plan buttons now use Stripe Checkout flow from dashboard.js");
