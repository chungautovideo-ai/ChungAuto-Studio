import test from 'node:test';import assert from 'node:assert/strict';
import {brollTimingReport} from '../src/services/broll-timing-report.mjs';
import {brollEditorTiming} from '../editor/ui/contentos-broll-editor-timing.js';
import {brollTimingPanel} from '../editor/ui/contentos-broll-timing.js';
const project=()=>({source:{duration:10},segments:[{id:'first',in:2,out:4},{id:'second',in:6,out:8,speed:2}],brolls:[{id:'b',at:5,dur:.5,src:'a.mp4'}]});
test('removed anchor is explicit in editor/worker while placement and original duration remain unchanged',()=>{
 const p=project(),before=structuredClone(p),worker=brollTimingReport(p).items[0],editor=brollEditorTiming(p,p.brolls[0]);
 assert.equal(worker.anchorMoved,true);assert.equal(worker.anchorOutsideContent,false);assert.equal(worker.projectAt,5);assert.equal(worker.outputStart,2);assert.equal(worker.outputDuration,.5);assert.ok(worker.advisories.includes('ANCHOR_IN_REMOVED_FOOTAGE'));
 assert.equal(editor.anchorMoved,true);assert.equal(editor.start,worker.outputStart);assert.equal(editor.duration,.5);assert.deepEqual(p,before);
 p.brolls[0].at=1;assert.equal(brollTimingReport(p).items[0].anchorMoved,true);assert.equal(brollEditorTiming(p,p.brolls[0]).start,0);
 p.brolls[0].at=7;assert.equal(brollTimingReport(p).items[0].anchorMoved,false);assert.equal(brollEditorTiming(p,p.brolls[0]).start,2.5);
 p.brolls[0].at=9;const outside=brollTimingReport(p).items[0];assert.equal(outside.anchorOutsideContent,true);assert.ok(outside.advisories.includes('ANCHOR_OUTSIDE_CONTENT'));assert.equal(brollEditorTiming(p,p.brolls[0]).available,false);
});
test('existing timing panel explains removed anchor and clears explanation when anchor is kept',()=>{
 const nodes=[],h=(tag,attrs={},...children)=>{const node={tag,...attrs,children,textContent:'',append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];}};nodes.push(node);return node;};
 const p=project(),panel=brollTimingPanel({h,getProject:()=>p,item:p.brolls[0],seek:()=>{}});
 assert.ok(nodes.some(n=>n.textContent.includes('Mốc gốc 5.00s nằm trong đoạn đã bỏ')));
 p.brolls[0].at=7;panel.refresh();assert.equal(nodes.some(n=>n.textContent.includes('Mốc gốc')),false);
});
