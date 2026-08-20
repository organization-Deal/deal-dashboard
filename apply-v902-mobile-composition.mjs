import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "RUBJAI_MOBILE_COMPOSITION_V902_20260820";
const brandFile = path.join(root, "assets", "brand-theme.css");
const indexFile = path.join(root, "index.html");

if (!fs.existsSync(indexFile)) throw new Error("v9.02 missing index.html");
fs.mkdirSync(path.dirname(brandFile), { recursive: true });
if (!fs.existsSync(brandFile)) fs.writeFileSync(brandFile, "", "utf8");

let css = fs.readFileSync(brandFile, "utf8");

const MOBILE = `

/* ============================================================
   ${MARK}
   Mobile-first composition pass
   Target: 390–430px iPhone / LINE in-app browser
   ============================================================ */

@media (max-width: 820px) {
  :root{
    --mobile-bottom:66px!important;
    --mobile-page-x:14px;
    --mobile-gap:10px;
  }

  html,body{
    background:#F7F8FB!important;
  }

  /* ----- page shell: denser, calmer ----- */
  .main{
    padding:10px var(--mobile-page-x)
      calc(var(--mobile-bottom) + 20px + env(safe-area-inset-bottom))!important;
  }

  /* ----- workspace switcher: 60px -> compact 52px ----- */
  .main>.mobile-workspace-card{
    min-height:52px!important;
    margin:0 0 10px!important;
    padding:8px 10px!important;
    grid-template-columns:34px minmax(0,1fr) auto!important;
    gap:9px!important;
    border-radius:16px!important;
    border-color:#E4E7EC!important;
    box-shadow:0 1px 2px rgba(17,22,46,.025)!important;
  }
  .mobile-workspace-avatar{
    width:34px!important;
    height:34px!important;
    border-radius:50%!important;
    background:#11162E!important;
    font-size:10px!important;
  }
  .mobile-workspace-copy small{
    font-size:8.5px!important;
    line-height:1.05!important;
    letter-spacing:.02em!important;
  }
  .mobile-workspace-copy strong{
    font-size:12.5px!important;
    margin-top:2px!important;
  }
  .mobile-workspace-copy em{
    font-size:9px!important;
    margin-top:2px!important;
  }
  .mobile-workspace-action{
    padding:6px 9px!important;
    font-size:9.5px!important;
    background:#F0F2F8!important;
    color:#39405A!important;
  }

  /* ==========================================================
     MOBILE HEADER
     row 1: page title | how-to
     row 2: date range  | refresh
     ========================================================== */
  .main>.head{
    display:grid!important;
    grid-template-columns:minmax(0,1fr) 42px!important;
    grid-template-rows:auto 42px!important;
    column-gap:8px!important;
    row-gap:9px!important;
    align-items:center!important;
    margin:0 0 12px!important;
    padding:0!important;
  }
  .main>.head .head-title{
    grid-column:1!important;
    grid-row:1!important;
    min-width:0!important;
  }
  .main>.head .head-title h2{
    font-size:28px!important;
    line-height:1.05!important;
    letter-spacing:-.045em!important;
    margin:0!important;
  }

  /* how-to becomes a small utility, not a whole third row */
  .main>.head #guidedTourButton{
    grid-column:2!important;
    grid-row:1!important;
    justify-self:end!important;
    align-self:center!important;
    width:42px!important;
    min-width:42px!important;
    max-width:42px!important;
    height:36px!important;
    padding:0!important;
    border-radius:12px!important;
    border:1px solid #D9DEEA!important;
    background:#fff!important;
    color:#11162E!important;
    box-shadow:none!important;
    gap:0!important;
    overflow:hidden!important;
  }
  .main>.head #guidedTourButton>b{
    display:none!important;
  }
  .main>.head #guidedTourButton>span{
    width:22px!important;
    height:22px!important;
    flex:0 0 22px!important;
    margin:0 auto!important;
    background:#F0F2F8!important;
    color:#11162E!important;
    font-size:9px!important;
  }

  /* range + refresh share one row */
  .main>.head .rangesel{
    grid-column:1!important;
    grid-row:2!important;
    width:100%!important;
    min-width:0!important;
    height:42px!important;
    padding:3px!important;
    border-radius:13px!important;
    background:#E9EAF0!important;
    margin:0!important;
  }
  .main>.head .rangesel button{
    min-height:36px!important;
    padding:6px 5px!important;
    font-size:11px!important;
    border-radius:10px!important;
  }
  .main>.head .rangesel button.on{
    background:#fff!important;
    color:#11162E!important;
    box-shadow:0 1px 4px rgba(17,22,46,.08)!important;
  }
  .main>.head .syncstate{
    grid-column:2!important;
    grid-row:2!important;
    width:42px!important;
    height:42px!important;
    padding:0!important;
    margin:0!important;
    border:1px solid #D9DEEA!important;
    border-radius:13px!important;
    background:#fff!important;
    box-shadow:none!important;
  }
  .main>.head .syncstate button{
    width:40px!important;
    height:40px!important;
    font-size:17px!important;
    color:#11162E!important;
  }

  /* ----- Overview: remove explanatory noise on phone ----- */
  #page-overview.show{
    gap:0!important;
  }
  #page-overview>#accountingTodayMount:empty{
    display:none!important;
  }
  #page-overview>.accounting-note{
    display:none!important;
  }

  /* ----- KPI 2x2: denser, same information, less vertical waste ----- */
  #page-overview .kpis{
    order:1!important;
    display:grid!important;
    grid-template-columns:1fr 1fr!important;
    gap:8px!important;
    margin:0 0 10px!important;
  }
  #page-overview .kpi{
    min-height:100px!important;
    padding:14px!important;
    border-radius:18px!important;
    border-color:#E4E7EC!important;
    box-shadow:0 1px 3px rgba(17,22,46,.035)!important;
  }
  #page-overview .kpi.hero{
    background:linear-gradient(145deg,#11162E 0%,#232A48 100%)!important;
  }
  #page-overview .kpi .lb{
    font-size:10.5px!important;
    line-height:1.25!important;
  }
  #page-overview .kpi .big{
    font-size:26px!important;
    line-height:1!important;
    margin:8px 0 5px!important;
    letter-spacing:-.045em!important;
  }
  #page-overview .kpi .foot{
    font-size:9.5px!important;
    line-height:1.35!important;
    min-height:13px!important;
  }
  #page-overview .kpi.hero .bar{
    width:28px!important;
    height:3px!important;
    margin-top:9px!important;
    background:rgba(255,255,255,.58)!important;
  }

  /* ----- Trial: utility strip, not a marketing hero ----- */
  #page-overview .beta-plan-banner{
    order:2!important;
    display:grid!important;
    grid-template-columns:minmax(0,1fr) auto!important;
    align-items:center!important;
    gap:8px!important;
    min-height:52px!important;
    padding:9px 10px!important;
    margin:0 0 10px!important;
    border-radius:16px!important;
    border-color:#E4E7EC!important;
    box-shadow:none!important;
  }
  #page-overview .beta-plan-copy{
    min-width:0!important;
    display:grid!important;
    grid-template-columns:auto minmax(0,1fr)!important;
    gap:8px!important;
    align-items:center!important;
  }
  #page-overview .beta-plan-badge{
    min-height:22px!important;
    padding:4px 7px!important;
    border-radius:999px!important;
    font-size:8px!important;
    white-space:nowrap!important;
  }
  #page-overview .beta-plan-text strong{
    display:block!important;
    font-size:10.5px!important;
    line-height:1.2!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }
  #page-overview .beta-plan-text span{
    display:none!important;
  }
  #page-overview .beta-plan-banner [data-open-billing]{
    width:76px!important;
    min-width:76px!important;
    height:34px!important;
    min-height:34px!important;
    padding:0!important;
    border-radius:11px!important;
    font-size:0!important;
  }
  #page-overview .beta-plan-banner [data-open-billing]::after{
    content:"แพ็กเกจ";
    font-size:10px;
    font-weight:700;
  }

  /* ----- Graph + content cards ----- */
  #page-overview .grid2{
    order:3!important;
    display:block!important;
  }
  #page-overview .grid2 .card{
    padding:14px!important;
    margin-bottom:9px!important;
    border-radius:18px!important;
    border-color:#E4E7EC!important;
    box-shadow:0 1px 3px rgba(17,22,46,.03)!important;
  }
  #page-overview .grid2 .card h3{
    font-size:17px!important;
    line-height:1.2!important;
    margin-bottom:3px!important;
  }
  #page-overview .grid2 .card .cs{
    font-size:9.5px!important;
    line-height:1.35!important;
  }
  #page-overview .trend{
    height:118px!important;
    margin-top:8px!important;
  }

  /* Recent list: less air between rows */
  #page-overview #recent>div,
  #page-overview .recent-item{
    padding-top:10px!important;
    padding-bottom:10px!important;
  }

  /* ----- Bottom nav: 78px -> 66px ----- */
  .sidebar{
    height:calc(var(--mobile-bottom) + env(safe-area-inset-bottom))!important;
    box-shadow:0 -5px 20px rgba(17,22,46,.055)!important;
    background:rgba(250,250,252,.98)!important;
  }
  .sidebar-nav-v51{
    height:var(--mobile-bottom)!important;
    padding:5px 6px 6px!important;
    gap:1px!important;
  }
  .sidebar nav>.navlink.mobile-primary{
    height:54px!important;
    min-height:54px!important;
    padding:4px 1px!important;
    gap:3px!important;
    border-radius:12px!important;
    font-size:9px!important;
  }
  .sidebar nav>.navlink.mobile-primary .ic{
    width:21px!important;
    height:21px!important;
  }
  .sidebar nav>.navlink.mobile-primary .ic svg{
    width:19px!important;
    height:19px!important;
  }
  .sidebar nav>.navlink.mobile-primary span:not(.ic){
    font-size:9px!important;
    line-height:1!important;
  }
  .sidebar nav>.navlink.mobile-primary.active{
    background:#F0F2F8!important;
    color:#11162E!important;
  }
  .sidebar nav>.navlink.mobile-primary.active .ic{
    background:transparent!important;
    color:#5F6885!important;
  }
}

/* slightly narrower iPhones */
@media (max-width: 390px) {
  .main{
    padding-left:11px!important;
    padding-right:11px!important;
  }
  .main>.head .head-title h2{
    font-size:26px!important;
  }
  #page-overview .kpi{
    min-height:96px!important;
    padding:12px!important;
  }
  #page-overview .kpi .big{
    font-size:24px!important;
  }
  #page-overview .beta-plan-badge{
    display:none!important;
  }
}
`;

if (!css.includes(MARK)) {
  css += MOBILE;
  fs.writeFileSync(brandFile, css, "utf8");
}

/* Force a new stylesheet URL; otherwise LINE/iOS webview may keep old CSS. */
let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(
  /(\.\/assets\/brand-theme\.css)\?v=[^"'<>]+/g,
  "$1?v=9.02.20260820"
);
if (!/\.\/assets\/brand-theme\.css\?v=9\.02\.20260820/.test(html)) {
  if (/<\/head>/i.test(html)) {
    html = html.replace(
      /<\/head>/i,
      '<link rel="stylesheet" href="./assets/brand-theme.css?v=9.02.20260820">\n</head>'
    );
  }
}
fs.writeFileSync(indexFile, html, "utf8");

/* Check active JS after all older patchers have run. */
const assets = path.join(root, "assets");
if (fs.existsSync(assets)) {
  for (const name of fs.readdirSync(assets)) {
    if (!name.endsWith(".js")) continue;
    execFileSync(process.execPath, ["--check", path.join(assets, name)], { stdio:"pipe" });
  }
}

const finalCss = fs.readFileSync(brandFile, "utf8");
for (const required of [
  MARK,
  "--mobile-bottom:66px",
  ".main>.head #guidedTourButton",
  "#page-overview .kpis",
  "#page-overview .beta-plan-banner",
  "#page-overview .trend"
]) {
  if (!finalCss.includes(required)) throw new Error(`v9.02 audit missing ${required}`);
}
if (!fs.readFileSync(indexFile,"utf8").includes("brand-theme.css?v=9.02.20260820")) {
  throw new Error("v9.02 cache-bust audit failed");
}

console.log(`✅ ${MARK}`);
console.log("✅ Compact mobile header composition");
console.log("✅ KPI 2x2 density pass");
console.log("✅ Trial banner compact");
console.log("✅ Graph height compact");
console.log("✅ Bottom nav 66px");
console.log("✅ iOS/LINE cache bust v9.02");
