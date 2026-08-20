import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const VERSION = "9.11.0";
const BUILD_DATE = "20260820";
const SELF = "apply-v911-reconciliation-stability-hotfix.mjs";
const MARK = "RUBJAI_V911_RECON_STABILITY_HOTFIX_20260820";

const indexFile = path.join(root, "index.html");
const packageFile = path.join(root, "package.json");
const assetsDir = path.join(root, "assets");
const reconJsFile = path.join(assetsDir, "reconciliation-operator-v910.js");
const reconCssFile = path.join(assetsDir, "reconciliation-operator-v910.css");

if (!fs.existsSync(indexFile)) throw new Error("v9.11 missing index.html");
if (!fs.existsSync(reconJsFile)) throw new Error("v9.11 expected v9.10 reconciliation JS to exist first");
if (!fs.existsSync(reconCssFile)) throw new Error("v9.11 expected v9.10 reconciliation CSS to exist first");

/*
  Root cause fixed here:
  v9.10 searched for the reconciliation heading globally. Because the SPA keeps
  hidden page DOM around, the hidden reconciliation heading could be found even
  when page=reconciliation was NOT active. The old guard then still passed.
  It also observed style/class mutations while writing inline styles during the
  same audit, which could create a self-triggering microtask loop and starve the
  browser main thread (blank/black page + endless spinner).

  v9.11 keeps the same reconciliation UX but makes the runtime inert outside the
  exact route and uses a debounced childList-only observer. No inline style writes.
*/

const safeJs = `/* ${MARK} */
(() => {
  "use strict";
  const VERSION = "${VERSION}";
  const clean = s => String(s || "").replace(/\\s+/g, " ").trim();
  let queued = false;
  let timer = 0;
  let lastUrl = location.href;

  function routeIsRecon(){
    try { return new URL(location.href).searchParams.get("page") === "reconciliation"; }
    catch { return false; }
  }

  function visible(el){
    if(!el) return false;
    if(el.hidden || el.getAttribute("aria-hidden") === "true") return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  }

  function leafs(scope, selector){
    return [...scope.querySelectorAll(selector)].filter(el => el.children.length === 0 && clean(el.textContent));
  }

  function findText(scope, text, selector = "h1,h2,h3,h4,h5,p,span,div,label"){
    return leafs(scope, selector).find(el => clean(el.textContent).includes(text)) || null;
  }

  function findButton(scope, text){
    return [...scope.querySelectorAll("button,a,[role=button]")].find(el => clean(el.textContent).includes(text)) || null;
  }

  function activePage(){
    const candidates = [...document.querySelectorAll("[id^=page-],main,.page,[data-page-root]")];
    const title = [...document.querySelectorAll("h1,h2,h3,h4,.page-title,.section-title")]
      .find(el => visible(el) && clean(el.textContent).includes("กระทบยอดตามบัญชี"));
    if(title) return title.closest("[id^=page-],main,.page,[data-page-root]") || title.parentElement?.parentElement || document.body;
    return candidates.find(el => visible(el) && clean(el.textContent).includes("กระทบยอดตามบัญชี")) || null;
  }

  function commonAncestor(nodes, stop){
    const arr = nodes.filter(Boolean);
    if(!arr.length) return null;
    let cur = arr[0];
    while(cur && cur !== stop && cur !== document.body){
      if(arr.every(n => cur.contains(n))) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  function boundedCommon(nodes, page, maxChars = 1800){
    const arr = nodes.filter(Boolean);
    let c = commonAncestor(arr, page);
    if(!c) return null;
    if(clean(c.textContent).length <= maxChars) return c;
    let x = arr[0]?.parentElement;
    while(x && x !== c){
      if(arr.every(n => x.contains(n)) && clean(x.textContent).length <= maxChars) return x;
      x = x.parentElement;
    }
    return c;
  }

  function directPanel(el, page){
    let c = el;
    for(let i=0; c && c !== page && i<7; i++, c=c.parentElement){
      const t = clean(c.textContent);
      if(t.length >= 20 && t.length <= 1400 && (c.matches?.("section,article,.card,.panel,[class*=card],[class*=panel]") || c.children.length >= 2)) return c;
    }
    return el?.parentElement || null;
  }

  function numericValue(container){
    if(!container) return null;
    const matches = clean(container.textContent).match(/(?:^|\\s)(\\d+(?:[.,]\\d+)?)(?:\\s|$)/g) || [];
    if(!matches.length) return null;
    const n = Number(matches[matches.length-1].trim().replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  }

  function ensureFlow(page, title){
    let flow = page.querySelector(".v910-recon-flow");
    if(flow) return flow;
    flow = document.createElement("div");
    flow.className = "v910-recon-flow";
    flow.innerHTML = '<b>1 เลือกบัญชี</b><span class="v910-arrow">→</span><b>2 Statement</b><span class="v910-arrow">→</span><b>3 ตรวจคู่</b><span class="v910-arrow">→</span><b>4 ยืนยัน</b>';
    const subtitle = findText(page, "เลือกบัญชีต้นทางก่อน", "p,div,span");
    if(subtitle) subtitle.insertAdjacentElement("afterend", flow);
    else title?.insertAdjacentElement("afterend", flow);
    return flow;
  }

  function conciseSubtitle(page){
    const sub = findText(page, "เลือกบัญชีต้นทางก่อน", "p,div,span") || findText(page, "เลือกบัญชี แล้วอัปโหลด Statement", "p,div,span");
    if(!sub) return;
    sub.classList.add("v910-recon-subtitle");
    if(sub.dataset.v911Copy !== "1"){
      sub.dataset.v911Copy = "1";
      if(clean(sub.textContent).includes("เลือกบัญชีต้นทางก่อน")) sub.textContent = "เลือกบัญชี แล้วอัปโหลด Statement เพื่อให้ระบบจับคู่รายการจ่าย";
    }
  }

  function markSummary(page){
    const labels = ["ใบเบิกจ่ายแล้ว","Statement เงินออก","รอกระทบยอด","กระทบยอดแล้ว"].map(t => findText(page,t));
    if(labels.filter(Boolean).length < 3) return;
    boundedCommon(labels,page,1700)?.classList.add("v910-account-summary");
  }

  function markEmptyWarning(page){
    const go = findButton(page, "ไปหน้าเบิกจ่าย");
    if(!go) return;
    let c = go.parentElement;
    for(let i=0; c && c!==page && i<4; i++, c=c.parentElement){
      const t = clean(c.textContent).replace(/[•·]/g, "").trim();
      if(t.includes("ไปหน้าเบิกจ่าย") && t.length < 50){ c.classList.add("v910-empty-warning"); break; }
    }
  }

  function markKpis(page){
    const labels = ["ทั้งหมดของบัญชีนี้","ระบบจับคู่ให้","ต้องตรวจ","ไม่พบคู่","กระทบยอดแล้ว"].map(t => findText(page,t));
    if(labels.filter(Boolean).length < 4) return;
    const c = boundedCommon(labels,page,1300);
    if(!c) return;
    c.classList.add("v910-recon-kpis");
    const vals = labels.filter(Boolean).map(el => numericValue(directPanel(el,c))).filter(v => v !== null);
    c.classList.toggle("v910-all-zero", vals.length >= 4 && vals.every(v => v === 0));
  }

  function markStatement(page){
    const label = findText(page, "ไฟล์ Statement");
    const pick = findButton(page, "เลือก Statement");
    if(!label || !pick) return null;
    const dup = findText(page, "บัญชีที่กำลังกระทบยอด");
    const panel = boundedCommon([label,pick,dup], page, 1900) || directPanel(label,page);
    if(!panel) return null;
    panel.classList.add("v910-statement-panel");
    pick.classList.add("v910-statement-button");

    let area = label.parentElement;
    for(let i=0; area && area!==panel && i<4; i++, area=area.parentElement){
      if(area.contains(label) && !area.contains(pick)){ area.classList.add("v910-statement-file-area"); break; }
    }
    if(dup && panel.contains(dup)){
      let p = dup.parentElement;
      for(let i=0; p && p!==panel && i<4; i++, p=p.parentElement){
        const t = clean(p.textContent);
        if(t.includes("บัญชีที่กำลังกระทบยอด") && t.length < 550){ p.classList.add("v910-statement-account-duplicate"); break; }
      }
    }
    return { panel, pick };
  }

  function markWork(page, statement){
    const heading = findText(page, "งานกระทบยอดของบัญชีนี้", "h1,h2,h3,h4,div,span");
    if(!heading) return;
    heading.classList.add("v910-work-heading");
    const search = [...page.querySelectorAll("input")].find(i => String(i.placeholder||"").includes("ค้นหารายละเอียด")) || null;
    const table = page.querySelector("table");
    const work = boundedCommon([heading, table || search], page, 5500) || directPanel(heading,page);
    if(!work) return;
    work.classList.add("v910-work-card");
    if(table) table.classList.add("v910-work-table");

    const confirm = findButton(page, "ยืนยันคู่ที่ตรงกันทั้งหมด");
    if(confirm){
      confirm.classList.add("v910-confirm-button");
      let actions = work.querySelector(".v910-work-actions");
      if(!actions){
        actions = document.createElement("div");
        actions.className = "v910-work-actions";
        const hParent = heading.parentElement;
        if(hParent){ hParent.classList.add("v911-work-title-row"); hParent.appendChild(actions); }
      }
      if(actions && confirm.parentElement !== actions) actions.appendChild(confirm);
      confirm.classList.remove("v910-top-confirm");
    }

    const noStatement = !!findText(page, "ยังไม่ได้เลือกไฟล์", "div,span,p,label");
    page.classList.toggle("v910-no-statement", noStatement);
    let empty = work.querySelector(".v910-recon-empty");
    if(noStatement && !empty){
      empty = document.createElement("div");
      empty.className = "v910-recon-empty";
      empty.innerHTML = '<div class="v910-empty-icon">≋</div><strong>เริ่มจาก Statement ของบัญชีนี้</strong><span>อัปโหลดไฟล์แล้วระบบจะแสดงรายการที่ต้องจับคู่ตรงนี้</span><button type="button">เลือก Statement</button>';
      empty.querySelector("button")?.addEventListener("click", () => statement?.pick?.click());
      if(table) table.insertAdjacentElement("beforebegin", empty); else work.appendChild(empty);
    } else if(!noStatement && empty) empty.remove();
  }

  function updateVersion(){
    const badge = document.getElementById("appBuildBadge");
    const b = badge?.querySelector?.("b");
    if(b && b.textContent !== "Dashboard v" + VERSION) b.textContent = "Dashboard v" + VERSION;
    const pageBadge = document.getElementById("batchPageVersionV907");
    if(pageBadge && pageBadge.textContent !== "v9.11") pageBadge.textContent = "v9.11";
    window.__RUBJAI_DASHBOARD_VERSION__ = VERSION;
    window.__RUBJAI_V911_RECON_STABLE__ = true;
  }

  function audit(){
    queued = false;
    timer = 0;
    updateVersion();

    // HARD GUARD: never scan/recompose hidden reconciliation DOM outside route.
    if(!routeIsRecon()) return;

    const page = activePage();
    if(!page) return;
    const title = [...page.querySelectorAll("h1,h2,h3,h4,.page-title,.section-title")]
      .find(el => visible(el) && clean(el.textContent).includes("กระทบยอดตามบัญชี"));
    if(!title) return;

    page.classList.add("v910-reconciliation-page");
    title.classList.add("v910-recon-heading");
    conciseSubtitle(page);
    ensureFlow(page,title);
    markSummary(page);
    markEmptyWarning(page);
    markKpis(page);
    const statement = markStatement(page);
    markWork(page,statement);
  }

  function schedule(delay = 16){
    if(queued) return;
    queued = true;
    clearTimeout(timer);
    timer = setTimeout(audit, delay);
  }

  // childList only: our class/style changes cannot recursively retrigger this observer.
  new MutationObserver(() => {
    if(routeIsRecon()) schedule(24);
  }).observe(document.body, { subtree:true, childList:true });

  document.addEventListener("click", () => { if(routeIsRecon()) schedule(32); }, true);
  window.addEventListener("popstate", () => schedule(0));
  setInterval(() => {
    if(location.href !== lastUrl){
      lastUrl = location.href;
      schedule(0);
    }
  }, 250);

  // Emergency cleanup in case a stale v9.09 transition class survived a crashed render.
  if(!(() => { try { const u=new URL(location.href); return u.searchParams.get("page") === "business" && u.searchParams.get("biz") === "permissions"; } catch { return false; } })()){
    document.documentElement.classList.remove("v909-permission-transition","v909-permission-ready");
  }

  updateVersion();
  if(routeIsRecon()) [0,80,240,700].forEach(ms => setTimeout(() => schedule(0), ms));
  console.info("${MARK}", VERSION);
})();
`;

fs.writeFileSync(reconJsFile, safeJs, "utf8");
execFileSync(process.execPath, ["--check", reconJsFile], { stdio: "pipe" });

let css = fs.readFileSync(reconCssFile, "utf8");
if (!css.includes(MARK)) {
  css += `\n/* ${MARK} */\n.v910-reconciliation-page .v911-work-title-row{display:flex!important;flex-wrap:wrap!important;align-items:center!important;gap:10px!important}\n`;
  fs.writeFileSync(reconCssFile, css, "utf8");
}

let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(/(<div class="app-build-badge"[^>]*id="appBuildBadge"[\s\S]*?<b>)Dashboard v[^<]+/i, `$1Dashboard v${VERSION}`);
for (const asset of [
  "dashboard.css","brand-theme.css","batches-mobile-v907.css","brand-composition-v908.css","permissions-fullwidth-v909.css","reconciliation-operator-v910.css",
  "dashboard.js","reimbursement-batch-lock.js","batches-mobile-v907.js","brand-composition-v908.js","permissions-fullwidth-v909.js","reconciliation-operator-v910.js"
]) {
  const escaped = asset.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(\\.\\/assets\\/${escaped})(?:\\?v=[^"'<>]+)?`, "g");
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

const checks = {
  hardRouteGuard: safeJs.includes('if(!routeIsRecon()) return;'),
  noAttributeObserver: !safeJs.includes('attributeFilter') && safeJs.includes('childList:true'),
  noMicrotaskLoop: !safeJs.includes('queueMicrotask'),
  noInlineStyleWrites: !safeJs.includes('.style.display') && !safeJs.includes('.style.flex'),
  staleTransitionRecovery: safeJs.includes('v909-permission-transition'),
  syntaxOk: true,
};
if (Object.values(checks).some(v => !v)) throw new Error(`v9.11 audit failed: ${JSON.stringify(checks)}`);
fs.writeFileSync(path.join(root, "AUDIT_V911.json"), JSON.stringify({ version:VERSION, mark:MARK, checks }, null, 2) + "\n", "utf8");

console.log(`✅ Dashboard v${VERSION}`);
console.log("✅ Fixed global v9.10 reconciliation route guard that could run on hidden SPA DOM");
console.log("✅ Removed self-triggering attribute/style MutationObserver loop");
console.log("✅ Reconciliation enhancement now runs only on page=reconciliation");
console.log("✅ Added stale transition cleanup so a failed render cannot trap the dashboard");
console.log("✅ v9.10 clean reconciliation composition remains intact");
