import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {patchFastLoad,fastLoad,planRefresh,MARK} from '../performance/nakna-fast-load.mjs';
const old=`async function load(){
  const [settingsOk]=await Promise.all([refreshSettings()]);
  primaryOk=await refreshData({initial:true});
  ROUTE_BOOTSTRAPPING=false;
}
async function refreshSubscription({quiet=false}={}){
  return false;
}
`;
const wait=()=>new Promise(r=>setImmediate(r));
function fixture(target='overview'){
  const calls=[],nodes={};
  const get=id=>nodes[id]||(nodes[id]={textContent:'loading',hidden:false});
  const c={TENANT:'fixture-a',K:'test-key-only',ROUTE_PAGE:target,ROUTE_BIZ:'team',
    EXPENSE_DATA_PAGES:new Set(['overview','expenses','business','settings']),
    ROUTE_BOOTSTRAPPING:true,HAS_LOADED:false,DASH_AUTH_BLOCKED:false,DASH_SETUP_BLOCKED:false,
    EMAIL_INFO:{},PLAN_INFO:{existing:'do-not-clobber'},QS:new URLSearchParams(''),
    document:{querySelector:()=>null},el:get,currentPageKey:()=>target,
    console:{warn:()=>{}},apiUrl:p=>'https://fixture.test'+p+'?tenant=a&k=not-real',planDate:x=>x,
    refreshData:async()=>{calls.push('primary');return true;},refreshSettings:async()=>{calls.push('settings');return true;},
    refreshBusinesses:async()=>{calls.push('business');return true;},refreshWorkspaceLinks:async()=>{calls.push('workspace');return true;},
    refreshSubscription:async()=>{calls.push('plan');return true;},refreshGoogleCoreStatus:async()=>{calls.push('google');return true;},
    refreshGmailConnectionStatus:async()=>{calls.push('gmail');return true;},
    refreshBatchData:async()=>{calls.push('batches');return true;},refreshReconciliation:async()=>{calls.push('reconciliation');return true;},
    refreshIncome:async()=>{calls.push('income');return true;},refreshEmailData:async()=>{calls.push('email');return true;},
    openPage:()=>{},openBusiness:()=>{},fatal:()=>calls.push('fatal'),renderOnboarding:()=>calls.push('onboarding'),
    applyWorkspaceBranding:()=>{},renderCompanySetupGate:()=>calls.push('setup'),companySetupState:()=>({ready:true}),
    startRealtime:()=>calls.push('realtime'),scheduleDashboardRetry:()=>calls.push('retry'),
    renderLocalPage:()=>{},syncStatus:()=>{},showCoreDataUnavailable:()=>calls.push('readerror'),
    confirmGmailOAuthReturn:async()=>calls.push('oauthReturn'),syncGmail:async()=>calls.push('syncGmail'),
    renderSubscription:()=>calls.push('renderFull'),fetch:async()=>({ok:true,json:async()=>({ok:true})})};
  vm.createContext(c);vm.runInContext(fastLoad,c);return {c,calls,get};
}
test('patch works with original and 1.1 load anchors',()=>{const s=patchFastLoad(old);assert(s.includes(MARK));assert(!s.includes('primaryOk=await refreshData({initial:true});\n  ROUTE_BOOTSTRAPPING'));});
test('source patch idempotent',()=>{const s=patchFastLoad(old);assert.equal(patchFastLoad(s),s);});
test('unsupported source fails closed',()=>assert.throws(()=>patchFastLoad('async function load(){}'),/Unsupported/));
test('duplicate function definition stops build',()=>assert.throws(()=>patchFastLoad(old+old),/expected one/));
test('slow settings and optional APIs do not hold boot',async()=>{
  const {c,calls}=fixture();c.refreshSettings=()=>new Promise(()=>{});c.refreshBusinesses=()=>new Promise(()=>{});c.refreshSubscription=()=>new Promise(()=>{});
  await c.load();assert.equal(c.ROUTE_BOOTSTRAPPING,false);assert.equal(c.HAS_LOADED,true);assert(calls.includes('realtime'));
});
test('primary starts before optional metadata',async()=>{const {c,calls}=fixture();await c.load();await wait();assert(calls.indexOf('primary')<calls.indexOf('business'));assert(calls.indexOf('primary')<calls.indexOf('plan'));});
test('overview does not eagerly probe Gmail or Google or unopened ledgers',async()=>{const {c,calls}=fixture();await c.load();await wait();for(const x of ['gmail','google','batches','income','reconciliation'])assert(!calls.includes(x),x);});
test('secondary concurrency bounded at two',async()=>{const {c}=fixture();let running=0,max=0;const held=[];const fn=()=>{running++;max=Math.max(max,running);return new Promise(r=>held.push(()=>{running--;r(true);}));};c.refreshBusinesses=fn;c.refreshWorkspaceLinks=fn;c.refreshSubscription=fn;await c.load();await wait();assert.equal(max,2);while(held.length){held.shift()();await wait();}assert.equal(max,2);});
test('settings controls still get health checks',async()=>{const {c,calls}=fixture('settings');await c.load();await wait();assert(calls.includes('google'));assert(calls.includes('gmail'));});
test('missing credentials makes no data request',async()=>{const {c,calls}=fixture();c.K='';await c.load();assert.deepEqual(calls,['fatal']);});
test('401 blocking state remains blocked with no retry/fanout',async()=>{const {c,calls}=fixture();c.refreshData=async()=>{c.DASH_AUTH_BLOCKED=true;return false;};await c.load();await wait();for(const x of ['business','plan','retry','setup'])assert(!calls.includes(x));});
test('primary exception leaves boot and reports error',async()=>{const {c,calls}=fixture();c.refreshData=async()=>{throw Error('fixture');};await c.load();assert.equal(c.ROUTE_BOOTSTRAPPING,false);assert(calls.includes('readerror'));assert(calls.includes('retry'));});
test('failed settings never force setup wizard',async()=>{const {c,calls}=fixture();c.refreshSettings=async()=>false;await c.load();await wait();assert(!calls.includes('setup'));});
test('batches route only reads its primary endpoint',async()=>{const {c,calls}=fixture('batches');await c.load();assert(calls.includes('batches'));assert(!calls.includes('primary'));});
test('income route only reads income',async()=>{const {c,calls}=fixture('income');await c.load();assert(calls.includes('income'));assert(!calls.includes('primary'));});
test('existing OAuth return is preserved',async()=>{const {c,calls}=fixture();c.QS=new URLSearchParams('gmail=connected');await c.load();await wait();assert(calls.includes('oauthReturn'));});
function planFixture(target='overview'){
  const f=fixture(target);vm.runInContext(planRefresh,f.c);return f;
}
const summary={ok:true,summaryOnly:true,planName:'Pro',betaActive:false};
test('overview requests metadata-only, not full quota',async()=>{const {c}=planFixture();let url;c.fetch=async u=>{url=u;return {ok:true,json:async()=>summary};};await c.refreshSubscription();assert(url.includes('view=summary'));});
test('summary never overwrites full PLAN_INFO or calls billing renderer',async()=>{const {c,calls}=planFixture();const before=c.PLAN_INFO;c.fetch=async()=>({ok:true,json:async()=>summary});await c.refreshSubscription();assert.equal(c.PLAN_INFO,before);assert(!calls.includes('renderFull'));});
test('summary contains actual plan name on banner',async()=>{const {c,get}=planFixture();c.fetch=async()=>({ok:true,json:async()=>summary});await c.refreshSubscription();assert.equal(get('betaPlanTitle').textContent,'แพ็กเกจ Pro');});
test('billing requests full data and keeps quota renderer',async()=>{const {c,calls}=planFixture('billing');let url;c.fetch=async u=>{url=u;return {ok:true,json:async()=>({ok:true,usage:{documents:7}})};};await c.refreshSubscription();assert(url.includes('view=full'));assert.equal(c.PLAN_INFO.usage.documents,7);assert(calls.includes('renderFull'));});
test('billing rejects summary instead of displaying false zero',async()=>{const {c,calls}=planFixture('billing');c.fetch=async()=>({ok:true,json:async()=>summary});assert.equal(await c.refreshSubscription(),false);assert(!calls.includes('renderFull'));assert.equal(c.PLAN_INFO.existing,'do-not-clobber');});
test('plan failure exits loading even when quiet',async()=>{const {c,get}=planFixture();c.fetch=async()=>{throw Error('network');};assert.equal(await c.refreshSubscription({quiet:true}),false);assert(get('betaPlanTitle').textContent.includes('ไม่สำเร็จ'));});
test('simultaneous plan reads share in-flight work',async()=>{const {c}=planFixture();let count=0,done;c.fetch=()=>{count++;return new Promise(r=>done=()=>r({ok:true,json:async()=>summary}));};const a=c.refreshSubscription(),b=c.refreshSubscription();done();await Promise.all([a,b]);assert.equal(count,1);});
test('failed plan request is retryable and not cached',async()=>{const {c}=planFixture();let count=0;c.fetch=async()=>{count++;throw Error('offline');};await c.refreshSubscription();await c.refreshSubscription();assert.equal(count,2);});
test('return from full billing cannot be overwritten by late summary',async()=>{const {c,calls}=planFixture();let done;c.fetch=()=>new Promise(r=>done=()=>r({ok:true,json:async()=>summary}));const p=c.refreshSubscription();c.currentPageKey=()=> 'billing';done();await p;assert(!calls.includes('renderFull'));assert.equal(c.PLAN_INFO.existing,'do-not-clobber');});
test('no observer/persistent record cache/authorization shortcuts introduced',()=>{const text=fastLoad+planRefresh;for(const x of ['MutationObserver','localStorage','sessionStorage','ALL=[]','CONNECTED=true'])assert(!text.includes(x));});
