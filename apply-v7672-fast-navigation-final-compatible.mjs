import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const file=path.join(root,"assets","dashboard.js");
const MARK="FAST_NAVIGATION_FINAL_COMPAT_V7_67_2_20260816";

if(!fs.existsSync(file)){
  throw new Error("ไม่พบ assets/dashboard.js");
}

let src=fs.readFileSync(file,"utf8");

if(src.includes(MARK)){
  console.log("✅ "+MARK+" already applied");
  process.exit(0);
}

/*
  IMPORTANT v7.67.2:
  - Do NOT assume dashboard.js ends with load();
  - Do NOT replace the load() block
  - Previous migrations append runtime code after load()
  - Fast navigation works independently of load() placement
*/

const oldHard=`function hardNavigate(page,extra={}){
  const next=page==="reimburse"?"batches":page;
  const current=currentPageKey();
  if(next===current && (!extra.biz || extra.biz===BUSINESS_TAB))return false;
  location.assign(routeUrl(next,extra));
  return true;
}`;

if(!src.includes(oldHard)){
  throw new Error("v7.67.2: hardNavigate pattern changed");
}

src=src.replace(
  oldHard,
  "const FAST_NAV_TTL_MS=30000;\nconst FAST_NAV_LAST_FETCH=new Map();\nlet FAST_NAV_PRIME_STARTED=false;\n\nfunction fastNavKey(page){\n  if(EXPENSE_DATA_PAGES.has(page))return \"expense-core\";\n  if(page===\"email\"||page===\"subscriptions\")return \"email\";\n  return page;\n}\nfunction fastNavFresh(page){\n  const at=Number(FAST_NAV_LAST_FETCH.get(fastNavKey(page))||0);\n  return at>0&&(Date.now()-at)<FAST_NAV_TTL_MS;\n}\nasync function fastNavRefresh(page,{force=false}={}){\n  const p=page===\"reimburse\"?\"batches\":page;\n  if(!navigator.onLine||DASH_AUTH_BLOCKED)return false;\n  if(!force&&fastNavFresh(p))return true;\n\n  const key=fastNavKey(p);\n  FAST_NAV_LAST_FETCH.set(key,Date.now());\n\n  try{\n    let ok=true;\n\n    if(EXPENSE_DATA_PAGES.has(p)){\n      ok=await refreshData({manual:false});\n    }else if(p===\"batches\"){\n      ok=await refreshBatchData({quiet:true});\n    }else if(p===\"reconciliation\"){\n      ok=await refreshReconciliation({quiet:true});\n    }else if(p===\"income\"){\n      ok=await refreshIncome({quiet:true,withReconciliation:false});\n    }else if(p===\"email\"||p===\"subscriptions\"){\n      ok=await refreshEmailData({scope:p});\n    }else if(p===\"billing\"){\n      const result=await Promise.all([\n        refreshSubscription({quiet:true}),\n        refreshBusinesses({quiet:true})\n      ]);\n      ok=result.every(x=>x!==false);\n    }\n\n    if(ok===false){\n      FAST_NAV_LAST_FETCH.delete(key);\n      return false;\n    }\n\n    FAST_NAV_LAST_FETCH.set(key,Date.now());\n    return true;\n  }catch(err){\n    FAST_NAV_LAST_FETCH.delete(key);\n    console.debug(\"fast navigation background refresh skipped\",p,err);\n    return false;\n  }\n}\n\nfunction fastNavHydrateExpenseCache(){\n  if(ALL.length)return false;\n\n  const cached=loadDashboardCache();\n  if(!cached?.rows?.length)return false;\n\n  ALL=cached.rows;\n  LAST_SIGNATURE=rowsSignature(ALL);\n\n  try{\n    drawAll();\n  }catch(err){\n    console.debug(\"fast cache render skipped\",err);\n  }\n\n  return true;\n}\n\nfunction fastNavPrime(current){\n  if(FAST_NAV_PRIME_STARTED||document.hidden||!navigator.onLine)return;\n\n  FAST_NAV_PRIME_STARTED=true;\n\n  if(current!==\"batches\"){\n    setTimeout(()=>fastNavRefresh(\"batches\"),1400);\n  }\n\n  if(current!==\"income\"){\n    setTimeout(()=>fastNavRefresh(\"income\"),2800);\n  }\n}\n\nfunction fastNavHistory(page,extra={}){\n  try{\n    history.pushState(\n      {dashboard:true,page,biz:extra.biz||\"\"},\n      \"\",\n      routeUrl(page,extra)\n    );\n  }catch(err){\n    console.debug(\"history update skipped\",err);\n  }\n}\n\nfunction hardNavigate(page,extra={}){\n  const next=page===\"reimburse\"?\"batches\":page;\n  const current=currentPageKey();\n\n  if(next===current && (!extra.biz || extra.biz===BUSINESS_TAB)){\n    return false;\n  }\n\n  fastNavHistory(next,extra);\n\n  if(next===\"business\"){\n    const tab=extra.biz||BUSINESS_TAB||\"profile\";\n\n    openBusiness(\n      tab,\n      document.querySelector(`[data-biz=\"${tab}\"]`),\n      {\n        soft:true,\n        bypassSetup:true,\n        fastNav:true\n      }\n    );\n  }else{\n    if(EXPENSE_DATA_PAGES.has(next)){\n      fastNavHydrateExpenseCache();\n    }\n\n    openPage(\n      next,\n      document.querySelector(`[data-p=\"${next}\"]`),\n      {\n        soft:true,\n        bypassSetup:true,\n        fastNav:true\n      }\n    );\n  }\n\n  return true;\n}"
);

const oldReleasePage=`  if(previous&&previous!==p){releasePageDom(previous);releasePageData(previous,p);}`;

if(!src.includes(oldReleasePage)){
  throw new Error("v7.67.2: openPage release pattern changed");
}

src=src.replace(
  oldReleasePage,
  `  // v7.67.2 preserve page DOM/data so returning to a page is instant.\n  if(previous&&previous!==p){closeGlobalModal();}`
);

const oldReleaseBusiness=`  if(previous&&previous!=="business"){releasePageDom(previous);releasePageData(previous,"business");}`;

if(!src.includes(oldReleaseBusiness)){
  throw new Error("v7.67.2: openBusiness release pattern changed");
}

src=src.replace(
  oldReleaseBusiness,
  `  // v7.67.2 preserve previous page data across Business navigation.\n  if(previous&&previous!=="business"){closeGlobalModal();}`
);

const oldFetch=`  if(!opts.skipFetch){
    if(p==="email"||p==="subscriptions") refreshEmailData({scope:p});
    if(p==="billing") Promise.all([refreshSubscription({quiet:true}),refreshBusinesses({quiet:true})]);
    if(p==="batches") refreshBatchData();
    if(p==="reconciliation") refreshReconciliation();
    if(p==="income") refreshIncome({quiet:true,withReconciliation:false});
  }`;

if(!src.includes(oldFetch)){
  throw new Error("v7.67.2: openPage fetch block changed");
}

src=src.replace(
  oldFetch,
  `  if(!opts.skipFetch){\n    // Show existing state immediately, refresh silently only when stale.\n    fastNavRefresh(p);\n  }`
);

const oldBusinessEnd=`  el("rangeSel").style.display="none";
  setBusinessTab(tab);
}`;

if(!src.includes(oldBusinessEnd)){
  throw new Error("v7.67.2: openBusiness ending changed");
}

src=src.replace(
  oldBusinessEnd,
  `  el("rangeSel").style.display="none";\n  setBusinessTab(tab);\n  if(!opts.soft&&previous==="business")fastNavHistory("business",{biz:tab});\n  fastNavRefresh("business");\n}`
);

/*
  Append only.
  There may be load(); plus v7.61/v7.62 runtime after it.
  We intentionally leave all of that untouched.
*/
src += "\n\n/* FAST_NAVIGATION_FINAL_COMPAT_V7_67_2_20260816 */\nwindow.addEventListener(\"popstate\",()=>{\n  const q=new URLSearchParams(location.search);\n  const raw=q.get(\"page\")||\"overview\";\n  const page=raw===\"reimburse\"?\"batches\":raw;\n\n  if(page===\"business\"){\n    const tab=q.get(\"biz\")||\"profile\";\n\n    openBusiness(\n      tab,\n      document.querySelector(`[data-biz=\"${tab}\"]`),\n      {\n        soft:true,\n        bypassSetup:true,\n        fastNav:true\n      }\n    );\n    return;\n  }\n\n  if(EXPENSE_DATA_PAGES.has(page)){\n    fastNavHydrateExpenseCache();\n  }\n\n  openPage(\n    page,\n    document.querySelector(`[data-p=\"${page}\"]`),\n    {\n      soft:true,\n      bypassSetup:true,\n      fastNav:true\n    }\n  );\n});\n\nwindow.dashboardFastNavReport=function(){\n  return {\n    version:\"FAST_NAVIGATION_FINAL_COMPAT_V7_67_2_20260816\",\n    page:currentPageKey(),\n    ttlMs:FAST_NAV_TTL_MS,\n    cache:[...FAST_NAV_LAST_FETCH.entries()].map(([key,at])=>({\n      key,\n      ageMs:Date.now()-at\n    })),\n    expenses:ALL.length,\n    batches:(BATCH_DATA.batches||[]).length,\n    income:(INCOME_DATA.records||[]).length\n  };\n};\n\n// Warm heavy views after initial load without touching load() implementation.\nsetTimeout(()=>{\n  try{\n    fastNavPrime(currentPageKey());\n  }catch(err){\n    console.debug(\"fast navigation warmup skipped\",err);\n  }\n},1800);\n";

fs.writeFileSync(file,src);

execFileSync(
  process.execPath,
  ["--check",file],
  {stdio:"inherit"}
);

const out=fs.readFileSync(file,"utf8");

for(const [ok,label] of [
  [out.includes(MARK),"marker"],
  [!out.includes("location.assign(routeUrl(next,extra))"),"hard navigation removed"],
  [out.includes("history.pushState"),"history pushState"],
  [out.includes("fastNavRefresh(p)"),"background refresh"],
  [out.includes("dashboardFastNavReport"),"runtime report"],
  [out.includes("preserve page DOM/data"),"page memory retention"]
]){
  if(!ok){
    throw new Error("v7.67.2 assertion failed: "+label);
  }
}

console.log("✅ "+MARK+" ready");
console.log("✅ Dashboard internal navigation no longer uses full-page reload");
console.log("✅ dashboard.js tail/load() placement is no longer assumed");
console.log("✅ previous page DOM/data remains in memory");
console.log("✅ page data uses 30-second stale-while-revalidate");
console.log("✅ heavy reimbursement/income pages warm after initial load");
console.log("✅ browser Back/Forward uses soft navigation");
