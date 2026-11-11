import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {HF} from '../editor/lib/hf.mjs';import {hyperframesCommand} from '../src/services/hyperframes-command.mjs';
test('pinned cached HyperFrames launches through Node without a shell and preserves path arguments',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'hf-launch-')),cache=path.join(root,'cache'),pkg=path.join(cache,'_npx/id/node_modules/hyperframes');
 try{fs.mkdirSync(path.join(pkg,'bin'),{recursive:true});fs.writeFileSync(path.join(pkg,'bin/cli.mjs'),'');fs.writeFileSync(path.join(pkg,'package.json'),JSON.stringify({name:'hyperframes',version:HF.split('@').at(-1),bin:{hyperframes:'bin/cli.mjs'}}));
 const args=['render','--output','renders/Tên video & (test).mp4'],result=hyperframesCommand(root,args,{environment:{npm_config_cache:cache},platform:'win32',home:root,node:'test-node.exe'});
 assert.equal(result.command,'test-node.exe');assert.equal(result.shell,false);assert.deepEqual(result.args.slice(1),args);assert.equal(result.source,'installed-cli');
 fs.writeFileSync(path.join(pkg,'package.json'),JSON.stringify({name:'hyperframes',version:'0.0.0',bin:{hyperframes:'bin/cli.mjs'}}));assert.equal(hyperframesCommand(root,args,{environment:{npm_config_cache:cache},platform:'win32',home:root}).source,'npx-fallback');
 fs.writeFileSync(path.join(pkg,'outside.mjs'),'');fs.writeFileSync(path.join(pkg,'package.json'),JSON.stringify({name:'hyperframes',version:HF.split('@').at(-1),bin:{hyperframes:'../outside.mjs'}}));fs.writeFileSync(path.join(pkg,'../outside.mjs'),'');assert.equal(hyperframesCommand(root,args,{environment:{npm_config_cache:cache},platform:'win32',home:root}).source,'npx-fallback');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
