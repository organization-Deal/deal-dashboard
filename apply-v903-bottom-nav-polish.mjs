import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const MARK = "RUBJAI_BOTTOM_NAV_V903_20260820";
const brandFile = path.join(root, "assets", "brand-theme.css");
const indexFile = path.join(root, "index.html");

if (!fs.existsSync(indexFile)) throw new Error("v9.03 missing index.html");
fs.mkdirSync(path.dirname(brandFile), { recursive: true });
if (!fs.existsSync(brandFile)) fs.writeFileSync(brandFile, "", "utf8");

let css = fs.readFileSync(brandFile, "utf8");

const PATCH = `

/* ============================================================
   ${MARK}
   iPhone / LINE WebView bottom navigation polish
   ============================================================ */
@media (max-width:820px){
  :root{
    --rubjai-bottom-nav-h:72px;
    --rubjai-bottom-safe:env(safe-area-inset-bottom,0px);
  }

  /* Content clearance */
  html body .main{
    padding-bottom:calc(var(--rubjai-bottom-nav-h) + var(--rubjai-bottom-safe) + 18px)!important;
  }

  /* Floating glass dock instead of a full-width gray slab */
  html body .sidebar{
    position:fixed!important;
    left:10px!important;
    right:10px!important;
    bottom:calc(7px + var(--rubjai-bottom-safe))!important;
    top:auto!important;
    width:auto!important;
    height:64px!important;
    padding:0!important;
    background:rgba(255,255,255,.94)!important;
    border:1px solid rgba(17,22,46,.08)!important;
    border-radius:21px!important;
    box-shadow:
      0 10px 32px rgba(17,22,46,.10),
      0 1px 2px rgba(17,22,46,.05)!important;
    -webkit-backdrop-filter:blur(20px) saturate(150%)!important;
    backdrop-filter:blur(20px) saturate(150%)!important;
    overflow:hidden!important;
    z-index:100!important;
  }

  html body .sidebar-nav-v51,
  html body .sidebar nav{
    width:100%!important;
    height:64px!important;
    margin:0!important;
    padding:5px 6px!important;
    display:grid!important;
    grid-template-columns:repeat(5,minmax(0,1fr))!important;
    gap:3px!important;
    overflow:visible!important;
    background:transparent!important;
  }

  /* Base tab */
  html body .sidebar nav>.navlink.mobile-primary{
    position:relative!important;
    display:flex!important;
    min-width:0!important;
    width:100%!important;
    height:54px!important;
    min-height:54px!important;
    margin:0!important;
    padding:6px 2px 5px!important;
    flex-direction:column!important;
    justify-content:center!important;
    align-items:center!important;
    gap:4px!important;
    border:0!important;
    border-radius:15px!important;
    background:transparent!important;
    color:#8A93A8!important;
    box-shadow:none!important;
    transform:none!important;
    transition:background-color .16s ease,color .16s ease,transform .16s ease!important;
  }

  html body .sidebar nav>.navlink.mobile-primary:active{
    transform:scale(.97)!important;
  }

  /* Icon is line-based and lighter; no dark square */
  html body .sidebar nav>.navlink.mobile-primary .ic{
    width:22px!important;
    height:22px!important;
    min-width:22px!important;
    min-height:22px!important;
    display:grid!important;
    place-items:center!important;
    background:transparent!important;
    border:0!important;
    border-radius:0!important;
    color:inherit!important;
    box-shadow:none!important;
  }
  html body .sidebar nav>.navlink.mobile-primary .ic svg{
    width:20px!important;
    height:20px!important;
    color:inherit!important;
    opacity:.96!important;
  }
  html body .sidebar nav>.navlink.mobile-primary .ic svg path,
  html body .sidebar nav>.navlink.mobile-primary .ic svg line,
  html body .sidebar nav>.navlink.mobile-primary .ic svg polyline,
  html body .sidebar nav>.navlink.mobile-primary .ic svg circle,
  html body .sidebar nav>.navlink.mobile-primary .ic svg ellipse{
    stroke:currentColor!important;
  }
  html body .sidebar nav>.navlink.mobile-primary .ic svg rect{
    fill:none!important;
    stroke:currentColor!important;
  }

  html body .sidebar nav>.navlink.mobile-primary span:not(.ic){
    max-width:100%!important;
    font-size:10px!important;
    font-weight:650!important;
    line-height:1!important;
    letter-spacing:-.012em!important;
    color:inherit!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
  }

  /* Active item: soft pill + navy indicator, not a heavy filled block */
  html body .sidebar nav>.navlink.mobile-primary.active{
    background:#F2F4F8!important;
    color:#11162E!important;
    box-shadow:none!important;
  }
  html body .sidebar nav>.navlink.mobile-primary.active::before{
    content:""!important;
    position:absolute!important;
    top:4px!important;
    left:50%!important;
    width:22px!important;
    height:3px!important;
    transform:translateX(-50%)!important;
    border-radius:999px!important;
    background:#11162E!important;
    opacity:1!important;
  }
  html body .sidebar nav>.navlink.mobile-primary.active .ic{
    color:#5F6885!important;
    background:transparent!important;
  }
  html body .sidebar nav>.navlink.mobile-primary.active span:not(.ic){
    color:#11162E!important;
    font-weight:750!important;
  }

  /* More is visually secondary */
  html body .sidebar nav>.navlink.mobile-primary.mobile-more-nav,
  html body .sidebar nav>.navlink.mobile-primary.more{
    color:#9AA2B5!important;
  }

  /* Kill old active vertical/left indicators */
  html body .sidebar nav>.navlink.mobile-primary.active::after{
    display:none!important;
    content:none!important;
  }

  /* More sheet should feel connected to the new dock */
  html body .mobile-more-backdrop{
    background:rgba(17,22,46,.26)!important;
    -webkit-backdrop-filter:blur(7px)!important;
    backdrop-filter:blur(7px)!important;
  }
  html body .mobile-more-sheet{
    background:#F8F9FC!important;
    border-radius:26px 26px 0 0!important;
    box-shadow:0 -18px 60px rgba(17,22,46,.16)!important;
  }
  html body .mobile-sheet-handle{
    background:#C9CEDA!important;
  }
}

/* Narrow iPhone widths */
@media (max-width:390px){
  html body .sidebar{
    left:8px!important;
    right:8px!important;
    border-radius:19px!important;
  }
  html body .sidebar-nav-v51,
  html body .sidebar nav{
    padding-left:4px!important;
    padding-right:4px!important;
    gap:1px!important;
  }
  html body .sidebar nav>.navlink.mobile-primary{
    border-radius:13px!important;
  }
  html body .sidebar nav>.navlink.mobile-primary span:not(.ic){
    font-size:9.5px!important;
  }
}
`;

if (!css.includes(MARK)) {
  css += PATCH;
  fs.writeFileSync(brandFile, css, "utf8");
}

let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(
  /(\.\/assets\/brand-theme\.css)\?v=[^"'<>]+/g,
  "$1?v=9.03.20260820"
);
if (!html.includes("brand-theme.css?v=9.03.20260820")) {
  html = html.replace(
    /<\/head>/i,
    '<link rel="stylesheet" href="./assets/brand-theme.css?v=9.03.20260820">\n</head>'
  );
}
fs.writeFileSync(indexFile, html, "utf8");

/* Runtime syntax check */
const assetsDir = path.join(root, "assets");
if (fs.existsSync(assetsDir)) {
  for (const name of fs.readdirSync(assetsDir)) {
    if (!name.endsWith(".js")) continue;
    execFileSync(process.execPath, ["--check", path.join(assetsDir, name)], { stdio:"pipe" });
  }
}

const finalCss = fs.readFileSync(brandFile, "utf8");
for (const required of [
  MARK,
  "left:10px!important",
  "border-radius:21px!important",
  "grid-template-columns:repeat(5,minmax(0,1fr))!important",
  ".navlink.mobile-primary.active::before",
  "background:#F2F4F8!important"
]) {
  if (!finalCss.includes(required)) throw new Error(`v9.03 audit missing ${required}`);
}
if (!fs.readFileSync(indexFile, "utf8").includes("brand-theme.css?v=9.03.20260820")) {
  throw new Error("v9.03 cache bust audit failed");
}

console.log(`✅ ${MARK}`);
console.log("✅ Floating glass bottom dock");
console.log("✅ Softer icons");
console.log("✅ Active pill + navy indicator");
console.log("✅ Safe-area / LINE WebView spacing");
console.log("✅ Cache bust v9.03");
