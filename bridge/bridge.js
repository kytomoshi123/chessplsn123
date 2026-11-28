// Мост: запускает настоящий Stockfish (нативный бинарник) и отдаёт его сайту по HTTP на этом же устройстве.
// Использование (Termux на Android):  node bridge.js ./stockfish-android-arm64-universal
// Затем открой в браузере http://localhost:8765  (мост сам раздаёт сайт из папки выше).
const http=require('http'),fs=require('fs'),path=require('path'),os=require('os'),{spawn}=require('child_process');
const PORT=+process.env.PORT||8765,SITE=path.resolve(process.env.SITE||path.join(__dirname,'..'));
const cmd=(process.env.ENGINE||process.argv[2]||'./stockfish').split(' ').filter(Boolean);
const eng=spawn(cmd[0],cmd.slice(1),{stdio:['pipe','pipe','inherit']});
eng.on('error',e=>{console.error('Не удалось запустить движок:',e.message);process.exit(1)});
eng.on('exit',c=>{console.error('Движок остановился, код',c);process.exit(1)});
const clients=new Set();let buf='';
eng.stdout.on('data',d=>{buf+=d;let i;while((i=buf.indexOf('\n'))>=0){const l=buf.slice(0,i).replace(/\r$/,'');buf=buf.slice(i+1);for(const c of clients)c.write('data: '+l+'\n\n')}});
// Пропускаем только безопасные UCI-команды (никаких файлов и путей)
const OK=/^(uci|isready|ucinewgame|stop|position (startpos|fen [^;]+)( moves [a-h1-8qrbn ]+)?|go( (movetime|depth|nodes|infinite|searchmoves)( [a-h1-8qrbn ]+| \d+)?)*|setoption name (Hash|MultiPV|Threads|Skill Level|UCI_LimitStrength|UCI_Elo|Move Overhead) value [\w]+)$/;
const send=c=>{if(OK.test(c))eng.stdin.write(c+'\n');else console.error('отклонено:',c)};
const threads=Math.max(1,os.cpus().length-1);
send('uci');send('setoption name Threads value '+threads);send('setoption name Hash value 256');send('isready');
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.wasm':'application/wasm','.png':'image/png','.txt':'text/plain','.md':'text/plain; charset=utf-8'};
http.createServer((req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','*');res.setHeader('Access-Control-Allow-Private-Network','true');
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}
 const u=req.url.split('?')[0];
 if(u==='/ping')return res.end('chessplan-bridge threads='+threads);
 if(u==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache',Connection:'keep-alive'});res.write(':ok\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return}
 if(req.method==='POST'&&u==='/cmd'){let b='';req.on('data',d=>{b+=d;if(b.length>5000)req.destroy()});req.on('end',()=>{b.split('\n').map(x=>x.trim()).filter(Boolean).forEach(send);res.end('ok')});return}
 let f=path.join(SITE,u==='/'?'index.html':decodeURIComponent(u));if(!f.startsWith(SITE)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('not found')}
 res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res)
}).listen(PORT,'127.0.0.1',()=>console.log('Мост запущен: http://localhost:'+PORT+'  (потоков Stockfish: '+threads+'). Не закрывай это окно.'));
