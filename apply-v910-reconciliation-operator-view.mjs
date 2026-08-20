import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const VERSION = "9.10.0";
const BUILD_DATE = "20260820";
const SELF = "apply-v910-reconciliation-operator-view.mjs";
const MARK = "RUBJAI_V910_RECONCILIATION_OPERATOR_VIEW_20260820";

const indexFile = path.join(root, "index.html");
const packageFile = path.join(root, "package.json");
const assetsDir = path.join(root, "assets");
const cssFile = path.join(assetsDir, "reconciliation-operator-v910.css");
const jsFile = path.join(assetsDir, "reconciliation-operator-v910.js");

if (!fs.existsSync(indexFile)) throw new Error("v9.10 missing index.html");
fs.mkdirSync(assetsDir, { recursive: true });

const css = `/* ${MARK} */
:root{
  --v910-ink:#11162E;
  --v910-text:#39405A;
  --v910-muted:#667085;
  --v910-line:#D9DEEA;
  --v910-soft:#F0F2F8;
  --v910-bg:#F8F9FC;
  --v910-white:#FFFFFF;
  --v910-ok:#178A55;
  --v910-warn:#B76A00;
}

/* Reconciliation is an operator workspace: one clear flow, not stacked dashboards. */
.v910-reconciliation-page{
  width:100%!important;
  max-width:none!important;
  min-width:0!important;
}
.v910-reconciliation-page .v910-recon-heading{
  margin-bottom:8px!important;
}
.v910-reconciliation-page .v910-recon-subtitle{
  margin-top:0!important;
  margin-bottom:10px!important;
  color:var(--v910-muted)!important;
}
.v910-recon-flow{
  display:inline-flex;
  align-items:center;
  gap:8px;
  margin:0 0 14px 0;
  padding:7px 10px;
  border:1px solid var(--v910-line);
  border-radius:999px;
  background:var(--v910-white);
  color:var(--v910-text);
  font-size:12px;
  line-height:1.2;
  white-space:nowrap;
}
.v910-recon-flow b{color:var(--v910-ink);font-weight:700}
.v910-recon-flow .v910-arrow{color:#A1A8BA}

/* Header actions stay secondary. Confirmation belongs with reconciliation work. */
.v910-reconciliation-page .v910-top-confirm{display:none!important}

/* Selected account summary: one compact strip. */
.v910-account-summary{
  display:grid!important;
  grid-template-columns:minmax(260px,1.7fr) repeat(4,minmax(90px,.65fr))!important;
  gap:0!important;
  min-height:64px!important;
  padding:0!important;
  margin:10px 0 10px!important;
  border:1px solid var(--v910-line)!important;
  border-radius:14px!important;
  background:var(--v910-white)!important;
  overflow:hidden!important;
  box-shadow:none!important;
}
.v910-account-summary > *{
  min-width:0!important;
  margin:0!important;
  border-radius:0!important;
  box-shadow:none!important;
  border:0!important;
  border-right:1px solid #E6E9F0!important;
  padding:12px 14px!important;
  background:transparent!important;
}
.v910-account-summary > *:last-child{border-right:0!important}

/* A meaningless warning strip (e.g. only an orange dot) should never consume a row. */
.v910-empty-warning{display:none!important}

/* Five KPI cards repeat the same state. Hide them when all values are zero;
   if there is live work, keep them as small chips instead of another dashboard. */
.v910-recon-kpis.v910-all-zero{display:none!important}
.v910-recon-kpis:not(.v910-all-zero){
  display:flex!important;
  flex-wrap:wrap!important;
  gap:8px!important;
  margin:8px 0 10px!important;
  padding:0!important;
  background:transparent!important;
  border:0!important;
  box-shadow:none!important;
}
.v910-recon-kpis:not(.v910-all-zero) > *{
  flex:0 0 auto!important;
  width:auto!important;
  min-width:120px!important;
  padding:9px 12px!important;
  border:1px solid var(--v910-line)!important;
  border-radius:10px!important;
  background:var(--v910-white)!important;
  box-shadow:none!important;
}

/* Statement upload becomes one action row. The account is already obvious above. */
.v910-statement-panel{
  display:grid!important;
  grid-template-columns:minmax(0,1fr) auto!important;
  align-items:center!important;
  gap:12px!important;
  padding:12px 14px!important;
  margin:10px 0 12px!important;
  min-height:0!important;
  border:1px solid var(--v910-line)!important;
  border-radius:14px!important;
  background:var(--v910-white)!important;
  box-shadow:none!important;
}
.v910-statement-account-duplicate{display:none!important}
.v910-statement-panel .v910-statement-file-area{
  min-width:0!important;
  width:100%!important;
  margin:0!important;
  padding:0!important;
  border:0!important;
  background:transparent!important;
}
.v910-statement-panel .v910-statement-button{
  margin:0!important;
  min-height:40px!important;
  white-space:nowrap!important;
  background:var(--v910-ink)!important;
  color:#fff!important;
  border-color:var(--v910-ink)!important;
}

/* The actual reconciliation table is the primary content on the page. */
.v910-work-card{
  margin-top:0!important;
  border:1px solid var(--v910-line)!important;
  border-radius:16px!important;
  background:var(--v910-white)!important;
  box-shadow:none!important;
  overflow:hidden!important;
}
.v910-work-card .v910-work-heading{
  margin:0!important;
}
.v910-work-actions{
  display:flex;
  align-items:center;
  gap:8px;
  margin-left:auto;
}
.v910-work-actions .v910-confirm-button{
  min-height:38px!important;
  padding:0 14px!important;
  background:var(--v910-ink)!important;
  color:#fff!important;
  border-color:var(--v910-ink)!important;
  border-radius:10px!important;
  white-space:nowrap!important;
}
.v910-no-statement .v910-work-table{display:none!important}
.v910-recon-empty{
  display:flex;
  flex-direction:column;
  justify-content:center;
  align-items:center;
  min-height:230px;
  padding:32px 20px;
  text-align:center;
  background:linear-gradient(180deg,#FFFFFF 0%,#FBFCFE 100%);
  border-top:1px solid #EEF0F5;
}
.v910-recon-empty .v910-empty-icon{
  width:42px;height:42px;border-radius:12px;
  display:grid;place-items:center;
  margin-bottom:12px;
  background:var(--v910-soft);
  color:var(--v910-ink);
  font-weight:800;
}
.v910-recon-empty strong{font-size:16px;color:var(--v910-ink);margin-bottom:5px}
.v910-recon-empty span{font-size:13px;color:var(--v910-muted);margin-bottom:14px}
.v910-recon-empty button{
  min-height:40px;padding:0 16px;border-radius:10px;
  border:1px solid var(--v910-ink);background:var(--v910-ink);color:#fff;font-weight:700;
}

/* Reduce excess vertical rhythm inside this feature only. */
.v910-reconciliation-page section,
.v910-reconciliation-page article{scroll-margin-top:84px}

@media (max-width:1100px){
  .v910-account-summary{
    grid-template-columns:minmax(230px,1.5fr) repeat(2,minmax(90px,1fr))!important;
  }
  .v910-account-summary > *:nth-child(3){border-right:0!important}
}

@media (max-width:760px){
  .v910-recon-flow{max-width:100%;overflow:auto;scrollbar-width:none}
  .v910-recon-flow::-webkit-scrollbar{display:none}
  .v910-account-summary{
    display:flex!important;
    overflow-x:auto!important;
    scroll-snap-type:x proximity;
    border-radius:12px!important;
  }
  .v910-account-summary > *{
    flex:0 0 auto!important;
    min-width:128px!important;
    scroll-snap-align:start;
  }
  .v910-account-summary > *:first-child{min-width:240px!important}
  .v910-statement-panel{
    grid-template-columns:1fr!important;
    gap:8px!important;
  }
  .v910-statement-panel .v910-statement-button{width:100%!important}
  .v910-work-actions{width:100%;margin:8px 0 0}
  .v910-work-actions .v910-confirm-button{width:100%!important}
  .v910-recon-empty{min-height:200px}
}
`;

const js = `/* ${MARK} */
(() => {
  "use strict";
  const VERSION = "${VERSION}";
  const root = document.documentElement;
  const clean = s => String(s || "").replace(/\\s+/g," ").trim();
  const low = s => clean(s).toLowerCase();
  let queued = false;
  let lastUrl = location.href;

  function routeIsRecon(){
    try { return new URL(location.href).searchParams.get('page') === 'reconciliation'; }
    catch { return false; }
  }
  function textEls(selector='*'){
    return [...document.querySelectorAll(selector)].filter(el => el.children.length === 0 && clean(el.textContent));
  }
  function exact(text, selector='*'){
    return textEls(selector).find(el => clean(el.textContent) === text) || null;
  }
  function includesText(text, selector='*'){
    return textEls(selector).find(el => clean(el.textContent).includes(text)) || null;
  }
  function commonAncestor(nodes, stop){
    const arr = nodes.filter(Boolean); if(!arr.length) return null;
    let cur = arr[0];
    while(cur && cur !== stop && cur !== document.body){
      if(arr.every(n => cur.contains(n))) return cur;
      cur = cur.parentElement;
    }
    return null;
  }
  function boundedCommon(nodes, page, maxChars=1800){
    let c = commonAncestor(nodes,page); if(!c) return null;
    while(c.parentElement && c.parentElement !== page && clean(c.textContent).length < 90) c = c.parentElement;
    // Walk down if common parent accidentally became a huge page wrapper.
    if(clean(c.textContent).length > maxChars){
      const first = nodes.find(Boolean);
      let x = first?.parentElement;
      while(x && x !== c){
        if(nodes.every(n=>x.contains(n)) && clean(x.textContent).length <= maxChars) return x;
        x = x.parentElement;
      }
    }
    return c;
  }
  function buttonByText(text){
    return [...document.querySelectorAll('button,a,[role="button"]')].find(el => clean(el.textContent).includes(text)) || null;
  }
  function pageRoot(title){
    return title?.closest?.('[id^="page-"],main,.page,[data-page-root]') || title?.parentElement?.parentElement || document.body;
  }
  function numericValue(container){
    if(!container) return null;
    const nums = clean(container.textContent).match(/(?:^|\\s)(\\d+(?:[.,]\\d+)?)(?:\\s|$)/g) || [];
    if(!nums.length) return null;
    const n = Number(nums[nums.length-1].trim().replace(/,/g,''));
    return Number.isFinite(n) ? n : null;
  }
  function directPanel(el, page){
    let c = el;
    for(let i=0;c && c!==page && i<7;i++,c=c.parentElement){
      const t = clean(c.textContent);
      if(t.length >= 20 && t.length <= 1200 && (c.matches?.('section,article,.card,.panel,[class*="card"],[class*="panel"]') || c.children.length >= 2)) return c;
    }
    return el?.parentElement || null;
  }

  function ensureFlow(title, page){
    let flow = page.querySelector('.v910-recon-flow');
    if(!flow){
      flow = document.createElement('div');
      flow.className = 'v910-recon-flow';
      flow.innerHTML = '<b>1 เลือกบัญชี</b><span class="v910-arrow">→</span><b>2 Statement</b><span class="v910-arrow">→</span><b>3 ตรวจคู่</b><span class="v910-arrow">→</span><b>4 ยืนยัน</b>';
      const subtitle = [...page.querySelectorAll('p,div,span')].find(el => el.children.length===0 && clean(el.textContent).includes('เลือกบัญชีต้นทางก่อน'));
      if(subtitle){ subtitle.classList.add('v910-recon-subtitle'); subtitle.insertAdjacentElement('afterend',flow); }
      else title.insertAdjacentElement('afterend',flow);
    }
    return flow;
  }

  function markSummary(page){
    const labels = ['ใบเบิกจ่ายแล้ว','Statement เงินออก','รอกระทบยอด','กระทบยอดแล้ว'].map(t=>includesText(t));
    if(labels.filter(Boolean).length < 3) return null;
    const c = boundedCommon(labels,page,1600);
    if(c) c.classList.add('v910-account-summary');
    return c;
  }

  function markEmptyWarning(page){
    const go = buttonByText('ไปหน้าเบิกจ่าย');
    if(!go || !page.contains(go)) return;
    let c = go.parentElement;
    for(let i=0;c && c!==page && i<4;i++,c=c.parentElement){
      const t = clean(c.textContent).replace(/•|·|\\u2022/g,'').trim();
      if(t.includes('ไปหน้าเบิกจ่าย') && t.length < 45){ c.classList.add('v910-empty-warning'); break; }
    }
  }

  function markKpis(page){
    const labels = ['ทั้งหมดของบัญชีนี้','ระบบจับคู่ให้','ต้องตรวจ','ไม่พบคู่','กระทบยอดแล้ว'].map(t=>includesText(t));
    if(labels.filter(Boolean).length < 4) return null;
    const c = boundedCommon(labels,page,1200);
    if(!c) return null;
    c.classList.add('v910-recon-kpis');
    const vals = labels.filter(Boolean).map(el => numericValue(directPanel(el,c))).filter(v=>v!==null);
    if(vals.length >= 4 && vals.every(v=>v===0)) c.classList.add('v910-all-zero');
    else c.classList.remove('v910-all-zero');
    return c;
  }

  function markStatement(page){
    const label = includesText('ไฟล์ Statement');
    const pick = buttonByText('เลือก Statement');
    if(!label || !pick || !page.contains(label) || !page.contains(pick)) return null;
    const dup = includesText('บัญชีที่กำลังกระทบยอด');
    const c = boundedCommon([label,pick,(dup && page.contains(dup)) ? dup : null].filter(Boolean),page,1800) || directPanel(label,page);
    if(!c) return null;
    c.classList.add('v910-statement-panel');
    pick.classList.add('v910-statement-button');
    let fileArea = label.parentElement;
    for(let i=0;fileArea && fileArea!==c && i<4;i++,fileArea=fileArea.parentElement){
      if(fileArea.contains(label) && !fileArea.contains(pick)){ fileArea.classList.add('v910-statement-file-area'); break; }
    }
    if(dup && c.contains(dup)){
      let p = dup.parentElement;
      for(let i=0;p && p!==c && i<4;i++,p=p.parentElement){
        const t=clean(p.textContent);
        if(t.includes('บัญชีที่กำลังกระทบยอด') && t.length < 500){ p.classList.add('v910-statement-account-duplicate'); break; }
      }
    }
    return {panel:c,pick};
  }

  function markWork(page, statement){
    const heading = includesText('งานกระทบยอดของบัญชีนี้','h1,h2,h3,h4,div,span');
    if(!heading || !page.contains(heading)) return null;
    heading.classList.add('v910-work-heading');
    const search = [...page.querySelectorAll('input')].find(i => String(i.placeholder||'').includes('ค้นหารายละเอียด')) || null;
    const table = heading.parentElement?.parentElement?.querySelector?.('table') || page.querySelector('table');
    const work = boundedCommon([heading, table || search].filter(Boolean),page,5000) || directPanel(heading,page);
    if(!work) return null;
    work.classList.add('v910-work-card');
    if(table) table.classList.add('v910-work-table');

    // Move the real confirmation button into the work area; listeners survive reparenting.
    const confirm = buttonByText('ยืนยันคู่ที่ตรงกันทั้งหมด');
    if(confirm && page.contains(confirm)){
      confirm.classList.add('v910-top-confirm','v910-confirm-button');
      let actions = work.querySelector('.v910-work-actions');
      if(!actions){
        actions = document.createElement('div'); actions.className='v910-work-actions';
        const hParent = heading.parentElement;
        if(hParent){
          hParent.style.display='flex'; hParent.style.flexWrap='wrap'; hParent.style.alignItems='center'; hParent.style.gap='10px';
          hParent.appendChild(actions);
        }
      }
      if(actions && confirm.parentElement !== actions){
        confirm.classList.remove('v910-top-confirm');
        actions.appendChild(confirm);
      }
    }

    const noStatement = !!includesText('ยังไม่ได้เลือกไฟล์');
    page.classList.toggle('v910-no-statement',noStatement);
    let empty = work.querySelector('.v910-recon-empty');
    if(noStatement){
      if(!empty){
        empty = document.createElement('div'); empty.className='v910-recon-empty';
        empty.innerHTML='<div class="v910-empty-icon">≋</div><strong>เริ่มจาก Statement ของบัญชีนี้</strong><span>อัปโหลดไฟล์แล้วระบบจะแสดงรายการที่ต้องจับคู่ตรงนี้</span><button type="button">เลือก Statement</button>';
        const btn=empty.querySelector('button');
        btn?.addEventListener('click',()=>statement?.pick?.click());
        if(table) table.insertAdjacentElement('beforebegin',empty); else work.appendChild(empty);
      }
    } else if(empty) empty.remove();
    return work;
  }

  function conciseSubtitle(page){
    const sub = [...page.querySelectorAll('p,div,span')].find(el => el.children.length===0 && clean(el.textContent).includes('เลือกบัญชีต้นทางก่อน'));
    if(sub && !sub.dataset.v910Copy){
      sub.dataset.v910Copy='1';
      sub.textContent='เลือกบัญชี แล้วอัปโหลด Statement เพื่อให้ระบบจับคู่รายการจ่าย';
      sub.classList.add('v910-recon-subtitle');
    }
  }

  function updateVersion(){
    const badge=document.getElementById('appBuildBadge'); const b=badge?.querySelector?.('b');
    if(b && b.textContent !== 'Dashboard v'+VERSION) b.textContent='Dashboard v'+VERSION;
    const pageBadge=document.getElementById('batchPageVersionV907'); if(pageBadge && pageBadge.textContent !== 'v9.10') pageBadge.textContent='v9.10';
    window.__RUBJAI_DASHBOARD_VERSION__=VERSION;
    window.__RUBJAI_V910_RECONCILIATION_OPERATOR_VIEW__=true;
  }

  function audit(){
    queued=false;
    updateVersion();
    const title = includesText('กระทบยอดตามบัญชี','h1,h2,h3,h4,div,span');
    if(!title || (!routeIsRecon() && !clean(title.textContent).includes('กระทบยอดตามบัญชี'))) return;
    const page=pageRoot(title);
    page.classList.add('v910-reconciliation-page');
    title.classList.add('v910-recon-heading');
    conciseSubtitle(page);
    ensureFlow(title,page);
    markSummary(page);
    markEmptyWarning(page);
    markKpis(page);
    const statement=markStatement(page);
    markWork(page,statement);
  }
  function queue(){ if(queued) return; queued=true; queueMicrotask(audit); }

  new MutationObserver(queue).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','aria-hidden','value']});
  setInterval(()=>{ if(location.href!==lastUrl){lastUrl=location.href;queue();} },100);
  window.addEventListener('popstate',queue);
  document.addEventListener('click',()=>setTimeout(queue,0),true);
  audit(); [0,40,120,300,800,1600].forEach(ms=>setTimeout(audit,ms));
  console.info('${MARK}',VERSION);
})();
`;

fs.writeFileSync(cssFile, css, "utf8");
fs.writeFileSync(jsFile, js, "utf8");
execFileSync(process.execPath, ["--check", jsFile], { stdio: "pipe" });

let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(/\s*<link[^>]+reconciliation-operator-v910\.css[^>]*>\s*/gi, "\n");
html = html.replace(/\s*<script[^>]+reconciliation-operator-v910\.js[^>]*><\/script>\s*/gi, "\n");
if (!/<\/head>/i.test(html) || !/<\/body>/i.test(html)) throw new Error("v9.10 invalid index.html anchors");
html = html.replace(/<\/head>/i, `<link rel="stylesheet" href="./assets/reconciliation-operator-v910.css?v=${VERSION}.${BUILD_DATE}">\n</head>`);
html = html.replace(/<\/body>/i, `<script src="./assets/reconciliation-operator-v910.js?v=${VERSION}.${BUILD_DATE}"></script>\n</body>`);
html = html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i, `$1Dashboard v${VERSION}`);
for (const asset of [
  "dashboard.css","brand-theme.css","batches-mobile-v907.css","brand-composition-v908.css","permissions-fullwidth-v909.css",
  "dashboard.js","reimbursement-batch-lock.js","batches-mobile-v907.js","brand-composition-v908.js","permissions-fullwidth-v909.js"
]) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\.\\/assets\\/${escaped})(?:\\?v=[^\"'<>]+)?`, "g");
  html = html.replace(re, `$1?v=${VERSION}.${BUILD_DATE}`);
}
fs.writeFileSync(indexFile, html, "utf8");

if (fs.existsSync(packageFile)) {
  const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  pkg.version = VERSION;
  const deploy = String(pkg?.scripts?.deploy || "");
  if (deploy && !deploy.includes(SELF)) {
    const idx = deploy.lastIndexOf("wrangler deploy");
    const hook = `node ${SELF}`;
    if (idx >= 0) {
      const left = deploy.slice(0, idx).replace(/\s*&&\s*$/, "").trimEnd();
      const right = deploy.slice(idx);
      pkg.scripts.deploy = `${left} && ${hook} && ${right}`;
    } else pkg.scripts.deploy = `${deploy} && ${hook}`;
  }
  fs.writeFileSync(packageFile, JSON.stringify(pkg, null, 2) + "\n", "utf8");
}

const finalHtml=fs.readFileSync(indexFile,"utf8");
const finalCss=fs.readFileSync(cssFile,"utf8");
const finalJs=fs.readFileSync(jsFile,"utf8");
const checks={
  cssLinked:finalHtml.includes(`reconciliation-operator-v910.css?v=${VERSION}.${BUILD_DATE}`),
  jsLinked:finalHtml.includes(`reconciliation-operator-v910.js?v=${VERSION}.${BUILD_DATE}`),
  afterV909Css:finalHtml.lastIndexOf('reconciliation-operator-v910.css')>finalHtml.lastIndexOf('permissions-fullwidth-v909.css'),
  afterV909Js:finalHtml.lastIndexOf('reconciliation-operator-v910.js')>finalHtml.lastIndexOf('permissions-fullwidth-v909.js'),
  navy:finalCss.includes('--v910-ink:#11162E'),
  hidesZeroKpis:finalCss.includes('.v910-recon-kpis.v910-all-zero{display:none!important}'),
  compactStatement:finalCss.includes('.v910-statement-panel'),
  emptyState:finalJs.includes('เริ่มจาก Statement ของบัญชีนี้'),
  confirmMoves:finalJs.includes("appendChild(confirm)"),
  route:finalJs.includes("get('page') === 'reconciliation'"),
  version:finalJs.includes(`const VERSION = "${VERSION}"`)
};
const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
if(failed.length) throw new Error(`v9.10 audit failed: ${failed.join(', ')}`);
console.log('✅ Dashboard v9.10.0');
console.log('✅ Reconciliation redesigned as one operator flow: account → Statement → review → confirm');
console.log('✅ Duplicate zero KPI dashboard is removed when it carries no information');
console.log('✅ Statement upload is compact and duplicate bank card is suppressed');
console.log('✅ Empty state now explains the next action and opens the real Statement picker');
console.log('✅ Bulk confirm action lives with reconciliation work instead of the page header');
console.log('✅ Navy CI and v9.09 permission fixes remain last-safe through cache-busting');
