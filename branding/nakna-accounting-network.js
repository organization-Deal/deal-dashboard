/* NAKNA_ACCOUNTING_RECOVERY_1_1 — bounded READ requests, not an auth bypass.
   No persistent data cache, no automatic POST retries, no observers or polling. */
(function (win) {
  'use strict';
  if (win.__NAKNA_ACCOUNTING_NETWORK__) return;
  const nativeFetch = win.fetch.bind(win);
  const inFlight = new Map();
  const metrics = [];
  const apiOrigin = 'https://accoutingsuppor02.organization-23c.workers.dev';
  let hadPrimary = false, primaryOk = false, primaryPending = 0, slowTimer = null;
  const delays = Object.assign({read:20000, status:10000, slow:8000, boot:12000}, win.__NK_NETWORK_TEST_DELAYS__ || {});
  const statusPaths = new Set(['/api/google-status','/api/gmail-status','/api/subscription','/api/businesses','/api/workspace-links']);
  const primaryPaths = new Set(['/api/expenses','/api/batches','/api/reconciliation','/api/income']);
  const dedupPaths = new Set([...statusPaths, ...primaryPaths, '/api/settings']);
  function notice(title, detail, state) {
    if (!win.document?.body) return;
    let box = win.document.getElementById('nkAccountingLoadNotice');
    if (!box) {
      const main = win.document.querySelector('main,.main');
      if (!main) return;
      box = win.document.createElement('section');
      box.id = 'nkAccountingLoadNotice'; box.setAttribute('role','status'); box.setAttribute('aria-live','polite');
      const copy = win.document.createElement('div'); copy.className='nk-load-copy';
      copy.append(win.document.createElement('strong'),win.document.createElement('p'));
      const retry = win.document.createElement('button'); retry.type='button';retry.textContent='ลองโหลดอีกครั้ง';
      retry.addEventListener('click',()=>{
        const sync=win.document.getElementById('syncBtn');
        if(sync && !sync.disabled) sync.click(); else win.location.reload();
      });
      box.append(copy,retry);
      const head=main.querySelector('.head'); if(head)head.after(box);else main.prepend(box);
    }
    box.querySelector('strong').textContent=title;box.querySelector('p').textContent=detail;
    box.dataset.state=state;box.hidden=false;
  }
  function failure(path,status,reason) {
    if (!primaryPaths.has(path)) return;
    const label=status===401?'ลิงก์หมดอายุหรือไม่ได้รับอนุญาต':status===403?'ไม่มีสิทธิ์อ่านข้อมูลนี้':status===429?'ระบบต้นทางจำกัดการเรียกข้อมูลชั่วคราว':reason==='timeout'?'ข้อมูลบัญชีตอบช้ากว่าที่กำหนด':'ยังโหลดข้อมูลบัญชีไม่ได้';
    const detail=status===401||status===403?'เปิดลิงก์ใหม่จาก LINE หรือให้ผู้ดูแลตรวจสิทธิ์ ไม่ต้องเชื่อมธุรกิจซ้ำ':status===429?'หยุดกดซ้ำ แล้วลองโหลดใหม่ภายหลัง ข้อมูลที่เห็นอาจยังไม่ใช่ข้อมูลล่าสุด':'ข้อมูลที่เห็นอาจยังไม่ใช่ข้อมูลล่าสุด ระบบไม่ได้แทนยอดที่อ่านไม่สำเร็จด้วย 0';
    notice(label,detail,'error');
  }
  win.fetch=function(input,init){
    const options=init||{};
    let url;
    try{url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,win.location.href);}catch{return nativeFetch(input,init);}
    const method=String(options.method||(typeof input==='object'&&input.method)||'GET').toUpperCase();
    // Only inspect JSON read APIs on this accounting worker. Leave writes/uploads/OAuth/external calls untouched.
    if(method!=='GET'||url.origin!==apiOrigin||!url.pathname.startsWith('/api/'))return nativeFetch(input,init);
    const path=url.pathname;
    const headers=new Headers((typeof input==='object'&&input.headers)||{});
    new Headers(options.headers||{}).forEach((v,k)=>headers.set(k,v));
    const callerSignal=options.signal||((typeof input==='object'&&input)?input.signal:undefined);
    const normalized=new URL(url);normalized.searchParams.delete('_');normalized.searchParams.sort();
    // Key includes credentials and full tenant/auth query. Never log or persist this key.
    const key=JSON.stringify([normalized.href,[...headers.entries()].sort(),options.credentials||input?.credentials||'same-origin',options.mode||input?.mode||'cors',options.cache||'default']);
    const share=dedupPaths.has(path)&&!callerSignal&&!headers.has('range');
    if(share&&inFlight.has(key))return inFlight.get(key).then(r=>r.clone());
    const started=Date.now(),controller=new AbortController();let reason='',timer;
    const cancel=()=>controller.abort(callerSignal?.reason);
    const primary=primaryPaths.has(path);
    if(primary){
      hadPrimary=true;primaryPending++;
      if(!primaryOk&&!slowTimer)slowTimer=setTimeout(()=>notice('กำลังอ่านข้อมูลบัญชี','ระบบกำลังรอข้อมูลจากเซิร์ฟเวอร์ หากตอบช้าจะมีปุ่มลองใหม่ ไม่ต้องเชื่อมธุรกิจซ้ำ','loading'),delays.slow);
    }
    const work=(async()=>{
      if(callerSignal?.aborted){cancel();throw new DOMException('Aborted','AbortError');}
      callerSignal?.addEventListener('abort',cancel,{once:true});
      let rejectDeadline;
      const deadline=new Promise((_,reject)=>{rejectDeadline=reject;});
      timer=setTimeout(()=>{
        reason='timeout';controller.abort();const e=new Error('NAKNA_READ_TIMEOUT');e.name='TimeoutError';rejectDeadline(e);
      },statusPaths.has(path)?delays.status:delays.read);
      const read=(async()=>{
        const res=await nativeFetch(input,{...options,signal:controller.signal});
        const ct=res.headers.get('content-type')||'';
        if(!/application\/(?:[\w.+-]*\+)?json\b/i.test(ct))return res;
        // Include response-body time: fetch() alone resolves when only headers arrive.
        const body=await res.arrayBuffer();
        return new Response([204,205,304].includes(res.status)?null:body,{status:res.status,statusText:res.statusText,headers:res.headers});
      })();
      const res=await Promise.race([read,deadline]);
      metrics.push({path,status:res.status,ms:Date.now()-started});
      if(!res.ok)failure(path,res.status,'http');
      // HTTP 200 carrying an error/HTML must not be treated as valid expense data.
      if(path==='/api/expenses'&&res.ok){
        const data=await res.clone().json().catch(()=>null);
        if(Array.isArray(data)){primaryOk=true;const box=win.document?.getElementById('nkAccountingLoadNotice');if(box)box.hidden=true;}
        else failure(path,0,'payload');
      }
      return res;
    })().catch(err=>{
      metrics.push({path,status:0,ms:Date.now()-started,reason:reason||err.name||'read_error'});
      if(!callerSignal?.aborted)failure(path,0,reason);
      throw err;
    }).finally(()=>{
      clearTimeout(timer);callerSignal?.removeEventListener('abort',cancel);
      if(share)inFlight.delete(key);
      if(primary){primaryPending--;if(!primaryPending){clearTimeout(slowTimer);slowTimer=null;}}
      if(metrics.length>30)metrics.splice(0,metrics.length-30);
    });
    if(share)inFlight.set(key,work);
    return share?work.then(r=>r.clone()):work;
  };
  win.__NAKNA_ACCOUNTING_NETWORK__={release:'1.1.0',report:()=>metrics.map(x=>({...x}))};
  // Finite boot watchdog: no assumption that a stalled page is a network error.
  setTimeout(()=>{
    const q=new URLSearchParams(win.location.search);
    const page=q.get('page')||'overview';
    if(!hadPrimary&&['overview','expenses','batches','income','reconciliation'].includes(page)&&q.get('tenant')&&q.get('k')){
      notice('หน้าเว็บยังเริ่มโหลดข้อมูลไม่สำเร็จ','อาจเกิดจาก JavaScript หรือการโหลดไฟล์หน้าเว็บ ลองโหลดอีกครั้ง และตรวจเวอร์ชันที่ Deploy','error');
    }
  },delays.boot);
})(window);
