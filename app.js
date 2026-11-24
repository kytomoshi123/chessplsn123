const E=Eng,$=s=>document.querySelector(s),G={K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟'};
let BM='',li=1,me='w',pos,stack=[],hist=[],sel=null,leg=[],hint=true,bot=false,flip=false,A=null,msg='',tk=0;
const L=()=>E.LV[li],idx=s=>'abcdefgh'.indexOf(s[0])+(8-s[1])*8;
function chips(){$('#lv').innerHTML=E.LV.map((l,i)=>`<button class="${i==li?'on':''}" data-i="${i}">${l.n}</button>`).join('');
const names=[...new Set(Book.list(L().tier))];
$('#lvinfo').innerHTML=`<b>Раздел ${L().n}</b><br>${L().desc}<small>Дебюты раздела: ${names.join(', ')}</small>`}
function draw(){const bd=$('#board'),lm=hist.length?hist[hist.length-1]:'',lf=lm&&idx(lm.slice(0,2)),lt=lm&&idx(lm.slice(2,4));bd.innerHTML='';
for(let d=0;d<64;d++){const i=flip?63-d:d,c=pos.b[i],e=document.createElement('div');
e.className='sq '+(((i&7)+(i>>3))&1?'d':'l')+(sel===i?' sel':'')+(lm&&(i===lf||i===lt)?' last':'')+(sel!==null&&leg.some(m=>m.f===sel&&m.t===i)?' tg':'');e.dataset.i=i;
if(c){const s=document.createElement('span');s.className='pc '+(c===c.toUpperCase()?'w':'b');s.textContent=G[c.toUpperCase()];e.append(s)}bd.append(e)}}
function arrow(u){const p=i=>[(flip?7-(i&7):i&7)*10+5,(flip?7-(i>>3):i>>3)*10+5],[x1,y1]=p(idx(u.slice(0,2))),[x2,y2]=p(idx(u.slice(2,4))),n=Math.hypot(x2-x1,y2-y1),ux=(x2-x1)/n,uy=(y2-y1)/n,bx=x2-ux*4.5,by=y2-uy*4.5;
return`<line x1="${x1}" y1="${y1}" x2="${bx}" y2="${by}" stroke="#22c55e" stroke-width="2.4" stroke-linecap="round" opacity=".85"/><polygon points="${x2},${y2} ${bx-uy*3},${by+ux*3} ${bx+uy*3},${by-ux*3}" fill="#22c55e" opacity=".9"/>`}
function status(){let t;if(!leg.length)t=E.inCheck(pos)?(pos.t==='w'?'Мат. Победили чёрные':'Мат. Победили белые'):'Пат — ничья';else t=(pos.t==='w'?'Ход белых':'Ход чёрных')+(E.inCheck(pos)?' · шах!':'');
$('#st').textContent=t;const n=Book.name(hist);$('#op').textContent=n?'📖 '+n:'';$('#gr').textContent=msg;
$('#mv').textContent=hist.map((u,i)=>(i%2?'':(i/2+1|0)+'. ')+u.slice(0,2)+'–'+u.slice(2)).join(' ')}
function go(){leg=E.legal(pos);draw();$('#arrow').innerHTML='';$('#hint').textContent='';status();if(!leg.length)return;const t=++tk;setTimeout(()=>think(t),40)}
function think(t){if(t!==tk)return;A=null;$('#pl').hidden=true;
if(pos.t!==me){$('#hint').textContent='Ход соперника — повтори его на доске';return}
const b=Book.move(hist,L().tier,L().bk);let mv;
if(b){mv=b.mv;A={book:1,mv}}else{const r=E.analyze(pos,L()),p=E.pick(r,L());A={book:0,r};mv=E.uci(p.m)}
BM=mv;if(hint){$('#arrow').innerHTML=arrow(mv);$('#hint').textContent='Лучший ход: '+mv.slice(0,2)+'–'+mv.slice(2)+(b?' (теория)':'');$('#pl').hidden=false}}
function play(m){const u=E.uci(m);
if(A&&pos.t===me){if(A.book)msg=u===A.mv?'📖 Ход из теории':'Вне теории';else{const o=A.r.find(x=>E.uci(x.m)===u),d=A.r[0].s-(o?o.s:0);
msg=d<=15?'✅ Лучший ход':d<60?'👍 Хороший ход':d<150?'⚠️ Неточность':d<300?'❌ Ошибка':'💥 Зевок'}}else msg='';
stack.push(pos);hist.push(u);pos=E.apply(pos,m);sel=null;go()}
function reset(f){try{pos=f?E.fromFen(f):E.start()}catch(e){alert('Неверный FEN');return}stack=[];hist=[];sel=null;msg='';A=null;go()}
$('#board').onclick=e=>{const s=e.target.closest('.sq');if(!s||(bot&&pos.t!==me))return;const i=+s.dataset.i,m=leg.find(x=>x.f===sel&&x.t===i&&(!x.p||x.p==='q'));
if(m){sel=null;play(m);return}const c=pos.b[i];sel=c&&(c===c.toUpperCase())===(pos.t==='w')?i:null;draw()};
$('#lv').onclick=e=>{const b=e.target.closest('button');if(!b)return;li=+b.dataset.i;chips();go()};
$('#nw').onclick=()=>reset();
$('#un').onclick=()=>{if(!stack.length)return;do{pos=stack.pop();hist.pop()}while(bot&&stack.length&&pos.t!==me);msg='';sel=null;go()};
$('#fl').onclick=()=>{flip=!flip;go()};
$('#side').onchange=e=>{me=e.target.value;flip=me==='b';sel=null;go()};
$('#sw').onclick=()=>{me=me==='w'?'b':'w';$('#side').value=me;flip=me==='b';sel=null;go()};
$('#pl').onclick=()=>{const m=leg.find(x=>E.uci(x)===BM);if(m)play(m)};
$('#hn').onchange=e=>{hint=e.target.checked;go()};
$('#lf').onclick=()=>reset($('#fen').value);
chips();reset();
