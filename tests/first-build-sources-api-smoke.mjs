import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawn,execFile} from 'node:child_process';import {promisify} from 'node:util';import {fileURLToPath} from 'node:url';
const run=promisify(execFile),base='http://127.0.0.1:5195',delay=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn(process.execPath,['editor/server.mjs','--home','--port','5195'],{windowsHide:true,stdio:'ignore'});
async function call(url,body,method='POST'){const r=await fetch(base+url,body===undefined?{}:{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
try{
 for(let i=0;i<60;i++){try{await call('/api/ping');break;}catch{await delay(100);}}
 const source=fileURLToPath(new URL('./fixture.mp4',import.meta.url)),sourceBefore=fs.readFileSync(source);
 const upload=await fetch(base+'/api/new-project?file=fixture.mp4&name=ContentOS-Smoke-FirstSources&noasr=1',{method:'POST',body:sourceBefore});assert.ok(upload.ok);const created=await upload.json(),liveFile=path.join(created.dir,'project.json');
 const note='Dựng quảng cáo từ nguồn đã chọn\nA-roll: "'+source+'"\nB-roll: "'+source+'"';
 const inspected=await call('/api/v1/sources/inspect',{dir:created.dir,text:note});assert.equal(inspected.status,200);assert.equal(inspected.body.sources.length,2);
 const template=(await call('/api/installed-templates')).body.items[0].id;
 for(const execution of [{mode:'api',agent:'codex'},{mode:'cli',agent:'auto'},{mode:'session',agent:'codex',model:'model-only-cli'}])assert.equal((await call('/api/ai-job',{dir:created.dir,template,execution,completionMode:'review'})).status,400);
 const invalid=await call('/api/ai-job',{dir:created.dir,template,note:'B-roll: "'+source+'.missing"',completionMode:'review'});assert.equal(invalid.status,400);assert.equal(fs.existsSync(path.join(created.dir,'work/ai-job.json')),false);
 const queued=await call('/api/ai-job',{dir:created.dir,template,note,execution:{mode:'session',agent:'codex'},completionMode:'review',sfxLevel:'tat',background:true});assert.equal(queued.status,200,JSON.stringify(queued.body));const job=queued.body.job;assert.equal(job.sources.length,2);assert.equal(job.sources[1].role,'broll');assert.deepEqual(job.execution,{mode:'session',agent:'codex'});assert.equal(job.background,false);assert.equal(queued.body.runner,null);
 const skipped=await run(process.execPath,['editor/tools/ai-inbox.mjs','--next','--dir',created.dir,'--agent','claude'],{env:{...process.env,EDITOR_PORT:'5195'},windowsHide:true});assert.match(skipped.stdout,/Không có việc/);assert.equal(JSON.parse(fs.readFileSync(path.join(created.dir,'work/ai-job.json'))).status,'waiting');
 const originalProject=fs.readFileSync(liveFile,'utf8'),candidateBefore=fs.readFileSync(path.resolve(job.candidate),'utf8');
 const cli=await run(process.execPath,['editor/tools/nhap-nguon-chat.mjs',created.dir,'0'],{env:{...process.env,EDITOR_PORT:'5195'},windowsHide:true});const imported=JSON.parse(cli.stdout);assert.equal(imported.asset.sha256.length,64);assert.ok(fs.existsSync(path.join(created.dir,imported.asset.path)));
 assert.equal((await call('/api/v1/sources/attach-job',{jobDir:created.dir,path:source})).body.duplicate,true);
 assert.equal((await call('/api/v1/sources/attach-job',{jobDir:created.dir,path:path.resolve('package.json')})).status,400);
 assert.equal(fs.readFileSync(liveFile,'utf8'),originalProject);assert.equal(fs.readFileSync(path.resolve(job.candidate),'utf8'),candidateBefore);assert.deepEqual(fs.readFileSync(source),sourceBefore);
 const newer=JSON.parse(originalProject);newer.title='Newer manual edit';fs.writeFileSync(liveFile,JSON.stringify(newer,null,2)+'\n');
 assert.equal((await call('/api/v1/sources/attach-job',{jobDir:created.dir,path:source})).status,409);
 const workspaceId=(await call('/api/v1/workspaces')).body.activeId;
 const preview=await call('/api/v1/sources/preview',{workspaceId,text:note,selected:source});assert.equal(preview.status,200);
 const surveyed=await call('/api/v1/storage/new-project',{workspaceId,text:note,selected:source,previewManifest:preview.body.manifestPath,noasr:true});assert.equal(surveyed.status,201,JSON.stringify(surveyed.body));
 const surveyQueued=await call('/api/ai-job',{dir:surveyed.body.dir,template,note,execution:{mode:'session',agent:'codex'},completionMode:'review'});assert.equal(surveyQueued.status,200,JSON.stringify(surveyQueued.body));
 const surveyJob=surveyQueued.body.job;assert.equal(surveyJob.sourceSurvey.frames.length,6);
 for(const frame of surveyJob.sourceSurvey.frames){assert.ok(frame.path.includes(surveyJob.completionToken));assert.ok(fs.existsSync(frame.path));}
 const inbox=await run(process.execPath,['editor/tools/ai-inbox.mjs','--next','--dir',surveyed.body.dir,'--agent','codex'],{env:{...process.env,EDITOR_PORT:'5195'},windowsHide:true});assert.match(inbox.stdout,/ẢNH KHẢO SÁT NGUỒN/);assert.match(inbox.stdout,/Sáu ảnh cách đều không phải shot log/);assert.ok(inbox.stdout.includes(surveyJob.sourceSurvey.frames[0].path));
 fs.writeFileSync(path.join(surveyed.body.dir,'work/ai-job.json'),JSON.stringify({...surveyJob,status:'cancelled'}));
 const projectSurvey=path.join(surveyed.body.dir,'work/source-survey/preview.json'),savedSurvey=fs.readFileSync(projectSurvey),badSurvey=JSON.parse(savedSurvey);badSurvey.workspaceId='wrong';fs.writeFileSync(projectSurvey,JSON.stringify(badSurvey));
 const rejectedSurvey=await call('/api/ai-job',{dir:surveyed.body.dir,template,note,execution:{mode:'session',agent:'codex'},completionMode:'review'});assert.equal(rejectedSurvey.status,400);assert.equal(JSON.parse(fs.readFileSync(path.join(surveyed.body.dir,'work/ai-job.json'))).status,'cancelled');fs.writeFileSync(projectSurvey,savedSurvey);
 const refresh=await call('/api/v1/sources/preview',{workspaceId,text:note,selected:source});assert.equal(refresh.status,200);
 const refreshedJob=await call('/api/ai-job',{dir:surveyed.body.dir,template,note,sourceSurvey:{manifestPath:refresh.body.manifestPath,selected:source},completionMode:'review'});assert.equal(refreshedJob.status,200,JSON.stringify(refreshedJob.body));assert.equal(refreshedJob.body.job.sourceSurvey.id,refresh.body.id);
 fs.writeFileSync(path.join(surveyed.body.dir,'work/ai-job.json'),JSON.stringify({...refreshedJob.body.job,status:'cancelled'}));
 const invalidSurvey=await call('/api/ai-job',{dir:surveyed.body.dir,template,note,sourceSurvey:false,completionMode:'review'});assert.equal(invalidSurvey.status,400);
 const skippedSurvey=await call('/api/ai-job',{dir:surveyed.body.dir,template,note,sourceSurvey:null,completionMode:'review'});assert.equal(skippedSurvey.status,200);assert.equal(skippedSurvey.body.job.sourceSurvey,undefined);
 fs.writeFileSync(path.join(surveyed.body.dir,'work/ai-job.json'),JSON.stringify({...skippedSurvey.body.job,status:'cancelled'}));
 fs.writeFileSync('docs/SOURCE_SURVEY_JOB_API_SMOKE.json',JSON.stringify({syntheticOnly:true,project:surveyed.body.dir,previewToProjectToJob:true,sixJobLocalImages:true,inboxListsImagesAndLimits:true,wrongWorkspaceSurveyRejected:true,failedEnqueuePreservesPriorJob:true,explicitRefreshedSurveyOverridesSaved:true,explicitSkipSurvey:true,invalidSurveyRejected:true,noAgentDispatched:true,noPaidCalls:true},null,2)+'\n');
 fs.writeFileSync(path.join(created.dir,'work/ai-job.json'),JSON.stringify({...job,status:'cancelled'},null,2)+'\n');
 assert.equal((await call('/api/v1/sources/attach-job',{jobDir:created.dir,path:source})).status,409);
 fs.writeFileSync('docs/FIRST_BUILD_SOURCES_API_SMOKE.json',JSON.stringify({syntheticOnly:true,project:created.dir,note,inspection:true,invalidExecutionRejected:true,sessionAgentPinned:true,legacyBackgroundCannotOverrideSession:true,otherAgentSkipped:true,missingSourceRejected:true,snapshotRoles:true,cliSelectedImport:true,checksumAndDedup:true,outsideSnapshotRejected:true,projectAndCandidateUnchangedByImport:true,originalSourceUnchanged:true,staleRevisionAndCancelledRejected:true,limits:'Synthetic local source only; real NAS networking, recursive catalog and autonomous shot choice not validated.'},null,2)+'\n');console.log('First-build source inspection, job snapshot and shared CLI importer passed.');
}finally{server.kill();}
