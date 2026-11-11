import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('Windows launcher resolves portable Node with empty PATH and reports missing runtime',{skip:process.platform!=='win32'},()=>{
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-runtime-'));
 const portable=path.join(fixture,'tools/node/node.exe');
 const runtime=fileURLToPath(new URL('../installer/runtime.ps1',import.meta.url));
 fs.mkdirSync(path.dirname(portable),{recursive:true});
 fs.copyFileSync(process.execPath,portable);
 const quote=value=>"'"+value.replaceAll("'","''")+"'";
 const run=()=>spawnSync(path.join(process.env.SystemRoot,'System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoProfile','-ExecutionPolicy','Bypass','-Command',`[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false); . ${quote(runtime)}; $env:PATH=''; try { Resolve-ContentOSNode -AppRoot ${quote(fixture)} } catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }`],{encoding:'utf8',windowsHide:true,timeout:15000});
 try{
  const resolved=run();assert.equal(resolved.status,0,resolved.stderr);assert.equal(resolved.stdout.trim(),portable.replaceAll('/','\\'));
  fs.unlinkSync(portable);
  const missing=run();assert.equal(missing.status,1);assert.match(missing.stderr,/Node.js 22\+/);
 }finally{fs.rmSync(fixture,{recursive:true,force:true});}
});

