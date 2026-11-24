const E=Eng,$=s=>document.querySelector(s),STD='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',ONLYK='4k3/8/8/8/8/8/8/4K3 w - - 0 1';
const G=Object.fromEntries(Object.entries({K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'}).map(([k,v])=>[k,v+'\uFE0E']));
// r,c — позиция иконки в спрайте assets/icons.png (6 колонок × 6 строк, с 0)
const CLS={brilliant:{n:'Блестящий',r:1,c:0,d:'Лучший ход с неочевидной жертвой фигуры'},great:{n:'Замечательный',r:4,c:1,d:'Критически важный ход, почти единственный'},best:{n:'Лучший',r:1,c:3,d:'Первая линия движка'},excellent:{n:'Прекрасный',r:5,c:3,d:'Почти такой же сильный, как лучший'},good:{n:'Хороший',r:4,c:2,d:'Крепкий ход, чуть уступает лучшему'},book:{n:'Книжный',r:1,c:1,d:'Ход из дебютной теории'},inaccuracy:{n:'Неточность',r:4,c:0,d:'Небольшой промах'},mistake:{n:'Ошибка',r:0,c:5,d:'Заметно ухудшает позицию'},miss:{n:'Упущенный шанс',r:3,c:5,d:'Соперник ошибся, а тактику вы не нашли'},blunder:{n:'Зевок',r:1,c:2,d:'Грубая ошибка, переворачивает партию'}};
const ic=k=>CLS[k]?`<span class="ic" style="--r:${CLS[k].r};--c:${CLS[k].c}" title="${CLS[k].n}"></span>`:'';
let lastRev=null,autoRev=false,li=1,me='w',flip=false,hint=true,pos,leg=[],stack=[],hist=[],sans=[],keys=[],mi=[],hm=0,sf=STD,sel=null,msg='',tk=0,BM='',CACHE={},busy=false;
const L=()=>E.LV[li],idx=s=>'abcdefgh'.indexOf(s[0])+(8-s[1])*8,key=s=>s.b.map(c=>c||'.').join('')+s.t+s.c+s.e,CK=s=>li+'|'+key(s);
const fmt=v=>Math.abs(v)>20000?'мат':(v>0?'+':'')+(v/100).toFixed(1);
const lastK=()=>{const x=mi[mi.length-1];return x?x.k:''};
const copy=t=>{try{navigator.clipboard.writeText(t).catch(()=>prompt('Скопируй:',t))}catch(e){try{prompt('Скопируй:',t)}catch(_){}}};
function analyzeAt(p,hs,lvl){const k=CK(p);if(!CACHE[k]){const l=lvl||L(),b=Book.move(hs,l.tier,l.bk),r=E.analyze(p,l);CACHE[k]={r,book:b?b.mv:'',bname:b?b.name:''}}return CACHE[k]}
// Классификация хода: сравнивает ход с лучшим по движку (оценка с точки зрения ходящего)
function classify(p,m,info,isMe,prevK,hs){const u=E.uci(m),r=info.r;
 if(hs&&Book.isBook(hs,u,L().tier))return{k:'book',loss:0};
 if(!r||!r.length)return{k:'best',loss:0};
 const i=r.findIndex(o=>E.uci(o.m)===u),loss=i>=0?Math.max(0,r[0].s-r[i].s):0;let k;
 if(loss<=0)k=E.sacked(p,m)?'brilliant':(r.length>1&&r[0].s-r[1].s>=150?'great':'best');
 else k=loss<=20?'excellent':loss<=60?'good':loss<=120?'inaccuracy':loss<=250?'mistake':'blunder';
 if(isMe&&(prevK==='blunder'||prevK==='mistake')&&loss>=60&&k!=='brilliant')k='miss';
 return{k,loss}}
function arrow(u,col,w,op){if(!u||u.length<4)return'';const p=i=>[(flip?7-(i&7):i&7)*10+5,(flip?7-(i>>3):i>>3)*10+5],[x1,y1]=p(idx(u.slice(0,2))),[x2,y2]=p(idx(u.slice(2,4))),n=Math.hypot(x2-x1,y2-y1)||1,ux=(x2-x1)/n,uy=(y2-y1)/n,h=w*1.9,bx=x2-ux*h,by=y2-uy*h;
 return`<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/><polygon points="${x2},${y2} ${bx-uy*w*1.2},${by+ux*w*1.2} ${bx+uy*w*1.2},${by-ux*w*1.2}" fill="${col}" opacity="${op}"/>`}
function draw(){const bd=$('#board');bd.innerHTML='';const lu=hist.length?hist[hist.length-1]:'',lf=lu?idx(lu.slice(0,2)):-1,lt=lu?idx(lu.slice(2,4)):-1,lk=mi.length?mi[mi.length-1]:null;
 for(let d=0;d<64;d++){const i=flip?63-d:d,c=pos.b[i],e=document.createElement('div');
  e.className='sq '+(((i&7)+(i>>3))&1?'d':'l')+(sel===i?' sel':'')+((i===lf||i===lt)?' last':'')+(sel!==null&&leg.some(m=>m.f===sel&&m.t===i)?' tg':'');e.dataset.i=i;
  if(c){const s=document.createElement('span');s.className='pc '+(c===c.toUpperCase()?'w':'b');s.textContent=G[c.toUpperCase()];e.append(s)}
  if(i===lt&&lk&&lk.k)e.insertAdjacentHTML('beforeend',ic(lk.k).replace('class="ic"','class="ic badge"'));
  bd.append(e)}}
function over(){if(!leg.length)return E.inCheck(pos)?(pos.t==='w'?'Мат. Победили чёрные':'Мат. Победили белые'):'Пат — ничья';
 if(E.insuff(pos))return'Ничья: недостаточно материала';if(keys.filter(k=>k===keys[keys.length-1]).length>=3)return'Ничья: троекратное повторение';if(hm>=100)return'Ничья: правило 50 ходов';return''}
function setEval(ev){$('#evfill').style.height=(50+50*Math.tanh(ev/400))+'%'}
function status(){const o=over();$('#st').textContent=o||((pos.t==='w'?'Ход белых':'Ход чёрных')+(E.inCheck(pos)?' · шах!':'')+(pos.t===me?' · твой ход':' · ход соперника'));
 $('#gr').textContent=msg;const n=Book.name(hist),t=Book.trap(hist);$('#op').textContent=n?'📖 '+n:'';$('#tr').textContent=t?'⚠ Ловушка: '+t:'';
 $('#sideW').className=me==='w'?'on':'';$('#sideB').className=me==='b'?'on':''}
function renderMoves(){$('#mv').innerHTML=sans.map((s,i)=>(i%2?'':`<span class="num">${(i>>1)+1}.</span>`)+`<span class="mo">${s}${mi[i]?ic(mi[i].k):''}</span>`).join(' ')}
function think(t){if(t!==tk)return;if(over()){$('#hint').textContent='';return}
 const l=L(),info=analyzeAt(pos,hist),r=info.r;if(!r.length)return;
 const top=r[0],mine=pos.t===me,bestUci=info.book||E.uci(top.m),ws=pos.t==='w'?1:-1,ev=ws*top.s;
 setEval(ev);$('#depth').textContent='глубина '+l.d+'/'+l.d;$('#evt').textContent=fmt(ev);
 $('#lines').innerHTML=r.slice(0,4).map(o=>`<div class="ln" data-u="${E.uci(o.m)}"><span class="evc">${fmt(ws*o.s)}</span><span>${E.san(pos,o.m,leg)}</span></div>`).join('');
 const nm=u=>{const m=leg.find(x=>E.uci(x)===u);return m?E.san(pos,m,leg):u};
 $('#arrow').innerHTML='';$('#pl').hidden=true;
 if(mine){$('#hint').innerHTML=`Лучший ход: <b>${nm(bestUci)}</b>${info.book?' · 📖 теория':''}`;
  if(hint)$('#arrow').innerHTML=arrow(bestUci,'#22c55e',2.8,.9);BM=bestUci;$('#pl').hidden=false}
 else{const pr=E.uci(E.pick(r,l,{ply:hist.length}).m);$('#hint').innerHTML=`Вероятный ход соперника: <b>${nm(pr)}</b>`;
  if(hint)$('#arrow').innerHTML=arrow(pr,'#ef4444',1.6,.75)}
 $('#alt').textContent='Другие варианты: '+r.slice(1,3).map(o=>E.san(pos,o.m,leg)+' ('+fmt(ws*o.s)+')').join(', ')}
function go(){const t=++tk;draw();$('#arrow').innerHTML='';$('#pl').hidden=true;$('#hint').textContent='';$('#alt').textContent='';$('#lines').innerHTML='';status();renderMoves();save();
 if(over()){if(!autoRev&&hist.length){autoRev=true;review().then(recap)}return}$('#hint').textContent='Считаю…';setTimeout(()=>think(t),20)}
function push(m,quiet){const p=pos,isMe=p.t===me,u=E.uci(m);let c=null;
 if(!quiet){c=classify(p,m,analyzeAt(p,hist),isMe,lastK(),hist)}
 mi.push(c);sans.push(E.san(p,m,leg));stack.push([p,hm]);hist.push(u);
 hm=(p.b[m.f].toLowerCase()==='p'||p.b[m.t])?0:hm+1;pos=E.apply(p,m);keys.push(key(pos));leg=E.legal(pos);
 if(c)msg=(isMe?'Ты: ':'Соперник: ')+sans[sans.length-1]+' — '+CLS[c.k].n+(c.loss>0?' (−'+(c.loss/100).toFixed(2)+')':'')}
function play(m){sel=null;push(m);go()}
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
const pgnText=()=>sans.map((s,i)=>(i%2?'':((i>>1)+1)+'. ')+s).join(' ');
async function review(){if(busy||!hist.length)return;busy=true;const l=L(),lv={...l,ms:Math.min(l.ms,300)},H=hist.slice(),out=[],sides=[];let p=E.fromFen(sf),h=[];
 try{for(let i=0;i<H.length;i++){$('#sum').textContent=`Анализ партии: ${i+1} из ${H.length}…`;await new Promise(r=>setTimeout(r,0));
  const u=H[i],m=E.legal(p).find(x=>E.uci(x)===u);if(!m)break;const info=analyzeAt(p,h,lv);
  const c=classify(p,m,info,p.t===me,out.length?out[out.length-1].k:'',h);c.bs=info.r.length?E.san(p,info.r[0].m,E.legal(p)):'';out.push(c);sides.push(p.t);h.push(u);p=E.apply(p,m)}}
 finally{busy=false}
 mi=out;renderMoves();lastRev={out,sides,sans:sans.slice(),f:sf};
 const row=(side,name)=>{const xs=out.filter((_,i)=>sides[i]===side),avg=xs.reduce((a,c)=>a+c.loss,0)/Math.max(1,xs.length),c=k=>xs.filter(x=>x.k===k).length;
  return`<div>${name}: средняя потеря ${(avg/100).toFixed(2)} пешки · ${ic('blunder')}${c('blunder')} ${ic('mistake')}${c('mistake')} ${ic('inaccuracy')}${c('inaccuracy')}</div>`};
 $('#sum').innerHTML=row('w','Белые')+row('b','Чёрные')}
function save(){try{localStorage.setItem('cp2',JSON.stringify({sf,h:hist,me,li,flip,hint}))}catch(e){}}
function restore(){try{const d=JSON.parse(localStorage.getItem('cp2'));if(!d||!d.sf)return false;li=d.li|0;me=d.me==='b'?'b':'w';flip=!!d.flip;hint=d.hint!==false;$('#hn').checked=hint;
 reset(d.sf);for(const u of d.h||[]){const m=leg.find(x=>E.uci(x)===u);if(!m)break;push(m,true)}go();return true}catch(e){return false}}
function promo(c){const d=$('#promo');d.hidden=false;d.innerHTML='Превратить в: '+c.map((m,k)=>`<button data-k="${k}">${G[m.p.toUpperCase()]}</button>`).join('');
 d.onclick=e=>{const b=e.target.closest('button');if(!b)return;d.hidden=true;play(c[+b.dataset.k])}}
function chips(){$('#lv').innerHTML='<span class="muted">Рейтинг партии:</span>'+E.LV.map((x,i)=>`<button class="${i==li?'on':''}" data-i="${i}">${x.n}</button>`).join('');
 const l=L();$('#lvinfo').innerHTML=`<b>${l.n}</b>: ${l.desc}<br>Точность уровня примерно ${l.acc}%. Игроки такого уровня теряют хотя бы пешку примерно в ${Math.round(l.pb*100)}% ходов.<br>📖 Дебюты: ${[...new Set(Book.list(l.tier))].slice(0,8).join(', ')}…`}
function legend(){$('#legend').innerHTML='<b>Классификация ходов</b>'+Object.values(CLS).map((c,i)=>`<div class="row">${ic(Object.keys(CLS)[i])}<span><b>${c.n}</b> <small>— ${c.d}</small></span></div>`).join('')}
function recap(){const R=lastRev;if(!R||!R.out.length)return;
 const f0=+(R.f.split(' ')[5])||1,b0=R.f.split(' ')[1]==='b'?1:0,num=i=>(f0+Math.floor((i+b0)/2))+(((i+b0)%2)?'... ':'. ');
 const items=R.out.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.loss>=60&&['blunder','mistake','miss','inaccuracy'].includes(x.c.k)).sort((a,b)=>b.c.loss-a.c.loss).slice(0,3);
 $('#recap').innerHTML=`<b>Разбор партии</b><div class="muted">${over()||'Партия не завершена'}</div>`+(items.length?items.map(x=>`<div class="rc">${ic(x.c.k)}<b>${num(x.i)}${R.sans[x.i]}</b> — ${CLS[x.c.k].n}, потеря ${(x.c.loss/100).toFixed(1)}${x.c.bs&&x.c.bs!==R.sans[x.i]?`<div class="muted">Лучше было: ${x.c.bs}</div>`:''}</div>`).join(''):'<div class="muted">Серьёзных ошибок не найдено</div>')}
// --- обработчики ---
$('#board').onclick=e=>{const s=e.target.closest('.sq');if(!s||over())return;const i=+s.dataset.i,c=leg.filter(x=>x.f===sel&&x.t===i);
 if(c.length>1){promo(c);return}if(c.length){play(c[0]);return}
 const p=pos.b[i];sel=p&&(p===p.toUpperCase())===(pos.t==='w')?i:null;draw()};
$('#lv').onclick=e=>{const b=e.target.closest('button');if(!b)return;li=+b.dataset.i;chips();go()};
$('#lines').onclick=e=>{const d=e.target.closest('.ln');if(!d)return;const m=leg.find(x=>E.uci(x)===d.dataset.u);if(m)play(m)};
$('#un').onclick=()=>{if(!stack.length)return;autoRev=false;const[pp,h]=stack.pop();pos=pp;hm=h;hist.pop();sans.pop();mi.pop();keys.pop();leg=E.legal(pos);sel=null;msg='';go()};
$('#nw').onclick=()=>reset(STD);
$('#oc').onclick=()=>reset(ONLYK);
$('#fl').onclick=()=>{flip=!flip;go()};
const setSide=c=>{me=c;flip=c==='b';sel=null;go()};
$('#sideW').onclick=()=>setSide('w');$('#sideB').onclick=()=>setSide('b');
$('#pl').onclick=()=>{const m=leg.find(x=>E.uci(x)===BM);if(m&&pos.t===me)play(m)};
$('#hn').onchange=e=>{hint=e.target.checked;go()};
$('#rev').onclick=()=>review().then(recap);
$('#lf').onclick=()=>loadText($('#inp').value);
$('#cf').onclick=()=>copy(E.toFen(pos,hm,(hist.length>>1)+1));
$('#cp').onclick=()=>copy(pgnText());
chips();legend();if(!restore())reset();
