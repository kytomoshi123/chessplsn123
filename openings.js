// Дебютная книга (ходы в uci) + ловушки. Сложность: 0 просто … 3 профи.
(function(g){
const RAW=`Итальянская партия|0|e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d4 e5d4 c3d4 c5b4
Система Лондон|0|d2d4 d7d5 c1f4 g8f6 e2e3 e7e6 g1f3 c7c5 c2c3 b8c6 b1d2 f8d6
Простая защита d5 (против d4)|0|d2d4 d7d5 g1f3 g8f6 c1f4 e7e6 e2e3 f8d6
Слоновый дебют|1|e2e4 e7e5 f1c4 g8f6 d2d3 c7c6 g1f3 d7d5 c4b3 f8d6
Шотландская партия|1|e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 f8c5 d4b3 c5b6
Скандинавская защита|1|e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 d2d4 g8f6 g1f3 c7c6
Гамбит Эванса|1|e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 b2b4 c5b4 c2c3 b4a5 d2d4 e5d4 e1g1
Ферзевый гамбит отказанный|1|d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 f8e7 e2e3 e8g8 g1f3
Дебют Рети|1|g1f3 d7d5 g2g3 g8f6 f1g2 e7e6 e1g1 f8e7 d2d3
Испанская партия|2|e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6 c2c3 e8g8
Французская защита|2|e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 c1g5 f8e7 e4e5 f6d7 g5e7 d8e7
Защита Каро-Канн|2|e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 c8f5 e4g3 f5g6 h2h4 h7h6
Русская партия (Петров)|2|e2e4 e7e5 g1f3 g8f6 f3e5 d7d6 e5f3 f6e4 d2d4 d6d5 f1d3 f8e7
Славянская защита|2|d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 d5c4 a2a4 c8f5 e2e3 e7e6
Венская партия|2|e2e4 e7e5 b1c3 g8f6 f2f4 d7d5 f4e5 f6e4 g1f3 f8c5
Английское начало|2|c2c4 e7e5 b1c3 g8f6 g1f3 b8c6 g2g3 d7d5 c4d5 f6d5 f1g2 d5b6
Королевский гамбит|2|e2e4 e7e5 f2f4 e5f4 g1f3 g7g5 h2h4 g5g4 f3e5 g8f6
Голландская защита|2|d2d4 f7f5 g2g3 g8f6 f1g2 e7e6 g1f3 f8e7 e1g1 e8g8
Современная защита / Пирц|2|e2e4 d7d6 d2d4 g8f6 b1c3 g7g6 g1f3 f8g7 f1e2 e8g8
Сицилианская: открытый вариант|2|e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e5 d4b5 d7d6
Сицилианская: Найдорф|3|e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6 c1e3 e7e5 d4b3 c8e6
Староиндийская защита|3|d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 g1f3 e8g8 f1e2 e7e5 e1g1 b8c6
Защита Нимцовича|3|d2d4 g8f6 c2c4 e7e6 b1c3 f8b4 e2e3 e8g8 f1d3 d7d5 g1f3 c7c5 e1g1 b8c6
Каталонское начало|3|d2d4 g8f6 c2c4 e7e6 g2g3 d7d5 f1g2 f8e7 g1f3 e8g8 e1g1 d5c4 d1c2 a7a6
Защита Грюнфельда|3|d2d4 g8f6 c2c4 g7g6 b1c3 d7d5 c4d5 f6d5 e2e4 d5c3 b2c3 f8g7 g1f3 c7c5
Принятый ферзевый гамбит|3|d2d4 d7d5 c2c4 d5c4 g1f3 g8f6 e2e3 e7e6 f1c4 c7c5 e1g1 a7a6`;
const B=RAW.split('\n').map(l=>{const[n,t,m]=l.split('|');return{n,t:+t,m:m.split(' ')}});
// Ловушки и типовые ошибки (не входят в ходы бота, только подсказка-предупреждение)
const TRAPS=[
{n:"Детский мат (Scholar's mate)",m:'e2e4 e7e5 f1c4 b8c6 d1h5 g8f6 h5f7'.split(' ')},
{n:'Мат дурака (Fool\'s Mate)',m:'f2f3 e7e5 g2g4 d8h4'.split(' ')},
{n:'Мат Легаля (Légal\'s Mate)',m:'e2e4 e7e5 g1f3 d7d6 f1c4 c8g4 b1c3 g7g6 f3e5 g4d1 c4f7 e8e7 c3d5'.split(' ')},
{n:'Ловушка Блэкберна (Blackburne Shilling)',m:'e2e4 e7e5 g1f3 b8c6 f1c4 c6d4 f3e5 d8g5 e5f7 g5g2 h1f1 g2e4 c4e2 d4f3'.split(' ')},
{n:'Слоновая ловушка (Elephant Trap)',m:'d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 b8d7 c4d5 e6d5 c3d5 f6d5 g5d8 f8b4 d1d2 b4d2 e1d2 e8d8'.split(' ')},
{n:'Ловушка Ноева ковчега (Noah\'s Ark Trap)',m:'e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 d7d6 d2d4 b7b5 a4b3 c6d4 f3d4 e5d4 d1d4 c7c5 d4d5 c8e6 d5c6 e6d7 c6d5 c5c4'.split(' ')},
{n:'Ловушка Кенингера (Kieninger Trap, мат Nd3#)',m:'d2d4 g8f6 c2c4 e7e5 d4e5 f6g4 c1f4 b8c6 g1f3 f8b4 b1d2 d8e7 a2a3 g4e5 a3b4 e5d3'.split(' ')},
{n:'Ловушка Энглунда (Englund Gambit Trap)',m:'d2d4 e7e5 d4e5 b8c6 g1f3 d8e7 c1f4 e7b4 f4d2 b4b2 d2c3 f8b4 d1d2 b4c3 d2c3 b2a1'.split(' ')},
{n:'Атака «Печёная печень» (Fried Liver)',m:'e2e4 e7e5 g1f3 b8c6 f1c4 g8f6 f3g5 d7d5 e4d5 f6d5 g5f7 e8f7 d1f3'.split(' ')}];
const GAMES=[
{n:'Бессмертная партия (Андерсен — Кизерицкий, 1851)',s:'e4 e5 f4 exf4 Bc4 Qh4+ Kf1 b5 Bxb5 Nf6 Nf3 Qh6 d3 Nh5 Nh4 Qg5 Nf5 c6 g4 Nf6 Rg1 cxb5 h4 Qg6 h5 Qg5 Qf3 Ng8 Bxf4 Qf6 Nc3 Bc5 Nd5 Qxb2 Bd6 Bxg1 e5 Qxa1+ Ke2 Na6 Nxg7+ Kd8 Qf6+ Nxf6 Be7#'},
{n:'Опера-партия (Морфи, 1858)',s:'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#'}
];
const pre=(m,h,k)=>m.slice(0,k).join()===h.slice(0,k).join();
const RUN={'Sicilian':'Сицилианская защита','French':'Французская защита','Caro-Kann':'Защита Каро-Канн','Ruy Lopez':'Испанская партия','Italian Game':'Итальянская партия','Giuoco Piano':'Джуоко пьяно','Two Knights':'Защита двух коней','Scotch':'Шотландская партия','Vienna':'Венская партия',"King's Gambit":'Королевский гамбит',"Queen's Gambit Declined":'Ферзевый гамбит отказанный',"Queen's Gambit Accepted":'Принятый ферзевый гамбит',"Queen's Gambit":'Ферзевый гамбит','Slav':'Славянская защита','Nimzo-Indian':'Защита Нимцовича',"Queen's Indian":'Ферзевая индийская',"King's Indian":'Староиндийская защита','Grünfeld':'Защита Грюнфельда','Grunfeld':'Защита Грюнфельда','Benoni':'Защита Бенони','Benko':'Гамбит Бенко','Dutch':'Голландская защита','English Opening':'Английское начало','Réti':'Дебют Рети','Reti':'Дебют Рети','Catalan':'Каталонское начало','London':'Система Лондон','Pirc':'Защита Пирца','Modern Defense':'Современная защита','Scandinavian':'Скандинавская защита',"Alekhine":'Защита Алёхина','Petrov':'Русская партия (Петров)','Petroff':'Русская партия (Петров)','KID':'Староиндийская защита','QGD':'Ферзевый гамбит отказанный','QGA':'Принятый ферзевый гамбит','Philidor':'Защита Филидора',"Bishop's Opening":'Слоновый дебют','Evans Gambit':'Гамбит Эванса','Danish Gambit':'Датский гамбит','Latvian':'Латвийский гамбит','Budapest':'Венгерский (Будапештский) гамбит','Albin':'Контргамбит Альбина','Blackmar-Diemer':'Гамбит Блэкмара-Димера','Smith-Morra':'Гамбит Смита-Морра','Trompowsky':'Атака Тромповского','Colle':'Система Колле','Torre':'Атака Торре','Bird':'Дебют Бёрда','Larsen':'Дебют Ларсена','Polish':'Польский дебют','Grob':'Дебют Гроба',"Owen":'Защита Оуэна','Nimzowitsch Defense':'Защита Нимцовича (1…Nc6)',"St. George":'Защита св. Георгия','Hippopotamus':'Бегемот','Orangutan':'Орангутан','Hedgehog':'Ёж','Halloween':'Гамбит Хэллоуин','Elephant Gambit':'Слоновий гамбит','Englund':'Гамбит Энглунда','Stafford':'Гамбит Стаффорда','Wing Gambit':'Фланговый гамбит','Muzio':'Гамбит Музио','Göring':'Гамбит Геринга','Goring':'Гамбит Геринга','Jerome':'Гамбит Джерома','Schliemann':'Защита Шлемана','Marshall':'Атака Маршалла','Berlin':'Берлинская защита','Najdorf':'вариант Найдорфа','Dragon':'вариант Дракона','Sveshnikov':'вариант Свешникова','Scheveningen':'вариант Схевенингена','Taimanov':'вариант Тайманова','Alapin':'вариант Алапина','Stonewall':'Каменная стена','Vienna Game':'Венская партия','Center Game':'Центральная партия','Philidor':'Защита Филидора','Anderssen':'Дебют Андерссена','Ware':'Дебют Уэра','Sodium':'Дебют Натрия','Desprez':'Дебют Депре','Amar':'Дебют Амара','Mieses':'Дебют Мизеса','Van\'t Kruijs':'Дебют Ван т Крейса','Saragossa':'Дебют Сарагосы','Dunst':'Дебют Дунста','Borg':'Защита Борга','Barnes':'Защита Барнса','Goldsmith':'Защита Голдсмита','Adams':'Защита Адамса'};
const IDX={},NAMES={},DB=(typeof OPDB!=='undefined'?OPDB:[]);
for(const[e,n,u]of DB){const m=u.split(' ');if(!NAMES[u]||(!NAMES[u].n&&n))NAMES[u]={n,e};for(let i=0;i<m.length;i++){const k=m.slice(0,i).join(' '),x=IDX[k]||(IDX[k]={});x[m[i]]=(x[m[i]]||0)+1}}
const ruName=n=>{const out=[];for(const k in RUN){const v=RUN[k];if(n.indexOf(k)>=0&&!out.some(x=>x.includes(v)||v.includes(x)))out.push(v)}return out.slice(0,2).join(', ')};
const CO=(typeof COLL!=='undefined'?COLL:[]).map(c=>({n:c[0],m:c[1].split(' '),c:c[2],f:c[3]}));
g.Book={
info(h){for(let i=h.length;i>0;i--){const x=NAMES[h.slice(0,i).join(' ')];if(x&&x.n)return{name:x.n,eco:x.e,ru:ruName(x.n),exact:i===h.length}}return null},
next(h,n){const x=IDX[h.join(' ')];if(!x)return[];return Object.keys(x).map(u=>({u,c:x[u]})).sort((a,b)=>b.c-a.c).slice(0,n||5)},
inDb(h,u,maxPly){if(h.length>=maxPly)return false;const x=IDX[h.join(' ')];return !!(x&&x[u])},
coll(h){let best=null;for(const c of CO)if(c.m.length<=h.length&&pre(c.m,h,c.m.length)&&(!best||c.m.length>best.m.length))best=c;return best},

move(h,tier,maxPly){if(h.length>=maxPly)return null;const c=B.filter(o=>o.t<=tier&&o.m.length>h.length&&pre(o.m,h,h.length));if(!c.length)return null;
const mt=Math.max(...c.map(o=>o.t)),p=c.filter(o=>o.t===mt),o=p[Math.floor(Math.random()*p.length)];return{mv:o.m[h.length],name:o.n}},
name(h){let r='',bk=0;for(const o of B){const k=Math.min(h.length,o.m.length);if(k>bk&&pre(o.m,h,k)){bk=k;r=o.n}}return r},
trap(h){if(!h.length)return'';const t=TRAPS.find(t=>h.length<=t.m.length&&t.m.slice(0,h.length).join()===h.join());return t?t.n:''},
isBook(h,u,tier,maxPly){if(maxPly&&g.Book.inDb(h,u,maxPly))return true;return B.some(o=>o.t<=tier&&o.m.length>h.length&&pre(o.m,h,h.length)&&o.m[h.length]===u)},
list(tier){return B.filter(o=>o.t<=tier).map(o=>o.n)},
all:B,traps:TRAPS,games:GAMES};
})(window);
