import fs from 'node:fs';

// An export can outlive the build job file it started from (Home reuses that
// path). Only its own job generation and worker may receive terminal updates.
export function updateCompletionExport(file,owner,patch){
 let current;try{current=JSON.parse(fs.readFileSync(file,'utf8'));}catch{return false;}
 if(current.completionToken!==owner.token||current.exportPid!==owner.pid||current.appliedRevision!==owner.revision||current.completionState!=='export-started')return false;
 fs.writeFileSync(file,JSON.stringify({...current,...patch},null,2)+'\n');
 return true;
}
