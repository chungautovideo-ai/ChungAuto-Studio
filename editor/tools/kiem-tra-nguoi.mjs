#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';
import {personExposureReport} from '../../src/services/person-exposure-report.mjs';
try{
 const args=process.argv.slice(2);if(args.length!==1||args[0].startsWith('--'))throw new Error('Dùng: node editor/tools/kiem-tra-nguoi.mjs <thư mục dự án>');
 const dir=fs.realpathSync(path.resolve(args[0])),project=JSON.parse(fs.readFileSync(path.join(dir,'project.json'),'utf8'));
 console.log(JSON.stringify(personExposureReport(dir,project),null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
