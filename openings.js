// Дебютная книга: название | сложность (0 просто … 3 профи) | ходы
(function(g){
const RAW=`Итальянская партия|0|e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 c2c3 g8f6 d2d4 e5d4 c3d4 c5b4
Система Лондон|0|d2d4 d7d5 c1f4 g8f6 e2e3 e7e6 g1f3 c7c5 c2c3 b8c6 b1d2 f8d6
Простая защита d5 (против d4)|0|d2d4 d7d5 g1f3 g8f6 c1f4 e7e6 e2e3 f8d6
Шотландская партия|1|e2e4 e7e5 g1f3 b8c6 d2d4 e5d4 f3d4 f8c5 d4b3 c5b6
Скандинавская защита|1|e2e4 d7d5 e4d5 d8d5 b1c3 d5a5 d2d4 g8f6 g1f3 c7c6
Ферзевый гамбит отказанный|1|d2d4 d7d5 c2c4 e7e6 b1c3 g8f6 c1g5 f8e7 e2e3 e8g8 g1f3
Дебют Рети|1|g1f3 d7d5 g2g3 g8f6 f1g2 e7e6 e1g1 f8e7 d2d3
Испанская партия|2|e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6 e1g1 f8e7 f1e1 b7b5 a4b3 d7d6 c2c3 e8g8
Французская защита|2|e2e4 e7e6 d2d4 d7d5 b1c3 g8f6 c1g5 f8e7 e4e5 f6d7 g5e7 d8e7
Защита Каро-Канн|2|e2e4 c7c6 d2d4 d7d5 b1c3 d5e4 c3e4 c8f5 e4g3 f5g6 h2h4 h7h6
Русская партия (Петров)|2|e2e4 e7e5 g1f3 g8f6 f3e5 d7d6 e5f3 f6e4 d2d4 d6d5 f1d3 f8e7
Славянская защита|2|d2d4 d7d5 c2c4 c7c6 g1f3 g8f6 b1c3 d5c4 a2a4 c8f5 e2e3 e7e6
Английское начало|2|c2c4 e7e5 b1c3 g8f6 g1f3 b8c6 g2g3 d7d5 c4d5 f6d5 f1g2 d5b6
Королевский гамбит|2|e2e4 e7e5 f2f4 e5f4 g1f3 g7g5 h2h4 g5g4 f3e5 g8f6
Современная защита / Пирц|2|e2e4 d7d6 d2d4 g8f6 b1c3 g7g6 g1f3 f8g7 f1e2 e8g8
Сицилианская: открытый вариант|2|e2e4 c7c5 g1f3 b8c6 d2d4 c5d4 f3d4 g8f6 b1c3 e7e5 d4b5 d7d6
Сицилианская: Найдорф|3|e2e4 c7c5 g1f3 d7d6 d2d4 c5d4 f3d4 g8f6 b1c3 a7a6 c1e3 e7e5 d4b3 c8e6
Староиндийская защита|3|d2d4 g8f6 c2c4 g7g6 b1c3 f8g7 e2e4 d7d6 g1f3 e8g8 f1e2 e7e5 e1g1 b8c6
Защита Нимцовича|3|d2d4 g8f6 c2c4 e7e6 b1c3 f8b4 e2e3 e8g8 f1d3 d7d5 g1f3 c7c5 e1g1 b8c6
Каталонское начало|3|d2d4 g8f6 c2c4 e7e6 g2g3 d7d5 f1g2 f8e7 g1f3 e8g8 e1g1 d5c4 d1c2 a7a6
Защита Грюнфельда|3|d2d4 g8f6 c2c4 g7g6 b1c3 d7d5 c4d5 f6d5 e2e4 d5c3 b2c3 f8g7 g1f3 c7c5
Принятый ферзевый гамбит|3|d2d4 d7d5 c2c4 d5c4 g1f3 g8f6 e2e3 e7e6 f1c4 c7c5 e1g1 a7a6`;
const B=RAW.split('\n').map(l=>{const[n,t,m]=l.split('|');return{n,t:+t,m:m.split(' ')}});
const pre=(m,h,k)=>m.slice(0,k).join()===h.slice(0,k).join();
g.Book={
move(h,tier,maxPly){if(h.length>=maxPly)return null;const c=B.filter(o=>o.t<=tier&&o.m.length>h.length&&pre(o.m,h,h.length));if(!c.length)return null;
const mt=Math.max(...c.map(o=>o.t)),p=c.filter(o=>o.t===mt),o=p[Math.floor(Math.random()*p.length)];return{mv:o.m[h.length],name:o.n}},
name(h){let r='',bk=0;for(const o of B){const k=Math.min(h.length,o.m.length);if(k>bk&&pre(o.m,h,k)){bk=k;r=o.n}}return r},
list(tier){return B.filter(o=>o.t<=tier).map(o=>o.n)}};
})(window);
