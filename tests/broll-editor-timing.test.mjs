import test from 'node:test';import assert from 'node:assert/strict';
import {brollEditorTiming} from '../editor/ui/contentos-broll-editor-timing.js';
import {brollTimingReport} from '../src/services/broll-timing-report.mjs';
import {brollTimingPanel} from '../editor/ui/contentos-broll-timing.js';
const project=()=>({source:{duration:8},segments:[{id:'cut',in:0,out:1,keep:false},{id:'keep',in:1,out:7,speed:2}],captions:{enabled:true,lines:[{id:'words',words:[{w:'màn',s:2,e:2.3},{w:'hình',s:2.3,e:2.6},{w:'phim',s:2.8,e:3.2}]}]},brolls:[{id:'screen',src:'inputs/man.mp4',at:2,dur:.3,tIn:'slide',tInDuration:.3}]});
test('editor context matches worker output timing/words after cuts and speed without modifying project',()=>{
 const p=project(),before=structuredClone(p),expected=brollTimingReport(p).items[0],actual=brollEditorTiming(p,p.brolls[0]);
 assert.equal(actual.start,expected.outputStart);assert.equal(actual.end,expected.outputEnd);assert.deepEqual(actual.entrance,expected.entrance);assert.deepEqual(actual.words.map(w=>w.text),expected.speechOverlap.words.map(w=>w.text));assert.equal(actual.nextWord.text,expected.speechOverlap.nextWord.text);assert.deepEqual(p,before);
 for(const p2 of [{...p,captions:{enabled:false}},{...p,brolls:[]}])assert.doesNotThrow(()=>brollEditorTiming(p2,p.brolls[0]));
 assert.equal(brollEditorTiming(p,{...p.brolls[0],hidden:true}).available,false);assert.equal(brollEditorTiming(p,{...p.brolls[0],at:8}).available,false);
});
test('production timing panel refreshes without mutation and watch seeks latest start',()=>{
 const nodes=[],h=(tag,attrs={},...children)=>{const node={tag,...attrs,children,textContent:'',append(...items){this.children.push(...items);}};nodes.push(node);return node;};
 const p=project(),item=p.brolls[0];let time,plays=0;const panel=brollTimingPanel({h,getProject:()=>p,item,seek:t=>time=t,play:()=>plays++});
 const watch=nodes.find(n=>n.tag==='button'&&n.children.includes('Xem từ đầu cảnh'));watch.onclick();assert.equal(time,.5);assert.equal(plays,1);
 item.at=2.4;item.dur=.8;item.tInDuration=0;panel.refresh();watch.onclick();assert.equal(time,.7);assert.ok(nodes.some(n=>n.textContent.includes('0.80s')));
 const before=structuredClone(p);item.hidden=true;panel.refresh();watch.onclick();assert.equal(watch.disabled,true);assert.equal(plays,2);delete item.hidden;assert.deepEqual(p,before);
});
