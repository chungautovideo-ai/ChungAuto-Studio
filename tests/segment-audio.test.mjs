import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import test from 'node:test';import assert from 'node:assert/strict';
import {makeTimemap,mergeContiguous} from '../editor/lib/timemap.js';import {buildHtml} from '../editor/lib/build.mjs';import {applyEditorFields} from '../src/services/api-editor.mjs';
test('source audio gain survives timemap, contiguous merge and actual audio tags',t=>{const folder=fs.mkdtempSync(path.join(os.tmpdir(),'cos-segment-gain-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
 const p={source:{video:'source.mp4',duration:3,width:360,height:640,hasAudio:true},segments:[{id:'one',in:0,out:1,keep:true,audioVolume:.25},{id:'two',in:1,out:2,keep:true,audioVolume:.75},{id:'three',in:2,out:3,keep:true,audioVolume:.75}],audio:{voice:.8,music:'',autoSfx:false,sfxLevel:'tat'}};
 const tm=makeTimemap(p);assert.equal(tm.segs[1].audioVolume,.75);const merged=mergeContiguous(tm.segs,p);assert.equal(merged.length,2);assert.equal(merged[1].out,3);
 const html=buildHtml(p,folder);assert.match(html,/<audio id="a0"[^>]*data-volume="0.2"/);assert.match(html,/<audio id="a1"[^>]*data-volume="0.6"/);assert.doesNotMatch(html,/<audio id="a2"/);
 for(const audioVolume of [-1,3,'1']){const segments=structuredClone(p.segments);segments[0].audioVolume=audioVolume;assert.throws(()=>applyEditorFields(p,{segments}),/Âm lượng/);}
 const muted=structuredClone(p);muted.segments[0].audioVolume=0;assert.match(buildHtml(muted,folder),/<audio id="a0"[^>]*data-volume="0"/);
});
