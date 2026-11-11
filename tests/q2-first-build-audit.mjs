// Read-only editorial evidence for a finished Q2 QA job. Not a semantic quality verdict.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {resolveTimeline} from '../editor/lib/build.mjs';
import {brollSpeechOverlap} from '../src/services/broll-speech-overlap.mjs';
const [dir,output]=process.argv.slice(2);
assert.ok(dir?.startsWith('workspace/content/')&&output?.startsWith('docs/')&&!fs.existsSync(output),'Supply QA project and new evidence file.');
const job=JSON.parse(fs.readFileSync(path.join(dir,'work/ai-job.json')));
assert.ok(['done','error','cancelled'].includes(job.status),'Do not audit an in-flight candidate as finished.');
const project=JSON.parse(fs.readFileSync(path.join(dir,'project.json'))),timeline=resolveTimeline(project);
const words=timeline.caps.flatMap(c=>c.words.map(w=>({text:w.w,outputStart:Math.round((c.start+w.s)*1000)/1000,outputEnd:Math.round((c.start+w.e)*1000)/1000}))).sort((a,b)=>a.outputStart-b.outputStart);
const normalize=s=>s.toLocaleLowerCase('vi').replace(/[^\p{L}\p{N}]/gu,'');
// These labels belong only to the four inspected Q2 fixtures, never a filename classifier.
const fixtures={'inputs/den.mp4':{product:'đèn',tokens:['đèn']},'inputs/man.mp4':{product:'màn hình',tokens:['màn']},'inputs/ghe.mp4':{product:'ghế da',tokens:['ghế','da']},'inputs/mau.mp4':{product:'đổi màu',tokens:['đổi','màu']}};
const brolls=timeline.brolls.map(b=>{
 const expected=fixtures[b.src],windows=[];
 if(expected)for(let i=0;i<=words.length-expected.tokens.length;i++)if(expected.tokens.every((token,k)=>normalize(words[i+k].text)===token))windows.push({from:words[i].outputStart,to:words[i+expected.tokens.length-1].outputEnd});
 const start=b.start,end=b.start+b.dur,overlap=brollSpeechOverlap(words,start,end);
 return {id:b.id,src:b.src,projectAt:b.at,outputStart:start,outputEnd:end,mediaStart:b.mediaStart??0,minhHoa:b.minhHoa??null,fixtureProduct:expected?.product??null,exactPhraseWindows:windows,
 overlapsExactPhrase:windows.some(w=>w.from<end&&w.to>start),insideExactPhrase:windows.some(w=>start>=w.from-.002&&end<=w.to+.002),speechOverlap:overlap,
 note:'Exact phrase placement is one editorial signal; a montage elsewhere may be valid after visual review. Does not prove footage matches product or is readable.'};
});
const log=fs.readFileSync(path.join(dir,'work/ai-run.log'),'utf8');
const tokens=[...log.matchAll(/tokens used\s*\r?\n([\d,]+)/g)].map(m=>Number(m[1].replaceAll(',','')));
const report={project:dir,status:job.status,completion:job.completionState??null,duration:timeline.tm.total,counts:{segments:timeline.tm.segs.length,brolls:timeline.brolls.length,blocks:timeline.blocks.length,texts:timeline.texts.length},audio:project.audio,brolls,
 reportedTotalTokens:tokens.at(-1)??null,tokenLimits:'CLI total only; no billed/cached breakdown or controlled comparison. Not proof of token reduction.',
 helpersSeen:{timing:log.includes('speechOverlap'),media:log.includes('audioMedia')||log.includes('--audio-media'),presets:log.includes('chen-preset.mjs')},rendered:fs.existsSync(path.join(dir,'work/render.json')),
 limits:'Saved first-build QA and caption word clocks only. No continuous visual listening, asset content verification, native UI, color/person/plate coverage or production throughput acceptance.'};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,brolls:brolls.map(({speechOverlap,...b})=>({...b,speech: speechOverlap.words.map(w=>w.text).join(' '),nextWord:speechOverlap.nextWord?.text}))}));
