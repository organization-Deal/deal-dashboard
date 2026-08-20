import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "RUBJAI_NAVY_CI_V900_20260820";
const NAVY = "#11162E";
const NAVY_HOVER = "#20294F";
const NAVY_DEEP = "#080B1A";
const NAVY_SOFT = "#F0F2F8";
const NAVY_LINE = "#D9DEEA";

const HEX_MAP = new Map([
  // Old indigo / purple / blue CI -> Navy CI
  ["#4F46E5", NAVY],
  ["#4338CA", NAVY_HOVER],
  ["#3730A3", NAVY_DEEP],
  ["#6366F1", NAVY],
  ["#5B5FEF", NAVY],
  ["#5850EC", NAVY],
  ["#5D5FEF", NAVY],
  ["#6C63FF", NAVY],
  ["#5548E8", NAVY],
  ["#7C3AED", NAVY],
  ["#6D28D9", NAVY],
  ["#8B5CF6", NAVY],
  ["#A78BFA", "#B8C0D1"],
  ["#2563EB", NAVY],
  ["#3B82F6", NAVY],
  ["#0071E3", NAVY],
  ["#4B46C4", NAVY],
  ["#312E81", NAVY_DEEP],

  // Old soft accent -> cool navy neutrals
  ["#EEF2FF", NAVY_SOFT],
  ["#EDE9FE", NAVY_SOFT],
  ["#F0F7FF", NAVY_SOFT],
  ["#EAF1FF", NAVY_SOFT],
  ["#DBEAFE", NAVY_SOFT],
  ["#C7D2FE", NAVY_LINE],
  ["#A5B4FC", "#B8C0D1"],
  ["#DFE3FF", "#E1E5EF"],

  // Old black / graphite primary surfaces -> Navy
  ["#1D1D1F", NAVY],
  ["#101828", NAVY],
  ["#111827", NAVY],
  ["#111111", NAVY],
  ["#1C1F24", NAVY],
  ["#171719", NAVY],
  ["#000000", NAVY_DEEP],

  // Text neutrals
  ["#344054", "#39405A"],
  ["#3A3A3C", "#39405A"],
  ["#6E6E73", "#667085"],
  ["#86868B", "#98A2B3"],
  ["#AEAEB2", "#98A2B3"],
  ["#D2D2D7", "#D9DEE8"],
  ["#E5E5EA", "#E4E7EC"],
]);

const FORBIDDEN = [
  "#4F46E5","#4338CA","#3730A3","#6366F1","#5B5FEF","#5850EC",
  "#5D5FEF","#6C63FF","#5548E8","#7C3AED","#6D28D9","#8B5CF6",
  "#2563EB","#3B82F6","#0071E3","#4B46C4","#312E81",
  "#EEF2FF","#EDE9FE","#C7D2FE","#A5B4FC"
];

const ACTIVE_EXT = new Set([".html",".css",".js"]);
const ACTIVE_FILES = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      // bank logos / binary assets are deliberately not edited
      if (ent.name === "bank-logos") continue;
      walk(full);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (ACTIVE_EXT.has(ext)) ACTIVE_FILES.push(full);
  }
}

for (const name of fs.readdirSync(root)) {
  const full = path.join(root,name);
  if (fs.statSync(full).isFile() && name.endsWith(".html")) ACTIVE_FILES.push(full);
}
walk(path.join(root,"assets"));

function replaceHexToken(text, from, to) {
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`${escaped}(?![0-9A-Fa-f])`, "gi"), to);
}

function recolor(text) {
  for (const [from,to] of HEX_MAP) text = replaceHexToken(text, from, to);

  // RGB/RGBA remnants from the old Indigo CI
  text = text
    .replace(/rgba?\(\s*79\s*,\s*70\s*,\s*229\b/gi, m => m.replace(/79\s*,\s*70\s*,\s*229/i,"17,22,46"))
    .replace(/rgba?\(\s*67\s*,\s*56\s*,\s*202\b/gi, m => m.replace(/67\s*,\s*56\s*,\s*202/i,"32,41,79"))
    .replace(/rgba?\(\s*99\s*,\s*102\s*,\s*241\b/gi, m => m.replace(/99\s*,\s*102\s*,\s*241/i,"17,22,46"))
    .replace(/rgba?\(\s*29\s*,\s*29\s*,\s*31\b/gi, m => m.replace(/29\s*,\s*29\s*,\s*31/i,"17,22,46"));

  // Do not keep old CSS primary names visually purple even if variable names remain.
  text = text
    .replace(/--rj-primary\s*:\s*[^;]+;/gi, "--rj-primary:#11162E;")
    .replace(/--rj-primary-hover\s*:\s*[^;]+;/gi, "--rj-primary-hover:#20294F;")
    .replace(/--rj-primary-soft\s*:\s*[^;]+;/gi, "--rj-primary-soft:#F0F2F8;");

  return text;
}

const HTML_LOCK = `
<style id="rubjai-navy-ci-v900">
:root{
  --rubjai-primary:#11162E;
  --rubjai-primary-hover:#20294F;
  --rubjai-primary-deep:#080B1A;
  --rubjai-primary-soft:#F0F2F8;
  --rubjai-primary-line:#D9DEEA;
}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{
  outline:2px solid #11162E!important;outline-offset:2px!important;
}
.primary,.btn.primary,.btn.dark,.btn-primary,.action-grid .primary,
.login-card button,.ops-nav.active,.acct7-btn.primary,.acct7-tab.on,
.attach,.seg button.on,.ghost.on,.item.on .check{
  background:#11162E!important;background-image:none!important;
  border-color:#11162E!important;color:#fff!important;
}
.primary:hover,.btn.primary:hover,.btn.dark:hover,.btn-primary:hover,
.action-grid .primary:hover,.login-card button:hover,.attach:hover{
  background:#20294F!important;border-color:#20294F!important;
}
.hero{background:#11162E!important;background-image:linear-gradient(135deg,#11162E,#252945)!important}
.progress i,.progress .fill,.acct7-progress i{background:#11162E!important}
.ph.sel,.acct7-step.current{border-color:#11162E!important;box-shadow:0 0 0 3px rgba(17,22,46,.08)!important}

/* AI is a brand/info context, never purple/green */
.ai-badge,.ai-chip,.ai-pill,.ai-tag,[data-ai-badge],[data-ai-chip],[data-ai="true"]{
  background:#F0F2F8!important;color:#11162E!important;border-color:#D9DEEA!important;
}
.ai-badge svg,.ai-chip svg,.ai-pill svg,.ai-tag svg{color:#11162E!important;stroke:#11162E!important}

/* Readiness + live freshness are informational, not green success states */
#onboardingCard.setup-status-v51.complete .setup-status-dot,
#onboardingCard.setup-status-v51.complete #onboardingCount,
#onboardingCard #onboardingBar,
#onboardingSteps .onboard-step.done .step-dot,
.syncstate.ok .dot{
  color:#11162E!important;
}
#onboardingCard.setup-status-v51.complete .setup-status-dot,
#onboardingCard #onboardingBar,
.syncstate.ok .dot{
  background:#11162E!important;border-color:#11162E!important;
  box-shadow:0 0 0 3px rgba(17,22,46,.09)!important;
}
#onboardingSteps .onboard-step.done .step-dot{
  background:#F0F2F8!important;border-color:#D9DEEA!important;color:#11162E!important;box-shadow:none!important;
}
#onboardingCard.setup-status-v51.complete #onboardingCount{color:#11162E!important}

/* Async / loading */
.operation-spinner,.deal-spinner{border-top-color:#11162E!important;border-right-color:#D9DEEA!important}
.operation-bar i,.deal-progress i{background:#11162E!important}

/* Recommended pricing / current selection */
.pricing-card.recommended,.pricing-card.selected,.plan-card.recommended,.plan-card.selected{
  border-color:#11162E!important;box-shadow:0 0 0 1px #11162E inset!important;
}
.pricing-ribbon,.recommended-badge,.plan-recommended{
  background:#11162E!important;color:#fff!important;border-color:#11162E!important;
}
</style>`;

const BRAND_LOCK = `

/* ============================================================
   ${MARK}
   NAVY CI LOCK — reference image palette
   White / cool gray + deep navy. Semantic green/red only.
   ============================================================ */
:root{
  --rj-bg:#F8F9FC;
  --rj-surface:#FFFFFF;
  --rj-ink:#11162E;
  --rj-text:#39405A;
  --rj-primary:#11162E;
  --rj-primary-hover:#20294F;
  --rj-primary-soft:#F0F2F8;
  --rj-line:#E4E7EC;
  --rj-line-strong:#D0D5DD;
}
html body .navlink.active,
html body .subnavlink.active,
html body .system-nav.active{
  background:#F0F2F8!important;color:#11162E!important;
}
html body .navlink.active::before,
html body .navlink.active .ic,
html body .system-nav.active .system-dot{
  background-color:#11162E!important;color:#11162E!important;
}
html body .btn.solid,
html body .btn.primary,
html body button[type="submit"].primary,
html body .control-action.primary,
html body .income-action.primary,
html body .acct7-btn.primary,
html body .plan-action.primary,
html body .system-upgrade-btn,
html body .simple-create-v739,
html body #page-expenses #manualExpenseCreate{
  background:#11162E!important;background-image:none!important;border-color:#11162E!important;color:#fff!important;
}
html body .btn.solid:hover,
html body .btn.primary:hover,
html body .control-action.primary:hover,
html body .income-action.primary:hover,
html body .acct7-btn.primary:hover,
html body .plan-action.primary:hover,
html body .system-upgrade-btn:hover,
html body #page-expenses #manualExpenseCreate:hover{
  background:#20294F!important;border-color:#20294F!important;
}

/* Overview anchor panel + chart */
html body #page-overview .kpi.hero{
  background:linear-gradient(135deg,#11162E 0%,#252945 100%)!important;
  border-color:transparent!important;color:#fff!important;
}
html body #page-overview #trend polyline,
html body #page-overview #trend path[stroke],
html body #page-overview #trend line[stroke]{
  stroke:#11162E!important;
}
html body #page-overview #trend circle{fill:#11162E!important;stroke:#11162E!important}
html body #page-overview #trend polygon,
html body #page-overview #trend path:not([stroke]){fill:rgba(17,22,46,.07)!important}
html body #page-overview .track .fill,
html body #page-overview .merchant-row .track .fill{background:#11162E!important}

/* All active/select/focus accents */
html body input[type="checkbox"],
html body input[type="radio"]{accent-color:#11162E!important}
html body :focus-visible{outline-color:#11162E!important}
html body .expense-status-tab.active,
html body .acct-status-strip button.active,
html body .acct-status-strip button.on,
html body .billing-cycle button.active,
html body .rangesel button.on{
  color:#11162E!important;
}

/* Readiness/live freshness: NAVY, not semantic green */
html body #onboardingCard.setup-status-v51.complete .setup-status-dot,
html body #onboardingCard #onboardingBar,
html body .setup-status-v51.complete .onboarding-progress span,
html body .syncstate.ok .dot{
  background:#11162E!important;border-color:#11162E!important;
  box-shadow:0 0 0 3px rgba(17,22,46,.09)!important;
}
html body #onboardingCard.setup-status-v51.complete #onboardingCount,
html body .setup-status-v51.complete .count{color:#11162E!important}
html body #onboardingSteps .onboard-step.done .step-dot,
html body .setup-status-v51 .onboard-step.done .step-dot{
  background:#F0F2F8!important;background-color:#F0F2F8!important;
  border-color:#D9DEEA!important;color:#11162E!important;box-shadow:none!important;
}
html body #onboardingSteps .onboard-step.done{color:#667085!important;text-decoration:none!important}

/* Loading / long operations */
html body .operation-spinner{
  border-color:#E4E7EC!important;border-top-color:#11162E!important;border-right-color:#D9DEEA!important;
}
html body .operation-bar{background:#ECEEF3!important}
html body .operation-bar i{background:#11162E!important}

/* Pricing / plan */
html body .pricing-card.recommended,
html body .pricing-card.selected,
html body .plan-card.recommended,
html body .plan-card.selected{
  border-color:#11162E!important;box-shadow:0 0 0 1px #11162E inset!important;
}
html body .pricing-ribbon,
html body .recommended-badge,
html body .plan-recommended{
  background:#11162E!important;color:#fff!important;border-color:#11162E!important;
}

/* AI = navy information system, never old purple/green accent */
html body .ai-badge,
html body .ai-chip,
html body .ai-pill,
html body .ai-tag,
html body [data-ai-badge],
html body [data-ai-chip],
html body [data-ai="true"]{
  background:#F0F2F8!important;color:#11162E!important;border-color:#D9DEEA!important;
}
html body .ai-badge svg,
html body .ai-chip svg,
html body .ai-pill svg,
html body .ai-tag svg{
  color:#11162E!important;stroke:#11162E!important;
}

:root{--rubjai-ci-build:"v9.00-navy-20260820";}
`;

let changed = [];
for (const file of [...new Set(ACTIVE_FILES)]) {
  let src = fs.readFileSync(file,"utf8");
  const before = src;

  src = recolor(src);

  if (file.endsWith(".html")) {
    // force a fresh brand-theme asset URL in the main dashboard
    src = src.replace(
      /(\.\/assets\/brand-theme\.css)\?v=[^"'<>]+/g,
      "$1?v=9.00.20260820"
    );
    if (path.basename(file) === "index.html" && !/assets\/brand-theme\.css/i.test(src)) {
      src = src.replace(/<\/head>/i, '<link rel="stylesheet" href="./assets/brand-theme.css?v=9.00.20260820">\n</head>');
    }

    // Every standalone HTML gets the navy lock after its existing CSS.
    if (!src.includes('id="rubjai-navy-ci-v900"')) {
      src = src.replace(/<\/head>/i, `${HTML_LOCK}\n</head>`);
    }
  }

  if (file.endsWith(path.join("assets","brand-theme.css")) && !src.includes(MARK)) {
    src += BRAND_LOCK;
  }

  if (src !== before) {
    fs.writeFileSync(file,src);
    changed.push(path.relative(root,file));
  }
}

// Syntax check every active JS asset after recolor.
for (const file of ACTIVE_FILES.filter(f=>f.endsWith(".js"))) {
  execFileSync(process.execPath, ["--check", file], {stdio:"pipe"});
}

// Ensure the main direct-source theme exists even on an older snapshot.
const brand = path.join(root,"assets","brand-theme.css");
if (!fs.existsSync(brand)) {
  fs.mkdirSync(path.dirname(brand), {recursive:true});
  fs.writeFileSync(brand, BRAND_LOCK.trimStart());
  ACTIVE_FILES.push(brand);
  changed.push(path.relative(root,brand));
}

// Audit the ACTUAL runtime files, not historical apply scripts.
let remaining = [];
for (const file of [...new Set(ACTIVE_FILES)]) {
  const src = fs.readFileSync(file,"utf8");
  for (const hex of FORBIDDEN) {
    if (src.toUpperCase().includes(hex.toUpperCase())) {
      remaining.push(`${path.relative(root,file)}:${hex}`);
    }
  }
}
if (remaining.length) {
  throw new Error(`v9.00 Navy CI audit: old accent remains -> ${remaining.slice(0,20).join(", ")}`);
}

const brandSrc = fs.readFileSync(brand,"utf8");
for (const required of ["#11162E","#20294F","#F0F2F8","v9.00-navy-20260820"]) {
  if (!brandSrc.includes(required)) throw new Error(`v9.00 brand audit missing ${required}`);
}

console.log(`✅ ${MARK}`);
console.log(`✅ Active runtime files recolored: ${changed.length}`);
console.log("✅ Old Indigo/Purple/Blue CI literals: 0");
console.log("✅ Dashboard/standalone/AI/readiness/loading: Navy CI");
