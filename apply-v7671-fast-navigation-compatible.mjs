import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root=process.cwd();
const file=path.join(root,"assets","dashboard.js");
const MARK="FAST_NAVIGATION_COMPAT_V7_67_1_20260816";
if(!fs.existsSync(file))throw new Error("ไม่พบ assets/dashboard.js");
let src=fs.readFileSync(file,"utf8");
if(src.includes(MARK)){
  console.log("✅ "+MARK+" already applied");
  process.exit(0);
}

const oldHard=`function hardNavigate(page,extra={}){
  const next=page==="reimburse"?"batches":page;
  const current=currentPageKey();
  if(next===current && (!extra.biz || extra.biz===BUSINESS_TAB))return false;
  location.assign(routeUrl(next,extra));
  return true;
}`;
if(!src.includes(oldHard))throw new Error("v7.67.1: hardNavigate pattern changed");
src=src.replace(oldHard,"const FAST_NAV_TTL_MS=30000;\nconst FAST_NAV_LAST_FETCH=new Map();\nlet FAST_NAV_PRIME_STARTED=false;\n\nfunction fastNavKey(page){\n  if(EXPENSE_DATA_PAGES.has(page))return \"expense-core\";\n  if(page===\"email\"||page===\"subscriptions\")return \"email\";\n  return page;\n}\nfunction fastNavFresh(page){\n  const at=Number(FAST_NAV_LAST_FETCH.get(fastNavKey(page))||0);\n  return at>0&&(Date.now()-at)<FAST_NAV_TTL_MS;\n}\nasync function fastNavRefresh(page,{force=false}={}){\n  const p=page===\"reimburse\"?\"batches\":page;\n  if(!navigator.onLine||DASH_AUTH_BLOCKED)return false;\n  if(!force&&fastNavFresh(p))return true;\n  const key=fastNavKey(p);\n  FAST_NAV_LAST_FETCH.set(key,Date.now());\n  try{\n    let ok=true;\n    if(EXPENSE_DATA_PAGES.has(p))ok=await refreshData({manual:false});\n    else if(p===\"batches\")ok=await refreshBatchData({quiet:true});\n    else if(p===\"reconciliation\")ok=await refreshReconciliation({quiet:true});\n    else if(p===\"income\")ok=await refreshIncome({quiet:true,withReconciliation:false});\n    else if(p===\"email\"||p===\"subscriptions\")ok=await refreshEmailData({scope:p});\n    else if(p===\"billing\"){\n      const result=await Promise.all([\n        refreshSubscription({quiet:true}),\n        refreshBusinesses({quiet:true})\n      ]);\n      ok=result.every(x=>x!==false);\n    }\n    if(ok===false){FAST_NAV_LAST_FETCH.delete(key);return false;}\n    FAST_NAV_LAST_FETCH.set(key,Date.now());\n    return true;\n  }catch(err){\n    FAST_NAV_LAST_FETCH.delete(key);\n    console.debug(\"fast navigation background refresh skipped\",p,err);\n    return false;\n  }\n}\nfunction fastNavHydrateExpenseCache(){\n  if(ALL.length)return false;\n  const cached=loadDashboardCache();\n  if(!cached?.rows?.length)return false;\n  ALL=cached.rows;\n  LAST_SIGNATURE=rowsSignature(ALL);\n  try{drawAll();}catch(err){console.debug(\"fast cache render skipped\",err);}\n  return true;\n}\nfunction fastNavPrime(current){\n  if(FAST_NAV_PRIME_STARTED||document.hidden||!navigator.onLine)return;\n  FAST_NAV_PRIME_STARTED=true;\n  if(current!==\"batches\")setTimeout(()=>fastNavRefresh(\"batches\"),1200);\n  if(current!==\"income\")setTimeout(()=>fastNavRefresh(\"income\"),2600);\n}\nfunction fastNavHistory(page,extra={}){\n  try{history.pushState({dashboard:true,page,biz:extra.biz||\"\"},\"\",routeUrl(page,extra));}\n  catch(err){console.debug(\"history update skipped\",err);}\n}\n\nfunction hardNavigate(page,extra={}){\n  const next=page===\"reimburse\"?\"batches\":page;\n  const current=currentPageKey();\n  if(next===current && (!extra.biz || extra.biz===BUSINESS_TAB))return false;\n  fastNavHistory(next,extra);\n  if(next===\"business\"){\n    const tab=extra.biz||BUSINESS_TAB||\"profile\";\n    openBusiness(tab,document.querySelector(`[data-biz=\"${tab}\"]`),{soft:true,bypassSetup:true,fastNav:true});\n  }else{\n    if(EXPENSE_DATA_PAGES.has(next))fastNavHydrateExpenseCache();\n    openPage(next,document.querySelector(`[data-p=\"${next}\"]`),{soft:true,bypassSetup:true,fastNav:true});\n  }\n  return true;\n}");

const oldReleasePage=`  if(previous&&previous!==p){releasePageDom(previous);releasePageData(previous,p);}`;
if(!src.includes(oldReleasePage))throw new Error("v7.67.1: openPage release pattern changed");
src=src.replace(oldReleasePage,`  // v7.67.1 keep previous page DOM/data for instant return.\n  if(previous&&previous!==p){closeGlobalModal();}`);

const oldReleaseBusiness=`  if(previous&&previous!=="business"){releasePageDom(previous);releasePageData(previous,"business");}`;
if(!src.includes(oldReleaseBusiness))throw new Error("v7.67.1: openBusiness release pattern changed");
src=src.replace(oldReleaseBusiness,`  // v7.67.1 preserve the previous page cache.\n  if(previous&&previous!=="business"){closeGlobalModal();}`);

const oldFetch=`  if(!opts.skipFetch){
    if(p==="email"||p==="subscriptions") refreshEmailData({scope:p});
    if(p==="billing") Promise.all([refreshSubscription({quiet:true}),refreshBusinesses({quiet:true})]);
    if(p==="batches") refreshBatchData();
    if(p==="reconciliation") refreshReconciliation();
    if(p==="income") refreshIncome({quiet:true,withReconciliation:false});
  }`;
if(!src.includes(oldFetch))throw new Error("v7.67.1: openPage fetch block changed");
src=src.replace(oldFetch,`  if(!opts.skipFetch){\n    // show cached state first, then quietly refresh if stale.\n    fastNavRefresh(p);\n  }`);

const oldBusinessEnd=`  el("rangeSel").style.display="none";
  setBusinessTab(tab);
}`;
if(!src.includes(oldBusinessEnd))throw new Error("v7.67.1: openBusiness ending changed");
src=src.replace(oldBusinessEnd,`  el("rangeSel").style.display="none";\n  setBusinessTab(tab);\n  if(!opts.soft&&previous==="business")fastNavHistory("business",{biz:tab});\n  fastNavRefresh("business");\n}`);

// Optional only: never fail the build if previous migrations changed load().
let subscriptionOptimization="skipped";
const subscriptionLine='    (target==="billing"||target==="overview")?refreshSubscription({quiet:true}):Promise.resolve(true),';
if(src.includes(subscriptionLine)){
  src=src.replace(subscriptionLine,'    // v7.67.1 subscription/package fetch removed from connection gate,');
  subscriptionOptimization="applied";
}

const loadEnd=`  if(HAS_LOADED)startRealtime();
  if(primaryOk===false&&!DASH_AUTH_BLOCKED&&!DASH_SETUP_BLOCKED)scheduleDashboardRetry();
}`;
if(src.includes(loadEnd)){
  src=src.replace(loadEnd,`  if(HAS_LOADED)startRealtime();\n  if(primaryOk===false&&!DASH_AUTH_BLOCKED&&!DASH_SETUP_BLOCKED)scheduleDashboardRetry();\n  fastNavPrime(target);\n}`);
}else{
  console.log("ℹ️ v7.67.1 load-end pattern changed; page prewarm skipped");
}

if(!src.endsWith("load();"))throw new Error("v7.67.1: dashboard.js no longer ends with load()");
src=src.slice(0,-"load();".length)+"// FAST_NAVIGATION_COMPAT_V7_67_1_20260816\nwindow.addEventListener(\"popstate\",()=>{\n  const q=new URLSearchParams(location.search);\n  const raw=q.get(\"page\")||\"overview\";\n  const page=raw===\"reimburse\"?\"batches\":raw;\n  if(page===\"business\"){\n    const tab=q.get(\"biz\")||\"profile\";\n    openBusiness(tab,document.querySelector(`[data-biz=\"${tab}\"]`),{soft:true,bypassSetup:true,fastNav:true});\n  }else{\n    if(EXPENSE_DATA_PAGES.has(page))fastNavHydrateExpenseCache();\n    openPage(page,document.querySelector(`[data-p=\"${page}\"]`),{soft:true,bypassSetup:true,fastNav:true});\n  }\n});\n\nwindow.dashboardFastNavReport=function(){\n  return {\n    version:\"FAST_NAVIGATION_COMPAT_V7_67_1_20260816\",\n    page:currentPageKey(),\n    ttlMs:FAST_NAV_TTL_MS,\n    cache:[...FAST_NAV_LAST_FETCH.entries()].map(([key,at])=>({key,ageMs:Date.now()-at})),\n    expenses:ALL.length,\n    batches:(BATCH_DATA.batches||[]).length,\n    income:(INCOME_DATA.records||[]).length\n  };\n};\n\nload();";

fs.writeFileSync(file,src);
execFileSync(process.execPath,["--check",file],{stdio:"inherit"});
const out=fs.readFileSync(file,"utf8");
for(const [ok,label] of [
  [out.includes(MARK),"marker"],
  [!out.includes("location.assign(routeUrl(next,extra))"),"hard reload removed"],
  [out.includes("history.pushState"),"soft history"],
  [out.includes("fastNavRefresh(p)"),"stale while revalidate"],
  [out.includes("dashboardFastNavReport"),"runtime report"],
  [out.includes("keep previous page DOM/data"),"page cache retention"]
])if(!ok)throw new Error("v7.67.1 assertion failed: "+label);

console.log("✅ "+MARK+" ready");
console.log("✅ Dashboard page switches use soft navigation instead of full reload");
console.log("✅ previous page DOM/data is retained in memory");
console.log("✅ page refresh uses 30-second stale-while-revalidate");
console.log("✅ load() compatibility guard enabled — changed earlier migrations cannot fail this build");
console.log("✅ optional subscription gate optimization: "+subscriptionOptimization);
console.log("✅ browser Back/Forward works with soft navigation");
