import fs from 'node:fs';import path from 'node:path';
import {resolveContained} from './storage.mjs';
export function resolveCompletionOutput(root,jobDir,workspaceId,expectedSnapshot){
 if(typeof jobDir!=='string'||!/^workspace\/content\/[^/]+\/[^/]+$/.test(jobDir))throw new Error('Sai đường dẫn công việc.');
 const directory=resolveContained(root,jobDir).file,jobFile=path.join(directory,'work/ai-job.json'),job=JSON.parse(fs.readFileSync(jobFile,'utf8'));
 if(job.status!=='done'||job.completionState!=='exported'||!job.appliedRevision||!/^[a-f0-9-]{36}$/i.test(job.exportSnapshotId||''))throw new Error('Công việc chưa có bản xuất đã xác minh.');
 if(expectedSnapshot!==undefined&&job.exportSnapshotId!==expectedSnapshot)throw new Error('Bản xuất của công việc đã đổi; làm mới Hoạt động.');
 const project=resolveContained(root,job.project||jobDir).file,content=path.join(root,'workspace/content'),relative=path.relative(content,project);
 if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).length!==2)throw new Error('Sai dự án đầu ra.');
 const current=JSON.parse(fs.readFileSync(path.join(project,'project.json'),'utf8'));
 if((current.workspaceId||'default')!==workspaceId)throw new Error('Bản xuất không thuộc workspace đang xem.');
 const snapshot=resolveContained(path.join(project,'work/render-snapshots'),job.exportSnapshotId).file,result=JSON.parse(fs.readFileSync(path.join(snapshot,'result.json'),'utf8'));
 if(result.snapshotId!==job.exportSnapshotId||result.revision!==job.appliedRevision||result.ok!==true||result.quality!=='final'||typeof result.output!=='string')throw new Error('Thông tin bản xuất không khớp công việc.');
 const output=resolveContained(path.join(project,'renders'),path.relative(path.join(project,'renders'),path.resolve(result.output))).file;
 if(path.extname(output).toLowerCase()!=='.mp4')throw new Error('Đầu ra không phải MP4.');
 const metadata=JSON.parse(fs.readFileSync(output+'.json','utf8'));
 if(metadata.snapshotId!==result.snapshotId||metadata.revision!==result.revision||metadata.ok!==true||metadata.quality!=='final'||metadata.bytes!==result.bytes||metadata.sha256!==result.sha256)throw new Error('Bản xuất hoặc mã kiểm tra không khớp.');
 return {output,metadata,validate(){const latest=JSON.parse(fs.readFileSync(jobFile,'utf8')),pj=JSON.parse(fs.readFileSync(path.join(project,'project.json'),'utf8'));if(latest.status!=='done'||latest.completionState!=='exported'||latest.exportSnapshotId!==job.exportSnapshotId||latest.appliedRevision!==job.appliedRevision||(pj.workspaceId||'default')!==workspaceId)throw new Error('Công việc hoặc workspace đã đổi khi tải.');}};
}
