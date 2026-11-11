import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {captionPhraseSearch} from '../src/services/caption-phrase-search.mjs';
import {checkSessionCandidate} from '../src/services/session-candidate-check.mjs';import {projectRevision} from '../src/services/project-revisions.mjs';

test('literal phrase search supports Vietnamese punctuation/NFC, preserves repeats and bounds output',()=>{
 const words=Array.from({length:25},(_,i)=>[{text:'MÀN,',projectStart:i*3,outputStart:i*3,outputEnd:i*3+.3},{text:'hình!',projectStart:i*3+.3,outputStart:i*3+.3,outputEnd:i*3+.6}]).flat();
 const before=structuredClone(words),report=captionPhraseSearch(words,[{id:'b',src:'screen.mp4',at:0,start:0,dur:.6}],'màn hình'.normalize('NFD'));
 assert.equal(report.total,25);assert.equal(report.matches.length,20);assert.equal(report.truncated,true);assert.equal(report.matches[0].brolls[0].id,'b');assert.equal(report.matches[1].brolls.length,0);assert.equal(report.matches[0].words[0].projectStart,0);assert.equal(report.applied,false);assert.deepEqual(words,before);
 assert.equal(captionPhraseSearch(words,[],'man hinh').total,0);assert.equal(captionPhraseSearch(words,[],'màn hình phim').total,0);
 assert.equal(captionPhraseSearch([{text:'xe/xe',outputStart:0,outputEnd:.5}],[],'xe').total,1);
 for(const phrase of ['',null,'!!!','x'.repeat(121),Array(14).fill('xe').join(' ')])assert.throws(()=>captionPhraseSearch([],[],phrase),/Cụm/);
});

test('claimed candidate phrase lookup returns exact source anchors across cuts/rate without reading media or mutating files',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'cos-phrase-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const dir=path.join(root,'workspace/content/day/qa'),work=path.join(dir,'work'),token='fixture',candidate=path.join(work,'build-candidates',token,'work/candidate-project.json');fs.mkdirSync(path.dirname(candidate),{recursive:true});
 const p={workspaceId:'qa',source:{video:'inputs/absent.mp4'},segments:[{id:'s',in:5,out:9,speed:2}],captions:{enabled:true,lines:[{id:'cap',words:[{w:'màn',s:5.5,e:5.8},{w:'hình',s:5.8,e:6.1},{w:'phim',s:7,e:7.5}]}]},brolls:[{id:'screen',src:'inputs/screen.mp4',at:5.5,dur:.3}]};
 const live=path.join(dir,'project.json');for(const file of [live,candidate,path.join(path.dirname(candidate),'base-project.json')])fs.writeFileSync(file,JSON.stringify(p));
 const jobFile=path.join(work,'ai-job.json'),job={status:'working',claimedBy:{id:'owner'},candidate:path.relative(root,candidate),baseRevision:projectRevision(live),completionToken:token};fs.writeFileSync(jobFile,JSON.stringify(job));
 const files=[live,candidate,jobFile],before=files.map(f=>fs.readFileSync(f));
 const report=checkSessionCandidate(root,path.relative(root,dir),{claimId:'owner',find:'màn hình'});
 assert.equal(report.timing,undefined);const match=report.phraseSearch.matches[0];assert.equal(match.outputStart,.25);assert.equal(match.outputEnd,.55);assert.equal(match.outputDuration,.3);assert.deepEqual(match.words.map(w=>w.projectStart),[5.5,5.8]);assert.equal(match.brolls[0].id,'screen');
 const both=checkSessionCandidate(root,path.relative(root,dir),{claimId:'owner',find:'màn hình',window:{from:1,to:2}});assert.equal(both.timing.words[0].text,'phim');assert.equal(both.phraseSearch.total,1);
 assert.throws(()=>checkSessionCandidate(root,path.relative(root,dir),{claimId:'wrong',find:'màn hình'}),/phiên khác/);
 for(const [i,file] of files.entries())assert.deepEqual(fs.readFileSync(file),before[i]);assert.equal(fs.existsSync(path.join(dir,'index.html')),false);
 fs.writeFileSync(candidate,JSON.stringify({...p,captions:{...p.captions,enabled:false}}));assert.equal(checkSessionCandidate(root,path.relative(root,dir),{claimId:'owner',find:'màn hình'}).phraseSearch.total,0);
});
