/* Read-only release check. No login URL, tenant key, cookies or accounting data are requested. */
const origin=new URL(process.argv[2]||'https://deal-dashboard.organization-23c.workers.dev').origin;
async function get(path){const u=new URL(path,origin);u.searchParams.set('release_check',String(Date.now()));const r=await fetch(u,{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`${path}: HTTP ${r.status}`);return r;}
try{
 const release=await (await get('/assets/nakna-accounting-release.json')).json();
 if(release.release!=='NAKNA-ACCOUNTING-RECOVERY-1.1.0')throw new Error('Wrong release / old deployment');
 const html=await (await get('/')).text();
 if(!html.includes('data-nk-brand="accounting"')||!html.includes('nkAccountingTheme')||!html.includes('nkAccountingNetwork'))throw new Error('HTML still missing the brand/network build');
 const js=await (await get('/assets/dashboard.js')).text();
 if(!js.includes('NAKNA_ACCOUNTING_PRIMARY_FIRST_1_1'))throw new Error('Old dashboard runtime is still served');
 const css=await (await get('/assets/nakna-accounting-brand.css')).text();
 if(!css.includes('NAKNA_ACCOUNTING_BRAND_1.1.0')||!css.includes('#04878a'))throw new Error('Wrong brand stylesheet');
 console.log('PASS public deployed HTML / JS / CSS / manifest all match Nakna Accounting Recovery 1.1.0');
 console.log('This confirms the release only, NOT authenticated accounting API performance.');
}catch(e){console.error('FAIL release verification:',e.message);process.exitCode=1;}
