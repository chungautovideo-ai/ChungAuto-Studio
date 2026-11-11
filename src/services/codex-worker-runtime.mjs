import {execFile} from 'node:child_process';import {promisify} from 'node:util';
import {probeCodexSandbox} from './agent-sandbox-probe.mjs';
const run=promisify(execFile);
export function supportsMxcProbe(version){const match=/codex-cli\s+(\d+)\.(\d+)\.(\d+)/.exec(version);return !!match&&(Number(match[1])>0||Number(match[2])>=162);}
export async function prepareCodexWorkerRuntime(bin,{cwd,env,fallbackBins=[],probe=probeCodexSandbox,version=async file=>String((await run(file,['--version'],{cwd,env,windowsHide:true,shell:/\.cmd$/i.test(file),timeout:10000,maxBuffer:32768})).stdout)}={}){
 const original=await probe(bin,{cwd,env});
 if(original.ready||!original.checked)return {bin,configArgs:[],implementation:'configured',probe:original};
 // Only retry a known startup failure, never auth/network/model errors or a
 // weaker legacy sandbox. The explicit MXC implementation fails closed.
 if(original.errorCode==='CLI_EXEC_UNAVAILABLE')for(const candidate of [...new Set([bin,...fallbackBins].filter(Boolean))]){
  let currentVersion;try{currentVersion=await version(candidate);}catch{continue;}
  if(!supportsMxcProbe(currentVersion))continue;
  const checked=await probe(candidate,{cwd,env,implementation:'mxc'});
  if(checked.ready)return {bin:candidate,configArgs:['-c','windows.sandbox="mxc"'],implementation:'mxc',probe:checked};
 }
 throw Object.assign(new Error(original.message),{errorCode:original.errorCode});
}
