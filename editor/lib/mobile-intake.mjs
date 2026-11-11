import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { execFile } from 'node:child_process';
import QRCode from 'qrcode';

const ALLOWED = new Set(['.mp4','.mov','.m4v','.webm','.png','.jpg','.jpeg','.webp','.gif','.wav','.mp3','.m4a','.aac']);
const reply = (res, code, body) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body)); };
export function createMobileIntake({root,port=5181,host='0.0.0.0',maxBytes=2*1024**3,ttlMs=3600000,clock=Date.now,probe}={}) {
  const sessions=new Map(),receiving=new Set();let server=null,starting=null,verifications=0;
  const inspect = probe || (file=>new Promise((resolve,reject)=>execFile('ffprobe',['-v','error','-show_entries','stream=codec_type:format=duration','-of','json',file],{timeout:30000,maxBuffer:1024*1024,windowsHide:true},(e,out)=>e?reject(new Error('Không đọc được file media.')):resolve(JSON.parse(out)))));
  function lookup(token) {
    const s=sessions.get(token);
    if(!s||s.expiresAt<=clock()){sessions.delete(token);return null;}
    return s;
  }
  function project(dir) {
    if(typeof dir!=='string')throw new Error('Thiếu dự án.');
    const base=fs.realpathSync(path.join(root,'workspace','content'));
    const target=fs.realpathSync(path.resolve(root,dir));
    const rel=path.relative(base,target);
    if(!rel||rel.startsWith('..')||path.isAbsolute(rel)||rel.split(path.sep).length!==2)throw new Error('Dự án ngoài phạm vi.');
    const p=JSON.parse(fs.readFileSync(path.join(target,'project.json'),'utf8'));
    return {target,p};
  }
  function history(dir,workspaceId){
    const {target,p}=project(dir);if((p.workspaceId||'default')!==workspaceId)throw new Error('Dự án không thuộc workspace đang dùng.');
    const file=path.join(target,'work/phone-assets.json');if(!fs.existsSync(file))return [];
    const manifest=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(manifest.assets)||manifest.assets.length>10000)throw new Error('Lịch sử nhận file không hợp lệ.');
    return manifest.assets.map(asset=>{
      if(!/^inputs\/phone\/[a-zA-Z0-9-]+\.[a-z0-9]+$/.test(asset.path||''))throw new Error('Đường dẫn lịch sử nhận file không hợp lệ.');
      let state='missing';try{const stored=path.join(target,asset.path),real=fs.realpathSync(stored);if(!real.startsWith(target+path.sep))throw new Error('Tư liệu ngoài dự án.');const stat=fs.statSync(real);state=stat.isFile()&&stat.size===asset.bytes?'present':'changed';}catch(error){if(error.code!=='ENOENT')state='changed';}
      return {...asset,state};
    });
  }
  async function verifyPhoneAsset(target,asset,validate=()=>{}){
    if(!/^inputs\/phone\/[a-zA-Z0-9-]+\.[a-z0-9]+$/.test(asset.path||'')||!Number.isSafeInteger(asset.bytes)||asset.bytes<1||asset.bytes>maxBytes||!/^[a-f0-9]{64}$/.test(asset.sha256||''))throw new Error('Thông tin source điện thoại không hợp lệ.');
    const file=path.join(target,asset.path),real=await fs.promises.realpath(file);if(!real.startsWith(target+path.sep))throw new Error('Source điện thoại ngoài dự án.');
    const handle=await fs.promises.open(real,'r');
    try{const before=await handle.stat();if(!before.isFile()||before.size!==asset.bytes)throw new Error('Source điện thoại đã thay đổi.');const hash=crypto.createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);let bytes=0;
      for(;;){validate();const {bytesRead}=await handle.read(buffer,0,buffer.length,null);if(!bytesRead)break;bytes+=bytesRead;if(bytes>asset.bytes)throw new Error('Source điện thoại đã thay đổi.');hash.update(buffer.subarray(0,bytesRead));}
      const after=await handle.stat(),current=await fs.promises.stat(file);validate();if(bytes!==asset.bytes||after.mtimeMs!==before.mtimeMs||after.size!==before.size||current.ino!==after.ino||current.size!==after.size||current.mtimeMs!==after.mtimeMs||hash.digest('hex')!==asset.sha256)throw new Error('Source điện thoại đã thay đổi.');
    }finally{await handle.close();}
  }
  async function handle(req,res) {
    res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
    const url=new URL(req.url,'http://mobile.local');
    if(req.method==='GET'&&url.pathname==='/m'){
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"});
      return res.end(fs.readFileSync(path.join(root,'editor','ui','mobile.html')));
    }
    const token=String(req.headers['x-upload-token']||'');const session=lookup(token);
    if(!session)return reply(res,401,{error:'Link hết hạn hoặc đã thu hồi. Mở kết nối điện thoại trên PC để lấy link mới.'});
    // No editor/AI/admin endpoints exist on this listener. Capability is upload-only.
    if(req.method==='GET'&&url.pathname==='/session')return reply(res,200,{title:session.title,expiresAt:session.expiresAt,maxBytes,files:session.files});
    if(req.method!=='POST'||url.pathname!=='/upload')return reply(res,404,{error:'Không có chức năng này trong phiên gửi tư liệu.'});
    if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`)return reply(res,403,{error:'Nguồn yêu cầu không hợp lệ.'});
    if(session.busy)return reply(res,409,{error:'Đang nhận một file khác, hãy đợi hoàn tất.'});
    let temp,lockedTarget;
    try {
      const {target,p}=project(session.dir);if((p.workspaceId||'default')!==session.workspaceId)throw new Error('Workspace của dự án đã đổi. Tạo phiên mới.');
      if(receiving.has(target))return reply(res,409,{error:'Dự án đang nhận file từ thiết bị khác. Hãy thử lại khi xong.'});
      const raw=String(url.searchParams.get('name')||'');const ext=path.extname(raw).toLowerCase();
      if(!ALLOWED.has(ext))return reply(res,415,{error:'Định dạng file chưa hỗ trợ.'});
      if(Number(req.headers['content-length'])>maxBytes)return reply(res,413,{error:'File vượt giới hạn dung lượng.'});
      const incoming=path.join(target,'inputs','phone');fs.mkdirSync(incoming,{recursive:true});
      if(fs.realpathSync(incoming)!==path.resolve(incoming))throw new Error('Thư mục nhận không được là liên kết ngoài dự án.');
      const disk=fs.statfsSync(incoming), available=Number(disk.bavail)*Number(disk.bsize), declared=Number(req.headers['content-length'])||0;
      if(available<declared+128*1024**2)return reply(res,507,{error:'Ổ máy dựng không đủ chỗ trống để nhận file.'});
      session.busy=true;
      receiving.add(target);lockedTarget=target;
      const id=crypto.randomUUID();temp=path.join(incoming,'.'+id+'.part');const dest=path.join(incoming,id+ext);
      let bytes=0;const hash=crypto.createHash('sha256');
      const limiter=new Transform({transform(chunk,enc,done){bytes+=chunk.length;if(bytes>maxBytes||bytes>available-128*1024**2)return done(new Error('File vượt giới hạn dung lượng hoặc ổ đĩa không đủ chỗ.'));hash.update(chunk);done(null,chunk);}});
      await pipeline(req,limiter,fs.createWriteStream(temp,{flags:'wx'}));
      if(!bytes)throw new Error('File rỗng.');
      if(lookup(token)!==session)throw new Error('Phiên đã hết hạn hoặc thu hồi trong khi tải.');
      const media=await inspect(temp);
      if(!media.streams?.some(s=>['video','audio'].includes(s.codec_type)))throw new Error('Không nhận diện được media.');
      if(lookup(token)!==session)throw new Error('Phiên đã thu hồi.');
      if((project(session.dir).p.workspaceId||'default')!==session.workspaceId)throw new Error('Workspace của dự án đã đổi khi nhận file.');
      const sha256=hash.digest('hex');
      const manifestFile=path.join(target,'work','phone-assets.json');
      const manifest=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{schemaVersion:1,assets:[]};
      if(!Array.isArray(manifest.assets)||manifest.assets.length>=10000)throw new Error('Lịch sử nguồn điện thoại đầy hoặc không hợp lệ.');
      const validateSession=()=>{if(res.destroyed||lookup(token)!==session||(project(session.dir).p.workspaceId||'default')!==session.workspaceId)throw new Error('Phiên hoặc workspace đã đổi trong khi kiểm source.');};
      let duplicate=null;
      for(const candidate of manifest.assets.filter(f=>f.sha256===sha256&&f.bytes===bytes)){
        try{await verifyPhoneAsset(target,candidate,validateSession);duplicate=candidate;break;}catch(error){validateSession();if(!['ENOENT','ENOTDIR'].includes(error.code)&&!['Source điện thoại đã thay đổi.','Source điện thoại ngoài dự án.','Thông tin source điện thoại không hợp lệ.'].includes(error.message))throw error;}
      }
      validateSession();
      if(duplicate){fs.unlinkSync(temp);temp=null;if(!session.files.some(file=>file.id===duplicate.id))session.files.push(duplicate);return reply(res,200,{ok:true,duplicate:true,file:duplicate});}
      fs.renameSync(temp,dest);temp=null;
      const file={id,name:raw.slice(0,200),path:'inputs/phone/'+path.basename(dest),bytes,sha256,receivedAt:new Date(clock()).toISOString()};
      try{
        manifest.assets.push(file);fs.mkdirSync(path.dirname(manifestFile),{recursive:true});
        const pending=manifestFile+'.'+id+'.tmp';fs.writeFileSync(pending,JSON.stringify(manifest,null,2));fs.renameSync(pending,manifestFile);
      }catch(e){fs.rmSync(dest,{force:true});throw e;}
      session.files.push(file);
      reply(res,201,{ok:true,file});
    }catch(e){if(!res.destroyed)reply(res,400,{error:e.message});}
    finally{if(lockedTarget){session.busy=false;receiving.delete(lockedTarget);}if(temp)fs.rmSync(temp,{force:true});}
  }
  async function start() {
    if(server?.listening)return;
    if(starting)return starting;
    starting=new Promise((resolve,reject)=>{
      server=http.createServer((req,res)=>handle(req,res).catch(()=>{if(!res.headersSent)reply(res,500,{error:'Không nhận được file.'});}));
      server.requestTimeout=30*60*1000;
      server.once('error',e=>{server=null;reject(e);});server.listen(port,host,resolve);
    });
    try{await starting;}finally{starting=null;}
  }
  return {
    async create(dir,workspaceId){
      const {p}=project(dir);if((p.workspaceId||'default')!==workspaceId)throw new Error('Chọn dự án thuộc workspace đang dùng.');
      await start();
      for(const [key,s] of sessions)if(s.expiresAt<=clock())sessions.delete(key);
      const token=crypto.randomBytes(32).toString('base64url'),id=crypto.randomUUID(),expiresAt=clock()+ttlMs;
      sessions.set(token,{id,dir,workspaceId,title:p.title||path.basename(dir),expiresAt,files:[],busy:false});
      const addresses=Object.values(os.networkInterfaces()).flat().filter(n=>n.family==='IPv4'&&!n.internal&&/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(n.address)).map(n=>n.address);
      const actualPort=server.address().port;
      const links=(addresses.length?addresses:['127.0.0.1']).map(address=>({address,url:`http://${address}:${actualPort}/m#${token}`}));
      const qr=await QRCode.toDataURL(links[0].url,{width:280,margin:2});
      return {id,expiresAt,links,qr,lanAvailable:addresses.length>0};
    },
    revoke(id){for(const [token,s] of sessions)if(s.id===id)sessions.delete(token);},
    history,
    async verify(dir,workspaceId,id,{validate=()=>{}}={}){
      validate();const {target}=project(dir),asset=history(dir,workspaceId).find(file=>file.id===id);if(!asset)throw new Error('Không thấy source điện thoại.');if(verifications>=2)throw Object.assign(new Error('Đang kiểm tra hai source. Thử lại sau.'),{status:429});
      verifications++;try{await verifyPhoneAsset(target,asset,validate);validate();const current=history(dir,workspaceId).find(file=>file.id===id);if(!current||current.path!==asset.path||current.sha256!==asset.sha256||current.bytes!==asset.bytes)throw new Error('Bản ghi source đã đổi khi kiểm tra.');return {id,ok:true,sha256:asset.sha256,bytes:asset.bytes,verifiedAt:new Date(clock()).toISOString()};}finally{verifications--;}
    },
    status(id,workspaceId){for(const [token,s] of sessions)if(s.id===id&&lookup(token)){if(workspaceId!==undefined&&s.workspaceId!==workspaceId)throw new Error('Phiên thuộc workspace khác.');return {id,title:s.title,expiresAt:s.expiresAt,files:s.files,busy:s.busy};}throw new Error('Phiên đã hết hạn hoặc thu hồi.');},
    async close(){sessions.clear();if(server){const current=server;server=null;await new Promise(resolve=>current.close(resolve));}},
  };
}
