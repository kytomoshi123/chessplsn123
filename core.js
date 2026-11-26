// Быстрое ядро поиска: типизированные массивы, make/unmake, хеш-таблица, PVS, null-move, LMR, форсированный поиск.
// Работает поверх состояния {b:[символы], t:'w'|'b', c:'KQkq', e:индекс} из engine.js и возвращает ходы с оценками.
(function(g){
'use strict';
const MATE=30000,INF=32000,MAXP=96,MM=256;
const VAL=[0,100,320,330,500,900,0],PHW=[0,0,1,1,2,4,0];
const PS=[null,
[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]];
const KEG=[-50,-40,-30,-20,-20,-30,-40,-50,-30,-20,-10,0,0,-10,-20,-30,-30,-10,20,30,30,20,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,30,40,40,30,-10,-30,-30,-10,20,30,30,20,-10,-30,-30,-30,0,0,0,0,-30,-30,-50,-30,-30,-30,-30,-30,-30,-50];
const PMG=new Int16Array(16*64),PEG=new Int16Array(16*64),PHASE=new Int8Array(16);
for(let t=1;t<=6;t++){for(let s=0;s<64;s++){const mg=VAL[t]+PS[t][s],eg=VAL[t]+(t===6?KEG[s]:PS[t][s]),mm=VAL[t]+PS[t][s^56],me=VAL[t]+(t===6?KEG[s^56]:PS[t][s^56]);
 PMG[t*64+s]=mg;PEG[t*64+s]=eg;PMG[(t+8)*64+s]=-mm;PEG[(t+8)*64+s]=-me}PHASE[t]=PHASE[t+8]=PHW[t]}
// таблицы ходов
const KN=[],KG=[],RAY=[],PA=[[],[]];
const D8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]],NN=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
for(let s=0;s<64;s++){const x=s&7,y=s>>3,kn=[],kg=[],rays=[];
 for(const[a,c]of NN){const nx=x+a,ny=y+c;if(nx>=0&&nx<8&&ny>=0&&ny<8)kn.push(ny*8+nx)}
 for(const[a,c]of D8){const nx=x+a,ny=y+c;if(nx>=0&&nx<8&&ny>=0&&ny<8)kg.push(ny*8+nx);const r=[];let px=nx,py=ny;while(px>=0&&px<8&&py>=0&&py<8){r.push(py*8+px);px+=a;py+=c}rays.push(Int8Array.from(r))}
 KN.push(Int8Array.from(kn));KG.push(Int8Array.from(kg));RAY.push(rays);
 const w=[],bl=[];for(const dx of[-1,1]){if(x+dx<0||x+dx>7)continue;if(y>0)w.push((y-1)*8+x+dx);if(y<7)bl.push((y+1)*8+x+dx)}PA[0].push(Int8Array.from(w));PA[1].push(Int8Array.from(bl))}
// Zobrist
let rs=0x9E3779B9;const rnd=()=>{rs^=rs<<13;rs^=rs>>>17;rs^=rs<<5;return rs|0};
const Z1=new Int32Array(16*64),Z2=new Int32Array(16*64),ZC1=new Int32Array(16),ZC2=new Int32Array(16),ZE1=new Int32Array(8),ZE2=new Int32Array(8);
for(let i=0;i<Z1.length;i++){Z1[i]=rnd();Z2[i]=rnd()}for(let i=0;i<16;i++){ZC1[i]=rnd();ZC2[i]=rnd()}for(let i=0;i<8;i++){ZE1[i]=rnd();ZE2[i]=rnd()}const ZS1=rnd(),ZS2=rnd();
// состояние
const b=new Int8Array(64),ksq=[0,0],CRM=new Int8Array(64).fill(15);CRM[60]=12;CRM[63]=14;CRM[56]=13;CRM[4]=3;CRM[7]=11;CRM[0]=7;
let side=0,castle=0,ep=-1,h1=0,h2=0,mg=0,eg=0,ph=0,half=0,sp=0;
const uM=new Int32Array(1024),uCap=new Int8Array(1024),uPc=new Int8Array(1024),uCr=new Int8Array(1024),uEp=new Int8Array(1024),uH1=new Int32Array(1024),uH2=new Int32Array(1024),uMg=new Int32Array(1024),uEg=new Int32Array(1024),uPh=new Int8Array(1024),uHf=new Int16Array(1024);
const MV=new Int32Array(MAXP*MM),SC=new Int32Array(MAXP*MM),pathH=new Int32Array(MAXP+8),killer=new Int32Array(MAXP*2),hist=new Int32Array(16*64);
// хеш-таблица
const TTB=20,TTN=1<<TTB,TTM=TTN-1,tK1=new Int32Array(TTN),tK2=new Int32Array(TTN),tS=new Int16Array(TTN),tD=new Int8Array(TTN),tF=new Int8Array(TTN),tMv=new Int32Array(TTN),tA=new Uint8Array(TTN);let age=0;
const CH={P:1,N:2,B:3,R:4,Q:5,K:6};
function setup(s){b.fill(0);h1=h2=0;mg=eg=ph=0;for(let i=0;i<64;i++){const c=s.b[i];if(!c)continue;const t=CH[c.toUpperCase()],pc=t+(c===c.toLowerCase()?8:0);b[i]=pc;h1^=Z1[pc*64+i];h2^=Z2[pc*64+i];mg+=PMG[pc*64+i];eg+=PEG[pc*64+i];ph+=PHASE[pc];if(t===6)ksq[pc>>3]=i}
 side=s.t==='w'?0:1;castle=(s.c.includes('K')?1:0)|(s.c.includes('Q')?2:0)|(s.c.includes('k')?4:0)|(s.c.includes('q')?8:0);ep=s.e;half=0;sp=0;
 if(side){h1^=ZS1;h2^=ZS2}h1^=ZC1[castle];h2^=ZC2[castle];if(ep>=0){h1^=ZE1[ep&7];h2^=ZE2[ep&7]}if(ph>24)ph=24}
// атака поля sq фигурами цвета c (0 белые, 1 чёрные)
function attacked(sq,c){const o=c<<3;
 const pa=PA[1-c][sq];for(let i=0;i<pa.length;i++)if(b[pa[i]]===1+o)return true;
 const kn=KN[sq];for(let i=0;i<kn.length;i++)if(b[kn[i]]===2+o)return true;
 const kg=KG[sq];for(let i=0;i<kg.length;i++)if(b[kg[i]]===6+o)return true;
 const R=RAY[sq];for(let d=0;d<8;d++){const r=R[d];for(let i=0;i<r.length;i++){const p=b[r[i]];if(p){if(p===5+o||p===(d<4?4:3)+o)return true;break}}}return false}
// генерация псевдолегальных ходов; кодировка: from | to<<6 | promo<<12 | флаги<<16 (1 ep, 2 рокировка, 4 двойной ход)
function gen(ply,caps){const base=ply*MM;let n=base;const o=side<<3,up=side?8:-8;
 const add=(f,t,pr,fl)=>{MV[n++]=f|(t<<6)|(pr<<12)|(fl<<16)};
 for(let f=0;f<64;f++){const pc=b[f];if(!pc||(pc>>3)!==side)continue;const t=pc&7;
  if(t===1){const y=f>>3,promo=side?y===6:y===1,start=side?y===1:y===6,t1=f+up;
   if(!b[t1]&&(!caps||promo)){if(promo){add(f,t1,5,0);add(f,t1,4,0);add(f,t1,3,0);add(f,t1,2,0)}else{add(f,t1,0,0);if(start&&!b[t1+up]&&!caps)add(f,t1+up,0,4)}}
   const pa=PA[side][f];for(let i=0;i<pa.length;i++){const q=pa[i],v=b[q];if(v&&(v>>3)!==side){if(promo){add(f,q,5,0);add(f,q,4,0);add(f,q,3,0);add(f,q,2,0)}else add(f,q,0,0)}else if(q===ep)add(f,q,0,1)}}
  else if(t===2){const kn=KN[f];for(let i=0;i<kn.length;i++){const q=kn[i],v=b[q];if(!v?!caps:(v>>3)!==side)add(f,q,0,0)}}
  else if(t===6){const kg=KG[f];for(let i=0;i<kg.length;i++){const q=kg[i],v=b[q];if(!v?!caps:(v>>3)!==side)add(f,q,0,0)}
   if(!caps){const e=side?4:60,cs=side?4:1,cq=side?8:2;
    if(f===e&&(castle&cs)&&!b[e+1]&&!b[e+2]&&b[e+3]===4+o&&!attacked(e,1-side)&&!attacked(e+1,1-side)&&!attacked(e+2,1-side))add(f,e+2,0,2);
    if(f===e&&(castle&cq)&&!b[e-1]&&!b[e-2]&&!b[e-3]&&b[e-4]===4+o&&!attacked(e,1-side)&&!attacked(e-1,1-side)&&!attacked(e-2,1-side))add(f,e-2,0,2)}}
  else{const R=RAY[f],d0=t===3?4:0,d1=t===4?4:8;for(let d=d0;d<d1;d++){const r=R[d];for(let i=0;i<r.length;i++){const q=r[i],v=b[q];if(v){if((v>>3)!==side)add(f,q,0,0);break}if(!caps)add(f,q,0,0)}}}}
 return n-base}
function make(m){const f=m&63,t=(m>>6)&63,pr=(m>>12)&7,fl=m>>16,pc=b[f],c=side;let cap=b[t],cs=t;
 uM[sp]=m;uPc[sp]=pc;uCr[sp]=castle;uEp[sp]=ep;uH1[sp]=h1;uH2[sp]=h2;uMg[sp]=mg;uEg[sp]=eg;uPh[sp]=ph;uHf[sp]=half;
 if(ep>=0){h1^=ZE1[ep&7];h2^=ZE2[ep&7]}h1^=ZC1[castle];h2^=ZC2[castle];
 if(fl&1){cs=t+(c?-8:8);cap=b[cs];b[cs]=0}
 uCap[sp]=cap;sp++;
 if(cap){h1^=Z1[cap*64+cs];h2^=Z2[cap*64+cs];mg-=PMG[cap*64+cs];eg-=PEG[cap*64+cs];ph-=PHASE[cap]}
 b[f]=0;h1^=Z1[pc*64+f];h2^=Z2[pc*64+f];mg-=PMG[pc*64+f];eg-=PEG[pc*64+f];
 const np=pr?pr+(c<<3):pc;b[t]=np;h1^=Z1[np*64+t];h2^=Z2[np*64+t];mg+=PMG[np*64+t];eg+=PEG[np*64+t];if(pr)ph+=PHASE[np]-PHASE[pc];
 if(fl&2){const rf=t>f?t+1:t-2,rt=t>f?t-1:t+1,rk=b[rf];b[rf]=0;b[rt]=rk;h1^=Z1[rk*64+rf]^Z1[rk*64+rt];h2^=Z2[rk*64+rf]^Z2[rk*64+rt];mg+=PMG[rk*64+rt]-PMG[rk*64+rf];eg+=PEG[rk*64+rt]-PEG[rk*64+rf]}
 if((pc&7)===6)ksq[c]=t;
 castle&=CRM[f]&CRM[t];h1^=ZC1[castle];h2^=ZC2[castle];
 ep=(fl&4)?(f+t)>>1:-1;if(ep>=0){h1^=ZE1[ep&7];h2^=ZE2[ep&7]}
 half=((pc&7)===1||cap)?0:half+1;side^=1;h1^=ZS1;h2^=ZS2}
function unmake(){sp--;const m=uM[sp],f=m&63,t=(m>>6)&63,fl=m>>16,pc=uPc[sp],cap=uCap[sp];side^=1;
 b[f]=pc;if(fl&1){b[t]=0;b[t+(side?-8:8)]=cap}else b[t]=cap;
 if(fl&2){const rf=t>f?t+1:t-2,rt=t>f?t-1:t+1;b[rf]=b[rt];b[rt]=0}
 if((pc&7)===6)ksq[side]=f;
 castle=uCr[sp];ep=uEp[sp];h1=uH1[sp];h2=uH2[sp];mg=uMg[sp];eg=uEg[sp];ph=uPh[sp];half=uHf[sp]}
const wC=new Int8Array(10),bC=new Int8Array(10),wMin=new Int8Array(10),wMax=new Int8Array(10),bMin=new Int8Array(10),bMax=new Int8Array(10),rkS=new Int8Array(8),PB=[0,6,10,20,38,66,105,0];
const RD=[[[1,0],[-1,0],[0,1],[0,-1]],[[1,1],[1,-1],[-1,1],[-1,-1]]];
function evalExtra(){wC.fill(0);bC.fill(0);wMin.fill(99);wMax.fill(-1);bMin.fill(99);bMax.fill(-1);let sc=0,wB=0,bB=0,nr=0,wk=-1,bk=-1;
 for(let s=0;s<64;s++){const p=b[s];if(!p)continue;const t=p&7,c=p>>3,x=(s&7)+1,y=s>>3,sg=c?-1:1;
  if(t===1){if(c){bC[x]++;if(y<bMin[x])bMin[x]=y;if(y>bMax[x])bMax[x]=y}else{wC[x]++;if(y<wMin[x])wMin[x]=y;if(y>wMax[x])wMax[x]=y}}
  else if(t===6){if(c)bk=s;else wk=s}
  else if(t===2){const kn=KN[s];let m=0;for(let i=0;i<kn.length;i++){const v=b[kn[i]];if(!v||(v>>3)!==c)m++}sc+=sg*(m-4)*4}
  else{const R=RAY[s];let m=0;const d0=t===3?4:0,d1=t===4?4:8;for(let d=d0;d<d1;d++){const r=R[d];for(let i=0;i<r.length;i++){const v=b[r[i]];if(!v){m++;continue}if((v>>3)!==c)m++;break}}
   if(t===3){sc+=sg*(m-6)*5;if(c)bB++;else wB++}else if(t===4){sc+=sg*(m-7)*2;rkS[nr++]=s}else sc+=sg*(m-13)}}
 const phf=(24-(ph>24?24:ph))/24;
 for(let x=1;x<=8;x++){
  if(wC[x]>1)sc-=10*(wC[x]-1);if(bC[x]>1)sc+=10*(bC[x]-1);
  if(wC[x]&&!wC[x-1]&&!wC[x+1])sc-=12*wC[x];if(bC[x]&&!bC[x-1]&&!bC[x+1])sc+=12*bC[x];
  if(wC[x]){const y=wMin[x];if(bMin[x-1]>=y&&bMin[x]>=y&&bMin[x+1]>=y)sc+=PB[6-y]*(1+phf)}
  if(bC[x]){const y=bMax[x];if(wMax[x-1]<=y&&wMax[x]<=y&&wMax[x+1]<=y)sc-=PB[y-1]*(1+phf)}}
 for(let i=0;i<nr;i++){const s=rkS[i],x=(s&7)+1,c=b[s]>>3;if(!wC[x]&&!bC[x])sc+=c?-15:15;else if(c?!bC[x]:!wC[x])sc+=c?-8:8}
 if(wB>=2)sc+=30;if(bB>=2)sc-=30;
 if(ph>=10){const shield=(k,c)=>{if(k<0)return 0;const kx=k&7,ky=k>>3,d=c?1:-1;if(c?ky>1:ky<6)return 0;let f=0;for(let x=kx-1;x<=kx+1;x++){if(x<0||x>7)continue;const a=b[(ky+d)*8+x],a2=ky+2*d>=0&&ky+2*d<8?b[(ky+2*d)*8+x]:0,pw=c?9:1;if(a===pw||a2===pw)f++}return(3-f)*14*ph/24};
  sc-=shield(wk,0);sc+=shield(bk,1)}
 return sc}
function evalS(al,be){const p=ph>24?24:ph,base=((mg*p+eg*(24-p))/24)|0,sb=side?-base:base;
 if(al!==undefined&&(sb-300>=be||sb+300<=al))return sb;
 const s=base+evalExtra()|0;return (side?-s:s)+10}
// оценка порядка ходов
function score(ply,n,ttm){const base=ply*MM,k1=killer[ply*2],k2=killer[ply*2+1];
 for(let i=base;i<base+n;i++){const m=MV[i],f=m&63,t=(m>>6)&63,pr=(m>>12)&7,v=b[t],pc=b[f];let s;
  if(m===ttm)s=2000000;else if(v||(m>>16)&1){const vt=v?(v&7):1;s=100000+VAL[vt]*10-(pc&7)}else if(pr)s=90000+pr;else if(m===k1)s=80000;else if(m===k2)s=79000;else s=hist[pc*64+t];
  if(pr&&v)s+=50000;SC[i]=s}}
let nodes=0,stop=false,tEnd=0;
function hasPieces(){for(let i=0;i<64;i++){const p=b[i];if(p&&(p>>3)===side){const t=p&7;if(t>1&&t<6)return true}}return false}
function qs(alpha,beta,ply,qd){nodes++;if((nodes&2047)===0&&Date.now()>tEnd)stop=true;if(stop)return 0;
 const inChk=attacked(ksq[side],1-side);let best,stand=0;
 if(ply>=MAXP-2)return evalS();
 if(!inChk){stand=evalS(alpha,beta);if(stand>=beta||qd>=8)return stand;if(stand>alpha)alpha=stand;best=stand}else best=-MATE+ply;
 const n=gen(ply,!inChk),base=ply*MM;score(ply,n,0);let legal=0;
 for(let i=0;i<n;i++){let bi=base+i,bs=SC[bi];for(let j=base+i+1;j<base+n;j++)if(SC[j]>bs){bs=SC[j];bi=j}
  const m=MV[bi];MV[bi]=MV[base+i];SC[bi]=SC[base+i];MV[base+i]=m;
  if(!inChk&&!((m>>12)&7)){const cv=b[(m>>6)&63];if(cv&&stand+VAL[cv&7]+200<alpha)continue}
  if(!inChk&&!((m>>12)&7)){const cv2=b[(m>>6)&63];if(cv2&&VAL[cv2&7]+30<VAL[b[m&63]&7]&&attacked((m>>6)&63,1-side))continue}
  make(m);if(attacked(ksq[1-side],side)){unmake();continue}legal++;
  const v=-qs(-beta,-alpha,ply+1,qd+1);unmake();if(stop)return 0;
  if(v>best){best=v;if(v>alpha){alpha=v;if(v>=beta)return v}}}
 if(inChk&&!legal)return -MATE+ply;return best}
const LMRT=[];for(let d=0;d<64;d++){LMRT.push(new Int8Array(64));for(let m=1;m<64;m++)LMRT[d][m]=d<3?0:Math.floor(0.6+Math.log(d)*Math.log(m)/2.2)}
const tried=new Int32Array(MAXP*MM);
function search(depth,alpha,beta,ply,nullOk){nodes++;if((nodes&2047)===0&&Date.now()>tEnd)stop=true;if(stop)return 0;
 pathH[ply]=h1;
 if(ply>0){if(half>=100)return 0;for(let i=ply-2;i>=0;i-=2)if(pathH[i]===h1)return 0;
  if(alpha<-MATE+ply)alpha=-MATE+ply;if(beta>MATE-ply-1)beta=MATE-ply-1;if(alpha>=beta)return alpha}
 const inChk=attacked(ksq[side],1-side);if(inChk)depth++;
 if(depth<=0||ply>=MAXP-2)return qs(alpha,beta,ply,0);
 const idx=h1&TTM;let ttm=0;
 if(tK1[idx]===h1&&tK2[idx]===h2){ttm=tMv[idx];if(ply>0&&tD[idx]>=depth){let s=tS[idx];if(s>MATE-200)s-=ply;else if(s<-MATE+200)s+=ply;const fg=tF[idx];if(fg===0||(fg===1&&s>=beta)||(fg===2&&s<=alpha))return s}}
 const pvNode=beta-alpha>1;let se=0;
 if(!inChk){se=evalS(alpha,beta);
  if(!pvNode){if(depth<=3&&se-120*depth>=beta&&Math.abs(beta)<MATE-300)return se;
   if(nullOk&&depth>=3&&se>=beta&&hasPieces()){const oe=ep;if(ep>=0){h1^=ZE1[ep&7];h2^=ZE2[ep&7]}ep=-1;side^=1;h1^=ZS1;h2^=ZS2;
    const v=-search(depth-3-(depth>6?1:0),-beta,-beta+1,ply+1,false);
    side^=1;h1^=ZS1;h2^=ZS2;ep=oe;if(ep>=0){h1^=ZE1[ep&7];h2^=ZE2[ep&7]}
    if(stop)return 0;if(v>=beta)return v>MATE-300?beta:v}}}
 if(depth>=4&&!ttm)depth--;
 const n=gen(ply,false),base=ply*MM;score(ply,n,ttm);
 let legal=0,best=-INF,bm=0,fg=2,nq=0;const a0=alpha,tb=ply*MM;
 for(let i=0;i<n;i++){let bi=base+i,bs=SC[bi];for(let j=base+i+1;j<base+n;j++)if(SC[j]>bs){bs=SC[j];bi=j}
  const m=MV[bi];MV[bi]=MV[base+i];SC[bi]=SC[base+i];MV[base+i]=m;
  const t=(m>>6)&63,quiet=!b[t]&&!((m>>12)&7)&&!((m>>16)&1);
  if(quiet&&!pvNode&&!inChk&&legal>0&&depth<=3&&legal>4+depth*depth&&best>-MATE+300)continue;
  make(m);if(attacked(ksq[1-side],side)){unmake();continue}legal++;
  const gc=attacked(ksq[side],1-side);
  if(quiet&&!inChk&&!gc&&legal>1&&depth<=2&&!pvNode&&se+(depth===1?120:230)<=alpha&&best>-MATE+300){unmake();continue}
  let v;
  if(legal===1)v=-search(depth-1,-beta,-alpha,ply+1,true);
  else{let red=0;if(depth>=3&&legal>2&&quiet&&!inChk&&!gc){red=LMRT[depth>63?63:depth][legal>63?63:legal];if(pvNode)red--;if(red<0)red=0;if(red>depth-2)red=depth-2}
   v=-search(depth-1-red,-alpha-1,-alpha,ply+1,true);
   if(v>alpha&&(red>0||v<beta))v=-search(depth-1,-beta,-alpha,ply+1,true)}
  unmake();if(stop)return 0;
  if(quiet&&v<=alpha&&nq<60)tried[tb+nq++]=b[m&63]*64+t;
  if(v>best){best=v;bm=m;if(v>alpha){alpha=v;fg=0;if(v>=beta){fg=1;if(quiet){if(killer[ply*2]!==m){killer[ply*2+1]=killer[ply*2];killer[ply*2]=m}const hp=b[m&63]*64+t,dd=depth*depth;hist[hp]+=dd;for(let q=0;q<nq;q++)hist[tried[tb+q]]-=dd;if(hist[hp]>60000||hist[hp]<-60000)for(let q=0;q<hist.length;q++)hist[q]>>=1}break}}}}
 if(!legal)return inChk?-MATE+ply:0;
 let st=best;if(st>MATE-200)st+=ply;else if(st<-MATE+200)st-=ply;
 if(tK1[idx]!==h1||depth>=tD[idx]||tA[idx]!==age){tK1[idx]=h1;tK2[idx]=h2;tS[idx]=st;tD[idx]=depth;tF[idx]=fg;tMv[idx]=bm;tA[idx]=age}
 return best}
function rootMoves(){const n=gen(0,false),out=[];for(let i=0;i<n;i++){const m=MV[i];make(m);if(!attacked(ksq[1-side],side))out.push(m);unmake()}return out}
const uciOf=m=>'abcdefgh'[(m&63)&7]+(8-((m&63)>>3))+'abcdefgh'[((m>>6)&63)&7]+(8-(((m>>6)&63)>>3))+(((m>>12)&7)?'  nbrq'[(m>>12)&7]:'');
// Полный анализ корня: [{u,s,ub}] — все ходы с оценками (ub — только верхняя граница, ход заведомо хуже лучшего)
function analyzeRoot(s,o){age=(age+1)&255;setup(s);const t0=Date.now();tEnd=t0+(o.ms||200);stop=false;nodes=0;const margin=o.margin==null?250:o.margin,maxD=o.d||6;
 killer.fill(0);const rm=rootMoves();if(!rm.length)return[];
 let list=rm.map(m=>({m,s:0,ub:false}));
 if(list.length===1){const x=list[0];make(x.m);x.s=-qs(-INF,INF,1,0);unmake();return[{u:uciOf(x.m),s:x.s,ub:false,d:0}]}
 pathH[0]=h1;list.forEach(x=>{const t=(x.m>>6)&63,f=x.m&63;x.o=(b[t]?VAL[b[t]&7]*10-(b[f]&7):0)+(((x.m>>12)&7)?900:0)});list.sort((a,c)=>c.o-a.o);
 let done=null,doneD=0;
 for(let d=1;d<=maxD;d++){const cur=[];let best=-INF,ok=true;
  for(let i=0;i<list.length;i++){const x=list[i];make(x.m);let v;
   if(i===0)v=-search(d-1,-INF,INF,1,true);
   else{const al=best-margin;v=-search(d-1,-INF,-al,1,true)}
   unmake();if(stop){ok=false;break}
   const ub=i>0&&v<=best-margin;cur.push({m:x.m,s:v,ub});if(v>best)best=v}
  if(!ok){if(d===1&&!done){done=list.map(x=>({m:x.m,s:x.s,ub:true}))}break}
  cur.sort((x,y)=>y.s-x.s);list=cur.map(x=>({m:x.m,s:x.s,ub:x.ub}));done=cur;doneD=d;
  if(best>MATE-200||best<-MATE+200)break;
  if(Date.now()-t0>(o.ms||200)*0.55)break}
 return done.map(x=>({u:uciOf(x.m),s:x.s,ub:x.ub,d:doneD}))}
// Оценка одного заданного хода (полное окно) — для уточнения ходов, отброшенных как заведомо плохие
function scoreMove(s,u,o){age=(age+1)&255;setup(s);pathH[0]=h1;tEnd=Date.now()+(o.ms||200);stop=false;nodes=0;killer.fill(0);const rm=rootMoves(),m=rm.find(x=>uciOf(x)===u);if(!m)return null;
 let v=null;make(m);for(let d=1;d<=(o.d||6);d++){const x=-search(d-1,-INF,INF,1,true);if(stop)break;v=x;if(Math.abs(x)>MATE-200)break}unmake();return v}
function perft(s,d){setup(s);const go=dd=>{if(!dd)return 1;const n=gen(dd,false);let c=0;for(let i=0;i<n;i++){const m=MV[dd*MM+i];make(m);if(!attacked(ksq[1-side],side))c+=go(dd-1);unmake()}return c};
 const top=dd=>{const n=gen(dd,false);let c=0;for(let i=0;i<n;i++){const m=MV[dd*MM+i];make(m);if(!attacked(ksq[1-side],side))c+=dd>1?top(dd-1):1;unmake()}return c};return top(d)}
function clear(){tK1.fill(0);tK2.fill(0);tD.fill(0);hist.fill(0)}
g.FastEngine={analyzeRoot,scoreMove,perft,clear,stats:()=>({nodes})};
})(typeof window!=='undefined'?window:globalThis);
