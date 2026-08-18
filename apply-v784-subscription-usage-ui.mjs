import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const overlayFile = path.join(root, "assets", "reimbursement-batch-lock.js");
const indexFile = path.join(root, "index.html");
const MARK = "SUBSCRIPTION_USAGE_UI_V7_84_20260818";

for (const f of [overlayFile,indexFile]) {
  if (!fs.existsSync(f)) throw new Error(`v7.84 missing ${f}`);
}

let js = fs.readFileSync(overlayFile, "utf8");

if (!js.includes(MARK)) {
  js += `

/* ${MARK} */
(() => {
  "use strict";

  const style=document.createElement("style");
  style.textContent=\`
    .usage784{margin-top:18px}
    .usage784-head{display:flex;justify-content:space-between;align-items:end;gap:14px;margin-bottom:10px}
    .usage784-head h3{margin:0;font-size:17px;letter-spacing:-.02em}
    .usage784-head p{margin:3px 0 0;font-size:10px;color:#777}
    .usage784-month{font-size:10px;color:#777;white-space:nowrap}
    .usage784-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:10px}
    .usage784-kpi{background:#fff;border:1px solid #e5e5e7;border-radius:15px;padding:14px}
    .usage784-kpi span{display:block;font-size:9px;color:#7a7a80;margin-bottom:5px}
    .usage784-kpi strong{font-size:20px;letter-spacing:-.03em}
    .usage784-kpi small{display:block;margin-top:5px;font-size:9px;color:#8e8e93}
    .usage784-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:10px}
    .usage784-card{background:#fff;border:1px solid #e5e5e7;border-radius:15px;overflow:hidden}
    .usage784-card-head{padding:13px 14px;border-bottom:1px solid #eee}
    .usage784-card-head b{font-size:12px}.usage784-card-head span{display:block;font-size:9px;color:#8e8e93;margin-top:2px}
    .usage784-breakdown{padding:5px 14px 9px}
    .usage784-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f2}
    .usage784-row:last-child{border-bottom:0}
    .usage784-row b{font-size:11px;font-weight:650}.usage784-row small{display:block;font-size:9px;color:#8e8e93;margin-top:2px}
    .usage784-count{font-size:12px;font-weight:750}
    .usage784-rule{margin:0 14px 13px;padding:9px 10px;border-radius:10px;background:#f5f5f7;font-size:9px;color:#6e6e73;line-height:1.55}
    .usage784-history{max-height:310px;overflow:auto;padding:4px 14px 9px}
    .usage784-event{padding:9px 0;border-bottom:1px solid #f0f0f2}
    .usage784-event:last-child{border-bottom:0}
    .usage784-event-top{display:flex;justify-content:space-between;gap:10px}
    .usage784-event-top b{font-size:10px}.usage784-event-top strong{font-size:10px}
    .usage784-event-meta{font-size:9px;color:#8e8e93;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .usage784-empty{padding:24px 14px;text-align:center;color:#8e8e93;font-size:10px}
    .usage784-business{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
    .usage784-business span{border:1px solid #e2e2e5;border-radius:999px;padding:4px 7px;font-size:8px;color:#666;background:#fafafa}
    @media(max-width:900px){.usage784-kpis{grid-template-columns:repeat(2,1fr)}.usage784-grid{grid-template-columns:1fr}}
    @media(max-width:560px){.usage784-kpis{grid-template-columns:1fr 1fr}.usage784-kpi{padding:11px}.usage784-kpi strong{font-size:17px}.usage784-head{align-items:flex-start;flex-direction:column}.usage784-month{white-space:normal}}
  \`;
  document.head.appendChild(style);

  function money784(v){
    return Number(v||0).toLocaleString("th-TH",{minimumFractionDigits:0,maximumFractionDigits:2});
  }
  function date784(v){
    const d=new Date(v||"");
    if(!Number.isFinite(d.getTime()))return String(v||"");
    return d.toLocaleDateString("th-TH",{day:"numeric",month:"short"});
  }
  function month784(v){
    const m=String(v||"").match(/^(\\d{4})-(\\d{2})$/);
    if(!m)return String(v||"เดือนนี้");
    const d=new Date(Date.UTC(Number(m[1]),Number(m[2])-1,1));
    return d.toLocaleDateString("th-TH",{month:"long",year:"numeric"});
  }
  function usageHost784(){
    const hero=document.querySelector("#page-billing .billing-hero, #page-billing .billing-current-grid, #page-billing .billing-current");
    return hero?.parentElement || document.querySelector("#page-billing .pagebody") || document.getElementById("page-billing");
  }
  function renderUsage784(){
    if(currentPageKey?.()!=="billing")return;
    const host=usageHost784();if(!host)return;

    let root=document.getElementById("usageDetail784");
    if(!root){
      root=document.createElement("section");
      root.id="usageDetail784";
      root.className="usage784";
      const hero=document.querySelector("#page-billing .billing-hero");
      if(hero)hero.insertAdjacentElement("afterend",root);
      else host.appendChild(root);
    }

    const detail=PLAN_INFO?.usageDetail || {};
    const quota=detail.quota || {
      used:Number(PLAN_INFO?.usage?.documents||0),
      limit:PLAN_INFO?.documentLimit==null?null:Number(PLAN_INFO.documentLimit||0),
      remaining:PLAN_INFO?.documentLimit==null?null:Math.max(0,Number(PLAN_INFO.documentLimit||0)-Number(PLAN_INFO?.usage?.documents||0))
    };
    const ai=detail.ai || {
      used:Number(PLAN_INFO?.aiUsage?.documents||0),
      limit:Number(PLAN_INFO?.aiDocumentLimit||0),
      remaining:Math.max(0,Number(PLAN_INFO?.aiDocumentLimit||0)-Number(PLAN_INFO?.aiUsage?.documents||0))
    };
    const businesses=Array.isArray(detail.businessBreakdown)?detail.businessBreakdown:[];
    const breakdown=Array.isArray(detail.breakdown)?detail.breakdown:[];
    const recent=Array.isArray(detail.recent)?detail.recent:[];
    const daysRemaining=Number(PLAN_INFO?.daysRemaining||0);
    const trialDays=PLAN_INFO?.betaActive ? 30 : null;
    const daysUsed=trialDays==null?null:Math.max(0,Math.min(trialDays,trialDays-daysRemaining));

    const breakdownHtml=breakdown.length
      ? breakdown.map((row)=>\`
          <div class="usage784-row">
            <div><b>\${esc(row.label||row.key||"รายการ")}</b><small>ใช้โควตารายการ \${money784(row.count)} รายการ</small></div>
            <div class="usage784-count">\${money784(row.count)}</div>
          </div>\`).join("")
      : '<div class="usage784-empty">ยังไม่มีรายละเอียดการใช้งานสำหรับเดือนนี้</div>';

    const historyHtml=recent.length
      ? recent.slice(0,12).map((row)=>\`
          <div class="usage784-event">
            <div class="usage784-event-top"><b>\${esc(row.sourceLabel||"รายการ")}</b><strong>฿\${money784(row.amount)}</strong></div>
            <div class="usage784-event-meta">\${esc(date784(row.date))} · \${esc(row.businessName||"ธุรกิจ")} · \${esc(row.vendor||"ไม่ระบุผู้รับ")}</div>
          </div>\`).join("")
      : '<div class="usage784-empty">ยังไม่มีประวัติรายการในเดือนนี้</div>';

    const businessHtml=businesses.length
      ? '<div class="usage784-business">'+businesses.map(b=>\`<span>\${esc(b.name||"ธุรกิจ")} · \${money784(b.count)} รายการ</span>\`).join("")+'</div>'
      : "";

    root.innerHTML=\`
      <div class="usage784-head">
        <div><h3>การใช้งานเดือนนี้</h3><p>ดูได้ชัดเจนว่าโควตาถูกใช้กับอะไร และเหลือเท่าไร</p></div>
        <div class="usage784-month">\${esc(month784(detail.monthKey||PLAN_INFO?.usage?.monthKey||PLAN_INFO?.usage?.month))}</div>
      </div>

      <div class="usage784-kpis">
        <div class="usage784-kpi"><span>รายการธุรกิจ</span><strong>\${money784(quota.used)} / \${quota.limit==null?"∞":money784(quota.limit)}</strong><small>เหลือ \${quota.remaining==null?"ไม่จำกัด":money784(quota.remaining)} รายการ</small></div>
        <div class="usage784-kpi"><span>AI อ่านเอกสาร</span><strong>\${money784(ai.used)} / \${money784(ai.limit)}</strong><small>เหลือ \${money784(ai.remaining)} ใบ</small></div>
        <div class="usage784-kpi"><span>บริษัทที่ใช้งาน</span><strong>\${money784(PLAN_INFO?.businessCount||1)} / \${money784(PLAN_INFO?.businessLimit||1)}</strong><small>\${businesses.length?businesses.length+" บริษัทมีข้อมูลเดือนนี้":"ตามสิทธิ์แพ็กเกจ"}</small></div>
        <div class="usage784-kpi"><span>\${PLAN_INFO?.betaActive?"ช่วงทดลองใช้ฟรี":"แพ็กเกจปัจจุบัน"}</span><strong>\${PLAN_INFO?.betaActive?daysRemaining+" วัน":esc(PLAN_INFO?.planName||"-")}</strong><small>\${PLAN_INFO?.betaActive?"ใช้ไปแล้ว "+daysUsed+" / 30 วัน":"รอบ "+esc(PLAN_INFO?.cycle||"monthly")}</small></div>
      </div>

      <div class="usage784-grid">
        <article class="usage784-card">
          <div class="usage784-card-head"><b>ใช้โควตาไปกับอะไร</b><span>1 รายการใหม่ = ใช้โควตารายการ 1 ครั้ง</span>\${businessHtml}</div>
          <div class="usage784-breakdown">\${breakdownHtml}</div>
          <div class="usage784-rule">\${esc(detail.countingRule||"อนุมัติ เปลี่ยนสถานะ แนบสลิป และ Export ไม่ใช้โควตารายการเพิ่ม")}</div>
        </article>
        <article class="usage784-card">
          <div class="usage784-card-head"><b>ประวัติการใช้ล่าสุด</b><span>รายการล่าสุดที่ถูกนับในเดือนนี้</span></div>
          <div class="usage784-history">\${historyHtml}</div>
        </article>
      </div>\`;

    // Make the old summary card clearer as well.
    if(el("billingUsageSub")){
      el("billingUsageSub").textContent="รายการธุรกิจที่ถูกบันทึกเดือนนี้";
    }
    if(el("billingUsageState")){
      const remain=quota.remaining==null?"ไม่จำกัด":money784(quota.remaining);
      el("billingUsageState").textContent=\`เหลือ \${remain} รายการ · AI เหลือ \${money784(ai.remaining)} ใบ\`;
    }
  }

  if(typeof renderSubscription==="function"){
    const coreRenderSubscription784=renderSubscription;
    renderSubscription=function(...args){
      const out=coreRenderSubscription784.apply(this,args);
      try{renderUsage784();}catch(error){console.warn("v7.84 usage UI",error);}
      return out;
    };
  }

  setTimeout(()=>{try{if(currentPageKey?.()==="billing")renderUsage784();}catch{}},350);
  console.info("${MARK}");
})();`;
}

fs.writeFileSync(overlayFile,js);
execFileSync(process.execPath,["--check",overlayFile],{stdio:"inherit"});

let html=fs.readFileSync(indexFile,"utf8");
html=html.replace(/\.\/assets\/reimbursement-batch-lock\.js\?v=[^"]+/, "./assets/reimbursement-batch-lock.js?v=7.84.20260818");
fs.writeFileSync(indexFile,html);

if(!js.includes(MARK)||!html.includes("reimbursement-batch-lock.js?v=7.84.20260818")){
  throw new Error("v7.84 dashboard audit failed");
}

console.log(`✅ ${MARK}`);
console.log("✅ Billing page now shows used / limit / remaining");
console.log("✅ Source breakdown + per-business counts + recent usage history");
