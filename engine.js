// ChessPlan engine: правила + поиск alpha-beta. Сила зависит от уровня (LV).
(function(g){
const V={p:100,n:320,b:330,r:500,q:900,k:0},
N=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]],
K=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const isW=c=>c===c.toUpperCase(),sq=i=>'abcdefgh'[i&7]+(8-(i>>3)),uci=m=>sq(m.f)+sq(m.t)+(m.p||'');
// Уровни: d=глубина, ms=время, q=форсированный поиск взятий, noise=случайный шум (оценки), r=шанс случайного хода, bk=сколько полуходов дебютной теории, tier=сложность дебютов
const LV=[
{n:'100–300',d:1,ms:150,q:0,noise:450,r:.35,bk:4,tier:0,desc:'Бот часто зевает фигуры и ходит почти наугад. Учись: развитие фигур, рокировка, не оставлять фигуры без защиты.'},
{n:'400–600',d:1,ms:150,q:0,noise:260,r:.15,bk:6,tier:0,desc:'Берёт то, что висит, но не видит угроз на 2 хода. Ловись на простые вилки и связки.'},
{n:'700–900',d:2,ms:300,q:0,noise:150,r:.06,bk:8,tier:1,desc:'Видит простую тактику на 1–2 хода. Выбирай понятные дебюты и играй на ошибки.'},
{n:'1000–1200',d:2,ms:400,q:0,noise:80,r:.02,bk:10,tier:1,desc:'Знает базовую теорию, редко зевает. Работай над пешечной структурой и планом.'},
{n:'1300–1500',d:3,ms:600,q:0,noise:40,r:0,bk:14,tier:2,desc:'Играет осмысленно, тактика на 3 хода. Нужна точная теория и эндшпиль.'},
{n:'1600–1800',d:3,ms:900,q:1,noise:15,r:0,bk:20,tier:2,desc:'Хорошо считает размены. Знает основные дебюты глубоко. Ошибки дорого стоят.'},
{n:'1900+',d:4,ms:1500,q:1,noise:0,r:0,bk:40,tier:3,desc:'Максимум этого движка: глубокая теория и чистая тактика. Для настоящей силы подключи Stockfish (см. README).'}];
function fromFen(f){const p=f.trim().split(/\s+/),b=[];for(const ch of p[0]){if(ch==='/')continue;if(/\d/.test(ch))for(let i=0;i<+ch;i++)b.push('');else b.push(ch)}
if(b.length!==64)throw new Error('FEN');return{b,t:p[1]||'w',c:p[2]&&p[2]!=='-'?p[2]:'',e:p[3]&&p[3]!=='-'?(8-p[3][1])*8+'abcdefgh'.indexOf(p[3][0]):-1}}
const start=()=>fromFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
function att(b,s,w){const x=s&7,y=s>>3,at=(a,c)=>a>=0&&a<8&&c>=0&&c<8?b[c*8+a]:'',P=w?'P':'p',Nn=w?'N':'n',Kk=w?'K':'k',R=w?'R':'r',B=w?'B':'b',Q=w?'Q':'q',py=w?y+1:y-1;
if(at(x-1,py)===P||at(x+1,py)===P)return 1;
for(const[a,c]of N)if(at(x+a,y+c)===Nn)return 1;
for(const[a,c]of K)if(at(x+a,y+c)===Kk)return 1;
for(let k=0;k<8;k++){const[dx,dy]=K[k];let a=x+dx,c=y+dy;while(a>=0&&a<8&&c>=0&&c<8){const p=b[c*8+a];if(p){if(p===Q||p===(k<4?R:B))return 1;break}a+=dx;c+=dy}}return 0}
const kAtt=(b,w)=>{const k=b.indexOf(w?'K':'k');return k<0?0:att(b,k,!w)};
function gen(s,caps){const b=s.b,w=s.t==='w',out=[];
for(let i=0;i<64;i++){const c=b[i];if(!c||isW(c)!==w)continue;const x=i&7,y=i>>3,u=c.toLowerCase();
const add=(t,p)=>out.push({f:i,t,p,v:(b[t]?V[b[t].toLowerCase()]*10-V[u]:0)+(p?900:0)});
if(u==='p'){const d=w?-1:1,y1=y+d,pr=w?y1===0:y1===7,push=t=>{if(pr){add(t,'q');add(t,'n')}else add(t)};
if(!caps||pr)if(!b[y1*8+x]){push(y1*8+x);if(!caps&&y===(w?6:1)&&!b[(y1+d)*8+x])add((y1+d)*8+x)}
for(const dx of[-1,1]){const nx=x+dx;if(nx<0||nx>7)continue;const t=y1*8+nx;if(b[t]&&isW(b[t])!==w)push(t);else if(t===s.e)add(t)}}
else if(u==='n'||u==='k'){for(const[dx,dy]of u==='n'?N:K){const nx=x+dx,ny=y+dy;if(nx<0||nx>7||ny<0||ny>7)continue;const t=ny*8+nx;if((!b[t]||isW(b[t])!==w)&&(!caps||b[t]))add(t)}
if(u==='k'&&!caps&&i===(w?60:4)&&!att(b,i,!w)){const k=i;
if(s.c.includes(w?'K':'k')&&!b[k+1]&&!b[k+2]&&b[k+3]===(w?'R':'r')&&!att(b,k+1,!w)&&!att(b,k+2,!w))add(k+2);
if(s.c.includes(w?'Q':'q')&&!b[k-1]&&!b[k-2]&&!b[k-3]&&b[k-4]===(w?'R':'r')&&!att(b,k-1,!w)&&!att(b,k-2,!w))add(k-2)}}
else for(const[dx,dy]of u==='r'?K.slice(0,4):u==='b'?K.slice(4):K){let a=x+dx,e=y+dy;while(a>=0&&a<8&&e>=0&&e<8){const t=e*8+a;if(b[t]){if(isW(b[t])!==w)add(t);break}if(!caps)add(t);a+=dx;e+=dy}}}
return out}
const RM={60:'KQ',63:'K',56:'Q',4:'kq',7:'k',0:'q'};
function apply(s,m){const b=s.b.slice(),c=b[m.f],w=s.t==='w',u=c.toLowerCase();let e=-1,r=s.c;
b[m.t]=m.p?(w?m.p.toUpperCase():m.p):c;b[m.f]='';
if(u==='p'){if(m.t===s.e&&!s.b[m.t]&&(m.t&7)!==(m.f&7))b[m.t+(w?8:-8)]='';if(Math.abs(m.t-m.f)===16)e=(m.t+m.f)/2}
if(u==='k'&&Math.abs(m.t-m.f)===2){if(m.t>m.f){b[m.t-1]=b[m.t+1];b[m.t+1]=''}else{b[m.t+1]=b[m.t-2];b[m.t-2]=''}}
for(const q of[m.f,m.t])if(RM[q])r=r.replace(new RegExp('['+RM[q]+']','g'),'');
return{b,t:w?'b':'w',c:r,e}}
const legal=s=>gen(s).filter(m=>!kAtt(apply(s,m).b,s.t==='w')),inCheck=s=>!!kAtt(s.b,s.t==='w');
function ev(b){let sc=0;for(let i=0;i<64;i++){const c=b[i];if(!c)continue;const u=c.toLowerCase(),w=isW(c),x=i&7,y=i>>3,ce=6-Math.abs(x-3.5)-Math.abs(y-3.5);let v=V[u];
if(u==='p')v+=(w?6-y:y-1)*5+ce;else if(u==='n'||u==='b')v+=ce*5;else if(u==='q')v+=ce;
sc+=w?v:-v}return sc}
let T=0,DL=0,QS=0;
function qs(s,a,bt,d){const sg=s.t==='w'?1:-1,st=sg*ev(s.b);if(st>=bt)return st;if(st>a)a=st;if(d>3)return st;
for(const m of gen(s,1).sort((x,y)=>y.v-x.v)){const n=apply(s,m);if(kAtt(n.b,s.t==='w'))continue;const v=-qs(n,-bt,-a,d+1);if(v>=bt)return v;if(v>a)a=v}return a}
function S(s,d,a,bt,ply){if((++T&1023)===0&&Date.now()>DL)throw 1;
if(d<=0)return QS?qs(s,a,bt,0):(s.t==='w'?1:-1)*ev(s.b);
let n=0;for(const m of gen(s).sort((x,y)=>y.v-x.v)){const c=apply(s,m);if(kAtt(c.b,s.t==='w'))continue;n++;const v=-S(c,d-1,-bt,-a,ply+1);if(v>=bt)return v;if(v>a)a=v}
return n?a:(kAtt(s.b,s.t==='w')?-30000+ply:0)}
// Возвращает все ходы с оценками (сантипешки, с точки зрения ходящего), лучший первым
function analyze(s,lv){let root=legal(s);if(!root.length)return[];DL=Date.now()+lv.ms;QS=lv.q;T=0;let done=root.map(m=>({m,s:0}));
for(let d=1;d<=lv.d;d++){try{const cur=[];for(const o of done)cur.push({m:o.m,s:-S(apply(s,o.m),d-1,-1e5,1e5,1)});cur.sort((a,b)=>b.s-a.s);done=cur}catch(e){break}}
return done}
// Выбор хода "как человек этого рейтинга": шум и случайные ошибки
function pick(r,lv){if(!r.length)return null;if(r[0].s>20000)return r[0];if(Math.random()<lv.r)return r[Math.floor(Math.random()*r.length)];
let bs=null,bv=-1e9;for(const o of r){const v=o.s+(Math.random()*2-1)*lv.noise;if(v>bv){bv=v;bs=o}}return bs}
g.Eng={LV,fromFen,start,legal,apply,analyze,pick,uci,sq,inCheck};
})(typeof window!=='undefined'?window:globalThis);
