const E=Eng,$=s=>document.querySelector(s),STD='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',ONLYK='4k3/8/8/8/8/8/8/4K3 w - - 0 1';
const G=Object.fromEntries(Object.entries({K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'}).map(([k,v])=>[k,v+'\uFE0E']));
const CLS={brilliant:{n:'Блестящий',d:'!! Корректная жертва фигуры, лучший или почти лучший ход. После неё позиция не плохая, а до хода не была абсолютно выигранной'},great:{n:'Отличный',d:'! Ход, кардинально влияющий на исход: единственный, спасающий позицию, или единственный правильный ответ'},best:{n:'Лучший',d:'★ Первая линия движка — самый точный ход'},excellent:{n:'Превосходный',d:'Почти как первая линия: потеря шансов менее 2%'},good:{n:'Хороший',d:'Крепкий, логичный ход, у движка были идеи точнее'},book:{n:'Книжный',d:'Ход из дебютной теории, точность не оценивается'},inaccuracy:{n:'Неточность',d:'?! Шансы на победу падают на 5–10%'},mistake:{n:'Ошибка',d:'? Шансы падают на 10–20%, упущено преимущество или отдана инициатива'},miss:{n:'Упущение',d:'✕ Соперник только что ошибся, а ты не использовал это и вернул игру в равное или худшее русло'},blunder:{n:'Зевок',d:'?? Потеря фигуры, пропущенный мат или выигрыш превращён в проигрыш: потеря шансов 20% и больше'}};
const ic=k=>CLS[k]&&typeof ICONS!=='undefined'&&ICONS[k]?`<img class="ic" src="${ICONS[k]}" alt="${CLS[k].n}" title="${CLS[k].n}">`:'';
let edit=false,pick=null,lastRev=null,autoRev=false,li=1,me='w',flip=false,hint=true,pos,leg=[],stack=[],hist=[],sans=[],keys=[],mi=[],hm=0,sf=STD,sel=null,msg='',tk=0,BM='',CACHE={},busy=false;
const L=()=>E.LV[li],idx=s=>'abcdefgh'.indexOf(s[0])+(8-s[1])*8,key=s=>s.b.map(c=>c||'.').join('')+s.t+s.c+s.e,CK=s=>li+'|'+key(s);
const fmt=v=>Math.abs(v)>20000?'мат':(v>0?'+':'')+(v/100).toFixed(1);
const lastK=()=>{const x=mi[mi.length-1];return x?x.k:''};
const copy=t=>{try{navigator.clipboard.writeText(t).catch(()=>prompt('Скопируй:',t))}catch(e){try{prompt('Скопируй:',t)}catch(_){}}};
async function analyzeAtA(p,hs,lvl,stale){const k=CK(p)+(SF.on?'S':'');if(CACHE[k])return CACHE[k];
 const l=lvl||L(),b=Book.move(hs,l.tier,l.bk),fen=E.toFen(p,0,1);let r=null,sfl=false,d=0;
 if(SF.on){const lines=await SF.analyze(fen,{ms:l.sms,mpv:l.mpv,stale});if(lines===null)return null;const L0=E.legal(p);
  r=lines.map(x=>({m:L0.find(y=>E.uci(y)===x.u),s:x.s})).filter(o=>o.m);d=lines.length?lines[0].d:0;sfl=r.length>0}
 if(!r||!r.length){r=E.analyze(p,l);sfl=false}
 return CACHE[k]={r,book:b?b.mv:'',bname:b?b.name:'',sf:sfl,fen,d}}
async function classifyA(p,m,info,isMe,prevK,hs){let r=info.r;const u=E.uci(m);
 if(info.sf&&!r.some(o=>E.uci(o.m)===u)&&!(hs&&Book.isBook(hs,u,L().tier,L().bk))){const s=await SF.score(info.fen,u,Math.min(L().sms,1200));if(s!==null)r=r.concat([{m,s}]).sort((x,y)=>y.s-x.s)}
 return classify(p,m,{...info,r},isMe,prevK,hs)}
// Классификация хода: сравнивает ход с лучшим по движку (оценка с точки зрения ходящего)
const wp=s=>50+50*(2/(1+Math.exp(-0.00368208*s))-1);
function classify(p,m,info,isMe,prevK,hs){const u=E.uci(m),r=info.r;
 if(hs&&Book.isBook(hs,u,L().tier,L().bk))return{k:'book',loss:0,pl:0};
 if(!r||!r.length)return{k:'best',loss:0,pl:0};
 const i=r.findIndex(o=>E.uci(o.m)===u),sp=i>=0?r[i].s:r[0].s,loss=Math.max(0,r[0].s-sp),pl=Math.max(0,wp(r[0].s)-wp(sp)),
  gap=r.length>1?wp(r[0].s)-wp(r[1].s):99;let k;
 if(pl<2){
  if(E.sacked(p,m)&&sp>=-100&&r[0].s<400)k='brilliant';            // жертва, позиция после неё не плохая и до неё не была выигранной
  else if(i===0&&gap>=10)k='great';                                // единственный сильный ход
  else k=i===0?'best':'excellent';
 }else k=pl<5?'good':pl<10?'inaccuracy':pl<20?'mistake':'blunder';
 // Упущение: соперник только что ошибся, а ход не использовал это (игра равна или хуже)
 if((prevK==='blunder'||prevK==='mistake')&&pl>=5&&sp<=100&&k!=='blunder')k='miss';
 return{k,loss,pl}}
function arrow(u,col,w,op){if(!u||u.length<4)return'';const p=i=>[(flip?7-(i&7):i&7)*10+5,(flip?7-(i>>3):i>>3)*10+5];
 const[x1,y1]=p(idx(u.slice(0,2))),[x2,y2]=p(idx(u.slice(2,4)));const dx=Math.abs(x2-x1)/10,dy=Math.abs(y2-y1)/10;
 const head=(ax,ay,bx,by)=>{const n=Math.hypot(bx-ax,by-ay)||1,ux=(bx-ax)/n,uy=(by-ay)/n,hh=w*1.9,ex=bx-ux*hh,ey=by-uy*hh;
  return`<polygon points="${bx},${by} ${ex-uy*w*1.2},${ey+ux*w*1.2} ${ex+uy*w*1.2},${ey-ux*w*1.2}" fill="${col}" opacity="${op}"/>`};
 if((dx===2&&dy===1)||(dx===1&&dy===2)){
  const cx=dx===2?x2:x1,cy=dx===2?y1:y2;
  const n=Math.hypot(x2-cx,y2-cy)||1,ux=(x2-cx)/n,uy=(y2-cy)/n,bx=x2-ux*w*1.9,by=y2-uy*w*1.9;
  return`<polyline points="${x1},${y1} ${cx},${cy} ${bx},${by}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`+head(cx,cy,x2,y2)}
 const n=Math.hypot(x2-x1,y2-y1)||1,ux=(x2-x1)/n,uy=(y2-y1)/n,hh=w*1.9,bx=x2-ux*hh,by=y2-uy*hh;
 return`<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`+head(x1,y1,x2,y2)}
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
 $('#gr').textContent=msg;const n=Book.name(hist),t=Book.trap(hist),bi=Book.info(hist);$('#op').textContent=bi?'📖 '+(bi.ru?bi.ru+' · ':'')+bi.name+' ('+bi.eco+')':(n?'📖 '+n:'');theory();topics();$('#tr').textContent=t?'⚠ Ловушка: '+t:(famous(hist)?'📜 Партия: '+famous(hist):'');
 $('#sideW').className=me==='w'?'on':'';$('#sideB').className=me==='b'?'on':''}
function theory(){const el=$('#theory'),el2=$('#coll');el.textContent='';el2.textContent='';if(edit||hist.length>40)return;
 const nx=Book.next(hist,5).map(x=>{const m=leg.find(y=>E.uci(y)===x.u);return m?E.san(pos,m,leg)+' ('+x.c+')':''}).filter(Boolean);
 if(nx.length)el.textContent='📚 Теория дальше (ход и число линий): '+nx.join(', ');
 const c=Book.coll(hist);if(c)el2.textContent='🗂 В архиве мастеров (PGN Mentor): около '+c.c.toLocaleString('ru-RU')+' партий — '+c.n}
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
async function think(t){if(t!==tk)return;if(over()){$('#hint').textContent='';return}
 const l=L(),info=await analyzeAtA(pos,hist,null,()=>t!==tk);if(t!==tk||!info)return;const r=info.r;if(!r.length)return;
 const top=r[0],mine=pos.t===me,bestUci=info.book||E.uci(top.m),ws=pos.t==='w'?1:-1,ev=ws*top.s;
 setEval(ev);$('#depth').textContent=info.sf?'глубина '+(info.d||'?'):'глубина '+l.d+'/'+l.d;const rel=(me==='w'?1:-1)*ev;$('#goal').textContent='🎯 Цель — победа. '+(rel>20000?'Мат близко, играй его!':rel>=150?'Ты выигрываешь: упрощай, меняй фигуры, не рискуй.':rel>=50?'Небольшое преимущество: усиливай позицию и создавай угрозы.':rel>-50?'Равно: развивай фигуры и жди ошибки соперника.':rel>-150?'Чуть хуже: защищайся точно и ищи ловушки.':'Позиция сложная: ставь ловушки и ищи контрудар.');$('#evt').textContent=fmt(ev);
 $('#lines').innerHTML=r.slice(0,4).map(o=>`<div class="ln" data-u="${E.uci(o.m)}"><span class="evc">${fmt(ws*o.s)}</span><span>${E.san(pos,o.m,leg)}</span></div>`).join('');
 const nm=u=>{const m=leg.find(x=>E.uci(x)===u);return m?E.san(pos,m,leg):u};
 $('#arrow').innerHTML='';$('#pl').hidden=true;
 if(mine){const pk=info.book?null:practical(r,l),bu=info.book||E.uci(pk.m),lab=info.book?'Книжный ход':(pk===r[0]?'Лучший ход':'Практичный ход (соперник может ошибиться)');
  const bm=leg.find(x=>E.uci(x)===bu),thr=bm?mateThreat(E.apply(pos,bm)):'';
  $('#hint').innerHTML=`${lab}: <b>${nm(bu)}</b>${info.book?' · 📖 теория':''}${thr?`<br><span class="warn">⚠ Угроза: после этого хода соперник ставит мат ${thr}</span>`:''}`;
  if(hint)$('#arrow').innerHTML=arrow(bu,'#22c55e',2.8,.9);BM=bu;$('#pl').hidden=false}
 else{const pr=E.uci(E.pick(r,l,{ply:hist.length}).m);$('#hint').innerHTML=`Вероятный ход соперника: <b>${nm(pr)}</b>`;
  if(hint)$('#arrow').innerHTML=arrow(pr,'#ef4444',1.6,.75)}
 $('#alt').textContent='Другие варианты: '+r.slice(1,3).map(o=>E.san(pos,o.m,leg)+' ('+fmt(ws*o.s)+')').join(', ')}
const PIECES=['K','Q','R','B','N','P'];
function renderPal(){const mk=(col)=>PIECES.map(x=>{const ch=col==='w'?x:x.toLowerCase();return`<button data-p="${ch}" class="${pick===ch?'on':''}"${col==='w'?' data-w=1':''}>${G[x]}</button>`}).join('')+`<button data-p="" class="${pick===''?'on':''}">✕</button>`;
 $('#palT').innerHTML=mk('b');$('#palB').innerHTML=mk('w')}
function go(){const t=++tk;
 if(edit){draw();$('#arrow').innerHTML='';$('#pl').hidden=true;$('#hint').textContent='Редактор: выбери фигуру сверху или снизу и ставь на доску (✕ — стереть)';$('#st').textContent='Режим редактора';$('#st').className='edit';renderPal();return}
 $('#st').className='';draw();$('#arrow').innerHTML='';$('#pl').hidden=true;$('#hint').textContent='';$('#alt').textContent='';$('#lines').innerHTML='';status();renderMoves();save();
 if(over()){if(!autoRev&&hist.length){autoRev=true;review().then(recap)}return}$('#hint').textContent='Считаю…';setTimeout(()=>think(t).catch(()=>{$('#hint').textContent='Ошибка расчёта, попробуй ещё раз'}),20)}
function push(m,quiet){const p=pos,isMe=p.t===me,u=E.uci(m),hs=hist.slice(),pk=lastK();
 mi.push(null);sans.push(E.san(p,m,leg));stack.push([p,hm]);hist.push(u);
 hm=(p.b[m.f].toLowerCase()==='p'||p.b[m.t])?0:hm+1;pos=E.apply(p,m);keys.push(key(pos));leg=E.legal(pos);
 if(!quiet)gradeLater(p,m,isMe,pk,hs,mi.length-1,u)}
async function gradeLater(p,m,isMe,pk,hs,ix,u){try{const info=await analyzeAtA(p,hs);if(!info)return;const c=await classifyA(p,m,info,isMe,pk,hs);
 if(hist[ix]!==u)return;mi[ix]=c;if(ix===hist.length-1)msg=(isMe?'Ты: ':'Соперник: ')+sans[ix]+' — '+CLS[c.k].n+(c.pl>0?' (−'+c.pl.toFixed(1)+'%)':'');renderMoves();if(!edit)draw();status()}catch(e){}}
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
const toUci=str=>{let s=E.start(),out=[];for(const t of str.split(' ')){const L=E.legal(s),tt=t.replace(/[+#]/g,''),m=L.find(x=>E.san(s,x,L).replace(/[+#]/g,'')===tt);if(!m)return null;out.push(E.uci(m));s=E.apply(s,m)}return out};
const FAM=Book.games.map(g=>({n:g.n,m:toUci(g.s)}));
function famous(h){if(!h.length)return'';const f=FAM.find(g=>g.m&&h.length<=g.m.length&&g.m.slice(0,h.length).join()===h.join());return f?f.n:''}
function mateThreat(n){for(const x of E.legal(n)){const a2=E.apply(n,x);if(E.inCheck(a2)&&!E.legal(a2).length)return E.san(n,x)}return''}
function practical(r,l){if(l.tier>1||r.length<2)return r[0];const f=b=>(pos.t==='w'?1:-1)*E.ev(b);let best=r[0],bs=-1e9;
 for(const o of r.filter(o=>r[0].s-o.s<=40).slice(0,6)){const n=E.apply(pos,o.m),base=f(n.b),q=E.legal(n);
  const cnt=q.filter(x=>f(E.apply(n,x).b)-base>=150).length,sc=o.s+cnt*25;if(sc>bs){bs=sc;best=o}}
 return best}
const pgnText=()=>sans.map((s,i)=>(i%2?'':((i>>1)+1)+'. ')+s).join(' ');
async function review(){if(busy||!hist.length)return;busy=true;const l=L(),lv={...l,ms:Math.min(l.ms,300)},H=hist.slice(),out=[],sides=[];let p=E.fromFen(sf),h=[];
 try{for(let i=0;i<H.length;i++){$('#sum').textContent=`Анализ партии: ${i+1} из ${H.length}…`;await new Promise(r=>setTimeout(r,0));
  const u=H[i],m=E.legal(p).find(x=>E.uci(x)===u);if(!m)break;const info=await analyzeAtA(p,h,{...lv,sms:Math.min(l.sms,300)});
  const c=await classifyA(p,m,info,p.t===me,out.length?out[out.length-1].k:'',h);c.bs=info.r.length?E.san(p,info.r[0].m,E.legal(p)):'';out.push(c);sides.push(p.t);h.push(u);p=E.apply(p,m)}}
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
 const items=R.out.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.pl>=5&&['blunder','mistake','miss','inaccuracy'].includes(x.c.k)).sort((a,b)=>b.c.loss-a.c.loss).slice(0,3);
 $('#recap').innerHTML=`<b>Разбор партии</b><div class="muted">${over()||'Партия не завершена'}</div>`+(items.length?items.map(x=>`<div class="rc">${ic(x.c.k)}<b>${num(x.i)}${R.sans[x.i]}</b> — ${CLS[x.c.k].n}, потеря ${x.c.pl.toFixed(1)}%${x.c.bs&&x.c.bs!==R.sans[x.i]?`<div class="muted">Лучше было: ${x.c.bs}</div>`:''}</div>`).join(''):'<div class="muted">Серьёзных ошибок не найдено</div>')}
// --- обработчики ---
$('#board').onclick=e=>{const s=e.target.closest('.sq');if(!s)return;const i=+s.dataset.i;
 if(edit){if(pick!==null){pos.b[i]=pick;draw()}return}
 if(over())return;const c=leg.filter(x=>x.f===sel&&x.t===i);
 if(c.length>1){promo(c);return}if(c.length){play(c[0]);return}
 const p=pos.b[i];sel=p&&(p===p.toUpperCase())===(pos.t==='w')?i:null;draw()};
$('#lv').onclick=e=>{const b=e.target.closest('button');if(!b)return;li=+b.dataset.i;chips();go()};
$('#lines').onclick=e=>{const d=e.target.closest('.ln');if(!d)return;const m=leg.find(x=>E.uci(x)===d.dataset.u);if(m)play(m)};
$('#un').onclick=()=>{if(!stack.length)return;autoRev=false;const[pp,h]=stack.pop();pos=pp;hm=h;hist.pop();sans.pop();mi.pop();keys.pop();leg=E.legal(pos);sel=null;msg='';go()};
$('#nw').onclick=()=>reset(STD);
$('#oc').onclick=()=>reset(ONLYK);
$('#ed').onclick=()=>{if(!edit){edit=true;pick=null;$('#palT').hidden=false;$('#palB').hidden=false;sel=null;go();return}
 let f=null;try{f=E.toFen(pos,hm,(hist.length>>1)+1);E.fromFen(f)}catch(e){alert('Позиция некорректна: нужны обе стороны с королём и не под шахом у соперника');go();return}
 edit=false;$('#palT').hidden=true;$('#palB').hidden=true;reset(f)};
const palClick=e=>{const b=e.target.closest('button');if(!b)return;pick=b.dataset.p;renderPal()};
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
   return`<div class="ln" data-g="${i}"><span class="evc">${won?'1-0':ok?'½':'0-1'}</span><span>vs ${opp} · ${(g.time_class||'')} · ${new Date((g.end_time||0)*1000).toLocaleDateString('ru-RU')}</span></div>`}).join('');
  window._cgames=games}
 catch(e){$('#cg').innerHTML='Не удалось загрузить ('+e.message+'). Открой партию на chess.com, скопируй PGN и вставь его в поле ниже.'}}
$('#cl').onclick=()=>importChess();
$('#cg').onclick=e=>{const d=e.target.closest('.ln');if(!d||!window._cgames)return;const g=window._cgames[+d.dataset.g];if(g){loadPgn(g.pgn);$('#cg').insertAdjacentHTML('afterbegin','<div class="muted">Открыта партия, разбор будет после окончания.</div>')}};
chips();legend();if(!restore())reset();
SF.init().then(f=>{if(f){$('#eng').textContent='Stockfish';CACHE={};if(!edit)go()}else $('#eng').textContent='встроенный движок'});
