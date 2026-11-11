import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {findRenderBrowser} from './render-browser.mjs';
// Render scratch belongs to this installation's disk, not the system drive.
// FFmpeg/FFprobe bundled with the app are passed to HyperFrames explicitly (and put first on PATH),
// so export works on machines without a separate FFmpeg install. A user-configured path still wins.
export function renderEnvironment(root,environment=process.env){
 // App mở thẳng từ \\máy\share: thư mục tạm trên NAS thành \\?\UNC\… và công cụ tách khung báo "network name cannot be found" → dùng ổ máy
 const unc=/^(\\\\|\/\/)/.test(path.resolve(root));
 const folder=unc?path.join(os.tmpdir(),'contentos-render-temp'):path.resolve(root,'workspace/cache/render-temp');fs.mkdirSync(folder,{recursive:true});
 const env={...environment,TEMP:folder,TMP:folder,TMPDIR:folder,FORCE_COLOR:'0'};
 const exe=process.platform==='win32'?'.exe':'',dir=path.resolve(root,'tools','ffmpeg');
 const ffmpeg=path.join(dir,'ffmpeg'+exe),ffprobe=path.join(dir,'ffprobe'+exe);
 if(fs.existsSync(ffmpeg)&&!env.HYPERFRAMES_FFMPEG_PATH)env.HYPERFRAMES_FFMPEG_PATH=ffmpeg;
 if(fs.existsSync(ffprobe)&&!env.HYPERFRAMES_FFPROBE_PATH)env.HYPERFRAMES_FFPROBE_PATH=ffprobe;
 // Chrome render đi kèm app (engines/hyperframes/chrome): máy nào chạy app từ NAS cũng xuất được, không tự tải Chrome về từng máy
 const chrome=findRenderBrowser(path.resolve(root,'engines','hyperframes','chrome'));
 if(chrome&&!env.HYPERFRAMES_BROWSER_PATH)env.HYPERFRAMES_BROWSER_PATH=chrome;
 if(chrome&&!env.CONTENTOS_REMOTION_BROWSER)env.CONTENTOS_REMOTION_BROWSER=chrome;
 return env;
}
