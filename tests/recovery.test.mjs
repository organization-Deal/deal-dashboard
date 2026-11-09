import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {patchRuntime,prepare,MARK} from '../scripts/prepare-nakna-accounting-release.mjs';
import {brandHtml,RELEASE} from '../apply-nakna-accounting-brand.mjs';
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// The boot anchors below are copied from the inspected accounting core. No tenant data.
const loadFixture=`async function load(){
  if(!TENANT||!K){fatal('missing');return;}
  const target='overview';
  const [googleOk,settingsOk,businessOk,workspaceOk,gmailOk]=await Promise.all([refreshGoogleCoreStatus(),
    refreshSettings(),
    refreshBusinesses({quiet:true}),
    refreshWorkspaceLinks(),
    refreshGmailConnectionStatus({retries:1}),
    (target==="billing"||target==="overview")?refreshSubscription({quiet:true}):Promise.resolve(true),
  ]);
  let primaryOk=true;
  if(EXPENSE_DATA_PAGES.has(target)){
    primaryOk=await refreshData({initial:true});
  }
  ROUTE_BOOTSTRAPPING=false;
}
function fastNavPrime(current){
  if(current!=='batches')setTimeout(()=>fastNavRefresh('batches'),1400);
}
`;
const html=`<!doctype html><html lang="th"><head><title>Dashboard · ภาพรวมการเงิน</title><link rel="stylesheet" href="./assets/brand-theme.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai"></head><body><div class="app"><aside class="sidebar"><span id="businessSwitcherName">Company untouched</span></aside><main class="main"><div id="page-batches"></div><div id="page-overview"></div></main></div><script src="./assets/dashboard.js?v=old"></script></body></html>`;
test('load primary starts before all health probes',async()=>{
  const events=[];let resolveHealth;
  const health=new Promise(r=>resolveHealth=r);
  const ctx={TENANT:'fixture',K:'secret-not-logged',EXPENSE_DATA_PAGES:new Set(['overview']),ROUTE_BOOTSTRAPPING:true,FAST_NAV_PRIME_STARTED:false,
    refreshData:async()=>{events.push('primary');return true;},refreshGoogleCoreStatus:()=>{events.push('health');return health;},refreshSettings:async()=>true,refreshBusinesses:async()=>true,refreshWorkspaceLinks:async()=>true,refreshGmailConnectionStatus:async()=>true,refreshSubscription:async()=>{events.push('subscription');return true;},fatal:()=>{events.push('fatal');},setTimeout};
  vm.createContext(ctx);vm.runInContext(patchRuntime(loadFixture),ctx);
  const task=ctx.load();await Promise.resolve();assert.deepEqual(events,['primary','health']);
  resolveHealth(true);await task;await Promise.resolve();assert.equal(events.at(-1),'subscription');
});
test('no credentials => no primary read',async()=>{
  let hits=0;const c={TENANT:'',K:'',fatal:()=>hits++};vm.createContext(c);vm.runInContext(patchRuntime(loadFixture),c);await c.load();assert.equal(hits,1);
});
test('patch is idempotent',()=>{const first=patchRuntime(loadFixture);assert.equal(patchRuntime(first),first);});
test('no background fetch of unopened pages',()=>{const s=patchRuntime(loadFixture);assert(!s.includes("fastNavRefresh('batches')"));assert(s.includes('FAST_NAV_PRIME_STARTED=true'));});
test('unknown core fails instead of altering source',()=>assert.throws(()=>patchRuntime('async function load(){\n}\n'),/Unsupported/));
test('raw legacy disconnected gate does not turn failed data to zero',()=>{
  const src=loadFixture.replace('if(EXPENSE_DATA_PAGES.has(target)){','if(!CONNECTED){\n    ALL=[];HAS_LOADED=true;\n    primaryOk=false;\n  }else if(EXPENSE_DATA_PAGES.has(target)){');
  const out=patchRuntime(src);assert(!out.includes('ALL=[]'));assert(out.includes('nkPrimaryPromise'));
});
test('brand changes product not company and deduplicates fonts',()=>{const h=brandHtml(html,'hash');assert(h.includes('Company untouched'));assert(h.includes('นากนะ บัญชี'));assert.equal((h.match(/fonts\.googleapis\.com/g)||[]).length,1);assert.equal(brandHtml(h,'hash'),h);});
test('complete build hooks theme last and network before core',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nakna-'));fs.mkdirSync(path.join(dir,'assets'));fs.cpSync(path.join(root,'branding'),path.join(dir,'branding'),{recursive:true});fs.writeFileSync(path.join(dir,'index.html'),html);fs.writeFileSync(path.join(dir,'assets/dashboard.js'),loadFixture);
  const a=prepare(dir);assert.equal(a.checks.networkBeforeCore,true);assert.equal(a.checks.brandLast,true);const first=fs.readFileSync(path.join(dir,'index.html'),'utf8');prepare(dir);assert.equal(fs.readFileSync(path.join(dir,'index.html'),'utf8'),first);fs.rmSync(dir,{recursive:true});
});
const netSrc=fs.readFileSync(path.join(root,'branding/nakna-accounting-network.js'),'utf8');
function network(fetcher,overrides={}){
  const timers=new Set();
  const w={fetch:fetcher,location:{href:'https://deal-dashboard.organization-23c.workers.dev/?tenant=t&k=k',search:'?tenant=t&k=k'},__NK_NETWORK_TEST_DELAYS__:{read:35,status:20,slow:15,boot:5000,...overrides},document:{body:null,getElementById:()=>null}};
  const c={window:w,URL,URLSearchParams,Headers,Response,AbortController,DOMException,console,structuredClone,Date,Map,Set,Promise,setTimeout:(f,t)=>{const v=setTimeout(f,t);timers.add(v);return v;},clearTimeout:t=>{timers.delete(t);clearTimeout(t);}};
  vm.runInNewContext(netSrc,c);return {w,close:()=>{for(const t of timers)clearTimeout(t);}};
}
const base='https://accoutingsuppor02.organization-23c.workers.dev/api/expenses?tenant=t&k=k';
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});}
test('GET duplicate in-flight data request shared; responses independently readable',async()=>{
  let calls=0;const n=network(async()=>{calls++;await new Promise(r=>setTimeout(r,5));return json([{amount:10}]);});
  try{const [a,b]=await Promise.all([n.w.fetch(base+'&_=1'),n.w.fetch(base+'&_=2')]);assert.equal(calls,1);assert.deepEqual(await a.json(),[{amount:10}]);assert.deepEqual(await b.json(),[{amount:10}]);}finally{n.close();}
});
test('a completed request is NOT cached',async()=>{let calls=0;const n=network(async()=>{calls++;return json([]);});try{await n.w.fetch(base);await n.w.fetch(base);assert.equal(calls,2);}finally{n.close();}});
test('different tenant/auth cannot share response',async()=>{let calls=0;const n=network(async()=>{calls++;return json([]);});try{await Promise.all([n.w.fetch(base),n.w.fetch(base.replace('tenant=t','tenant=other')),n.w.fetch(base.replace('k=k','k=other'))]);assert.equal(calls,3);}finally{n.close();}});
test('POST is not retried, deduplicated or given a read deadline',async()=>{let calls=0,signal;const n=network(async(_u,o)=>{calls++;signal=o.signal;return json({ok:true});});try{await Promise.all([n.w.fetch(base,{method:'POST',body:'x'}),n.w.fetch(base,{method:'POST',body:'x'})]);assert.equal(calls,2);assert.equal(signal,undefined);}finally{n.close();}});
test('external fetch is unchanged',async()=>{let seen;const fn=async(u,o)=>{seen=o;return json([]);};const n=network(fn);try{const opts={headers:{x:'original'}};await n.w.fetch('https://example.com/api/expenses',opts);assert.equal(seen,opts);}finally{n.close();}});
test('401 and 403 are not converted to success',async()=>{for(const status of [401,403]){const n=network(async()=>json({error:'unauthorized'},status));try{const r=await n.w.fetch(base);assert.equal(r.status,status);}finally{n.close();}}});
test('429 returned unchanged, no immediate retry',async()=>{let calls=0;const n=network(async()=>{calls++;return json({error:'rate_limit'},429);});try{const r=await n.w.fetch(base);assert.equal(r.status,429);assert.equal(calls,1);}finally{n.close();}});
test('read timeout is finite even if transport ignores AbortSignal',async()=>{const n=network(()=>new Promise(()=>{}));try{await assert.rejects(n.w.fetch(base),/NAKNA_READ_TIMEOUT/);}finally{n.close();}});
test('deadline includes a stalled JSON body',async()=>{const n=network(async()=>new Response(new ReadableStream({start(){}}),{headers:{'content-type':'application/json'}}));try{await assert.rejects(n.w.fetch(base),/NAKNA_READ_TIMEOUT/);}finally{n.close();}});
test('reports never contain tenant key or signed URL',async()=>{const n=network(async()=>json([]));try{await n.w.fetch(base);const report=JSON.stringify(n.w.__NAKNA_ACCOUNTING_NETWORK__.report());assert(!report.includes('tenant='));assert(!report.includes('k=k'));assert(!report.includes('https://'));}finally{n.close();}});
test('AbortSignal remains respected',async()=>{const n=network(async(_u,o)=>new Promise((_r,reject)=>o.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))));try{const c=new AbortController();const p=n.w.fetch(base,{signal:c.signal});c.abort();await assert.rejects(p,/Aborted/);}finally{n.close();}});
test('guard contains no observer, persistent cache or repeating timer',()=>{assert(!netSrc.includes('MutationObserver'));assert(!netSrc.includes('setInterval'));assert(!netSrc.includes('localStorage'));});
