#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {analyzeShotColor} from '../../src/services/shot-color.mjs';
const args=process.argv.slice(2),dir=path.resolve(args[0]||''),kind=args.includes('--segment')?'segments':'brolls',flag=kind==='segments'?'--segment':'--broll',index=args.indexOf(flag);
try{
 if(!args[0]||index<1||!args[index+1]||args.includes('--segment')&&args.includes('--broll'))throw new Error('node editor/tools/phan-tich-mau.mjs <dự án> --segment ID hoặc --broll ID. Chỉ đọc nguồn, không tự áp màu.');
 const file=path.join(dir,'project.json'),before=fs.readFileSync(file,'utf8'),project=JSON.parse(before),validate=()=>{if(fs.readFileSync(file,'utf8')!==before)throw new Error('Dự án đã đổi; phân tích lại.');};
 const result=await analyzeShotColor(dir,project,{kind,id:args[index+1]},{validate});
 console.log(JSON.stringify({...result,samples:result.samples.map(({image,...sample})=>sample)},null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
