import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {resolveContained} from '../../src/services/storage.mjs';import {resolveScheduledVideo} from '../../src/services/scheduled-media.mjs';
import {verifyPublishCovers} from '../../src/services/publish-covers.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
try{
 const dir=resolveContained(root,process.argv[2]||'').file,job=JSON.parse(fs.readFileSync(path.join(dir,'work/ai-job.json'),'utf8'));
 if(job.kind!=='post'||job.scheduledMedia?.kind!=='pinned')throw new Error('Việc không có video lịch đã gắn file.');
 const file=await resolveScheduledVideo(root,job);if(path.resolve(file)!==path.resolve(job.video))throw new Error('File giao đăng không khớp lịch.');if(job.project&&job.publishDraft){const folder=resolveContained(root,job.project).file,pj=JSON.parse(fs.readFileSync(path.join(folder,'project.json'),'utf8'));verifyPublishCovers(folder,pj.workspaceId||'default',job.publishDraft);}console.log('✓ Đúng video và ảnh bìa đã hẹn: '+file);
}catch(error){console.error('✗ '+error.message);process.exitCode=1;}
