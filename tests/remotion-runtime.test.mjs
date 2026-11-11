import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {findRenderBrowser} from '../src/services/render-browser.mjs';import {remotionRuntime} from '../src/services/remotion-scenes.mjs';
test('Remotion uses pinned local packages, ignores legacy external modules and validates browser without downloads',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-remotion-runtime-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const modules=path.join(root,'engines/remotion/node_modules');
 for(const [name,version] of Object.entries({'@remotion/fonts':'4.0.538','@remotion/bundler':'4.0.538','@remotion/renderer':'4.0.538',remotion:'4.0.538',react:'19.3.1','react-dom':'19.3.1'})){const folder=path.join(modules,name);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'package.json'),JSON.stringify({name,version}));}
 const browser=path.join(root,'browser/chrome.exe');fs.mkdirSync(path.dirname(browser));fs.writeFileSync(browser,'fixture');assert.equal(findRenderBrowser(path.join(root,'browser')),browser);assert.equal(findRenderBrowser(path.join(root,'missing')),'');
 fs.mkdirSync(path.join(root,'workspace/contentos'),{recursive:true});fs.writeFileSync(path.join(root,'workspace/contentos/remotion-runtime.json'),JSON.stringify({modules:path.join(root,'external/node_modules'),browserExecutable:browser}));
 const runtime=remotionRuntime(root);assert.equal(runtime.modules,modules);assert.equal(runtime.independent,true);assert.equal(runtime.browserExecutable,browser);
 const react=path.join(modules,'react/package.json');fs.writeFileSync(react,JSON.stringify({version:'0.0.0'}));assert.throws(()=>remotionRuntime(root),/19.3.1/);
});
