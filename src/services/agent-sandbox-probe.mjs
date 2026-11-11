import {execFile} from 'node:child_process';
import {classifyAgentRunFailure} from './agent-run-failure.mjs';

export async function probeCodexSandbox(bin,{cwd,env,execute=execFile,implementation}={}){
 const result=await new Promise(resolve=>{
  const args=implementation==='mxc'?['-c','windows.sandbox="mxc"','sandbox','--include-managed-config','--permission-profile',':workspace','--','node','--version']:['sandbox','-c','sandbox_mode="workspace-write"','node','--version'];
  execute(bin,args,{cwd,env,shell:/\.cmd$/i.test(bin),windowsHide:true,encoding:'utf8',timeout:20000,maxBuffer:65536},(error,stdout='',stderr='')=>resolve({error,stdout,stderr}));
 });
 const output=String(result.stdout)+'\n'+String(result.stderr);
 if(!result.error&&/^v\d+\.\d+\.\d+\s*$/m.test(String(result.stdout)))return {checked:true,ready:true};
 if(/(?:unrecognized subcommand|unexpected argument)[^\r\n]*['"]?sandbox/i.test(output))return {checked:false,ready:null,reason:'unsupported'};
 const failure=classifyAgentRunFailure('codex',output);
 return {checked:true,ready:false,errorCode:failure.code==='CLI_EXEC_UNAVAILABLE'?failure.code:'CLI_SANDBOX_PROBE_FAILED',message:failure.message?failure.message.replace('Xem work/ai-run.log để đối chiếu.','Lỗi được phát hiện trước khi khởi chạy model dựng video.'):'Chưa chạy được lệnh kiểm tra trong sandbox Codex. Kiểm tra môi trường Codex tại thư mục ContentOS rồi giao lại; chưa khởi chạy model dựng video.'};
}
