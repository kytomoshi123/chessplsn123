const LM=new Map();
const E=Eng,$=s=>document.querySelector(s),STD='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',ONLYK='4k3/8/8/8/8/8/8/4K3 w - - 0 1';
const G=Object.fromEntries(Object.entries({K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'}).map(([k,v])=>[k,v+'\uFE0E']));
const CLS={brilliant:{n:'Блестящий',d:'!! Корректная жертва фигуры, лучший или почти лучший ход. После неё позиция не плохая, а до хода не была абсолютно выигранной'},great:{n:'Отличный',d:'! Ход, кардинально влияющий на исход: единственный, спасающий позицию, или единственный правильный ответ'},best:{n:'Лучший',d:'★ Первая линия движка — самый точный ход'},excellent:{n:'Превосходный',d:'Почти как первая линия: потеря шансов менее 2%'},good:{n:'Хороший',d:'Крепкий, логичный ход, у движка были идеи точнее'},book:{n:'Книжный',d:'Ход из дебютной теории, точность не оценивается'},inaccuracy:{n:'Неточность',d:'?! Шансы на победу падают на 5–10%'},mistake:{n:'Ошибка',d:'? Шансы падают на 10–20%, упущено преимущество или отдана инициатива'},miss:{n:'Упущение',d:'✕ Соперник только что ошибся, а ты не использовал это и вернул игру в равное или худшее русло'},blunder:{n:'Зевок',d:'?? Потеря фигуры, пропущенный мат или выигрыш превращён в проигрыш: потеря шансов 20% и больше'}};
const ic=k=>CLS[k]&&typeof ICONS!=='undefined'&&ICONS[k]?`<img class="ic" src="${ICONS[k]}" alt="${CLS[k].n}" title="${CLS[k].n}">`:'';
const SK=[{n:'Слабая',t:.6,d:'Простые человеческие ходы без лишнего риска. Цель всё равно победа: ход не хуже лучшего более чем на полпешки, выигрыш не отдаётся.'},{n:'Нормальная',t:1,d:'Обычные сильные ходы, иногда практичные ловушки против слабых соперников.'},{n:'Сильная',t:1.6,d:'Идеальные ходы: всегда первая линия движка, расчёт глубже.'},{n:'Профессиональная',t:2.6,d:'Лучший ход с минимумом шансов у соперника: движок считает дольше и выбирает ход, после которого у соперника меньше всего хороших ответов.'}];
let skill=1,edit=false,pick=null,lastRev=null,autoRev=false,li=1,me='w',flip=false,hint=true,pos,leg=[],stack=[],hist=[],sans=[],keys=[],mi=[],hm=0,sf=STD,sel=null,msg='',tk=0,BM='',CACHE={},busy=false;
const L=()=>E.LV[li],idx=s=>'abcdefgh'.indexOf(s[0])+(8-s[1])*8,key=s=>s.b.map(c=>c||'.').join('')+s.t+s.c+s.e,CK=s=>li+'|'+skill+'|'+key(s);
const fmt=v=>Math.abs(v)>20000?'мат':(v>0?'+':'')+(v/100).toFixed(1);
const stdStart=()=>sf.split(' ').slice(0,4).join(' ')===STD.split(' ').slice(0,4).join(' '),BH=h=>stdStart()?h:['----'];
const lastK=()=>{const x=mi[mi.length-1];return x?x.k:''};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const copy=t=>{try{navigator.clipboard.writeText(t).catch(()=>prompt('Скопируй:',t))}catch(e){try{prompt('Скопируй:',t)}catch(_){}}};
const PEND={},ckey=(p,lvl,fr)=>CK(p)+(SF.on?'S':'')+(lvl?'r':'')+(fr<1?'f'+fr:'');
const peek=p=>CACHE[ckey(p,null,1)]||CACHE[ckey(p,null,.5)]||CACHE[ckey(p,null,.2)]||null;
async function analyzeAtA(p,hs,lvl,stale,frac){frac=frac||1;const k=ckey(p,lvl,frac);if(CACHE[k])return CACHE[k];
 if(PEND[k]){const x=await PEND[k];if(x)return x}
 const pr=(async()=>{
  const t0=Date.now(),l0=lvl||L(),t=lvl?1:SK[skill].t*frac,cap=lvl?4500:(l0.cap||4500),sdd=l0.sd?l0.sd+(lvl?0:skill===2?3:skill===3?6:0):0,l={...l0,sms:Math.max(100,Math.min(frac<.5&&!lvl?300:cap,Math.round(l0.sms*t))),ms:Math.max(40,Math.min(frac<.5&&!lvl?120:Math.min(cap,3000),Math.round(l0.ms*t))),mpv:Math.min(8,l0.mpv+(skill===3&&!lvl?2:0)),d:l0.d+(skill>=2&&!lvl?2:0)},b=Book.move(BH(hs),l.tier,l.bk),fen=E.toFen(p,0,1);let r=null,sfl=false,d=0;
  if(SF.on){const lines=await SF.analyze(fen,{ms:l.sms,mpv:l.mpv,dep:sdd,stale});if(lines===null||(stale&&stale()))return null;const L0=E.legal(p);
   r=lines.map(x=>({m:L0.find(y=>E.uci(y)===x.u),s:x.s})).filter(o=>o.m);d=lines.length?lines[0].d:0;sfl=r.length>0}
  if(!r||!r.length){if(SF.on){SF.fallbacks++;const e=$('#sfstat');if(e)e.textContent='Внимание: Stockfish включён, но '+SF.fallbacks+' раз не вернул ходы, использован встроенный движок.'}r=E.analyze(p,l);sfl=false}
  return CACHE[k]={r,book:b?b.mv:'',bname:b?b.name:'',sf:sfl,fen,d,frac,t:Date.now()-t0}})();
 PEND[k]=pr;try{return await pr}finally{delete PEND[k]}}
// Упреждающий расчёт: пока ты вводишь ходы, Stockfish заранее считает вероятные следующие позиции
let ptk=0;const PKEYS=new Set(),ADOPT=new Set();
function ponder(items,frac){if(!SF.on)return;const my=++ptk;PKEYS.clear();ADOPT.clear();const ks=items.map(it=>ckey(it.p,null,frac));ks.forEach(k=>PKEYS.add(k));
 (async()=>{for(let i=0;i<items.length;i++){if(my!==ptk)return;const k=ks[i];await analyzeAtA(items[i].p,items[i].h,null,()=>my!==ptk&&!ADOPT.has(k),frac)}})().catch(()=>{})}
// Оценка твоих и чужих ходов откладывается, пока не готова подсказка (чтобы не задерживать её)
const GQ=[];let flushing=false;
async function flushGrades(){if(flushing)return;flushing=true;try{while(GQ.length){const g=GQ.shift();await gradeOne(...g)}}finally{flushing=false}}
async function classifyA(p,m,info,isMe,prevK,hs,ms){let r=info.r;const u=E.uci(m);
 if(info.sf&&!r.some(o=>E.uci(o.m)===u)&&!(hs&&Book.isBook(BH(hs),u,L().tier,L().bk))){const s=await SF.score(info.fen,u,ms||Math.min(L().sms,500));if(s!==null)r=r.concat([{m,s}]).sort((x,y)=>y.s-x.s)}
if(!info.sf){const o=r.find(x=>E.uci(x.m)===u);if(o&&o.ub){const s=E.scoreMove(p,m,{ms:Math.max(150,L().ms*2),d:L().d+1});if(s!==null)r=r.map(x=>x===o?{...x,s,ub:false}:x).sort((x,y)=>y.s-x.s)}}
 return classify(p,m,{...info,r},isMe,prevK,hs)}
// Классификация хода: сравнивает ход с лучшим по движку (оценка с точки зрения ходящего)
// Classification V2 (Chess.com, Expected Points Model): ожидаемые очки зависят от оценки движка и рейтинга (k растёт с рейтингом).
const EPf=(cp,k)=>1/(1+Math.exp(-k*Math.max(-3000,Math.min(3000,cp))));
const catOf=ep=>ep>=0.70?2:ep<=0.30?0:1;                  // 2 выигрыш, 1 равно, 0 проигрыш
function classify(p,m,info,isMe,prevK,hs){const u=E.uci(m),r=info.r,l=L(),k=l.k,gen=l.tier<=1;
 if(hs&&Book.isBook(BH(hs),u,l.tier,l.bk))return{k:'book',loss:0,pl:0};
 if(!r||!r.length)return{k:'best',loss:0,pl:0};
 const i=r.findIndex(o=>E.uci(o.m)===u),sp=i>=0?r[i].s:r[0].s,loss=Math.max(0,r[0].s-sp),epB=EPf(r[0].s,k),epP=EPf(sp,k),pl=Math.max(0,(epB-epP)*100);
 const others=r.filter(o=>E.uci(o.m)!==u),alt=others[0],epA=alt?EPf(alt.s,k):null;let kls;
 if(i===0||pl<=0.1)kls='best';else if(pl<2)kls='excellent';else if(pl<5)kls='good';else if(pl<10)kls='inaccuracy';else if(pl<20)kls='mistake';else kls='blunder';
 if(kls==='best'||kls==='excellent'){
  // Блестящий: хорошая жертва фигуры; после неё не плохо; без неё позиция не была полностью выигранной (щедрее для новичков)
  const nonSac=others.find(o=>!E.sacked(p,o.m,gen?200:300)),epN=nonSac?EPf(nonSac.s,k):0;
  if(E.sacked(p,m,gen?200:300)&&epP>=(gen?0.40:0.45)&&epN<0.90)kls='brilliant';
  // Отличный: критичный ход (проигрыш→равно, равно→выигрыш или единственный хороший ход)
  else if(alt&&(catOf(epA)<catOf(epP)||epP-epA>=(gen?0.10:0.15)))kls='great';
 }
 // Упущение: соперник ошибся, выигрыш был доступен, а ход его не использовал
 if((prevK==='blunder'||prevK==='mistake')&&epB>=0.70&&epP<0.70&&pl>=5&&kls!=='blunder')kls='miss';
 return{k:kls,loss,pl}}
globalThis.CP={classify:(...x)=>classify(...x),EPf,drawFilter:(...x)=>drawFilter(...x),legalMoves:()=>leg,keys:()=>keys,keyOf:s=>key(s),pos:()=>pos};
function arrow(u,col,w,op){if(!u||u.length<4)return'';const p=i=>[(flip?7-(i&7):i&7)*10+5,(flip?7-(i>>3):i>>3)*10+5];
 const[x1,y1]=p(idx(u.slice(0,2))),[x2,y2]=p(idx(u.slice(2,4))),dx=Math.abs(x2-x1)/10,dy=Math.abs(y2-y1)/10,hl=Math.min(w*1.9,6.5),hw=Math.min(w*1.15,3.6);
 const head=(ax,ay,bx,by)=>{const n=Math.hypot(bx-ax,by-ay)||1,ux=(bx-ax)/n,uy=(by-ay)/n,ex=bx-ux*hl,ey=by-uy*hl;return`<polygon points="${bx},${by} ${ex-uy*hw},${ey+ux*hw} ${ex+uy*hw},${ey-ux*hw}" fill="${col}" opacity="${op}"/>`};
 if((dx===2&&dy===1)||(dx===1&&dy===2)){const cx=dx===2?x2:x1,cy=dx===2?y1:y2,n=Math.hypot(x2-cx,y2-cy)||1,ux=(x2-cx)/n,uy=(y2-cy)/n,bx=x2-ux*hl,by=y2-uy*hl;
  return`<polyline points="${x1},${y1} ${cx},${cy} ${bx},${by}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`+head(cx,cy,x2,y2)}
 const n=Math.hypot(x2-x1,y2-y1)||1,ux=(x2-x1)/n,uy=(y2-y1)/n,bx=x2-ux*hl,by=y2-uy*hl;
 return`<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`+head(x1,y1,x2,y2)}
// Главная стрелка тем жирнее, чем сильнее ход выделяется среди остальных (мат — самая жирная); запасные линии — тонкие
function arrows(r,bu,l){const k=l.k,top=r[0],sec=r[1],gap=sec&&!sec.ub?EPf(top.s,k)-EPf(sec.s,k):(sec?0.3:0),w=top.s>20000?5.2:2.6+Math.min(2.4,gap*14);let s='';
 for(const o of r.slice(1,3)){const u=E.uci(o.m);if(u!==bu&&!o.ub&&top.s-o.s<=80)s+=arrow(u,'#86efac',1.5,.35)}
 return s+arrow(bu,'#22c55e',w,.92)}
const SQ=[];
function initBoard(){const bd=$('#board');bd.innerHTML='';SQ.length=0;for(let d=0;d<64;d++){const e=document.createElement('div'),s=document.createElement('span'),im=document.createElement('img');s.className='pc';im.className='ic badge';im.hidden=true;const cr=document.createElement('span'),cf=document.createElement('span');cr.className='co cr';cf.className='co cf';e.append(s);e.append(im);e.append(cr);e.append(cf);bd.append(e);SQ.push({e,s,im,cr,cf,rt:'',ft:'',cls:'',ch:'',bk:''})}}
function draw(){if(!SQ.length)initBoard();const lu=hist.length?hist[hist.length-1]:'',lf=lu?idx(lu.slice(0,2)):-1,lt=lu?idx(lu.slice(2,4)):-1,lk=mi.length?mi[mi.length-1]:null,hasI=typeof ICONS!=='undefined';
 for(let d=0;d<64;d++){const i=flip?63-d:d,c=pos.b[i],q=SQ[d],cl='sq '+(((i&7)+(i>>3))&1?'d':'l')+(sel===i?' sel':'')+((i===lf||i===lt)?' last':'')+(sel!==null&&leg.some(m=>m.f===sel&&m.t===i)?' tg':'')+(LM.has(i)?' '+LM.get(i):'');
  const rt=(d&7)===0?String(8-(i>>3)):'',ft=(d>>3)===7?'abcdefgh'[i&7]:'';if(q.rt!==rt){q.cr.textContent=rt;q.rt=rt}if(q.ft!==ft){q.cf.textContent=ft;q.ft=ft}
  if(q.cls!==cl){q.e.className=cl;q.cls=cl}q.e.dataset.i=i;
  const pcl=c?'pc '+(c===c.toUpperCase()?'w':'b'):'pc',ch=(c?G[c.toUpperCase()]:'')+pcl;if(q.ch!==ch){q.s.textContent=c?G[c.toUpperCase()]:'';q.s.className=pcl;q.ch=ch}
  const bk=(hasI&&i===lt&&lk&&lk.k&&ICONS[lk.k])?lk.k:'';if(q.bk!==bk){if(bk){q.im.src=ICONS[bk];q.im.alt=CLS[bk].n;q.im.hidden=false}else q.im.hidden=true;q.bk=bk}}}
function over(){if(!leg.length)return E.inCheck(pos)?(pos.t==='w'?'Мат. Победили чёрные':'Мат. Победили белые'):'Пат — ничья';
 if(E.insuff(pos))return'Ничья: недостаточно материала';if(keys.filter(k=>k===keys[keys.length-1]).length>=3)return'Ничья: троекратное повторение';if(hm>=100)return'Ничья: правило 50 ходов';return''}
function setEval(ev){$('#evfill').style.height=(50+50*Math.tanh(ev/400))+'%'}
function status(){const o=over();$('#st').textContent=o||((pos.t==='w'?'Ход белых':'Ход чёрных')+(E.inCheck(pos)?' · шах!':'')+(pos.t===me?' · твой ход':' · ход соперника'));
 $('#gr').textContent=msg;const n=Book.name(BH(hist)),t=Book.trap(BH(hist)),bi=Book.info(BH(hist));$('#op').textContent=bi?'📖 '+(bi.ru?bi.ru+' · ':'')+bi.name+' ('+bi.eco+')':(n?'📖 '+n:'');theory();topics();$('#tr').textContent=t?'⚠ Ловушка: '+t:(famous(hist)?'📜 Партия: '+famous(hist):'');
 $('#sideW').className=me==='w'?'on':'';$('#sideB').className=me==='b'?'on':''}
function theory(){const el=$('#theory'),el2=$('#coll');el.textContent='';el2.textContent='';if(edit||hist.length>40)return;
 const nx=Book.next(BH(hist),5).map(x=>{const m=leg.find(y=>E.uci(y)===x.u);return m?E.san(pos,m,leg)+' ('+x.c+')':''}).filter(Boolean);
 if(nx.length)el.textContent='📚 Теория дальше (ход и число линий): '+nx.join(', ');
 const c=Book.coll(BH(hist));if(c)el2.textContent='🗂 В архиве мастеров (PGN Mentor): около '+c.c.toLocaleString('ru-RU')+' партий — '+c.n}
function feats(p){const b=p.b,cnt={},bs=[];for(let i=0;i<64;i++){const c=b[i];if(c){cnt[c]=(cnt[c]||0)+1;if(c==='B'||c==='b')bs.push(((i&7)+(i>>3))&1)}}
 const n=c=>cnt[c]||0,q=n('Q')+n('q'),r=n('R')+n('r'),bi=n('B')+n('b'),kn=n('N')+n('n'),pw=n('P')+n('p'),np=q+r+bi+kn,out=[];
 const pf=(f,c)=>{let k=0;for(let y=0;y<8;y++)if(b[y*8+f]===c)k++;return k};
 if(np===0){out.push(pw===1?'Король и пешка против короля':'Оппозиция королей');if(pw>1)out.push('Правило квадрата')}
 else if(pw===0&&np===1&&q===1)out.push('Мат ферзём и королём');else if(pw===0&&np===1&&r===1)out.push('Мат ладьёй и королём');
 else if((q===0&&np<=6)||np<=4){
  if(q&&!r&&!bi&&!kn)out.push('Ферзевый эндшпиль');
  if(r&&!q&&!bi&&!kn){out.push('Активность ладьи');out.push(r===2&&pw===1?'Ладья и пешка против ладьи':'Ладья позади проходной')}
  if(bi===2&&!r&&!q&&!kn&&n('B')===1)out.push(bs[0]!==bs[1]?'Разноцветные слоны':'Слон и пешки одного цвета');
  if(bi===1&&kn===1&&!r&&!q)out.push('Слон против коня');
  if(kn&&!bi&&!r&&!q&&pw)out.push('Конь и проходная пешка');
  out.push('Активный король')}
 else{
  for(let f=0;f<8&&out.length<3;f++){const w=pf(f,'P'),bk=pf(f,'p'),rk=[...Array(8)].some((_,y)=>b[y*8+f]==='R'||b[y*8+f]==='r');
   if(!w&&!bk&&rk&&!out.includes('Открытая вертикаль'))out.push('Открытая вертикаль');
   else if((!w||!bk)&&(w||bk)&&rk&&!out.includes('Полуоткрытая вертикаль'))out.push('Полуоткрытая вертикаль')}
  for(const c of['P','p']){for(let f=0;f<8;f++){if(pf(f,c)>1&&!out.includes('Сдвоенные пешки'))out.push('Сдвоенные пешки');
   if(pf(f,c)&&!(f>0&&pf(f-1,c))&&!(f<7&&pf(f+1,c))&&!out.includes('Изолированная пешка'))out.push('Изолированная пешка')}}
  if((n('B')===2)!==(n('b')===2)&&!out.includes('Пара слонов'))out.push('Пара слонов');
  const kw=b.indexOf('K')&7,kb=b.indexOf('k')&7;if((kw<=2&&kb>=5)||(kw>=5&&kb<=2))out.push('Разнонаправленные рокировки');if(!out.length&&hist.length>=12)out.push('Улучшение худшей фигуры')}
 return out.slice(0,3)}
function topics(){const el=$('#topic');if(edit||typeof TOPICS==='undefined'){el.innerHTML='';return}
 const tt=feats(pos).map(n=>TOPICS.find(t=>t.n===n)).filter(Boolean);
 el.innerHTML=tt.length?'<b>Темы позиции</b>'+tt.map(t=>`<div class="tp"><b>${t.n}</b><div>${me==='w'?t.w:t.b}</div><div class="muted">${t.k}</div></div>`).join(''):''}
function renderMoves(){$('#mv').innerHTML=sans.map((s,i)=>(i%2?'':`<span class="num">${(i>>1)+1}.</span>`)+`<span class="mo">${s}${mi[i]?ic(mi[i].k):''}</span>`).join(' ')}
function counter(p,m){const n=E.apply(p,m),rr=E.analyze(n,{d:4,ms:70,margin:100,q:1});if(!rr.length)return{n:0};const top=rr[0].s;return{n:rr.filter(o=>!o.ub&&top-o.s<=60).length}}
// На любом рейтинге цель — победа: подсказка никогда не уходит далеко от лучшего хода (слабая ≤50 cp, нормальная ≤30 cp), а выигрыш не отдаётся.
function chooseCore(r,l,info){
 if(info.book)return{u:info.book,label:'Книжный ход'};
 const losing=r[0].s<=-150;
 if(skill===3){const tol=l.tier>=3?10:25,cand=r.filter(o=>!o.ub&&r[0].s-o.s<=tol).slice(0,4);let best=cand[0]||r[0],bs=-1e9,bn=0;
  for(const o of cand){const c=counter(pos,o.m),sc=o.s-8*c.n;if(sc>bs){bs=sc;best=o;bn=c.n}}
  return{u:E.uci(best.m),label:'Профессиональный ход',extra:'Ответов у соперника, не ухудшающих его положение: '+bn}}
 if(skill===2)return{u:E.uci(r[0].m),label:'Идеальный ход'};
 if(losing){const pk=practical(r,80);return{u:E.uci(pk.m),label:pk===r[0]?'Лучший ход':'Ловушка: шанс на победу',extra:'Позиция сложная: ищем ход, после которого соперник легче ошибётся.'}}
 if(skill===0){const pk=E.pick(r,{...l,tol:50},{hint:1});return{u:E.uci(pk.m),label:'Ход на уровне рейтинга'}}
 const pk=l.tier>1?r[0]:practical(r,30);return{u:E.uci(pk.m),label:pk===r[0]?'Лучший ход':'Практичный ход (соперник может ошибиться)'}}
function show(info,t){if(t!==tk)return;const l=L(),r=info.r;if(!r.length)return;
 const top=r[0],mine=pos.t===me,bestUci=info.book||E.uci(top.m),ws=pos.t==='w'?1:-1,ev=ws*top.s;
 setEval(ev);$('#depth').textContent=(info.sf?'Stockfish · глубина '+(info.d||'?'):'Встроенный · глубина '+l.d)+(info.t!=null?' · '+(info.t/1000).toFixed(1)+' с':'')+(info.frac<1?' · быстро':'');const rel=(me==='w'?1:-1)*ev;$('#goal').textContent='🎯 Цель — победа. '+(rel>20000?'Мат близко, играй его!':rel>=150?'Ты выигрываешь: упрощай, меняй фигуры, не рискуй.':rel>=50?'Небольшое преимущество: усиливай позицию и создавай угрозы.':rel>-50?'Равно: развивай фигуры и жди ошибки соперника.':rel>-150?'Чуть хуже: защищайся точно и ищи ловушки.':'Позиция сложная: ставь ловушки и ищи контрудар.');$('#evt').textContent=fmt(ev);
 $('#lines').innerHTML=r.slice(0,4).map(o=>`<div class="ln" data-u="${E.uci(o.m)}"><span class="evc">${fmt(ws*o.s)}</span><span>${E.san(pos,o.m,leg)}</span></div>`).join('');
 const nm=u=>{const m=leg.find(x=>E.uci(x)===u);return m?E.san(pos,m,leg):u};
 $('#arrow').innerHTML='';$('#pl').hidden=true;
 if(mine){const ch=chooseMine(r,l,info),bu=ch.u,bm=leg.find(x=>E.uci(x)===bu),thr=bm?mateThreat(E.apply(pos,bm)):'';if(ch.need&&SF.on&&!info.more){info.more=true;moreLines(info,t)}
  $('#hint').innerHTML=`${ch.label}: <b>${nm(bu)}</b>${info.book?' · 📖 теория':''}${ch.extra?`<br><span class="muted">${ch.extra}</span>`:''}${thr?`<br><span class="warn">⚠ Угроза: после этого хода соперник ставит мат ${thr}</span>`:''}`;
  if(hint)$('#arrow').innerHTML=arrows(r,bu,l);BM=bu;$('#pl').hidden=false}
 else{const pr=E.uci(E.pick(r,l,{ply:hist.length}).m);$('#hint').innerHTML=`Вероятный ход соперника: <b>${nm(pr)}</b>`;
  if(hint)$('#arrow').innerHTML=arrow(pr,'#ef4444',1.6,.75)}
 $('#alt').textContent='Другие варианты: '+r.slice(1,3).map(o=>E.san(pos,o.m,leg)+' ('+fmt(ws*o.s)+')').join(', ')}

function finish(t,mine,info){if(t!==tk)return;flushGrades();if(!SF.on)return;const r=info.r;
 if(mine){const m=leg.find(x=>E.uci(x)===BM);if(m)ponder([{p:E.apply(pos,m),h:hist.concat(BM)}],.5)}
 else ponder(r.filter(o=>!o.ub).slice(0,2).map(o=>({p:E.apply(pos,o.m),h:hist.concat(E.uci(o.m))})),1)}
// Защита от ничьей: когда позиция лучше или равна, не повторяем позицию в третий раз, не ставим пат и не доводим до правила 50 ходов
const countKeys=()=>{const c={};for(const k of keys)c[k]=(c[k]||0)+1;return c};
function drawFilter(r){const none={r,note:'',need:false};if(r.length<2||pos.t!==me||edit)return none;const top=r[0].s;if(top<=-150)return none;   // проигрываем: ничья — хороший исход
 const kc=countKeys(),W=top>=150?Math.min(150,top-100):40;
 const rows=r.map(o=>{const q=E.apply(pos,o.m),c=kc[key(q)]||0,cap=!!pos.b[o.m.t]||pos.b[o.m.f].toLowerCase()==='p';
  return{o,c,stale:!E.legal(q).length&&!E.inCheck(q),insuff:E.insuff(q),fifty:(cap?0:hm+1)>=100,prog:cap}});
 const bad=x=>x.c>=2||x.stale||(x.insuff&&top>100)||x.fifty;
 if(!rows.some(x=>bad(x)||x.c>=1))return none;
 let ok=rows.filter(x=>!bad(x)&&!x.o.ub&&top-x.o.s<=W);const fresh=ok.filter(x=>x.c===0);if(fresh.length)ok=fresh;
 if(hm>=40){const pr=ok.filter(x=>x.prog);if(pr.length)ok=pr}
 const f0=rows[0],why=f0.stale?'пат':f0.c>=2?'повтор позиции в третий раз':f0.fifty?'правило 50 ходов':f0.insuff?'недостаток материала':f0.c===1?'повтор позиции':'';
 if(!ok.length){const alt=rows.filter(x=>!bad(x)).sort((x,y)=>y.o.s-x.o.s);return{r:(alt.length?alt:rows).map(x=>x.o),note:'⚠ Сильные ходы ведут к ничьей ('+(why||'повтор')+'), выбран лучший из остальных.',need:true}}
 return{r:ok.map(x=>x.o),note:ok[0].o!==r[0]&&why?'Избегаю ничьей ('+why+').':'',need:false}}
function chooseMine(r0,l,info){if(info.book)return chooseCore(r0,l,info);const F=drawFilter(r0),res=chooseCore(F.r,l,info);if(F.note)res.extra=(res.extra?res.extra+' ':'')+F.note;res.need=F.need;return res}
async function moreLines(info,t){try{const lines=await SF.analyze(info.fen,{ms:350,mpv:14,stale:()=>t!==tk});if(!lines||!lines.length||t!==tk)return;const L0=E.legal(pos),r=lines.map(x=>({m:L0.find(y=>E.uci(y)===x.u),s:x.s})).filter(o=>o.m);if(r.length>info.r.length){info.r=r;show(info,t)}}catch(e){}}
async function think(t){if(t!==tk)return;if(over()){$('#hint').textContent='';return}
 const mine=pos.t===me,stale=()=>t!==tk,fr=mine?1:.5;let info=peek(pos);
 if(info&&info.frac>=fr){show(info,t);finish(t,mine,info);return}
 if(info)show(info,t);
 else if(Math.min(L().cap,L().sms*SK[skill].t)>250){const q=await analyzeAtA(pos,hist,null,stale,.2);if(stale()||!q)return;show(q,t)}
 const full=await analyzeAtA(pos,hist,null,stale,fr);if(stale()||!full)return;show(full,t);finish(t,mine,full)}
const PIECES=['K','Q','R','B','N','P'];
function renderPal(){const mk=(col)=>PIECES.map(x=>{const ch=col==='w'?x:x.toLowerCase();return`<button data-p="${ch}" class="${pick===ch?'on':''}"${col==='w'?' data-w=1':''}>${G[x]}</button>`}).join('')+`<button data-p="" class="${pick===''?'on':''}">✕</button>`+`<button data-p="stm">ход: ${pos.t==='w'?'белых':'чёрных'}</button>`;
 $('#palT').innerHTML=mk('b');$('#palB').innerHTML=mk('w')}
function go(){const t=++tk;if(PKEYS.has(ckey(pos,null,1))||PKEYS.has(ckey(pos,null,.5))){ADOPT.add(ckey(pos,null,1));ADOPT.add(ckey(pos,null,.5))}ptk++;if(SF.stopStale)SF.stopStale();
 if(edit){draw();$('#arrow').innerHTML='';$('#pl').hidden=true;$('#hint').textContent='Редактор: выбери фигуру сверху или снизу и ставь на доску (✕ — стереть)';$('#st').textContent='Режим редактора';$('#st').className='edit';renderPal();return}
 $('#st').className='';draw();$('#arrow').innerHTML='';if(typeof Learn!=='undefined'&&Learn.active){if(Learn.afterGo)Learn.afterGo();return}$('#pl').hidden=true;$('#hint').textContent='';$('#alt').textContent='';$('#lines').innerHTML='';status();renderMoves();save();
 if(over()){if(!autoRev&&hist.length){autoRev=true;review().then(recap)}return}$('#hint').textContent='Считаю…';setTimeout(()=>think(t).catch(()=>{$('#hint').textContent='Ошибка расчёта, попробуй ещё раз'}),20)}
function push(m,quiet){const p=pos,isMe=p.t===me,u=E.uci(m),hs=hist.slice(),pk=lastK();
 mi.push(null);sans.push(E.san(p,m,leg));stack.push([p,hm]);hist.push(u);
 hm=(p.b[m.f].toLowerCase()==='p'||p.b[m.t])?0:hm+1;pos=E.apply(p,m);keys.push(key(pos));leg=E.legal(pos);
 if(!quiet)gradeLater(p,m,isMe,pk,hs,mi.length-1,u)}
function gradeLater(...g){GQ.push(g);setTimeout(flushGrades,5000)}
async function gradeOne(p,m,isMe,pk,hs,ix,u){try{const info=peek(p)||await analyzeAtA(p,hs,null,null,.5);if(!info)return;const c=await classifyA(p,m,info,isMe,pk,hs);
 if(hist[ix]!==u)return;mi[ix]=c;if(ix===hist.length-1)msg=(isMe?'Ты: ':'Соперник: ')+sans[ix]+' — '+CLS[c.k].n+(c.pl>0?' (−'+c.pl.toFixed(1)+'%)':'');renderMoves();if(!edit)draw();status()}catch(e){}}function play(m){if(typeof Learn!=='undefined'&&Learn.active){sel=null;Learn.onUser(m);return}sel=null;push(m);go()}
function reset(fen){let p;try{p=E.fromFen(fen||STD)}catch(e){alert('Не удалось прочитать позицию (FEN)');return false}
 pos=p;sf=fen||STD;stack=[];hist=[];sans=[];mi=[];keys=[key(pos)];autoRev=false;lastRev=null;$('#recap').innerHTML='';hm=+((fen||'').split(' ')[4])||0;leg=E.legal(pos);sel=null;msg='';go();return true}
function loadPgn(t){const fm=t.match(/\[FEN "([^"]+)"\]/),start=fm?fm[1]:STD;
 const s=t.replace(/\[[^\]]*\]/g,' ').replace(/\{[^}]*\}/g,' ').replace(/\([^()]*\)/g,' ').replace(/\$\d+/g,' ');
 if(!reset(start))return;
 for(const tok of s.split(/\s+/).filter(Boolean)){if(/^(1-0|0-1|1\/2-1\/2|\*)$/.test(tok))break;
  const w=tok.replace(/^\d+\.+/,'').replace(/[+#!?]/g,'');if(!w)continue;
  const m=leg.find(x=>E.san(pos,x,leg).replace(/[+#]/g,'')===w);
  if(!m){alert('Не понял ход: '+tok);break}push(m,true)}
 go()}
function loadText(t){t=(t||'').trim();if(!t)return;if(/\[|\d+\.\s*[NBRQKOa-h]/.test(t))loadPgn(t);else reset(t)}
const toUci=str=>{let s=E.start(),out=[];for(const t of str.split(' ')){const L=E.legal(s),tt=t.replace(/[+#]/g,''),m=L.find(x=>E.san(s,x,L).replace(/[+#]/g,'')===tt);if(!m)return null;out.push(E.uci(m));s=E.apply(s,m)}return out};
const FAM=Book.games.map(g=>({n:g.n,m:toUci(g.s)}));
function famous(h){if(!h.length||!stdStart())return'';const f=FAM.find(g=>g.m&&h.length<=g.m.length&&g.m.slice(0,h.length).join()===h.join());return f?f.n:''}
function mateThreat(n){for(const x of E.legal(n)){const a2=E.apply(n,x);if(E.inCheck(a2)&&!E.legal(a2).length)return E.san(n,x)}return''}
function practical(r,win){if(r.length<2)return r[0];const f=b=>(pos.t==='w'?1:-1)*E.ev(b);let best=r[0],bs=-1e9;
 for(const o of r.filter(o=>!o.ub&&r[0].s-o.s<=win).slice(0,6)){const n=E.apply(pos,o.m),base=f(n.b),q=E.legal(n);
  const cnt=q.filter(x=>f(E.apply(n,x).b)-base>=150).length,sc=o.s+cnt*25;if(sc>bs){bs=sc;best=o}}
 return best}
const pgnText=()=>sans.map((s,i)=>(i%2?'':((i>>1)+1)+'. ')+s).join(' ');
async function review(){if(busy||!hist.length)return;busy=true;const l=L(),lv={...l,ms:Math.min(l.ms,300)},H=hist.slice(),out=[],sides=[];let p=E.fromFen(sf),h=[];
 try{for(let i=0;i<H.length;i++){$('#sum').textContent=`Анализ партии: ${i+1} из ${H.length}…`;await new Promise(r=>setTimeout(r,0));
  const u=H[i],m=E.legal(p).find(x=>E.uci(x)===u);if(!m)break;const info=await analyzeAtA(p,h,{...lv,sms:Math.min(l.sms,300)});
  const c=await classifyA(p,m,info,p.t===me,out.length?out[out.length-1].k:'',h,300);c.bs=info.r.length?E.san(p,info.r[0].m,E.legal(p)):'';out.push(c);sides.push(p.t);h.push(u);p=E.apply(p,m)}}
 finally{busy=false}
 if(H.join()!==hist.join())return;   // партия изменилась во время анализа
 mi=out;renderMoves();lastRev={out,sides,sans:sans.slice(),f:sf};
 const row=(side,name)=>{const xs=out.filter((_,i)=>sides[i]===side),avg=xs.reduce((a,c)=>a+c.loss,0)/Math.max(1,xs.length),c=k=>xs.filter(x=>x.k===k).length;
  const acc=xs.length?xs.reduce((s,c)=>s+Math.max(0,Math.min(100,103.1668*Math.exp(-0.04354*c.pl)-3.1669)),0)/xs.length:0;
  return`<div>${name}: точность ≈ ${acc.toFixed(1)}% · ${ic('blunder')}${c('blunder')} ${ic('mistake')}${c('mistake')} ${ic('inaccuracy')}${c('inaccuracy')} ${ic('miss')}${c('miss')}</div>`};
 $('#sum').innerHTML=row('w','Белые')+row('b','Чёрные')}
function save(){try{localStorage.setItem('cp2',JSON.stringify({sf,h:hist,me,li,flip,hint,skill}))}catch(e){}}
function restore(){try{const d=JSON.parse(localStorage.getItem('cp2'));if(!d||!d.sf)return false;li=d.li|0;skill=Math.max(0,Math.min(3,d.skill===undefined?1:d.skill|0));me=d.me==='b'?'b':'w';flip=!!d.flip;hint=d.hint!==false;$('#hn').checked=hint;
 reset(d.sf);for(const u of d.h||[]){const m=leg.find(x=>E.uci(x)===u);if(!m)break;push(m,true)}go();return true}catch(e){return false}}
function promo(c){const d=$('#promo');d.hidden=false;d.innerHTML='Превратить в: '+c.map((m,k)=>`<button data-k="${k}">${G[m.p.toUpperCase()]}</button>`).join('');
 d.onclick=e=>{const b=e.target.closest('button');if(!b)return;d.hidden=true;play(c[+b.dataset.k])}}
function chips(){$('#lv').innerHTML='<span class="muted">Рейтинг партии:</span>'+E.LV.map((x,i)=>`<button class="${i==li?'on':''}" data-i="${i}">${x.n}</button>`).join('');
 const l=L();$('#lvinfo').innerHTML=`<b>${l.n}</b>: ${l.desc}<br>Точность уровня примерно ${l.acc}%. Игроки такого уровня теряют хотя бы пешку примерно в ${Math.round(l.pb*100)}% ходов.<br>📖 Дебюты: ${[...new Set(Book.list(l.tier))].slice(0,8).join(', ')}…`}
function skillUI(){$('#skill').innerHTML=SK.map((x,i)=>`<button class="${i===skill?'on':''}" data-s="${i}">${x.n}</button>`).join('');
 $('#skinfo').innerHTML=`<b>Рейтинг партии ${L().n} × ${SK[skill].n}</b><br>🎯 На любом рейтинге цель — победа.<br>${SK[skill].d}`}
function legend(){$('#legend').innerHTML='<b>Классификация ходов</b><div class="muted">По модели ожидаемых очков chess.com (Classification V2): потеря до 2% — Превосходный, 2–5% — Хороший, 5–10% — Неточность, 10–20% — Ошибка, от 20% — Зевок. Шансы на победу считаются по оценке движка с поправкой на рейтинг партии: чем он ниже, тем снисходительнее оценки. Точные коэффициенты chess.com не публикует, здесь они приближённые.</div>'+Object.values(CLS).map((c,i)=>`<div class="row">${ic(Object.keys(CLS)[i])}<span><b>${c.n}</b> <small>— ${c.d}</small></span></div>`).join('')}
function recap(){const R=lastRev;if(!R||!R.out.length)return;
 const f0=+(R.f.split(' ')[5])||1,b0=R.f.split(' ')[1]==='b'?1:0,num=i=>(f0+Math.floor((i+b0)/2))+(((i+b0)%2)?'... ':'. ');
 const items=R.out.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.pl>=5&&['blunder','mistake','miss','inaccuracy'].includes(x.c.k)).sort((a,b)=>b.c.loss-a.c.loss).slice(0,3);
 $('#recap').innerHTML=`<b>Разбор партии</b><div class="muted">${over()||'Партия не завершена'}</div>`+(items.length?items.map(x=>`<div class="rc">${ic(x.c.k)}<b>${num(x.i)}${R.sans[x.i]}</b> — ${CLS[x.c.k].n}, потеря ${x.c.pl.toFixed(1)}%${x.c.bs&&x.c.bs!==R.sans[x.i]?`<div class="muted">Лучше было: ${x.c.bs}</div>`:''}</div>`).join(''):'<div class="muted">Серьёзных ошибок не найдено</div>')}
// --- обработчики ---
$('#board').onclick=e=>{const s=e.target.closest('.sq');if(!s)return;const i=+s.dataset.i;
 if(typeof Learn!=='undefined'&&Learn.active&&Learn.onSquare&&Learn.onSquare(i))return;
 if(edit){if(pick!==null){pos.b[i]=pick;pos.e=-1;const b=pos.b;pos.c=(b[60]==='K'&&b[63]==='R'?'K':'')+(b[60]==='K'&&b[56]==='R'?'Q':'')+(b[4]==='k'&&b[7]==='r'?'k':'')+(b[4]==='k'&&b[0]==='r'?'q':'');draw()}return}
 if(over())return;const c=leg.filter(x=>x.f===sel&&x.t===i);
 if(c.length>1){promo(c);return}if(c.length){play(c[0]);return}
 const p=pos.b[i];sel=p&&(p===p.toUpperCase())===(pos.t==='w')?i:null;draw()};
$('#lv').onclick=e=>{const b=e.target.closest('button');if(!b)return;li=+b.dataset.i;chips();skillUI();go()};
$('#skill').onclick=e=>{const b=e.target.closest('button');if(!b)return;skill=+b.dataset.s;skillUI();go()};
$('#lines').onclick=e=>{const d=e.target.closest('.ln');if(!d)return;const m=leg.find(x=>E.uci(x)===d.dataset.u);if(m)play(m)};
$('#un').onclick=()=>{if(!stack.length)return;autoRev=false;const[pp,h]=stack.pop();pos=pp;hm=h;hist.pop();sans.pop();mi.pop();keys.pop();leg=E.legal(pos);sel=null;msg='';go()};
$('#nw').onclick=()=>reset(STD);
$('#oc').onclick=()=>reset(ONLYK);
$('#ed').onclick=()=>{if(!edit){edit=true;pick=null;$('#palT').hidden=false;$('#palB').hidden=false;sel=null;go();return}
 let f=null;try{f=E.toFen(pos,hm,(hist.length>>1)+1);E.fromFen(f)}catch(e){alert('Позиция некорректна: нужны обе стороны с королём и не под шахом у соперника');go();return}
 edit=false;$('#palT').hidden=true;$('#palB').hidden=true;reset(f)};
const palClick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.p==='stm'){pos.t=pos.t==='w'?'b':'w';renderPal();return}pick=b.dataset.p;renderPal()};
$('#palT').onclick=palClick;$('#palB').onclick=palClick;
$('#fl').onclick=()=>{flip=!flip;go()};
const setSide=c=>{me=c;flip=c==='b';sel=null;go()};
$('#sideW').onclick=()=>setSide('w');$('#sideB').onclick=()=>setSide('b');
$('#pl').onclick=()=>{const m=leg.find(x=>E.uci(x)===BM);if(m&&pos.t===me)play(m)};
$('#hn').onchange=e=>{hint=e.target.checked;go()};
$('#rev').onclick=()=>review().then(recap);
$('#lf').onclick=()=>loadText($('#inp').value);
$('#cf').onclick=()=>copy(E.toFen(pos,hm,(hist.length>>1)+1));
$('#cp').onclick=()=>copy(pgnText());

// --- импорт партий chess.com (публичный PubAPI, запросы по очереди) ---
const cget=async u=>{const r=await fetch(u);if(!r.ok)throw new Error('HTTP '+r.status);return r.json()};
async function importChess(){const u=($('#cu').value||'').trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
 if(!u){$('#cg').textContent='Введи ник';return}
 $('#cg').textContent='Загружаю…';
 try{const ar=await cget('https://api.chess.com/pub/player/'+u+'/games/archives');
  const last=(ar.archives||[]).slice(-2).reverse();let games=[];
  for(const a of last){try{const d=await cget(a);games=games.concat((d.games||[]).reverse())}catch(e){}}
  games=games.filter(g=>g.pgn).slice(0,20);
  if(!games.length){$('#cg').textContent='Партии не найдены';return}
  $('#cg').innerHTML=games.map((g,i)=>{const me=g.white&&g.white.username.toLowerCase()===u,opp=me?g.black.username:g.white.username,res=me?g.white.result:g.black.result;
   const won=res==='win',ok=res==='win'||res==='draw'||res==='stalemate'||res==='insufficient'||res==='50move'||res==='repetition'||res==='agreed'||res==='timevsinsufficient';
   return`<div class="ln" data-g="${i}"><span class="evc">${won?'1-0':ok?'½':'0-1'}</span><span>vs ${esc(opp)} · ${(g.time_class||'')} · ${new Date((g.end_time||0)*1000).toLocaleDateString('ru-RU')}</span></div>`}).join('');
  window._cgames=games}
 catch(e){$('#cg').innerHTML='Не удалось загрузить ('+e.message+'). Открой партию на chess.com, скопируй PGN и вставь его в поле ниже.'}}
$('#cl').onclick=()=>importChess();
$('#cg').onclick=e=>{const d=e.target.closest('.ln');if(!d||!window._cgames)return;const g=window._cgames[+d.dataset.g];if(g){loadPgn(g.pgn);$('#cg').insertAdjacentHTML('afterbegin','<div class="muted">Открыта партия, разбор будет после окончания.</div>')}};
chips();legend();if(!restore())reset();skillUI();
const engChip=()=>{const e=$('#eng');e.textContent=SF.on?(SF.native?'Stockfish (нативный)':'Stockfish'):'Встроенный движок';e.title=SF.status.msg;const s=$('#sfstat');if(s)s.textContent=SF.status.msg};
engChip();
SF.init().then(f=>{engChip();if(f){CACHE={};if(!edit)go()}});
$('#sftest').onclick=async()=>{const s=$('#sfstat');s.textContent='Проверяю…';const r=await SF.test();s.textContent=r.ok?'✅ '+r.name+' отвечает: глубина '+r.depth+' за '+r.ms+' мс'+(r.nps?', около '+Math.round(r.nps/1000)+' тыс. позиций/с':'')+', лучший ход из начальной позиции '+r.best:'❌ '+r.msg}
