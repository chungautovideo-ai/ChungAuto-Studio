import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
export function findRenderBrowser(folder=path.join(os.homedir(),'.cache/hyperframes/chrome'),depth=0){
 if(depth>5||!fs.existsSync(folder))return '';
 for(const entry of fs.readdirSync(folder,{withFileTypes:true})){
  if(entry.isSymbolicLink())continue;const file=path.join(folder,entry.name);
  if(entry.isFile()&&['chrome.exe','chrome','Chromium','chrome-headless-shell.exe','chrome-headless-shell'].includes(entry.name))return file;
  if(entry.isDirectory()){const found=findRenderBrowser(file,depth+1);if(found)return found;}
 }
 return '';
}
