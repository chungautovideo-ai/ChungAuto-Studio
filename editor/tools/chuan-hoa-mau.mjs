#!/usr/bin/env node
// Uses the same conversion service as the editor/API; only a claimed candidate is writable.
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {sessionColorCommand} from '../../src/services/session-color-command.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),args=process.argv.slice(2),known=new Set(['--claim','--segment','--broll','--profile','--technical-lut','--look-lut','--encoder','--stabilize','--apply','--list-luts']),flags=new Map();
try{
 const usage='node editor/tools/chuan-hoa-mau.mjs <dự án> --claim ID (--segment ID|--broll ID) [--profile auto] [--technical-lut PATH] [--look-lut PATH] [--encoder auto|cpu|gpu] [--stabilize off|smooth|lock|fast] [--apply]; hoặc --list-luts';
 if(!args[0]||args[0].startsWith('--'))throw new Error(usage);
 for(let i=1;i<args.length;i++){const key=args[i];if(!known.has(key)||flags.has(key))throw new Error('Tham số không hợp lệ hoặc trùng: '+key);if(['--apply','--list-luts'].includes(key))flags.set(key,true);else{const value=args[++i];if(!value||value.startsWith('--'))throw new Error('Thiếu giá trị '+key);flags.set(key,value);}}
 const list=flags.has('--list-luts');if(!flags.has('--claim')||!list&&flags.has('--segment')===flags.has('--broll')||list&&[...flags.keys()].some(k=>!['--claim','--list-luts'].includes(k)))throw new Error(usage);
 const controller=new AbortController();process.once('SIGINT',()=>controller.abort());process.once('SIGTERM',()=>controller.abort());
 const request={kind:flags.has('--segment')?'segments':'brolls',id:flags.get('--segment')||flags.get('--broll'),profile:flags.get('--profile')||'auto',encoder:flags.get('--encoder')||'auto',stabilize:flags.get('--stabilize')||'off'};
 if(flags.has('--technical-lut'))request.technicalLut=flags.get('--technical-lut');if(flags.has('--look-lut'))request.lookLut=flags.get('--look-lut');
 console.log(JSON.stringify(await sessionColorCommand(root,args[0],{claimId:flags.get('--claim'),request,list,apply:flags.has('--apply'),signal:controller.signal}),null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
