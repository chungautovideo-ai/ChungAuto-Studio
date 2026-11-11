#!/usr/bin/env node
import path from 'node:path';import {fileURLToPath} from 'node:url';
import {checkSessionCandidate} from '../../src/services/session-candidate-check.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),args=process.argv.slice(2);
try{
 if(![3,7].includes(args.length)||args[1]!=='--claim'||!args[0]||!args[2]||args.length===7&&(args[3]!=='--from'||args[5]!=='--to'||!args[4].trim()||!args[6].trim()))throw Error('Dùng: node editor/tools/kiem-ban-dung.mjs <việc dựng/sửa> --claim ID [--from A --to B]. A/B là giây output, tối đa 30 giây. Chỉ kiểm candidate, không build dự án gốc/xuất/đăng.');
 const window=args.length===7?{from:Number(args[4]),to:Number(args[6])}:undefined;
 const result=checkSessionCandidate(root,args[0],{claimId:args[2],window});console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}catch(error){console.error(error.message);process.exitCode=1;}
