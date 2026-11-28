// Подключение Stockfish (WASM) через Web Worker. Если файлов нет, сайт работает на встроенном движке.
// Положи рядом с index.html файлы stockfish-19-lite-single.js и stockfish-19-lite-single.wasm (см. README).
(function(g){
const FILES=['stockfish-19-lite-single.js','stockfish-18-lite-single.js','stockfish-17.1-lite-single.js','stockfish-16.1-lite-single.js','stockfish.js'];
const SF={on:false,file:'',W:null,q:Promise.resolve(),name:'',nps:0,fallbacks:0,status:{ok:false,msg:'Проверяю Stockfish…'}};
const tryFile=f=>new Promise(res=>{let w,name='';try{w=new Worker(f)}catch(e){return res({err:'браузер не создал воркер ('+(e&&e.message||e)+')'})}
 const t=setTimeout(()=>{try{w.terminate()}catch(e){}res({err:'движок не ответил за 20 секунд (рядом с .js должен лежать .wasm с тем же именем)'})},20000);
 w.onmessage=e=>{const l=String(e.data);if(l.indexOf('id name')===0)name=l.slice(8).trim();if(l.indexOf('uciok')>=0){clearTimeout(t);res({w,name})}};
 w.onerror=e=>{clearTimeout(t);res({err:'ошибка запуска воркера'+(e&&e.message?': '+e.message:'')})};w.postMessage('uci');w.postMessage('setoption name Hash value 32')});
// Нативный Stockfish через мост (bridge/bridge.js): HTTP-команды + поток событий; команды отправляются строго по очереди
function nativeWorker(base){return new Promise(res=>{let es;try{es=new EventSource(base+'/events')}catch(e){return res(null)}let q=Promise.resolve();
 const w={onmessage:null,postMessage(c){q=q.then(()=>fetch(base+'/cmd',{method:'POST',body:c})).catch(()=>{})},terminate(){es.close()}};
 const t=setTimeout(()=>{es.close();res(null)},4000);
 es.onmessage=e=>{if(w.onmessage)w.onmessage({data:e.data})};
 w.onmessage=e=>{if(String(e.data).indexOf('uciok')>=0){clearTimeout(t);w.onmessage=null;res(w)}};
 es.onopen=()=>w.postMessage('uci');es.onerror=()=>{}})}
SF.init=async()=>{const st=(ok,msg)=>{SF.status={ok,msg};return ok};
 if(typeof fetch==='undefined')return st(false,'Браузер не поддерживает fetch');
 const loc=typeof location!=='undefined'?location:{hostname:'',origin:'',protocol:''},local=loc.hostname==='localhost'||loc.hostname==='127.0.0.1';
 if(loc.protocol==='file:')return st(false,'Страница открыта как файл (file://): браузер не запускает Stockfish. Загрузи сайт на GitHub Pages или запусти в папке сайта «python3 -m http.server» и открой http://localhost:8000.');
 let opt=false;try{opt=localStorage.getItem('cp-native')==='1'}catch(e){}
 if((local||opt||g.SF_BRIDGE)&&typeof EventSource!=='undefined'){const base=g.SF_BRIDGE||(local?loc.origin:'http://127.0.0.1:8765');
  try{const c=new AbortController(),t=setTimeout(()=>c.abort(),800),r=await fetch(base+'/ping',{signal:c.signal});clearTimeout(t);
   if(r.ok&&/chessplan-bridge/.test(await r.text())){const w=await nativeWorker(base);if(w){SF.W=w;SF.on=true;SF.native=true;SF.file='native';SF.name='Stockfish (нативный)';st(true,'Работает нативный Stockfish через мост');return'native'}}}catch(e){}}
 if(typeof Worker==='undefined')return st(false,'Браузер не поддерживает Web Worker');
 let notFound=false,netErr=false,wErr='';
 for(const f of g.SF_FILES||FILES){let r;try{r=await fetch(f,{method:'HEAD'})}catch(e){netErr=true;continue}if(!r.ok){notFound=true;continue}
  const o=await tryFile(f);if(o.w){SF.W=o.w;SF.on=true;SF.file=f;SF.name=o.name||'Stockfish';st(true,'Работает '+SF.name+' (файл '+f+')');return f}wErr=o.err}
 return st(false,wErr?'Stockfish не запустился: '+wErr:notFound?'Файлы Stockfish не найдены рядом с index.html: нужны stockfish-19-lite-single.js и stockfish-19-lite-single.wasm в той же папке на хостинге.':netErr?'Не удалось запросить файлы Stockfish (проверь, что сайт открыт по http/https).':'Stockfish не найден')};
function run(cmds,ms,stale){return SF.q=SF.q.then(()=>new Promise(res=>{if(stale&&stale())return res(null);
 const W=SF.W,L={};let done=false;const fin=v=>{if(done)return;done=true;SF.cur=null;clearTimeout(t1);clearTimeout(t2);res(v)};
 SF.cur=stale||null;const t1=setTimeout(()=>W.postMessage('stop'),ms+5000),t2=setTimeout(()=>fin([]),ms+12000);
 W.onmessage=e=>{const l=String(e.data);
  if(l.startsWith('info')){const np=l.match(/ nps (\d+)/);if(np)SF.nps=+np[1]}
  if(l.startsWith('info')&&l.indexOf(' pv ')>0&&!/lowerbound|upperbound/.test(l)){
   const mp=+((l.match(/multipv (\d+)/)||[0,1])[1]),d=+((l.match(/ depth (\d+)/)||[0,0])[1]),cp=l.match(/score cp (-?\d+)/),mt=l.match(/score mate (-?\d+)/),pv=l.match(/ pv (\S+)/);
   if(pv&&(cp||mt))L[mp]={u:pv[1],s:mt?(+mt[1]>0?30000-(+mt[1]):-30000-(+mt[1])):+cp[1],d}}
  else if(l.startsWith('bestmove'))fin(Object.keys(L).map(Number).sort((a,b)=>a-b).map(k=>L[k]))};
 cmds.forEach(c=>W.postMessage(c))})).catch(()=>[])}
// лучшие линии позиции (MultiPV): [{u:'e2e4', s:сантипешки с точки зрения ходящего, d:глубина}]
SF.analyze=(fen,o)=>run(['setoption name MultiPV value '+(o.mpv||3),'position fen '+fen,'go '+(o.dep?'depth '+o.dep+' ':'')+'movetime '+(o.ms||500)],o.ms||500,o.stale);
// оценка одного заданного хода
SF.score=async(fen,u,ms)=>{const r=await run(['setoption name MultiPV value 1','position fen '+fen,'go movetime '+ms+' searchmoves '+u],ms);return r&&r.length?r[0].s:null};
// Проверка: короткий поиск из начальной позиции, чтобы убедиться, что Stockfish отвечает
SF.test=async()=>{if(!SF.on)return{ok:false,msg:SF.status.msg};const t=Date.now(),L=await SF.analyze('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',{mpv:1,ms:800});
 return L&&L.length?{ok:true,name:SF.name,depth:L[0].d,best:L[0].u,ms:Date.now()-t,nps:SF.nps}:{ok:false,msg:'Stockfish запущен, но не вернул ходов'}};
SF.stopStale=()=>{if(SF.cur&&SF.cur()&&SF.W)SF.W.postMessage('stop')};
g.SF=SF;
})(typeof window!=='undefined'?window:globalThis);
