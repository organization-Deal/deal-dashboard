import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const dashboardFile = path.join(root, "assets", "dashboard.js");
const indexFile = path.join(root, "index.html");
const MARK = "BILLING_SUCCESS_UX_V7_77_20260818";

for (const file of [dashboardFile, indexFile]) {
  if (!fs.existsSync(file)) throw new Error(`v7.77 missing ${file}`);
}

let dash = fs.readFileSync(dashboardFile, "utf8");

if (!dash.includes(MARK)) {
  dash += `

/* ${MARK} */
(() => {
  "use strict";

  const style = document.createElement("style");
  style.textContent = \`
    .billing-life-card{margin:16px 0 18px;padding:18px 20px;border:1px solid #e5e5e7;border-radius:18px;background:rgba(255,255,255,.92);box-shadow:0 8px 30px rgba(0,0,0,.045);display:flex;align-items:center;justify-content:space-between;gap:18px}
    .billing-life-left{display:flex;align-items:flex-start;gap:12px}.billing-life-dot{width:10px;height:10px;border-radius:50%;margin-top:7px;background:#34c759;box-shadow:0 0 0 5px rgba(52,199,89,.10)}
    .billing-life-card.warn .billing-life-dot{background:#ff9f0a;box-shadow:0 0 0 5px rgba(255,159,10,.12)}
    .billing-life-title{font-weight:700;font-size:15px;color:#111}.billing-life-sub{margin-top:4px;font-size:12px;line-height:1.55;color:#6e6e73}
    .billing-life-actions{display:flex;gap:8px;flex-wrap:wrap}.billing-life-actions button{border:1px solid #d2d2d7;background:#fff;color:#111;border-radius:11px;padding:9px 13px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
    .billing-life-actions button.primary{background:#111;color:#fff;border-color:#111}
    .stripe-return-backdrop{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.28);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:18px}
    .stripe-return-card{width:min(470px,100%);background:#fff;border-radius:24px;padding:28px;box-shadow:0 28px 80px rgba(0,0,0,.22);text-align:center}
    .stripe-return-icon{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;margin:0 auto 16px;background:#ecf9ef;color:#16883d;font-size:26px;font-weight:800}
    .stripe-return-icon.wait{background:#f2f2f7;color:#555}.stripe-return-icon.cancel{background:#f2f2f7;color:#555}
    .stripe-return-card h3{margin:0;font-size:23px;letter-spacing:-.02em}.stripe-return-card p{margin:10px auto 0;max-width:380px;color:#6e6e73;font-size:13px;line-height:1.65}
    .stripe-return-meta{margin:18px 0 0;background:#f5f5f7;border-radius:14px;padding:13px 15px;text-align:left;font-size:12px;color:#3a3a3c;line-height:1.7}
    .stripe-return-actions{display:flex;gap:9px;margin-top:20px}.stripe-return-actions button{flex:1;border-radius:12px;padding:11px 13px;border:1px solid #d2d2d7;background:#fff;font:inherit;font-weight:650;cursor:pointer}
    .stripe-return-actions button.primary{background:#111;color:#fff;border-color:#111}
    @media(max-width:700px){.billing-life-card{align-items:flex-start;flex-direction:column}.billing-life-actions{width:100%}.billing-life-actions button{flex:1}.stripe-return-actions{flex-direction:column}}
  \`;
  document.head.appendChild(style);

  function moneyV777(value){
    const n=Number(value||0);
    return new Intl.NumberFormat("th-TH",{maximumFractionDigits:2}).format(n);
  }
  function thaiDateV777(value){
    if(!value)return "";
    const d=new Date(value);if(!Number.isFinite(d.getTime()))return "";
    return new Intl.DateTimeFormat("th-TH",{day:"numeric",month:"short",year:"numeric"}).format(d);
  }
  function activePlanPriceV777(){
    const plan=PLAN_INFO?.effectivePlan||PLAN_INFO?.plan||"";
    const cat=PLAN_INFO?.catalog?.[plan]||{};
    return PLAN_INFO?.cycle==="annual"?Number(cat.annual||PLAN_INFO.priceAnnual||0):Number(cat.monthly||PLAN_INFO.priceMonthly||0);
  }
  function cycleTextV777(){return PLAN_INFO?.cycle==="annual"?"ปี":"เดือน";}

  async function openBillingPortalV777(){
    try{
      const res=await fetch(apiUrl("/api/subscription/portal"),{method:"POST"});
      const data=await res.json().catch(()=>({}));
      if(!res.ok||data.ok!==true||!data.portalUrl)throw new Error(data.detail||data.reason||"เปิดหน้าจัดการการชำระเงินไม่สำเร็จ");
      location.assign(data.portalUrl);
    }catch(err){alert(err?.message||"เปิดหน้าจัดการการชำระเงินไม่สำเร็จ");}
  }

  function ensureLifecycleCardV777(){
    const page=el("page-billing"); if(!page)return null;
    let card=document.getElementById("billingLifecycleCardV777");
    if(card)return card;
    card=document.createElement("section");
    card.id="billingLifecycleCardV777";
    card.className="billing-life-card";
    const pricing=document.getElementById("pricingGrid");
    const host=pricing?.parentElement||page;
    host.insertBefore(card,pricing||host.firstChild);
    return card;
  }

  function renderLifecycleV777(){
    const card=ensureLifecycleCardV777(); if(!card||!PLAN_INFO?.ok)return;
    const active=PLAN_INFO.status==="active"&&!PLAN_INFO.betaActive;
    const payment=String(PLAN_INFO.stripePaymentStatus||"");
    if(!active&&!["past_due","unpaid","incomplete"].includes(payment)){card.hidden=true;return;}
    card.hidden=false;
    const warning=["past_due","unpaid","incomplete"].includes(payment);
    card.classList.toggle("warn",warning);
    const renewal=thaiDateV777(PLAN_INFO.nextRenewalAt||PLAN_INFO.stripeCurrentPeriodEnd);
    const price=activePlanPriceV777();
    const plan=PLAN_INFO.planName||"แพ็กเกจ";
    card.innerHTML=\`
      <div class="billing-life-left">
        <span class="billing-life-dot"></span>
        <div>
          <div class="billing-life-title">\${warning?"การชำระเงินต้องตรวจสอบ":\`แพ็กเกจ \${esc(plan)} ใช้งานอยู่\`}</div>
          <div class="billing-life-sub">
            \${warning?"Stripe ไม่สามารถเก็บเงินรอบล่าสุดได้ กรุณาตรวจสอบวิธีชำระเงิน":\`\${price?moneyV777(price)+" บาท/"+cycleTextV777():""}\${renewal?" · ต่ออายุ "+renewal:""}\`}
          </div>
        </div>
      </div>
      <div class="billing-life-actions">
        \${PLAN_INFO.canManageBilling?'<button type="button" class="primary" id="billingManageV777">จัดการการชำระเงิน</button>':""}
      </div>\`;
    document.getElementById("billingManageV777")?.addEventListener("click",openBillingPortalV777);
  }

  const coreRenderSubscriptionV777=renderSubscription;
  renderSubscription=function(...args){
    const out=coreRenderSubscriptionV777.apply(this,args);
    try{renderLifecycleV777();}catch(e){console.warn("billing lifecycle UI",e);}
    return out;
  };

  function modalShellV777({icon="✓",iconClass="",title="",message="",meta="",primary="เริ่มใช้งาน",secondary=""}={}){
    document.getElementById("stripeReturnV777")?.remove();
    const wrap=document.createElement("div");
    wrap.id="stripeReturnV777";
    wrap.className="stripe-return-backdrop";
    wrap.innerHTML=\`<div class="stripe-return-card">
      <div class="stripe-return-icon \${iconClass}">\${icon}</div>
      <h3 id="stripeReturnTitleV777">\${esc(title)}</h3>
      <p id="stripeReturnMessageV777">\${esc(message)}</p>
      <div class="stripe-return-meta" id="stripeReturnMetaV777" \${meta?"":"hidden"}>\${meta}</div>
      <div class="stripe-return-actions">
        \${secondary?'<button type="button" id="stripeReturnSecondaryV777">'+esc(secondary)+'</button>':""}
        <button type="button" class="primary" id="stripeReturnPrimaryV777">\${esc(primary)}</button>
      </div>
    </div>\`;
    document.body.appendChild(wrap);
    return wrap;
  }

  function cleanStripeParamsV777(){
    const u=new URL(location.href);
    u.searchParams.delete("stripe");
    u.searchParams.delete("session_id");
    history.replaceState({}, "", u.pathname+"?"+u.searchParams.toString());
  }

  async function handleStripeReturnV777(){
    const u=new URL(location.href);
    const state=u.searchParams.get("stripe");
    if(!state)return;
    cleanStripeParamsV777();

    if(state==="cancel"){
      const modal=modalShellV777({
        icon:"—",iconClass:"cancel",title:"ยังไม่มีการชำระเงิน",
        message:"แพ็กเกจเดิมของคุณยังใช้งานตามปกติ และยังไม่มีการตัดเงิน",
        primary:"กลับไปดูแพ็กเกจ"
      });
      modal.querySelector("#stripeReturnPrimaryV777")?.addEventListener("click",()=>modal.remove());
      return;
    }
    if(state!=="success")return;

    const modal=modalShellV777({
      icon:"…",iconClass:"wait",title:"รับการชำระเงินแล้ว",
      message:"กำลังยืนยันสิทธิ์กับ Stripe และเปิดแพ็กเกจให้คุณ",
      primary:"กำลังตรวจสอบ…"
    });
    const primary=modal.querySelector("#stripeReturnPrimaryV777");
    if(primary)primary.disabled=true;

    let active=false;
    for(let i=0;i<12;i++){
      await refreshSubscription({quiet:true}).catch(()=>false);
      if(PLAN_INFO?.status==="active"&&!PLAN_INFO?.betaActive){
        active=true;break;
      }
      await new Promise(r=>setTimeout(r,900));
    }

    const title=modal.querySelector("#stripeReturnTitleV777");
    const message=modal.querySelector("#stripeReturnMessageV777");
    const icon=modal.querySelector(".stripe-return-icon");
    const meta=modal.querySelector("#stripeReturnMetaV777");
    if(active){
      const renewal=thaiDateV777(PLAN_INFO.nextRenewalAt||PLAN_INFO.stripeCurrentPeriodEnd);
      const price=activePlanPriceV777();
      if(icon){icon.textContent="✓";icon.classList.remove("wait");}
      if(title)title.textContent="ชำระเงินสำเร็จ";
      if(message)message.textContent=\`เปิดใช้งานแพ็กเกจ \${PLAN_INFO.planName||""} แล้ว\`;
      if(meta){
        meta.hidden=false;
        meta.innerHTML=\`<b>แพ็กเกจ:</b> \${esc(PLAN_INFO.planName||"")}<br><b>ค่าบริการ:</b> \${moneyV777(price)} บาท/\${cycleTextV777()}\${renewal?\`<br><b>ต่ออายุครั้งถัดไป:</b> \${esc(renewal)}\`:""}\`;
      }
      if(primary){primary.disabled=false;primary.textContent="เริ่มใช้งาน";}
      if(PLAN_INFO.canManageBilling){
        const actions=modal.querySelector(".stripe-return-actions");
        if(actions&&!modal.querySelector("#stripeReturnSecondaryV777")){
          const manage=document.createElement("button");manage.type="button";manage.id="stripeReturnSecondaryV777";manage.textContent="จัดการการชำระเงิน";
          actions.insertBefore(manage,primary);manage.addEventListener("click",openBillingPortalV777);
        }
      }
    }else{
      if(title)title.textContent="ชำระเงินแล้ว · กำลังเปิดสิทธิ์";
      if(message)message.textContent="Stripe รับรายการแล้ว แต่ Webhook ยังซิงก์สิทธิ์ไม่เสร็จ หน้าแพ็กเกจจะอัปเดตอัตโนมัติในอีกสักครู่";
      if(primary){primary.disabled=false;primary.textContent="กลับหน้าแพ็กเกจ";}
    }
    primary?.addEventListener("click",()=>modal.remove());
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(handleStripeReturnV777,150));
  else setTimeout(handleStripeReturnV777,150);

  console.info("${MARK}");
})();`;
}

fs.writeFileSync(dashboardFile,dash);
execFileSync(process.execPath,["--check",dashboardFile],{stdio:"inherit"});

let index=fs.readFileSync(indexFile,"utf8");
index=index.replace(/\.\/assets\/dashboard\.js\?v=[^"]+/, "./assets/dashboard.js?v=7.77.20260818");
index=index.replace(/ช่วงทดลองใช้ไม่มีการตัดเงินอัตโนมัติ[^<]*/g,"ช่วงทดลองใช้ไม่มีการตัดเงินอัตโนมัติ · เมื่อชำระแพ็กเสียเงินสำเร็จ ระบบจะเปิดสิทธิ์และแสดงวันต่ออายุอัตโนมัติ");
fs.writeFileSync(indexFile,index);

if(!dash.includes(MARK)||!dash.includes("handleStripeReturnV777")||!dash.includes("openBillingPortalV777"))throw new Error("v7.77 dashboard audit failed");
console.log(`✅ ${MARK} ready`);
console.log("✅ Stripe success/cancel return UX");
console.log("✅ Active subscription card + renewal date + Customer Portal button");
