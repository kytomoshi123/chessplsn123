// Вкладка «Обучение»: уроки, тренажёры дебютов, задачи, эндшпильные упражнения, видение доски.
// Работает поверх доски и движка основного приложения (app.js).
(function(){
'use strict';
const LS='cp-learn';let done={};try{done=JSON.parse(localStorage.getItem(LS))||{}}catch(e){}
const persist=()=>{try{localStorage.setItem(LS,JSON.stringify(done))}catch(e){}};
const Lr=globalThis.Learn={active:false};
let cur=null,st={},TM=[];
const root=()=>$('#learn'),later=(f,ms)=>{TM.push(setTimeout(f,ms))},clearT=()=>{TM.forEach(clearTimeout);TM=[]};
const sqn=i=>'abcdefgh'[i&7]+(8-(i>>3)),R=n=>Math.floor(Math.random()*n);
const items=()=>LESSONS.flatMap(M=>M.items),doneCount=()=>items().filter(x=>done[x.id]).length;
const rank=n=>n<5?'Новичок':n<15?'Ученик':n<30?'Любитель':'Сильный любитель';
const say=(h,k)=>{const e=$('#lmsg');if(e){e.innerHTML=h;e.className='lmsg '+(k||'')}};
const clearArrow=()=>{$('#arrow').innerHTML=''};
function flash(sq){LM.set(sq,'bad');draw();later(()=>{LM.delete(sq);draw()},700)}
function setBoard(fen,meSide){reset(fen);me=meSide||pos.t;flip=me==='b';sel=null;LM.clear();clearArrow();draw()}
function blank(fl){reset('4k3/8/8/8/8/8/8/4K3 w - - 0 1');pos.b=Array(64).fill('');leg=[];me='w';flip=!!fl;sel=null;LM.clear();clearArrow();draw()}
// ---------- вспомогательные расчёты ----------
const D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],N8=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
function attacks(b,i){const c=b[i],t=c.toLowerCase(),x=i&7,y=i>>3,out=[],add=(nx,ny)=>{if(nx>=0&&nx<8&&ny>=0&&ny<8)out.push(ny*8+nx)};
 if(t==='n')N8.forEach(([a,d])=>add(x+a,y+d));else if(t==='k')D8.forEach(([a,d])=>add(x+a,y+d));
 else if(t==='p'){const d=c===c.toUpperCase()?-1:1;add(x-1,y+d);add(x+1,y+d)}
 else{const d0=t==='b'?4:0,d1=t==='r'?4:8;for(let k=d0;k<d1;k++){let nx=x+D8[k][0],ny=y+D8[k][1];while(nx>=0&&nx<8&&ny>=0&&ny<8){out.push(ny*8+nx);if(b[ny*8+nx])break;nx+=D8[k][0];ny+=D8[k][1]}}}
 return out}
const mate1=s=>E.legal(s).some(m=>{const q=E.apply(s,m);return E.inCheck(q)&&!E.legal(q).length});
function dbPosition(minPly,maxPly){const L=(typeof OPDB!=='undefined'&&OPDB.length)?OPDB:null;for(let t=0;t<60;t++){let u;if(L){u=L[R(L.length)][2].split(' ')}else{u='e2e4 e7e5 g1f3 b8c6 f1c4 g8f6'.split(' ')}if(u.length<minPly)continue;
  let s=E.start();const k=Math.min(u.length,minPly+R(maxPly-minPly+1));let okk=true;for(let i=0;i<k;i++){const m=E.legal(s).find(x=>E.uci(x)===u[i]);if(!m){okk=false;break}s=E.apply(s,m)}if(okk&&E.legal(s).length)return s}
 return E.start()}
// ---------- меню ----------
function setStart(){reset(STD);me='w';flip=false;LM.clear();clearArrow();draw()}
function menu(){cur=null;st={};clearT();const total=items().length,dn=doneCount();
 root().innerHTML=`<div class="lhd"><b>Обучение</b><span class="chip">${rank(dn)}</span></div><div class="lprog"><div style="width:${Math.round(dn/total*100)}%"></div></div><div class="muted">Пройдено ${dn} из ${total}. Выбери тему и решай задания на доске слева.</div>`+
 LESSONS.map((M,mi)=>`<div class="lmod"><b>${M.title}</b><div class="muted">${M.sub}</div><div class="lgrid">${M.items.map((it,ii)=>`<button class="litem ${done[it.id]?'dn':''}" data-m="${mi}" data-i="${ii}">${done[it.id]?'✓ ':''}${it.title}</button>`).join('')}</div></div>`).join('');
 setStart()}
function frame(it,extra){const mod=LESSONS[cur.m];root().innerHTML=`<div class="lhd"><button data-act="back">← К списку</button><span class="muted">${mod.title}</span></div><h3>${it.title}</h3><div class="ltext">${extra||''}</div><div id="lmsg" class="lmsg"></div><div class="lbtn" id="lbtn"></div>`}
function btns(list){$('#lbtn').innerHTML=list.map(([a,t,c])=>`<button data-act="${a}" class="${c||''}">${t}</button>`).join('')}
function open(mi,ii){clearT();cur={m:mi,i:ii};const it=LESSONS[mi].items[ii];st={it,tries:0,over:false};LM.clear();clearArrow();
 const T={text:openText,puzzle:openPuzzle,avoid:openPuzzle,drill:openDrill,line:openLine,game:openGame,vision:openVision}[it.type];T(it)}
function finish(it){done[it.id]=true;persist();st.over=true;const nx=LESSONS[cur.m].items[cur.i+1];
 btns([['retry','Ещё раз'],nx?['next','Дальше →','go']:['back','К списку','go']])}
// ---------- текст ----------
function openText(it){frame(it,it.body);setStart();done[it.id]=true;persist();const nx=LESSONS[cur.m].items[cur.i+1];btns([nx?['next','Дальше →','go']:['back','К списку','go']])}
// ---------- задачи на один ход ----------
function openPuzzle(it){frame(it,it.text);setBoard(it.fen);st.tries=0;st.over=false;say('Твой ход ('+(me==='w'?'белые':'чёрные')+').');btns([['hint','Подсказка'],['retry','Заново']])}
function onPuzzle(m){if(st.over)return;const it=st.it,u=E.uci(m),q=E.apply(pos,m);
 if(it.type==='puzzle'){
  if(it.accept.includes(u)){push(m,true);go();clearArrow();say('✅ Верно! '+it.explain,'ok');finish(it)}
  else{st.tries++;flash(m.t);say('❌ Не то. '+(st.tries>=2?'Нажми «Подсказка».':'Подумай: что можно взять, чем сделать шах или создать угрозу?'),'bad')}return}
 // avoid
 let bad='';if(it.kind==='nomate1'&&mate1(q))bad='после этого хода у соперника есть мат в один ход.';
 if(it.kind==='nostalemate'){if(!E.legal(q).length&&!E.inCheck(q))bad='это пат: ничья!';else if(E.legal(q).some(x=>q.b[x.t]))bad='соперник может взять твою фигуру.'}
 if(bad){st.tries++;flash(m.t);say('❌ Не годится: '+bad,'bad')}
 else{push(m,true);go();say('✅ Хороший ход! '+it.explain,'ok');finish(it)}}
// ---------- упражнения против движка ----------
function openDrill(it){frame(it,it.text);setBoard(it.fen,'w');st.moves=0;st.q0=pos.b.filter(c=>c==='Q').length;st.over=false;say('Играй за белых. Осталось ходов: '+it.maxMoves+'.');btns([['hint','Подсказка'],['retry','Заново']]);if(pos.t!==me)later(oppDrill,500)}
function checkEnd(){const it=st.it;
 if(!leg.length){if(E.inCheck(pos)){if(pos.t!==me){say('✅ Мат! '+it.explain,'ok');finish(it)}else{say('❌ Тебе поставили мат. Попробуй ещё раз.','bad');st.over=true;btns([['retry','Заново']])}}
  else{say('❌ Пат: ничья! Так нельзя: перед ходом проверь, что у короля соперника останется ход.','bad');st.over=true;btns([['retry','Заново']])}return true}
 if(E.insuff(pos)){say('❌ Недостаточно материала для победы.','bad');st.over=true;btns([['retry','Заново']]);return true}
 if(it.goal==='promote'&&pos.b.filter(c=>c==='Q').length>st.q0){say('✅ Пешка превратилась в ферзя! '+it.explain,'ok');finish(it);return true}
 if(st.moves>=it.maxMoves){say('❌ Слишком много ходов. Попробуй найти более прямой путь.','bad');st.over=true;btns([['retry','Заново'],['hint','Подсказка']]);return true}
 say('Играй за белых. Осталось ходов: '+(it.maxMoves-st.moves)+'.');return false}
// Лучший ход для упражнений: Stockfish, если он загрузился, иначе встроенное ядро
async function best(p,ms){if(typeof SF!=='undefined'&&SF.on){try{const L=await SF.analyze(E.toFen(p,0,1),{ms,mpv:1});if(L&&L.length)return L[0].u}catch(e){}}
 const r=E.analyze(p,{d:10,ms,q:1,margin:0,k:0.004,tier:3,tol:0,pb:0,sms:ms,mpv:1,cap:ms,sd:10});return E.uci(r[0].m)}
async function oppDrill(){if(!Lr.active||st.over||pos.t===me||!leg.length)return;const key=st;const u=await best(pos,250);if(!Lr.active||st!==key||st.over||pos.t===me)return;const m=leg.find(x=>E.uci(x)===u)||leg[0];push(m,true);go();checkEnd()}
function onDrill(m){if(st.over||pos.t!==me)return;push(m,true);go();clearArrow();st.moves++;if(checkEnd())return;later(oppDrill,450)}
// ---------- тренажёр дебюта ----------
function openLine(it){frame(it,`<p>Играй за ${it.side==='w'?'белых':'чёрных'} и повторяй ходы теории. Соперник отвечает по книге.</p><p><b>План:</b> ${it.plan}</p>`);setBoard(STD,it.side);st.moves=it.moves.split(' ');st.i=0;st.over=false;st.tries=0;say('Твой ход.');btns([['hint','Показать ход'],['retry','Заново']]);if(pos.t!==me)later(autoOpp,500)}
function autoOpp(){if(!Lr.active||st.over)return;if(st.i>=st.moves.length)return lineDone();if(pos.t===me)return;const m=leg.find(x=>E.uci(x)===st.moves[st.i]);if(!m)return;push(m,true);st.i++;go();if(st.i>=st.moves.length)return lineDone();if(pos.t!==me)later(autoOpp,350)}
function lineDone(){const it=st.it;say('✅ Линия пройдена! <br><b>Советы:</b> '+it.tips,'ok');clearArrow();finish(it)}
function onLine(m){if(st.over||pos.t!==me)return;const exp=st.moves[st.i],u=E.uci(m);
 if(u===exp){push(m,true);st.i++;st.tries=0;clearArrow();go();if(st.i>=st.moves.length)return lineDone();say('✅ Верно.','ok');later(autoOpp,400)}
 else{st.tries++;flash(m.t);say('❌ Это не ход из теории.'+(st.tries>=2?' Нажми «Показать ход».':''),'bad')}}
// ---------- разбор знаменитых партий ----------
function openGame(it){frame(it,'<p>Листай ходы кнопками и читай комментарии. Это настоящая партия.</p>');st.moves=it.moves.split(' ');st.n=0;showGame(0)}
function showGame(n){st.n=Math.max(0,Math.min(st.moves.length,n));reset(STD);me='w';flip=false;LM.clear();for(let i=0;i<st.n;i++){const m=leg.find(x=>E.uci(x)===st.moves[i]);push(m,true)}draw();
 const c=st.n>0&&st.it.comments[st.n-1];say(st.n===0?'Начальная позиция.':'<b>Ход '+st.n+' из '+st.moves.length+'.</b> '+(c||''),c?'ok':'');
 btns([['gprev','← Назад'],['gnext','Вперёд →','go'],['gauto','▶ Авто']]);if(st.n>=st.moves.length){done[st.it.id]=true;persist()}}
// ---------- видение доски ----------
function openVision(it){frame(it,`<p>${it.text}</p>`);st={it,round:0,score:0,total:it.total,kind:it.kind,over:false,sel:new Set()};nextRound()}
function nextRound(){if(!Lr.active)return;LM.clear();clearArrow();st.sel=new Set();st.answered=false;if(st.round>=st.total)return endVision();st.round++;const k=st.kind,pre=`<b>Раунд ${st.round}/${st.total}</b> · счёт ${st.score}. `;
 if(k==='find'){blank(Math.random()<.5);st.target=R(64);say(pre+'Нажми на поле <b>'+sqn(st.target)+'</b>.');btns([['back','Выйти']])}
 else if(k==='name'){blank(Math.random()<.5);st.target=R(64);LM.set(st.target,'hl');draw();const o=new Set([sqn(st.target)]);while(o.size<4)o.add(sqn(R(64)));const opts=[...o].sort(()=>Math.random()-.5);say(pre+'Как называется подсвеченное поле?');$('#lbtn').innerHTML=opts.map(x=>`<button data-act="ans" data-a="${x}">${x}</button>`).join('')}
 else if(k==='knight'){blank(Math.random()<.5);st.target=R(64);pos.b[st.target]='N';draw();st.goal=new Set(attacks(pos.b,st.target));say(pre+'Отметь все поля, куда прыгнет конь, и нажми «Проверить».');btns([['check','Проверить','go']])}
 else if(k==='attacks'){let s,cands=[];for(let t=0;t<40&&!cands.length;t++){s=dbPosition(8,16);cands=[];for(let i=0;i<64;i++){const c=s.b[i];if(c&&c.toLowerCase()!=='k'&&attacks(s.b,i).length>=2)cands.push(i)}}
  setBoard(E.toFen(s,0,1),'w');st.target=cands[R(cands.length)];LM.set(st.target,'hl2');draw();st.goal=new Set(attacks(pos.b,st.target));say(pre+'Отметь все поля, которые атакует подсвеченная фигура, и нажми «Проверить».');btns([['check','Проверить','go']])}
 else if(k==='check'){let s,chk=[];for(let t=0;t<60&&!chk.length;t++){s=dbPosition(6,14);chk=E.legal(s).filter(m=>E.inCheck(E.apply(s,m)))}
  setBoard(E.toFen(s,0,1));st.done=false;say(pre+'Ходят '+(me==='w'?'белые':'чёрные')+'. Найди любой ход, который ставит шах.');btns([['skip','Пропустить']])}}
function endVision(){const need=Math.ceil(st.total*.8),okk=st.score>=need;blank(false);say((okk?'✅ ':'')+'Результат: <b>'+st.score+' из '+st.total+'</b>. '+(okk?'Тема пройдена!':'Нужно минимум '+need+'. Попробуй ещё раз.'),okk?'ok':'bad');
 if(okk){done[st.it.id]=true;persist()}const nx=LESSONS[cur.m].items[cur.i+1];btns([['retry','Ещё раз'],nx?['next','Дальше →','go']:['back','К списку','go']])}
function answer(good){if(st.answered)return;st.answered=true;if(good)st.score++;later(nextRound,good?600:1100)}
function onSquareV(i){const k=st.kind;if(st.answered)return true;
 if(k==='find'){if(i===st.target){LM.set(i,'ok');say('✅ Верно!','ok');answer(true)}else{LM.set(i,'bad');LM.set(st.target,'ok');say('❌ Это '+sqn(i)+'. Нужное поле показано зелёным.','bad');answer(false)}draw();return true}
 if(k==='knight'||k==='attacks'){if(i===st.target)return true;if(st.sel.has(i)){st.sel.delete(i);LM.delete(i)}else{st.sel.add(i);LM.set(i,'hl')}draw();return true}
 return k==='name'}
function checkSet(){if(st.answered)return;const good=st.goal.size===st.sel.size&&[...st.goal].every(x=>st.sel.has(x));LM.clear();if(st.kind==='attacks')LM.set(st.target,'hl2');
 for(const g of st.goal)LM.set(g,st.sel.has(g)?'ok':'miss');for(const s of st.sel)if(!st.goal.has(s))LM.set(s,'bad');draw();
 say(good?'✅ Всё верно!':'❌ Зелёные поля выбраны верно, красные лишние, синие пропущены.',good?'ok':'bad');answer(good)}
function onCheck(m){if(st.answered)return;const q=E.apply(pos,m);if(E.inCheck(q)){push(m,true);go();say('✅ Шах!','ok');answer(true)}else{flash(m.t);st.tries=(st.tries||0)+1;say('❌ Это не шах. Попробуй ещё или нажми «Пропустить».','bad')}}
// ---------- события ----------
Lr.onUser=m=>{const it=st.it;if(!it)return;if(it.type==='puzzle'||it.type==='avoid')onPuzzle(m);else if(it.type==='drill')onDrill(m);else if(it.type==='line')onLine(m);else if(it.type==='vision'&&st.kind==='check')onCheck(m)};
Lr.onSquare=i=>{const it=st.it;if(!it)return false;if(it.type==='vision')return onSquareV(i);if(it.type==='game'||it.type==='text')return true;return false};
function hint(){const it=st.it;if(!it)return;
 if(it.type==='puzzle'){const u=it.accept[0];$('#arrow').innerHTML=arrow(u,'#22c55e',3.2,.9);say('Лучший ход показан стрелкой.')}
 else if(it.type==='line'){const u=st.moves[st.i];if(u&&pos.t===me){$('#arrow').innerHTML=arrow(u,'#22c55e',3.2,.9);say('Ход из теории показан стрелкой.')}}
 else if(it.type==='drill'&&pos.t===me&&!st.over){const key=st;say('Считаю подсказку…');best(pos,400).then(u=>{if(!Lr.active||st!==key||st.over||pos.t!==me)return;$('#arrow').innerHTML=arrow(u,'#22c55e',3.2,.9);say('Подсказка: лучший ход показан стрелкой.')})}
 else if(it.type==='avoid'){say('Подсказка: '+(it.kind==='nomate1'?'найди ход, который закрывает f7 или отгоняет ферзя.':'проверь, что у чёрного короля остаётся поле для хода.'))}}
function act(a,d){
 if(a==='back')return menu();
 if(a==='next'){const M=LESSONS[cur.m];return cur.i+1<M.items.length?open(cur.m,cur.i+1):menu()}
 if(a==='retry')return open(cur.m,cur.i);
 if(a==='hint')return hint();
 if(a==='check')return checkSet();
 if(a==='skip'){st.answered=true;later(nextRound,100);return}
 if(a==='ans'){if(st.answered)return;const good=d===sqn(st.target);say(good?'✅ Верно!':'❌ Это поле называется '+sqn(st.target)+'.',good?'ok':'bad');answer(good);return}
 if(a==='gprev')return showGame(st.n-1);if(a==='gnext')return showGame(st.n+1);
 if(a==='gauto'){const step=()=>{if(!Lr.active||st.n>=st.moves.length)return;showGame(st.n+1);later(step,1300)};step()}}
function bind(){const r=root();if(!r||r._b)return;r._b=1;r.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.act)return act(b.dataset.act,b.dataset.a);if(b.dataset.m!==undefined)open(+b.dataset.m,+b.dataset.i)}}
function tabs(){$('#tabPlay').className=Lr.active?'':'on';$('#tabLearn').className=Lr.active?'on':''}
function enter(){if(Lr.active)return;Lr.active=true;document.body.classList.add('learn');edit=false;bind();tabs();menu()}
function leave(){if(!Lr.active)return;clearT();Lr.active=false;document.body.classList.remove('learn');LM.clear();clearArrow();tabs();if(!restore())reset()}
Lr.act=act;Lr.showGame=showGame;Lr.enter=enter;Lr.leave=leave;Lr.open=open;Lr.menu=menu;Lr.state=()=>st;Lr.attacks=attacks;
const tp=$('#tabPlay'),tl=$('#tabLearn');if(tp)tp.onclick=leave;if(tl)tl.onclick=enter;
})();
