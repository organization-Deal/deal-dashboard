import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const indexFile = path.join(root, "index.html");
const assetsDir = path.join(root, "assets");
const jsFile = path.join(assetsDir, "cash-position-live-v7692.js");
const MARK = "CASH_POSITION_SINGLE_TRUTH_V7_69_2_20260817";
if (!fs.existsSync(indexFile)) throw new Error("ไม่พบ index.html");
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const js = `(()=>{
"use strict";
const MARK="${MARK}";
const CACHE_KEY="cash-position:last-good:v7692:"+(typeof TENANT!=="undefined"?TENANT:"unknown");
const SUCCESS_TTL_MS=12000,MIN_REQUEST_GAP_MS=5000,RATE_LIMIT_COOLDOWN_MS=65000;
let lastData=null,lastSuccessAt=0,inFlight=null,timer=null,blockedUntil=0,renderWrapped=false;

function baht(v){const n=Number(v||0);return "฿"+n.toLocaleString("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2});}
function writeText(node,text){if(node&&node.textContent!==text)node.textContent=text;}
function setMoney(node,value){if(!node)return;writeText(node,value==null?"—":baht(value));node.classList.toggle("negative",value!=null&&Number(value)<0);node.classList.toggle("positive",value!=null&&Number(value)>=0);node.classList.toggle("empty",value==null);}
function accountCard(id){try{return document.querySelector('[data-update-cash="'+CSS.escape(String(id||""))+'"]')?.closest(".cash-account-card")||null}catch{return null}}
function saveCache(data){try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),data}))}catch{}}
function loadCache(){try{const x=JSON.parse(sessionStorage.getItem(CACHE_KEY)||"null");return x?.data?.ok===true?x.data:null}catch{return null}}
function paint(data){
  if(!data?.ok||data.complete===false)return false;
  const board=document.getElementById("cashPositionBoard");if(!board)return false;
  lastData=data;board.dataset.cashTruth="effective";
  const summary=[...document.querySelectorAll("#cashPositionSummary > div")];
  setMoney(summary[0]?.querySelector("strong"),data.summary?.balance);setMoney(summary[1]?.querySelector("strong"),data.summary?.pendingOut);setMoney(summary[2]?.querySelector("strong"),data.summary?.afterPending);
  for(const account of data.accounts||[]){const card=accountCard(account.id);if(!card)continue;setMoney(card.querySelector(".cash-account-balance"),account.balance);const meta=card.querySelector(".cash-account-meta span");if(meta&&account.balance!=null){const at=account.baselineAt?new Date(account.baselineAt):null;const date=at&&!Number.isNaN(at.getTime())?at.toLocaleDateString("th-TH",{day:"numeric",month:"short",year:"2-digit"}):"";const incoming=Number(account.moneyIn||0),outgoing=Number(account.moneyOut||0);writeText(meta,[date?("ฐาน "+date):"",incoming?("+รับ "+baht(incoming)):"",outgoing?("-จ่าย "+baht(outgoing)):""].filter(Boolean).join(" · ")||"อัปเดตยอดฐานแล้ว");}}
  return true;
}
function maskLegacy(){const board=document.getElementById("cashPositionBoard");if(!board)return;board.dataset.cashTruth="loading";[...document.querySelectorAll("#cashPositionSummary > div")].forEach(x=>setMoney(x.querySelector("strong"),null));board.querySelectorAll(".cash-account-balance").forEach(x=>setMoney(x,null));}
function restoreTruth(){const good=lastData||loadCache();if(good)paint(good);else maskLegacy();}
function isRateLimit(r,d){const t=String(d?.message||d?.error||"").toLowerCase();return r?.status===429||/rate|quota|too many|ถี่เกิน|เรียกถี่|resource_exhausted/.test(t);}
async function refreshCash({force=false}={}){
  const now=Date.now();if(now<blockedUntil)return lastData;if(inFlight)return inFlight;if(!force&&lastData&&now-lastSuccessAt<SUCCESS_TTL_MS)return lastData;if(lastSuccessAt&&now-lastSuccessAt<MIN_REQUEST_GAP_MS)return lastData;if(typeof TENANT==="undefined"||typeof K==="undefined"||!TENANT||!K)return lastData;
  inFlight=(async()=>{try{const worker=typeof WORKER!=="undefined"?WORKER:"https://accoutingsuppor02.organization-23c.workers.dev";const u=new URL(worker+"/api/cash-position");u.searchParams.set("tenant",TENANT);u.searchParams.set("k",K);u.searchParams.set("_",String(Date.now()));const r=await fetch(u.toString(),{cache:"no-store",headers:{accept:"application/json","cache-control":"no-cache"}});const d=await r.json().catch(()=>({}));if(isRateLimit(r,d)){blockedUntil=Date.now()+RATE_LIMIT_COOLDOWN_MS;console.warn("[Cash Position] rate limited; keeping last-good");return lastData;}if(!r.ok||d.ok!==true||d.complete!==true){console.warn("[Cash Position] incomplete snapshot ignored",r.status,d?.error||d?.message||"");return lastData;}lastSuccessAt=Date.now();paint(d);saveCache(d);return d;}catch(e){console.warn("[Cash Position] refresh failed; keeping last-good",e?.message||e);return lastData;}finally{inFlight=null}})();return inFlight;
}
function schedule(delay=1000,{force=false}={}){if(timer)clearTimeout(timer);timer=setTimeout(()=>{timer=null;refreshCash({force})},Math.max(0,delay));}
function wrapCore(){if(renderWrapped)return;const core=window.renderCashPositionBoard;if(typeof core!=="function")return;if(core.__singleTruthV7692){renderWrapped=true;return}const wrapped=function(...args){const out=core.apply(this,args);queueMicrotask(restoreTruth);return out};wrapped.__singleTruthV7692=true;window.renderCashPositionBoard=wrapped;renderWrapped=true;}
function patchCopy(){const n=document.getElementById("cashBalanceModal")?.querySelector(".cash-balance-info");if(n)writeText(n,"ยอดที่กรอกเป็นยอดฐาน ณ ตอนนี้ หลังจากนั้นระบบจะบวกรายรับและหักเงินจ่ายให้อัตโนมัติ");}
const cached=loadCache();if(cached){lastData=cached;queueMicrotask(()=>paint(cached));}
wrapCore();[0,50,250,900].forEach(ms=>setTimeout(()=>{wrapCore();restoreTruth();patchCopy()},ms));
try{if(typeof refreshBatchData==="function"&&!refreshBatchData.__singleTruthV7692){const core=refreshBatchData;const wrapped=async function(...args){const out=await core.apply(this,args);restoreTruth();schedule(2200,{force:true});return out};wrapped.__singleTruthV7692=true;refreshBatchData=wrapped;}}catch(e){console.debug("cash batch hook skipped",e)}
document.addEventListener("click",e=>{if(e.target.closest("[data-update-cash]"))setTimeout(patchCopy,30);if(e.target.closest("#cashBalanceSave")){setTimeout(restoreTruth,50);schedule(2200,{force:true});}},true);
document.addEventListener("visibilitychange",()=>{if(!document.hidden){restoreTruth();if(Date.now()-lastSuccessAt>20000)schedule(500)}});window.addEventListener("focus",()=>{restoreTruth();if(Date.now()-lastSuccessAt>20000)schedule(500)});
schedule(500);
window.__cashPositionTruthV7692=()=>({version:MARK,source:document.getElementById("cashPositionBoard")?.dataset.cashTruth||"missing",hasLastGood:Boolean(lastData),lastSuccessAt,ageMs:lastSuccessAt?Date.now()-lastSuccessAt:null,blockedForMs:Math.max(0,blockedUntil-Date.now()),inFlight:Boolean(inFlight),summary:lastData?.summary||null});
console.info("[Dashboard] "+MARK+" active");
})();`;

fs.writeFileSync(jsFile, js);
execFileSync(process.execPath, ["--check", jsFile], { stdio: "inherit" });
let html = fs.readFileSync(indexFile, "utf8");
html = html.replace(/\s*<!-- AUTO_CASH_POSITION_UI_V7_69_20260816 -->\s*<script[^>]*cash-position-live-v769\.js[^>]*><\/script>\s*/g, "\n");
html = html.replace(/\s*<!-- CASH_POSITION_RATE_LIMIT_FIX_V7_69_1_20260816 -->\s*<script[^>]*cash-position-live-v7691\.js[^>]*><\/script>\s*/g, "\n");
html = html.replace(/\s*<!-- CASH_POSITION_SINGLE_TRUTH_V7_69_2_20260817 -->\s*<script[^>]*cash-position-live-v7692\.js[^>]*><\/script>\s*/g, "\n");
html = html.replace("</body>", `<!-- ${MARK} -->\n<script src="./assets/cash-position-live-v7692.js?v=7.69.2.20260817"></script>\n</body>`);
fs.writeFileSync(indexFile, html);
const out = fs.readFileSync(indexFile, "utf8");
if(out.includes("cash-position-live-v769.js?v=7.69.20260816"))throw new Error("old v7.69 runtime still active");
if(out.includes("cash-position-live-v7691.js?v=7.69.1.20260816"))throw new Error("old v7.69.1 runtime still active");
if(!out.includes("cash-position-live-v7692.js?v=7.69.2.20260817"))throw new Error("v7.69.2 runtime missing");
console.log("✅ "+MARK+" ready");
console.log("✅ legacy/manual balance can no longer overwrite the effective balance on re-render");
console.log("✅ last-known-good effective balance is restored immediately after Dashboard redraws");
console.log("✅ first load masks raw baseline until a complete effective balance arrives");
console.log("✅ incomplete / rate-limited cash snapshots never replace the displayed balance");
console.log("✅ only one cash-position browser runtime remains active");
