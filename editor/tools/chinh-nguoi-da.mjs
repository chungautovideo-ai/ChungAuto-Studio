#!/usr/bin/env node
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sessionPersonCommand,sessionSelectedPersonMeasurement} from '../../src/services/session-person-command.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
try{
 const args=process.argv.slice(2),flags=new Map(),known=new Set(['--claim','--src','--sha256','--person-light','--body-white','--body-smooth','--apply','--measure-selected','--from','--to']);
 if(!args[0]||args[0].startsWith('--'))throw Error('Dùng: chinh-nguoi-da.mjs <thư mục việc sửa> --claim ID [--src FILE --sha256 HASH --body-white 20 --apply]. Không có mức: đọc report candidate; bỏ --apply: chỉ kiểm.');
 for(let i=1;i<args.length;i++){
  const key=args[i];if(!known.has(key)||flags.has(key))throw Error('Tham số không hợp lệ hoặc trùng: '+key);
  if(key==='--apply'||key==='--measure-selected')flags.set(key,true);else{const value=args[++i];if(!value||value.startsWith('--'))throw Error('Thiếu giá trị '+key);flags.set(key,value);}
 }
 const levels={};for(const [flag,key] of [['--person-light','personLight'],['--body-white','bodyWhite'],['--body-smooth','bodySmooth']])if(flags.has(flag)){if(!flags.get(flag).trim())throw Error('Mức chỉnh không hợp lệ.');levels[key]=Number(flags.get(flag));}
 const editing=Object.keys(levels).length>0;
 const measuring=flags.has('--measure-selected');
 if(measuring&&(editing||flags.has('--apply')||!flags.get('--src')||!flags.get('--sha256')))throw Error('Đo riêng cần --src/--sha256, không kèm mức chỉnh hoặc --apply.');
 if(!flags.get('--claim')||!editing&&!measuring&&(flags.has('--src')||flags.has('--sha256')||flags.has('--apply')))throw Error('Cần claim; khi sửa cần nguồn/hash và ít nhất một mức.');
 const hasRange=flags.has('--from')||flags.has('--to');
 if(hasRange&&(!editing||measuring||!flags.has('--from')||!flags.has('--to')))throw Error('Chỉnh khoảng cần cả --from và --to cùng ít nhất một mức; không kèm --measure-selected.');
 const range=hasRange?{from:Number(flags.get('--from')),to:Number(flags.get('--to'))}:undefined;
 const request=measuring?{src:flags.get('--src'),sha256:flags.get('--sha256')}:editing?{src:flags.get('--src'),sha256:flags.get('--sha256'),levels,...(range?{range}:{})}:undefined;
 const result=measuring?await sessionSelectedPersonMeasurement(root,args[0],{claimId:flags.get('--claim'),request}):sessionPersonCommand(root,args[0],{claimId:flags.get('--claim'),request,apply:flags.has('--apply')});
 console.log(JSON.stringify(result,null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
