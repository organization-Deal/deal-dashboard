import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "RUBJAI_NAVY_CLEANUP_V901_20260820";
const NAVY = "#11162E";
const NAVY_HOVER = "#20294F";
const NAVY_DEEP = "#080B1A";
const NAVY_SOFT = "#F0F2F8";
const NAVY_LINE = "#D9DEEA";
const SLATE_ICON = "#6A728E";
const SOFT_BG = "#F8F9FC";

const MAP = new Map([
  // leftover indigo / blue / violet accents
  ["#4F46E5", NAVY],["#4338CA", NAVY_HOVER],["#3730A3", NAVY_DEEP],["#6366F1", NAVY],["#5B5FEF", NAVY],["#5850EC", NAVY],["#5D5FEF", NAVY],["#6C63FF", NAVY],["#5548E8", NAVY],["#7C3AED", NAVY],["#6D28D9", NAVY],["#8B5CF6", NAVY],["#A78BFA", "#B8C0D1"],["#2563EB", NAVY],["#3B82F6", NAVY],["#0071E3", NAVY],["#4B46C4", NAVY],["#312E81", NAVY_DEEP],
  ["#EEF2FF", NAVY_SOFT],["#EDE9FE", NAVY_SOFT],["#F0F7FF", NAVY_SOFT],["#EAF1FF", NAVY_SOFT],["#DBEAFE", NAVY_SOFT],["#C7D2FE", NAVY_LINE],["#A5B4FC", "#B8C0D1"],["#DFE3FF", "#E1E5EF"],

  // remove green completely from brand usage
  ["#30D158", NAVY],["#248A3D", NAVY],["#18794E", NAVY],["#147A36", NAVY],["#39705A", NAVY],["#34C759", NAVY],
  ["#DFF3E4", NAVY_SOFT],["#EDF8EF", NAVY_SOFT],["#EDF8F0", NAVY_SOFT],["#EAF7EF", NAVY_SOFT],["#E9F7EE", NAVY_SOFT],["#F0F8F2", NAVY_SOFT],["#F1F6F3", NAVY_SOFT],["#BAD6C0", NAVY_LINE],["#F7FBF8", SOFT_BG],

  // darker brand blocks
  ["#1D1D1F", NAVY],["#101828", NAVY],["#111827", NAVY],["#111111", NAVY],["#1C1F24", NAVY],["#171719", NAVY],["#000000", NAVY_DEEP],
  ["#344054", "#39405A"],["#3A3A3C", "#39405A"],["#6E6E73", "#667085"],["#86868B", "#98A2B3"],["#AEAEB2", "#98A2B3"],["#D2D2D7", "#D9DEE8"],["#E5E5EA", "#E4E7EC"]
]);

const FORBIDDEN = [
  "#4F46E5","#4338CA","#3730A3","#6366F1","#5B5FEF","#5850EC","#5D5FEF","#6C63FF","#5548E8","#7C3AED","#6D28D9","#8B5CF6",
  "#2563EB","#3B82F6","#0071E3","#4B46C4","#312E81","#EEF2FF","#EDE9FE","#C7D2FE","#A5B4FC",
  "#30D158","#248A3D","#18794E","#147A36","#39705A","#34C759","#DFF3E4","#EDF8EF","#EDF8F0","#EAF7EF","#E9F7EE","#F0F8F2","#BAD6C0"
];

const ACTIVE_EXT = new Set([".html",".css",".js"]);
const ACTIVE_FILES = [];
function walk(dir){
  if(!fs.existsSync(dir)) return;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,ent.name);
    if(ent.isDirectory()){
      if(ent.name === 'bank-logos') continue;
      walk(full);
      continue;
    }
    if(ACTIVE_EXT.has(path.extname(ent.name).toLowerCase())) ACTIVE_FILES.push(full);
  }
}
for(const name of fs.readdirSync(root)){
  const full=path.join(root,name);
  if(fs.statSync(full).isFile() && name.endsWith('.html')) ACTIVE_FILES.push(full);
}
walk(path.join(root,'assets'));

function replaceHexToken(text, from, to){
  const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(`${escaped}(?![0-9A-Fa-f])`, 'gi'), to);
}

function recolor(text){
  for(const [from,to] of MAP) text = replaceHexToken(text,from,to);
  text = text
    .replace(/rgba?\(\s*79\s*,\s*70\s*,\s*229\b/gi, m=>m.replace(/79\s*,\s*70\s*,\s*229/i,'17,22,46'))
    .replace(/rgba?\(\s*67\s*,\s*56\s*,\s*202\b/gi, m=>m.replace(/67\s*,\s*56\s*,\s*202/i,'32,41,79'))
    .replace(/rgba?\(\s*99\s*,\s*102\s*,\s*241\b/gi, m=>m.replace(/99\s*,\s*102\s*,\s*241/i,'17,22,46'))
    .replace(/rgba?\(\s*48\s*,\s*209\s*,\s*88\b/gi, m=>m.replace(/48\s*,\s*209\s*,\s*88/i,'17,22,46'))
    .replace(/rgba?\(\s*36\s*,\s*138\s*,\s*61\b/gi, m=>m.replace(/36\s*,\s*138\s*,\s*61/i,'17,22,46'))
    .replace(/rgba?\(\s*24\s*,\s*121\s*,\s*78\b/gi, m=>m.replace(/24\s*,\s*121\s*,\s*78/i,'17,22,46'));

  // variable fallback for standalone HTML pages that use old semantic variable names
  text = text
    .replace(/--rj-primary\s*:\s*[^;]+;/gi, '--rj-primary:#11162E;')
    .replace(/--rj-primary-hover\s*:\s*[^;]+;/gi, '--rj-primary-hover:#20294F;')
    .replace(/--rj-primary-soft\s*:\s*[^;]+;/gi, '--rj-primary-soft:#F0F2F8;')
    .replace(/--green2?\s*:\s*[^;]+;/gi, m => m.startsWith('--green2') ? '--green2:#F0F2F8;' : '--green:#11162E;')
    .replace(/--success\s*:\s*[^;]+;/gi, '--success:#11162E;');
  return text;
}

const LOCK = `
<style id="rubjai-navy-cleanup-v901">
:root{
  --rubjai-primary:#11162E;
  --rubjai-primary-hover:#20294F;
  --rubjai-primary-deep:#080B1A;
  --rubjai-primary-soft:#F0F2F8;
  --rubjai-primary-line:#D9DEEA;
  --green:#11162E!important;
  --green2:#F0F2F8!important;
  --success:#11162E!important;
}
/* no green brand accents anywhere */
.syncstate.ok .dot,
.integration-state.ok .state-dot,
.control-state.integration-state.ok .state-dot,
.chip.ok:before,
.line-connected,
.line-connected:before,
.finance-badge,
.finance-badge.default,
.rec .badge,
.company-setup-step.done .company-setup-icon,
.setup-status-v51.complete .setup-status-dot,
.setup-status-v51.complete #onboardingBar,
.setup-status-v51.complete .onboarding-progress span,
.setup-status-v51.complete .count,
#onboardingCard.setup-status-v51.complete .setup-status-dot,
#onboardingCard #onboardingBar,
#onboardingCard.setup-status-v51.complete #onboardingCount,
#page-overview .merchant-row .line-connected,
.line-group-monitor .line-connected{
  color:#11162E!important;
}
.syncstate.ok .dot,
.integration-state.ok .state-dot,
.control-state.integration-state.ok .state-dot,
.chip.ok:before,
.setup-status-v51.complete .setup-status-dot,
.setup-status-v51.complete #onboardingBar,
#onboardingCard.setup-status-v51.complete .setup-status-dot,
#onboardingCard #onboardingBar,
.setup-status-v51.complete .onboarding-progress span{
  background:#11162E!important;
  border-color:#11162E!important;
  box-shadow:0 0 0 3px rgba(17,22,46,.09)!important;
}
.line-connected,
.finance-badge,
.finance-badge.default,
.rec .badge,
.chip.ok,
.integration-state.ok,
.control-state.integration-state.ok,
#gmailConnectedState,
#setLineState,
#setGoogleState.ok,
#setGmailState.ok,
#setFinanceState.ok{
  background:#F0F2F8!important;
  color:#11162E!important;
  border-color:#D9DEEA!important;
}
.company-setup-step.done .company-setup-icon,
.company-setup-icon,
.control-icon,
.integration-logo,
.integration-icon,
.integration-mark,
.finance-account-icon,
.brandmark,
.business-menu-mark{
  background:#F0F2F8!important;
  color:#11162E!important;
  border:1px solid #D9DEEA!important;
  box-shadow:none!important;
}
.company-setup-step.done .company-setup-icon:before{color:#11162E!important}

/* softer active sidebar icon: keep text active, icon not a dark block */
.navlink.active,
.sidebar nav>.navlink.mobile-primary.active{
  background:#F3F4F7!important;
  color:#11162E!important;
  border-color:transparent!important;
}
.navlink.active .ic,
.sidebar nav>.navlink.mobile-primary.active .ic{
  background:transparent!important;
  color:#6A728E!important;
}
.navlink.active .ic svg,
.sidebar nav>.navlink.mobile-primary.active .ic svg{
  color:inherit!important;
}
.navlink.active .ic svg rect,
.sidebar nav>.navlink.mobile-primary.active .ic svg rect{
  fill:currentColor!important;stroke:currentColor!important;
}
.navlink.active .ic svg path,
.navlink.active .ic svg line,
.navlink.active .ic svg polyline,
.navlink.active .ic svg circle,
.navlink.active .ic svg ellipse,
.sidebar nav>.navlink.mobile-primary.active .ic svg path,
.sidebar nav>.navlink.mobile-primary.active .ic svg line,
.sidebar nav>.navlink.mobile-primary.active .ic svg polyline,
.sidebar nav>.navlink.mobile-primary.active .ic svg circle,
.sidebar nav>.navlink.mobile-primary.active .ic svg ellipse{
  stroke:currentColor!important;
}

/* document control highlighted metric should be navy, not purple */
.doc-kpi.attention{
  background:#FFFFFF!important;
  color:#11162E!important;
  border-color:#D9DEEA!important;
  box-shadow:0 0 0 1px #D9DEEA inset!important;
}
.doc-kpi.attention span,
.doc-kpi.attention strong,
.doc-kpi.attention small{
  color:#11162E!important;
}

/* trial / banner / chips */
.beta-plan-badge,
.billing-trial-badge,
.trial-badge,
[class*="trial-badge"],
[class*="trial-bubble"],
[class*="trial-pill"]{
  background:#F0F2F8!important;
  color:#11162E!important;
  border:1px solid #D9DEEA!important;
}
.workflow-current-badge,
.recommended-badge,
.plan-recommended,.pricing-ribbon{
  background:#11162E!important;
  color:#fff!important;
  border-color:#11162E!important;
}

/* remove any green from file-matching / standalone pages */
.chip.ok{color:#11162E!important}
.rec.near{border-color:#D9DEEA!important;background:#FFFFFF!important}
.hero .bar,.kpi.hero .bar{background:rgba(255,255,255,.55)!important}
.hero,.kpi.hero,.batch-hero{background:#11162E!important;background-image:linear-gradient(135deg,#11162E,#252945)!important}

/* AI remains navy informational */
.ai-badge,.ai-chip,.ai-pill,.ai-tag,[data-ai-badge],[data-ai-chip],[data-ai="true"]{
  background:#F0F2F8!important;color:#11162E!important;border-color:#D9DEEA!important;
}
.ai-badge svg,.ai-chip svg,.ai-pill svg,.ai-tag svg{color:#11162E!important;stroke:#11162E!important}
</style>`;

const BRAND_LOCK = `

/* ============================================================
   ${MARK}
   Navy cleanup lock — no green brand accents, softer active icons.
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
  --green:#11162E;
  --green2:#F0F2F8;
  --success:#11162E;
}
html body .navlink.active,
html body .subnavlink.active,
html body .system-nav.active{background:#F3F4F7!important;color:#11162E!important}
html body .navlink.active .ic,
html body .system-nav.active .system-dot{background:transparent!important;color:#6A728E!important}
html body .navlink.active::before{background:#11162E!important}
html body .navlink.active .ic svg rect{fill:currentColor!important;stroke:currentColor!important}
html body .navlink.active .ic svg path,
html body .navlink.active .ic svg line,
html body .navlink.active .ic svg polyline,
html body .navlink.active .ic svg circle,
html body .navlink.active .ic svg ellipse{stroke:currentColor!important}

html body .syncstate.ok .dot,
html body .integration-state.ok .state-dot,
html body .control-state.integration-state.ok .state-dot,
html body .chip.ok:before,
html body .setup-status-v51.complete .setup-status-dot,
html body #onboardingCard.setup-status-v51.complete .setup-status-dot,
html body #onboardingCard #onboardingBar,
html body .setup-status-v51.complete .onboarding-progress span{
  background:#11162E!important;border-color:#11162E!important;box-shadow:0 0 0 3px rgba(17,22,46,.09)!important;
}
html body .line-connected,
html body .finance-badge,
html body .finance-badge.default,
html body .rec .badge,
html body .chip.ok,
html body .integration-state.ok,
html body .control-state.integration-state.ok,
html body #gmailConnectedState,
html body #setLineState{
  background:#F0F2F8!important;color:#11162E!important;border-color:#D9DEEA!important;
}
html body .company-setup-icon,
html body .company-setup-step.done .company-setup-icon,
html body .control-icon,
html body .integration-logo,
html body .integration-icon,
html body .integration-mark,
html body .finance-account-icon,
html body .brandmark,
html body .business-menu-mark{
  background:#F0F2F8!important;color:#11162E!important;border:1px solid #D9DEEA!important;box-shadow:none!important;
}
html body .doc-kpi.attention{background:#fff!important;color:#11162E!important;border-color:#D9DEEA!important;box-shadow:0 0 0 1px #D9DEEA inset!important}
html body .doc-kpi.attention span,html body .doc-kpi.attention strong,html body .doc-kpi.attention small{color:#11162E!important}
html body .beta-plan-badge,html body .billing-trial-badge,html body .trial-badge,[class*="trial-badge"],[class*="trial-bubble"],[class*="trial-pill"]{background:#F0F2F8!important;color:#11162E!important;border:1px solid #D9DEEA!important}
html body .hero .bar,html body .kpi.hero .bar{background:rgba(255,255,255,.55)!important}
:root{--rubjai-ci-build:"v9.01-navy-cleanup-20260820";}
`;

let changed=[];
for(const file of [...new Set(ACTIVE_FILES)]){
  let src=fs.readFileSync(file,'utf8');
  const before=src;
  src = recolor(src);
  if(file.endsWith('.html')){
    src = src.replace(/(\.\/assets\/brand-theme\.css)\?v=[^"'<>]+/g, '$1?v=9.01.20260820');
    if(path.basename(file)==='index.html' && !/assets\/brand-theme\.css/i.test(src)){
      src = src.replace(/<\/head>/i, '<link rel="stylesheet" href="./assets/brand-theme.css?v=9.01.20260820">\n</head>');
    }
    if(!src.includes('id="rubjai-navy-cleanup-v901"')) src = src.replace(/<\/head>/i, `${LOCK}\n</head>`);
  }
  if(file.endsWith(path.join('assets','brand-theme.css')) && !src.includes(MARK)) src += BRAND_LOCK;
  if(src!==before){fs.writeFileSync(file,src);changed.push(path.relative(root,file));}
}

for(const file of ACTIVE_FILES.filter(f=>f.endsWith('.js'))){execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}
const brand=path.join(root,'assets','brand-theme.css');
if(!fs.existsSync(brand)){fs.mkdirSync(path.dirname(brand),{recursive:true});fs.writeFileSync(brand,BRAND_LOCK.trimStart());changed.push(path.relative(root,brand));}

let remaining=[];
for(const file of [...new Set(ACTIVE_FILES), brand]){
  if(!fs.existsSync(file)) continue;
  const src=fs.readFileSync(file,'utf8');
  for(const hex of FORBIDDEN){ if(src.toUpperCase().includes(hex.toUpperCase())) remaining.push(`${path.relative(root,file)}:${hex}`); }
}
if(remaining.length) throw new Error(`v9.01 cleanup audit failed -> ${remaining.slice(0,30).join(', ')}`);
const brandSrc=fs.readFileSync(brand,'utf8');
for(const must of ['v9.01-navy-cleanup-20260820','#11162E','#F0F2F8']) if(!brandSrc.includes(must)) throw new Error(`brand audit missing ${must}`);
console.log(`✅ ${MARK}`);
console.log(`✅ Active runtime files recolored: ${changed.length}`);
console.log('✅ No green / purple / blue brand accents remain in runtime');
console.log('✅ Active nav icon softened, readiness/integration/doc-kpi/trial corrected');
