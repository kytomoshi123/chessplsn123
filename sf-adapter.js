// Подключение Stockfish (WASM) через Web Worker. Если файлов нет, сайт работает на встроенном движке.
// Положи рядом с index.html файлы stockfish-19-lite-single.js и stockfish-19-lite-single.wasm (см. README).
(function(g){
const FILES=['stockfish-19-lite-single.js','stockfish-18-lite-single.js','stockfish-17.1-lite-single.js','stockfish-16.1-lite-single.js','stockfish.js'];
const SF={on:false,file:'',W:null,q:Promise.resolve()};
const tryFile=f=>new Promise(res=>{let w;try{w=new Worker(f)}catch(e){return res(null)}
 const t=setTimeout(()=>{try{w.terminate()}catch(e){}res(null)},20000);
 w.onmessage=e=>{if(String(e.data).indexOf('uciok')>=0){clearTimeout(t);res(w)}};
 w.onerror=()=>{clearTimeout(t);res(null)};w.postMessage('uci');w.postMessage('setoption name Hash value 32')});
SF.init=async()=>{if(typeof Worker==='undefined'||typeof fetch==='undefined')return false;
 for(const f of g.SF_FILES||FILES){try{const r=await fetch(f,{method:'HEAD'});if(!r.ok)continue}catch(e){continue}
  const w=await tryFile(f);if(w){SF.W=w;SF.on=true;SF.file=f;return f}}return false};
function run(cmds,ms,stale){return SF.q=SF.q.then(()=>new Promise(res=>{if(stale&&stale())return res(null);
 const W=SF.W,L={};let done=false;const fin=v=>{if(done)return;done=true;SF.cur=null;clearTimeout(t1);clearTimeout(t2);res(v)};
 SF.cur=stale||null;const t1=setTimeout(()=>W.postMessage('stop'),ms+5000),t2=setTimeout(()=>fin([]),ms+12000);
 W.onmessage=e=>{const l=String(e.data);
  if(l.startsWith('info')&&l.indexOf(' pv ')>0&&!/lowerbound|upperbound/.test(l)){
   const mp=+((l.match(/multipv (\d+)/)||[0,1])[1]),d=+((l.match(/ depth (\d+)/)||[0,0])[1]),cp=l.match(/score cp (-?\d+)/),mt=l.match(/score mate (-?\d+)/),pv=l.match(/ pv (\S+)/);
   if(pv&&(cp||mt))L[mp]={u:pv[1],s:mt?(+mt[1]>0?30000-(+mt[1]):-30000-(+mt[1])):+cp[1],d}}
  else if(l.startsWith('bestmove'))fin(Object.keys(L).map(Number).sort((a,b)=>a-b).map(k=>L[k]))};
 cmds.forEach(c=>W.postMessage(c))})).catch(()=>[])}
// лучшие линии позиции (MultiPV): [{u:'e2e4', s:сантипешки с точки зрения ходящего, d:глубина}]
SF.analyze=(fen,o)=>run(['setoption name MultiPV value '+(o.mpv||3),'position fen '+fen,'go movetime '+(o.ms||500)],o.ms||500,o.stale);
// оценка одного заданного хода
SF.score=async(fen,u,ms)=>{const r=await run(['setoption name MultiPV value 1','position fen '+fen,'go movetime '+ms+' searchmoves '+u],ms);return r&&r.length?r[0].s:null};
SF.stopStale=()=>{if(SF.cur&&SF.cur()&&SF.W)SF.W.postMessage('stop')};
g.SF=SF;
})(typeof window!=='undefined'?window:globalThis);
