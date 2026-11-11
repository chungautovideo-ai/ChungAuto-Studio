import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';
import {waitForRenderLock} from './render-lock.mjs';
import {assertProjectRevision} from './project-revisions.mjs';
import {fingerprintArtifact,verifyArtifact} from './artifact-integrity.mjs';
import {execFileSync} from 'node:child_process';
import http from 'node:http';
import {findRenderBrowser} from './render-browser.mjs';
import {posterDimensions} from './poster-input.mjs';
export function normalizeRemotionScene(value){
 const text=(v,max)=>{if(typeof v!=='string'||v.length>max)throw new Error('Nội dung cảnh Remotion không hợp lệ.');return v;};
 const color=v=>{if(!/^#[0-9a-f]{6}$/i.test(v))throw new Error('Màu cảnh cần dạng #RRGGBB.');return v.toLowerCase();};
 const duration=Number(value.duration??3);if(!Number.isFinite(duration)||duration<0.5||duration>30)throw new Error('Cảnh dài từ 0,5 đến 30 giây.');
 if(!['9:16','16:9'].includes(value.format))throw new Error('Tỷ lệ cảnh không hợp lệ.');
 return {title:text(value.title,300),subtitle:text(value.subtitle??'',600),background:color(value.background??'#101014'),color:color(value.color??'#ffffff'),accent:color(value.accent??'#d3f53c'),width:value.format==='16:9'?1920:1080,height:value.format==='16:9'?1080:1920,fps:30,durationInFrames:Math.round(duration*30)};
}
export function remotionRuntime(root){
 let saved={};try{saved=JSON.parse(fs.readFileSync(path.join(root,'workspace/contentos/remotion-runtime.json'),'utf8'));}catch{}
 const local=path.join(root,'engines/remotion/node_modules');
 const modules=path.resolve(process.env.CONTENTOS_REMOTION_RUNTIME||local);
 const require=createRequire(path.resolve(modules,'../package.json'));
 for(const [name,expected] of Object.entries({'@remotion/renderer':'4.0.538','@remotion/bundler':'4.0.538','@remotion/fonts':'4.0.538',remotion:'4.0.538',react:'19.3.1','react-dom':'19.3.1'})){
  const packageFile=fs.realpathSync(require.resolve(name+'/package.json')),relative=path.relative(fs.realpathSync(modules),packageFile);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error('Runtime '+name+' nằm ngoài thư mục dependency đã chọn.');
  const version=JSON.parse(fs.readFileSync(packageFile,'utf8')).version;if(version!==expected)throw new Error('Runtime '+name+' cần phiên bản '+expected+'. Chạy installer/setup.ps1 để kiểm và cài lại.');
 }
 const browserExecutable=process.env.CONTENTOS_REMOTION_BROWSER||(saved.browserExecutable&&fs.existsSync(saved.browserExecutable)?saved.browserExecutable:findRenderBrowser());
 if(!browserExecutable||!fs.existsSync(browserExecutable))throw new Error('Chưa có Chrome local cho Remotion. Chạy installer/setup.ps1; render không tự tải trình duyệt.');
 return {modules,require,version:'4.0.538',browserExecutable,independent:modules===path.resolve(local)&&fs.realpathSync(modules)===path.resolve(local)};
}
export async function renderRemotionScene({root,projectDir,revision,scene,still=null,signal,validate=()=>{},onProgress=()=>{},runtime=remotionRuntime(root)}){
 const props=still?still.props:normalizeRemotionScene(scene),compositionId=still?.kind==='thumbnail'?'ContentOSThumbnail':still?'ContentOSPoster':'ContentOSTitleCard';
 const entry=path.join(root,'engines/remotion/src',still?'stills.jsx':'index.jsx');
 const codeHash=crypto.createHash('sha256');for(const name of ['index.jsx','stills.jsx','aiev/Poster.tsx','aiev/Thumbnail.tsx','aiev/brandFonts.ts'])codeHash.update(fs.readFileSync(path.join(root,'engines/remotion/src',name)));
 const fingerprint=codeHash.update(JSON.stringify({props,version:runtime.version,assets:still?.assets?.map(a=>({name:a.name,sha256:a.sha256,bytes:a.bytes}))||[]})).digest('hex');
 const check=()=>{signal?.throwIfAborted();validate();assertProjectRevision(path.join(projectDir,'project.json'),revision);};check();
 const lock=await waitForRenderLock(root,{projectDir,kind:'remotion-scene'},{signal,validate:check,onWait:()=>onProgress({phase:'Đang chờ lượt render cảnh Remotion…'})});
 const folder=path.join(projectDir,'inputs/remotion',fingerprint),output=path.join(folder,still?'scene.png':'scene.mp4'),metadata=output+'.json';let browser,server;const browserListeners=[];
 try{
  check();if(fs.existsSync(output)&&fs.existsSync(metadata)){const cached=JSON.parse(fs.readFileSync(metadata,'utf8'));verifyArtifact(output,cached);return {...cached,path:path.relative(projectDir,output).replace(/\\/g,'/'),cached:true};}
  fs.mkdirSync(folder,{recursive:true});const temporary=path.join(folder,crypto.randomUUID()+(still?'.png':'.mp4')),bundleDir=path.join(folder,'bundle'),publicDir=still?path.join(folder,'public'):null;
  const {bundle}=runtime.require('@remotion/bundler'),renderer=runtime.require('@remotion/renderer');
  try{
   onProgress({phase:'Đang biên dịch composition React…'});
   if(publicDir){fs.mkdirSync(publicDir,{recursive:true});for(const asset of still.assets||[]){if(!/^[a-z]+\.(png|jpg|woff2?|ttf|otf)$/.test(asset.name))throw new Error('Tên asset composition không hợp lệ.');verifyArtifact(asset.file,asset);fs.copyFileSync(asset.file,path.join(publicDir,asset.name));verifyArtifact(path.join(publicDir,asset.name),asset);}}
   await bundle({entryPoint:entry,outDir:bundleDir,publicDir,enableCaching:false,webpackOverride:config=>({...config,resolve:{...config.resolve,modules:[runtime.modules,...(config.resolve?.modules||[])],alias:{...config.resolve?.alias,react:path.join(runtime.modules,'react'),'react-dom':path.join(runtime.modules,'react-dom'),remotion:path.join(runtime.modules,'remotion'),'@remotion/fonts':path.join(runtime.modules,'@remotion/fonts')}}})});check();
   // Bind an explicit IPv4 loopback URL: localhost may resolve to a different
   // existing IPv6 service on this workstation.
   server=http.createServer((req,res)=>{try{const relative=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\//,''),file=path.resolve(bundleDir,relative||'index.html');if(path.relative(bundleDir,file).startsWith('..')||!fs.statSync(file).isFile())throw new Error();res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html':'application/octet-stream');fs.createReadStream(file).on('error',()=>res.destroy()).pipe(res);}catch{res.writeHead(404);res.end();}});
   await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const serveUrl='http://127.0.0.1:'+server.address().port;
   const events=['exit','SIGINT','SIGTERM','SIGHUP'],before=new Map(events.map(event=>[event,new Set(process.listeners(event))]));
   try{browser=await renderer.openBrowser('chrome',{browserExecutable:runtime.browserExecutable,logLevel:'error'});}finally{for(const event of events)for(const listener of process.listeners(event))if(!before.get(event).has(listener))browserListeners.push([event,listener]);}check();
   const composition=await renderer.selectComposition({serveUrl,id:compositionId,inputProps:props,puppeteerInstance:browser});check();
   const {cancelSignal,cancel}=renderer.makeCancelSignal();const abort=()=>cancel();signal?.addEventListener('abort',abort,{once:true});
   try{check();if(still)await renderer.renderStill({serveUrl,composition,inputProps:props,puppeteerInstance:browser,imageFormat:'png',output:temporary,frame:0,cancelSignal,logLevel:'error'});else await renderer.renderMedia({serveUrl,composition,inputProps:props,puppeteerInstance:browser,codec:'h264',outputLocation:temporary,concurrency:2,cancelSignal,logLevel:'error',onProgress:p=>onProgress({phase:'Đang render cảnh Remotion…',progress:p.progress})});}finally{signal?.removeEventListener('abort',abort);}
   check();const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=width,height,r_frame_rate,codec_type','-of','json',temporary],{encoding:'utf8',windowsHide:true})),video=probe.streams.find(s=>s.codec_type==='video');
   const dimensions=still?posterDimensions[props.aspect]:[props.width,props.height];
   if(!video||video.width!==dimensions[0]||video.height!==dimensions[1]||(!still&&(video.r_frame_rate!=='30/1'||Math.abs(Number(probe.format.duration)-props.durationInFrames/30)>0.1)))throw new Error('Cảnh Remotion xuất không khớp thông số.');
   check();fs.renameSync(temporary,output);const result={...fingerprintArtifact(output),engine:'remotion',runtime:runtime.version,composition:compositionId,fingerprint,revision,props,probe,createdAt:new Date().toISOString()};fs.writeFileSync(metadata,JSON.stringify(result,null,2));
   return {...result,path:path.relative(projectDir,output).replace(/\\/g,'/'),cached:false};
  }finally{fs.rmSync(temporary,{force:true});fs.rmSync(bundleDir,{recursive:true,force:true});if(publicDir)fs.rmSync(publicDir,{recursive:true,force:true});}
 }finally{try{if(browser){await browser.connection.send('Browser.close').catch(()=>{});browser.disconnect();}}finally{for(const [event,listener] of browserListeners)process.removeListener(event,listener);server?.closeAllConnections();if(server)await new Promise(resolve=>server.close(resolve));lock.release();}}
}
