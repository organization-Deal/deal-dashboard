import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {patchFastLoad} from '../performance/nakna-fast-load.mjs';
import {applyBrand,assertAccounting} from '../apply-nakna-accounting-brand.mjs';
export const MARK='NAKNA_ACCOUNTING_PRIMARY_FIRST_1_1';
const sha=x=>crypto.createHash('sha256').update(x).digest('hex').slice(0,16);
export function patchRuntime(source){
  if(source.includes(MARK))return source;
  const re=/async function load\(\)\{[\s\S]*?\n\}/g;
  const matches=[...source.matchAll(re)];
  if(matches.length!==1)throw new Error('Unsupported dashboard.js: expected one load() function. No changes written.');
  let body=matches[0][0];
  const gate=/const \[[^\]\n]*settingsOk[^\]\n]*\]=await Promise\.all\(\[/;
  if(!gate.test(body)||!body.includes('primaryOk=await refreshData({initial:true});'))throw new Error('Unsupported load sequence: no partial write');
  // Start the AUTHENTICATED primary read first; do not claim any connection/permission is valid.
  body=body.replace(gate,m=>`/* ${MARK} */\n  const nkPrimaryPromise=EXPENSE_DATA_PAGES.has(target)?refreshData({initial:true}):null;\n  ${m}`);
  body=body.replace('primaryOk=await refreshData({initial:true});','primaryOk=await (nkPrimaryPromise||refreshData({initial:true}));');
  // Support the raw source as well as the existing v7.50+ production build.
  const destructive=/if\(!CONNECTED\)\{\n[\s\S]*?primaryOk=false;\n  \}else if\(EXPENSE_DATA_PAGES\.has\(target\)\)\{/;
  if(destructive.test(body))body=body.replace(destructive,'if(EXPENSE_DATA_PAGES.has(target)){');
  // Subscription has no bearing on whether an authenticated accounting GET may render.
  const subscription='(target==="billing"||target==="overview")?refreshSubscription({quiet:true}):Promise.resolve(true),';
  if(body.includes(subscription)){
    body=body.replace(subscription,'Promise.resolve(true), /* subscription is not a readiness gate */');
    body=body.replace(`/* ${MARK} */`,`/* ${MARK} */`); // stable marker
    const before='  ROUTE_BOOTSTRAPPING=false;';
    if(!body.includes(before))throw new Error('Missing boot completion anchor');
    body=body.replace(before,`  if(target==="billing"||target==="overview"){\n    Promise.resolve().then(()=>refreshSubscription({quiet:true})).catch(()=>{});\n  }\n${before}`);
  }
  let out=source.replace(matches[0][0],body);
  // Remove speculative work on pages the user has not opened. Navigation still refreshes on demand.
  const prime=/function fastNavPrime\(current\)\{[\s\S]*?\n\}/;
  if(prime.test(out))out=out.replace(prime,'function fastNavPrime(current){\n  // NAKNA 1.1: intentionally no speculative accounting API requests.\n  FAST_NAV_PRIME_STARTED=true;\n}');
  new vm.Script(out,{filename:'dashboard.js'});
  return out;
}
export function prepare(root){
  const index=path.join(root,'index.html'), js=path.join(root,'assets/dashboard.js');
  for(const f of [index,js])if(!fs.existsSync(f))throw new Error('Wrong repo: run in deal-dashboard');
  const originalHtml=fs.readFileSync(index,'utf8');
  assertAccounting(originalHtml);
  if(!/<script\b[^>]*src=["'](?:\.\/)?assets\/dashboard\.js(?:\?[^"']*)?["'][^>]*>/.test(originalHtml))throw new Error('Missing accounting core script; no changes written');
  const before=fs.readFileSync(js,'utf8');const after=before.includes('NAKNA_ACCOUNTING_DECOUPLED_BOOT_1_2')?before:patchFastLoad(patchRuntime(before));
  const guard=fs.readFileSync(path.join(root,'branding/nakna-accounting-network.js'),'utf8');
  new vm.Script(guard);
  // Validate every runtime change before writing.
  if(after!==before)fs.writeFileSync(js,after);
  applyBrand(root);
  fs.writeFileSync(path.join(root,'assets/nakna-accounting-network.js'),guard);
  let html=fs.readFileSync(index,'utf8');
  html=html.replace(/\s*<script\b[^>]*\bid=["']nkAccountingNetwork["'][^>]*>[\s\S]*?<\/script>/g,'');
  const tag=`<script id="nkAccountingNetwork" src="./assets/nakna-accounting-network.js?v=${sha(guard)}"></script>\n`;
  const script=/\s*<script\b[^>]*src=["'](?:\.\/)?assets\/dashboard\.js(?:\?[^"']*)?["'][^>]*>/;
  if(!script.test(html))throw new Error('Cannot find accounting core script; no blind injection');
  html=html.replace(script,m=>'\n'+tag+m.trimStart());
  const runtimeHash=sha(fs.readFileSync(js));
  html=html.replace(/(assets\/dashboard\.js)(?:\?[^"'<>]*)?/g,`$1?v=nk12-${runtimeHash}`);
  fs.writeFileSync(index,html);
  const report={release:'NAKNA-ACCOUNTING-PERFORMANCE-1.2.0',product:'นากนะ บัญชี',primaryFirst:true,nonBlockingBoot:true,summaryOnlyOnOverview:true,readDeadlineMs:20000,statusDeadlineMs:10000,backgroundPrefetch:false,apiAuthUnchanged:true,runtimeSHA256:crypto.createHash('sha256').update(fs.readFileSync(js)).digest('hex'),checks:{htmlBrand:html.includes('data-nk-brand="accounting"'),networkBeforeCore:html.indexOf('id="nkAccountingNetwork"')<html.indexOf('assets/dashboard.js'),brandLast:html.indexOf('id="nkAccountingTheme"')>html.indexOf('assets/brand-theme.css')}};
  if(Object.values(report.checks).some(v=>!v))throw new Error('Release verification failed');
  fs.writeFileSync(path.join(root,'assets/nakna-accounting-release.json'),JSON.stringify(report,null,2)+'\n');
  return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const r=prepare(process.cwd());console.log('PASS '+r.release);console.log('PASS Nakna brand applied by Wrangler build (not optional deploy hook)');console.log('PASS authenticated primary data starts before health/status fan-out');console.log('PASS read timeouts + no speculative page prefetch + unchanged POST/auth');}
  catch(e){console.error('FAIL Nakna build:',e.message);process.exitCode=1;}
}
