import test from 'node:test';import assert from 'node:assert/strict';
import {personCoverageControls} from '../editor/ui/contentos-person-coverage.js';
const src='inputs/a.mp4',sha256='a'.repeat(64),selection={src,sha256,method:'sam2.1-tiny-point-prompt',from:1,to:2.8,fps:1,w:2,h:2,f:[[4,1],[4,1]]};
function h(tag,attrs={},...children){return {tag,attrs,children:children.flat(),append(...items){this.children.push(...items.flat());}};}
const text=n=>typeof n==='string'?n:(n.children||[]).map(text).join(' ');
test('coverage disclosure reports source-clock gaps without editing selection, camera or timeline',()=>{
 const project={source:{video:src},segments:[{in:100,out:104,src,mediaStart:0,speed:2}],camera:{beauty:{personSelections:[selection]}}},before=structuredClone(project);
 const root=personCoverageControls({h,project,src,sha256});assert.match(text(root),/2 khoảng nguồn/);assert.match(text(root),/0–1 giây nguồn/);assert.match(text(root),/2.8–4 giây nguồn/);assert.equal(root.children[1].tag,'details');assert.deepEqual(project,before);
});
test('coverage distinguishes all people, full coverage, unused source and stale identity',()=>{
 const project={source:{video:src},segments:[{in:0,out:1}],camera:{beauty:{}}};const render=()=>text(personCoverageControls({h,project,src,sha256}));
 assert.match(render(),/mọi người/);project.camera.beauty.personSelections=[{...selection,from:0,to:1,f:[[4,1]]}];assert.match(render(),/đều nằm trong khoảng/);
 project.camera.beauty.personSelections[0].sha256='b'.repeat(64);assert.match(render(),/không khớp/);assert.doesNotMatch(render(),/mọi người/);
 project.camera.beauty.personSelections=[];project.segments=[];assert.match(render(),/chưa có đoạn đang dùng/);
});
