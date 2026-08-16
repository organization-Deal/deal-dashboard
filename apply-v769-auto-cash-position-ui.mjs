import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const indexFile=path.join(root,"index.html");
const assetsDir=path.join(root,"assets");
const jsFile=path.join(assetsDir,"cash-position-live-v769.js");
const MARK="AUTO_CASH_POSITION_UI_V7_69_20260816";

if(!fs.existsSync(indexFile))throw new Error("ไม่พบ index.html");
if(!fs.existsSync(assetsDir))fs.mkdirSync(assetsDir,{recursive:true});

const js=`(()=>{
"use strict";
const MARK="${MARK}";
let loading=false,lastAt=0,lastData=null;

function baht(v){
  const n=Number(v||0);
  return "฿"+n.toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});
}
function setMoney(node,value){
  if(!node)return;
  node.textContent=value==null?"ยังไม่ตั้งยอด":baht(value);
  node.classList.toggle("negative",value!=null&&Number(value)<0);
  node.classList.toggle("positive",value!=null&&Number(value)>=0);
  node.classList.toggle("empty",value==null);
}
function accountCard(id){
  const selector='[data-update-cash="'+CSS.escape(String(id||""))+'"]';
  const btn=document.querySelector(selector);
  return btn?.closest(".cash-account-card")||null;
}
function paint(data){
  if(!data?.ok)return;
  lastData=data;
  const summary=[...document.querySelectorAll("#cashPositionSummary > div")];
  setMoney(summary[0]?.querySelector("strong"),data.summary?.balance);
  setMoney(summary[1]?.querySelector("strong"),data.summary?.pendingOut);
  setMoney(summary[2]?.querySelector("strong"),data.summary?.afterPending);

  for(const account of data.accounts||[]){
    const card=accountCard(account.id);
    if(!card)continue;
    setMoney(card.querySelector(".cash-account-balance"),account.balance);

    const meta=card.querySelector(".cash-account-meta span");
    if(meta && account.balance!=null){
      const at=account.baselineAt?new Date(account.baselineAt):null;
      const date=at&&!Number.isNaN(at.getTime())
        ?at.toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"2-digit"})
        :"";
      const incoming=Number(account.moneyIn||0),outgoing=Number(account.moneyOut||0);
      meta.textContent=[
        date?("ฐาน "+date):"",
        incoming?("+รับ "+baht(incoming)):"",
        outgoing?("-จ่าย "+baht(outgoing)):""
      ].filter(Boolean).join(" · ") || "อัปเดตยอดฐานแล้ว";
    }
  }
}
async function refreshCashPositionV769({force=false}={}){
  if(loading)return lastData;
  if(!force&&Date.now()-lastAt<1500)return lastData;
  if(typeof TENANT==="undefined"||typeof K==="undefined"||!TENANT||!K)return null;
  loading=true;
  try{
    const u=new URL((typeof WORKER!=="undefined"?WORKER:"https://accoutingsuppor02.organization-23c.workers.dev")+"/api/cash-position");
    u.searchParams.set("tenant",TENANT);
    u.searchParams.set("k",K);
    const r=await fetch(u.toString(),{cache:"no-store",headers:{accept:"application/json","cache-control":"no-cache"}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok||j.ok===false)throw new Error(j.message||j.error||("HTTP "+r.status));
    lastAt=Date.now();
    paint(j);
    return j;
  }catch(error){
    console.warn("[Dashboard] v7.69 cash position",error?.message||error);
    return null;
  }finally{
    loading=false;
  }
}

function patchCopy(){
  const modal=document.getElementById("cashBalanceModal");
  if(!modal)return;
  const info=modal.querySelector(".cash-balance-info");
  if(info)info.textContent="ยอดที่กรอกจะเป็นยอดฐาน ณ ตอนนี้ หลังจากนั้นระบบจะบวกรายรับและหักเงินจ่ายจากบัญชีนี้ให้อัตโนมัติ";
}

const originalWindow=window.renderCashPositionBoard;
if(typeof originalWindow==="function"&&!originalWindow.__autoCashV769){
  const wrapped=function(...args){
    const out=originalWindow.apply(this,args);
    queueMicrotask(()=>refreshCashPositionV769({force:true}));
    return out;
  };
  wrapped.__autoCashV769=true;
  window.renderCashPositionBoard=wrapped;
}

try{
  if(typeof renderBatches==="function"&&!renderBatches.__autoCashV769){
    const core=renderBatches;
    const wrapped=function(...args){
      const out=core.apply(this,args);
      setTimeout(()=>refreshCashPositionV769({force:true}),0);
      return out;
    };
    wrapped.__autoCashV769=true;
    renderBatches=wrapped;
  }
}catch{}

try{
  if(typeof refreshBatchData==="function"&&!refreshBatchData.__autoCashV769){
    const core=refreshBatchData;
    const wrapped=async function(...args){
      const out=await core.apply(this,args);
      await refreshCashPositionV769({force:true});
      return out;
    };
    wrapped.__autoCashV769=true;
    refreshBatchData=wrapped;
  }
}catch{}

document.addEventListener("click",event=>{
  if(event.target.closest("[data-update-cash]"))setTimeout(patchCopy,30);
  if(event.target.closest("#cashBalanceSave")){
    setTimeout(()=>refreshCashPositionV769({force:true}),700);
    setTimeout(()=>refreshCashPositionV769({force:true}),1600);
  }
},true);

document.addEventListener("visibilitychange",()=>{
  if(!document.hidden&&typeof currentPageKey==="function"&&currentPageKey()==="batches"){
    refreshCashPositionV769({force:true});
  }
});

[0,200,700,1600].forEach(ms=>setTimeout(()=>{
  patchCopy();
  if(typeof currentPageKey==="function"&&currentPageKey()==="batches")refreshCashPositionV769({force:true});
},ms));

window.__refreshCashPositionV769=()=>refreshCashPositionV769({force:true});
window.__cashPositionDataV769=()=>lastData;
console.info("[Dashboard] "+MARK+" active");
})();`;

fs.writeFileSync(jsFile,js);
execFileSync(process.execPath,["--check",jsFile],{stdio:"inherit"});

let html=fs.readFileSync(indexFile,"utf8");
html=html.replace(/\s*<!-- AUTO_CASH_POSITION_UI_V7_69_20260816 -->\s*<script[^>]*cash-position-live-v769\.js[^>]*><\/script>\s*/g,"\n");
html=html.replace("</body>",`<!-- ${MARK} -->
<script src="./assets/cash-position-live-v769.js?v=7.69.20260816"></script>
</body>`);
fs.writeFileSync(indexFile,html);

const out=fs.readFileSync(indexFile,"utf8");
if(!out.includes("cash-position-live-v769.js?v=7.69.20260816"))throw new Error("v7.69 dashboard script injection failed");

console.log("✅ "+MARK+" ready");
console.log("✅ cash cards now use backend effective balances");
console.log("✅ income adds to the selected account automatically");
console.log("✅ reimbursement and AP payments subtract automatically");
console.log("✅ manual Update button now resets the balance baseline");
console.log("✅ cash position refreshes immediately after reimbursement refresh");
