import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const indexFile=path.join(root,"index.html");
const assetsDir=path.join(root,"assets");
const jsFile=path.join(assetsDir,"cash-position-live-v7691.js");
const MARK="CASH_POSITION_RATE_LIMIT_FIX_V7_69_1_20260816";

if(!fs.existsSync(indexFile))throw new Error("ไม่พบ index.html");
if(!fs.existsSync(assetsDir))fs.mkdirSync(assetsDir,{recursive:true});

const js="(()=>{\n\"use strict\";\nconst MARK=\"CASH_POSITION_RATE_LIMIT_FIX_V7_69_1_20260816\";\n\nlet lastData=null;\nlet lastSuccessAt=0;\nlet inFlight=null;\nlet timer=null;\nlet blockedUntil=0;\n\nconst SUCCESS_TTL_MS=12000;\nconst MIN_REQUEST_GAP_MS=5000;\nconst RATE_LIMIT_COOLDOWN_MS=65000;\n\nfunction baht(v){\n  const n=Number(v||0);\n  return \"฿\"+n.toLocaleString(\"th-TH\",{\n    minimumFractionDigits:2,\n    maximumFractionDigits:2\n  });\n}\nfunction setMoney(node,value){\n  if(!node)return;\n  node.textContent=value==null?\"ยังไม่ตั้งยอด\":baht(value);\n  node.classList.toggle(\"negative\",value!=null&&Number(value)<0);\n  node.classList.toggle(\"positive\",value!=null&&Number(value)>=0);\n  node.classList.toggle(\"empty\",value==null);\n}\nfunction accountCard(id){\n  const selector='[data-update-cash=\"'+CSS.escape(String(id||\"\"))+'\"]';\n  return document.querySelector(selector)?.closest(\".cash-account-card\")||null;\n}\nfunction paint(data){\n  if(!data?.ok)return;\n  lastData=data;\n\n  const summary=[...document.querySelectorAll(\"#cashPositionSummary > div\")];\n  setMoney(summary[0]?.querySelector(\"strong\"),data.summary?.balance);\n  setMoney(summary[1]?.querySelector(\"strong\"),data.summary?.pendingOut);\n  setMoney(summary[2]?.querySelector(\"strong\"),data.summary?.afterPending);\n\n  for(const account of data.accounts||[]){\n    const card=accountCard(account.id);\n    if(!card)continue;\n    setMoney(card.querySelector(\".cash-account-balance\"),account.balance);\n\n    const meta=card.querySelector(\".cash-account-meta span\");\n    if(meta&&account.balance!=null){\n      const at=account.baselineAt?new Date(account.baselineAt):null;\n      const date=at&&!Number.isNaN(at.getTime())\n        ?at.toLocaleDateString(\"th-TH\",{day:\"numeric\",month:\"short\",year:\"2-digit\"})\n        :\"\";\n      const incoming=Number(account.moneyIn||0);\n      const outgoing=Number(account.moneyOut||0);\n      meta.textContent=[\n        date?(\"ฐาน \"+date):\"\",\n        incoming?(\"+รับ \"+baht(incoming)):\"\",\n        outgoing?(\"-จ่าย \"+baht(outgoing)):\"\"\n      ].filter(Boolean).join(\" · \")||\"อัปเดตยอดฐานแล้ว\";\n    }\n  }\n}\nfunction isRateLimit(response,data){\n  const text=String(\n    data?.message||\n    data?.error||\n    \"\"\n  ).toLowerCase();\n\n  return response?.status===429 ||\n    /rate|quota|too many|ถี่เกิน|เรียกถี่/.test(text);\n}\nasync function doRefresh({force=false}={}){\n  const now=Date.now();\n\n  if(now<blockedUntil){\n    return lastData;\n  }\n  if(inFlight){\n    return inFlight;\n  }\n  if(!force&&lastData&&now-lastSuccessAt<SUCCESS_TTL_MS){\n    return lastData;\n  }\n\n  const since=now-lastSuccessAt;\n  if(lastSuccessAt&&since<MIN_REQUEST_GAP_MS){\n    return lastData;\n  }\n\n  if(typeof TENANT===\"undefined\"||\n     typeof K===\"undefined\"||\n     !TENANT||\n     !K){\n    return lastData;\n  }\n\n  inFlight=(async()=>{\n    try{\n      const worker=\n        typeof WORKER!==\"undefined\"\n          ?WORKER\n          :\"https://accoutingsuppor02.organization-23c.workers.dev\";\n\n      const u=new URL(worker+\"/api/cash-position\");\n      u.searchParams.set(\"tenant\",TENANT);\n      u.searchParams.set(\"k\",K);\n\n      const response=await fetch(u.toString(),{\n        cache:\"no-store\",\n        headers:{\n          accept:\"application/json\",\n          \"cache-control\":\"no-cache\"\n        }\n      });\n\n      const data=await response.json().catch(()=>({}));\n\n      if(isRateLimit(response,data)){\n        blockedUntil=Date.now()+RATE_LIMIT_COOLDOWN_MS;\n        console.warn(\n          \"[Dashboard] cash position paused for Sheets cooldown\",\n          data?.message||data?.error||response.status\n        );\n        return lastData;\n      }\n\n      if(!response.ok||data.ok===false){\n        throw new Error(data.message||data.error||(\"HTTP \"+response.status));\n      }\n\n      lastSuccessAt=Date.now();\n      paint(data);\n      return data;\n    }catch(error){\n      console.warn(\n        \"[Dashboard] cash position refresh skipped\",\n        error?.message||error\n      );\n      return lastData;\n    }finally{\n      inFlight=null;\n    }\n  })();\n\n  return inFlight;\n}\nfunction scheduleRefresh(delay=1400,{force=false}={}){\n  if(timer)clearTimeout(timer);\n  timer=setTimeout(()=>{\n    timer=null;\n    doRefresh({force});\n  },Math.max(0,delay));\n}\nfunction patchCopy(){\n  const modal=document.getElementById(\"cashBalanceModal\");\n  const info=modal?.querySelector(\".cash-balance-info\");\n  if(info){\n    info.textContent=\n      \"ยอดที่กรอกเป็นยอดฐาน ณ ตอนนี้ หลังจากนั้นระบบจะบวกรายรับและหักเงินจ่ายให้อัตโนมัติ\";\n  }\n}\n\n/*\n  IMPORTANT:\n  v7.69 had 6+ forced refresh paths.\n  v7.69.1 intentionally has only:\n  - one delayed initial read\n  - one delayed read after batch refresh\n  - one delayed read after manual baseline save\n*/\n\ntry{\n  if(typeof refreshBatchData===\"function\"&&!refreshBatchData.__cashRateFixV7691){\n    const core=refreshBatchData;\n    const wrapped=async function(...args){\n      const result=await core.apply(this,args);\n\n      // Let the Sheet write settle first, then calculate once.\n      scheduleRefresh(2500,{force:true});\n\n      return result;\n    };\n    wrapped.__cashRateFixV7691=true;\n    refreshBatchData=wrapped;\n  }\n}catch(error){\n  console.debug(\"cash refreshBatchData hook skipped\",error);\n}\n\ndocument.addEventListener(\"click\",event=>{\n  if(event.target.closest(\"[data-update-cash]\")){\n    setTimeout(patchCopy,30);\n  }\n\n  if(event.target.closest(\"#cashBalanceSave\")){\n    // One refresh only. Old code used two forced refreshes.\n    scheduleRefresh(2500,{force:true});\n  }\n},true);\n\ndocument.addEventListener(\"visibilitychange\",()=>{\n  if(\n    !document.hidden&&\n    typeof currentPageKey===\"function\"&&\n    currentPageKey()===\"batches\"&&\n    Date.now()-lastSuccessAt>20000\n  ){\n    scheduleRefresh(800);\n  }\n});\n\n// One initial request only, after the normal page data has settled.\nsetTimeout(()=>{\n  patchCopy();\n  if(\n    typeof currentPageKey===\"function\"&&\n    currentPageKey()===\"batches\"\n  ){\n    scheduleRefresh(1200);\n  }\n},900);\n\nwindow.__refreshCashPositionV7691=()=>doRefresh({force:true});\nwindow.__cashPositionRateStateV7691=()=>({\n  version:MARK,\n  inFlight:Boolean(inFlight),\n  lastSuccessAt,\n  ageMs:lastSuccessAt?Date.now()-lastSuccessAt:null,\n  blockedForMs:Math.max(0,blockedUntil-Date.now()),\n  hasData:Boolean(lastData)\n});\n\nconsole.info(\"[Dashboard] \"+MARK+\" active\");\n})();";
fs.writeFileSync(jsFile,js);
execFileSync(process.execPath,["--check",jsFile],{stdio:"inherit"});

let html=fs.readFileSync(indexFile,"utf8");

// v7.69 still runs earlier in the build chain, but its aggressive runtime must NOT load.
html=html.replace(
  /\s*<!-- AUTO_CASH_POSITION_UI_V7_69_20260816 -->\s*<script[^>]*cash-position-live-v769\.js[^>]*><\/script>\s*/g,
  "\n"
);
html=html.replace(
  /\s*<!-- CASH_POSITION_RATE_LIMIT_FIX_V7_69_1_20260816 -->\s*<script[^>]*cash-position-live-v7691\.js[^>]*><\/script>\s*/g,
  "\n"
);

html=html.replace(
  "</body>",
  `<!-- ${MARK} -->
<script src="./assets/cash-position-live-v7691.js?v=7.69.1.20260816"></script>
</body>`
);

fs.writeFileSync(indexFile,html);

const out=fs.readFileSync(indexFile,"utf8");

for(const [ok,label] of [
  [!out.includes('cash-position-live-v769.js?v=7.69.20260816'),"old aggressive v7.69 runtime removed"],
  [out.includes('cash-position-live-v7691.js?v=7.69.1.20260816'),"v7.69.1 runtime injected"],
]){
  if(!ok)throw new Error("v7.69.1 assertion failed: "+label);
}

console.log("✅ "+MARK+" ready");
console.log("✅ removed repeated 0/200/700/1600ms cash-position requests");
console.log("✅ removed duplicate renderBatches + refreshBatchData forced requests");
console.log("✅ cash position now uses single-flight + debounce + 12-second cache");
console.log("✅ Google Sheets rate-limit response triggers a silent 65-second cooldown");
console.log("✅ payment/baseline changes trigger only one delayed cash refresh");
