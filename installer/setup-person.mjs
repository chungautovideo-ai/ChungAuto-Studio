import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {installPersonRuntime} from './person-runtime.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
try{const status=await installPersonRuntime(root);console.log(JSON.stringify({ready:status.ready,source:status.source,info:status.info},null,2));}catch(error){console.error(error.message);process.exitCode=1;}
