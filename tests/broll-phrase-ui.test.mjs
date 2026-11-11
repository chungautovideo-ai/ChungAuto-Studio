import test from 'node:test';import assert from 'node:assert/strict';
import {brollEditorPhraseSearch} from '../editor/ui/contentos-broll-editor-timing.js';
import {brollTimingPanel} from '../editor/ui/contentos-broll-timing.js';
import {captionPhraseSearch} from '../src/services/caption-phrase-search.mjs';
import {resolveTimeline} from '../editor/lib/build.mjs';
const project=()=>({source:{duration:10},segments:[{id:'a',in:1,out:7,speed:2}],captions:{enabled:true,lines:[{id:'c',words:[{w:'màn,',s:2.0007,e:2.3008},{w:'hình',s:2.3008,e:2.6009},{w:'phim',s:3,e:3.5}]}]},brolls:[{id:'b',at:2,dur:.5,src:'inputs/man.mp4'}]});
test('editor phrase search matches renderer rounding after source cuts/speed and does not change data',()=>{
 const p=project(),before=structuredClone(p),timeline=resolveTimeline(p),round=n=>Math.round(n*1000)/1000;
 const words=timeline.caps.flatMap(c=>c.words.map(w=>({text:w.w,outputStart:round(c.start+w.s),outputEnd:round(c.start+w.e)})));
 const actual=brollEditorPhraseSearch(p,'MÀN HÌNH'),expected=captionPhraseSearch(words,[],'MÀN HÌNH');
 assert.equal(actual.total,1);assert.equal(actual.matches[0].outputStart,expected.matches[0].outputStart);assert.equal(actual.matches[0].outputEnd,expected.matches[0].outputEnd);assert.equal(actual.matches[0].words[0].projectStart,2.0007);assert.deepEqual(p,before);
 assert.equal(brollEditorPhraseSearch({...p,captions:{...p.captions,enabled:false}},'màn').total,0);
});
test('production phrase controls handle Enter, empty/error, fresh seek, refresh and captions off without editing project',()=>{
 const nodes=[],h=(tag,attrs={},...children)=>{const node={tag,...attrs,children,textContent:'',value:'',append(...items){this.children.push(...items);},replaceChildren(...items){this.children=[...items];}};nodes.push(node);return node;};
 const p=project(),before=structuredClone(p);let time,plays=0,prevented=0;
 const panel=brollTimingPanel({h,getProject:()=>p,item:p.brolls[0],seek:t=>time=t,play:()=>plays++});
 const input=nodes.find(n=>n.tag==='input'),find=nodes.find(n=>n.tag==='button'&&n.children.includes('Tìm'));
 input.value='màn hình';input.onkeydown({key:'Enter',preventDefault:()=>prevented++});assert.equal(prevented,1);assert.equal(plays,0);
 const result=nodes.find(n=>n.tag==='button'&&/^Xem từ \d/.test(n.children[0]));assert.ok(result);result.onclick();assert.equal(time,brollEditorPhraseSearch(p,'màn hình').matches[0].outputStart);assert.equal(plays,1);assert.deepEqual(p,before);
 // The old result must seek the freshly resolved output clock after a rate edit.
 p.segments[0].speed=1;result.onclick();assert.equal(time,brollEditorPhraseSearch(p,'màn hình').matches[0].outputStart);assert.equal(plays,2);
 input.value='không có';input.oninput();find.onclick();assert.ok(nodes.some(n=>n.textContent.includes('Không thấy')));assert.equal(plays,2);
 input.value='!!!';find.onclick();assert.ok(nodes.some(n=>n.textContent.includes('Cụm tìm lời')));
 input.value='màn';find.onclick();p.captions.enabled=false;panel.refresh();assert.ok(nodes.some(n=>n.textContent.includes('Phụ đề đang tắt')));result.onclick();assert.equal(plays,2);
 assert.equal(input.value,'màn');assert.equal(input['aria-label'],'Tìm cụm từ trong lời');
});
