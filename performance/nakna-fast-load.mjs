/* NAKNA PERFORMANCE 1.2.0 — source transformation, not another DOM observer.
   Only patches verified accounting functions; unknown layouts stop the build. */
import vm from 'node:vm';
export const MARK = 'NAKNA_ACCOUNTING_DECOUPLED_BOOT_1_2';
export function replaceFunction(source, name, replacement) {
  const re = new RegExp(`^(?:async )?function ${name}\\([^\\n]*\\)\\{[\\s\\S]*?^\\}`, 'gm');
  const found = [...source.matchAll(re)];
  if (found.length !== 1) throw new Error(`Unsupported accounting source: expected one ${name} function, found ${found.length}`);
  return source.slice(0, found[0].index) + replacement + source.slice(found[0].index + found[0][0].length);
}
export const fastLoad = `async function load(){
  /* NAKNA_ACCOUNTING_DECOUPLED_BOOT_1_2 */
  if(!TENANT||!K){
    fatal("⚠️","<b>ลิงก์ไม่สมบูรณ์</b><br>กรุณาเปิดแดชบอร์ดจากปุ่มใน LINE");
    return;
  }
  const target=el("page-"+ROUTE_PAGE)?ROUTE_PAGE:"overview";
  const source=document.querySelector('[data-p="'+target+'"]');
  if(target==="business")openBusiness(ROUTE_BIZ,document.querySelector('[data-biz="'+ROUTE_BIZ+'"]'),{soft:true,bypassSetup:true});
  else openPage(target,source,{soft:true,skipFetch:true,bypassSetup:true});

  // Do not let Gmail/plan/business-directory reads become a readiness gate.
  // No fake empty data, connection state, permissions or cached balances are set here.
  const safe=(fn)=>Promise.resolve().then(fn).catch(()=>false);
  const settingsTask=safe(()=>refreshSettings());
  let primaryOk=false;
  try{
    if(EXPENSE_DATA_PAGES.has(target))primaryOk=await refreshData({initial:true});
    else if(target==="batches")primaryOk=await refreshBatchData({quiet:true});
    else if(target==="reconciliation")primaryOk=await refreshReconciliation({quiet:true});
    else if(target==="income")primaryOk=await refreshIncome({quiet:true,withReconciliation:false});
    else if(target==="email"||target==="subscriptions")primaryOk=await refreshEmailData({scope:target});
    else if(target==="billing")primaryOk=await refreshSubscription({quiet:true});
    else { renderLocalPage(target); primaryOk=true; }
    if(primaryOk===true)HAS_LOADED=true;
  }catch(error){
    console.warn("Nakna primary read failed",error?.name||"read_error");
    if(typeof showCoreDataUnavailable==="function")showCoreDataUnavailable("ยังอ่านข้อมูลไม่ได้ — กรุณากดลองโหลดอีกครั้ง");
    syncStatus("error","ยังอ่านข้อมูลไม่ได้");
  }finally{
    ROUTE_BOOTSTRAPPING=false;
    if(HAS_LOADED)startRealtime();
    if(primaryOk===false&&!DASH_AUTH_BLOCKED&&!DASH_SETUP_BLOCKED)scheduleDashboardRetry();
  }

  // Settings may finish later. Never show a setup wizard because a read timed out.
  void settingsTask.then(ok=>{
    if(ok!==true||DASH_AUTH_BLOCKED)return;
    try{
      renderOnboarding();applyWorkspaceBranding();
      if(currentPageKey()===target)renderCompanySetupGate({force:!companySetupState().ready});
    }catch(error){console.warn("Nakna settings render failed",error?.name||"render_error");}
  });

  // Limited secondary work, AFTER the primary read has settled. Neither load()
  // nor the navigation/realtime flag waits for this work to complete.
  if(!DASH_AUTH_BLOCKED){
    const jobs=[
      ()=>refreshBusinesses({quiet:true}),
      ()=>refreshWorkspaceLinks()
    ];
    if(target==="overview")jobs.unshift(()=>refreshSubscription({quiet:true}));
    if(target==="settings"||target==="email"||target==="subscriptions"){
      jobs.push(()=>refreshGoogleCoreStatus(),()=>refreshGmailConnectionStatus({retries:1}));
    }
    const run=async()=>{
      while(jobs.length&&!DASH_AUTH_BLOCKED){const job=jobs.shift();if(job)await safe(job);}
    };
    void Promise.all([run(),run()]);
  }
  if(QS.get("gmail")==="connected")void safe(()=>confirmGmailOAuthReturn());
  if((target==="email"||target==="subscriptions")&&primaryOk===true){
    const last=Date.parse(EMAIL_INFO.lastSyncAt||"");
    if(EMAIL_INFO.connected&&(!Number.isFinite(last)||Date.now()-last>10*60*1000))void safe(()=>syncGmail({manual:false}));
  }
}`;

export const planRefresh = `async function refreshSubscription({quiet=false}={}){
  /* NAKNA_PLAN_SUMMARY_1_2: summary is display-only; never sets PLAN_INFO/permissions. */
  const full=currentPageKey()==="billing";
  const view=full?"full":"summary";
  const key="naknaSubscriptionPending_"+view;
  if(refreshSubscription[key])return refreshSubscription[key];
  const task=(async()=>{
    const put=(id,text)=>{const n=el(id);if(n)n.textContent=text;};
    const retryState=()=>{
      put("betaPlanBadge","แพ็กเกจ");
      put("betaPlanTitle","ตรวจแพ็กเกจไม่สำเร็จ");
      put("betaPlanSub","ข้อมูลบัญชียังใช้งานได้ · เปิดหน้าแพ็กเกจเพื่อลองใหม่");
      if(full)put("billingUsageState","โหลดข้อมูลแพ็กเกจไม่สำเร็จ กรุณากดอัปเดต");
    };
    try{
      const u=apiUrl("/api/subscription")+"&view="+view+"&_="+Date.now();
      const res=await fetch(u,{cache:"no-store",headers:{accept:"application/json"}});
      const data=await res.json();
      if(!res.ok||data?.ok!==true)throw new Error("subscription_read_failed");
      if(full){
        if(data.summaryOnly===true)throw new Error("full_subscription_required");
        PLAN_INFO=data;renderSubscription();
      }else{
        // Compatible with an older backend returning a full snapshot as well.
        // Do NOT feed a summary lacking quota counters into billing rendering.
        if(!data.planName||typeof data.betaActive!=="boolean")throw new Error("invalid_plan_summary");
        if(currentPageKey()!=="billing"){
          const banner=el("betaPlanBanner");if(banner)banner.hidden=false;
          put("betaPlanBadge",data.betaActive?"ทดลองใช้ฟรี":String(data.planName));
          put("betaPlanTitle",data.betaActive?"ทดลองใช้ Business · เหลือ "+Number(data.daysRemaining||0)+" วัน":"แพ็กเกจ "+data.planName);
          put("betaPlanSub",data.betaActive?"ถึง "+planDate(data.trialEndsAt)+" · ดูโควตาและรายละเอียดในหน้าแพ็กเกจ":"ดูโควตาและรายละเอียดการใช้งานในหน้าแพ็กเกจ");
        }
      }
      return true;
    }catch(error){
      console.warn("Nakna subscription read failed",error?.name||"read_error");
      if(full||currentPageKey()!=="billing")retryState();
      return false;
    }
  })();
  refreshSubscription[key]=task;
  try{return await task;}finally{if(refreshSubscription[key]===task)delete refreshSubscription[key];}
}`;

export function patchFastLoad(source){
  if(source.includes(MARK))return source;
  if(!source.includes('async function load()')||!source.includes('async function refreshSubscription('))throw new Error('Unsupported dashboard source; no write');
  let out=replaceFunction(source,'load',fastLoad);
  out=replaceFunction(out,'refreshSubscription',planRefresh);
  if(/(?:const|let|var)\s+\w+\s*=\s*load\s*;/.test(out))throw new Error('Unexpected wrapper around load(); manual merge required');
  new vm.Script(out,{filename:'dashboard.js'});
  return out;
}
