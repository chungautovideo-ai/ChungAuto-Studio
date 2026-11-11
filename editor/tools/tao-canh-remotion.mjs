#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {renderRemotionScene} from '../../src/services/remotion-scenes.mjs';import {resolveContained} from '../../src/services/storage.mjs';import {projectRevision} from '../../src/services/project-revisions.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const [directory,parameters]=process.argv.slice(2);
if(!directory||!parameters){console.error('Dùng: node editor/tools/tao-canh-remotion.mjs <project dir tương đối> <scene.json tương đối trong project>');process.exit(1);}
try{
 const projectDir=resolveContained(path.join(root,'workspace/content'),path.relative(path.join(root,'workspace/content'),path.resolve(root,directory))).file;
 const scene=JSON.parse(fs.readFileSync(resolveContained(projectDir,parameters).file,'utf8')),revision=projectRevision(path.join(projectDir,'project.json'));
 const controller=new AbortController();process.once('SIGINT',()=>controller.abort());process.once('SIGTERM',()=>controller.abort());
 const result=await renderRemotionScene({root,projectDir,revision,scene,signal:controller.signal,onProgress:p=>console.error(p.phase)});
 console.log(JSON.stringify({path:result.path,revision,engine:result.engine,props:result.props,cached:result.cached,sha256:result.sha256,note:'Cảnh đã tạo trong inputs; thêm src này vào brolls của candidate hoặc editor. Chưa sửa project hoặc xuất final.'},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
