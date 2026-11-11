import test from 'node:test';
import assert from 'node:assert/strict';
import {applyTemplate} from '../editor/lib/template.js';

const project=()=>({camera:{color:{contrast:.1},beauty:{bodyWhite:20}},audio:{music:'inputs/chosen.mp3',sfxLevel:'vua',sfxVolume:.3},watermark:{file:'inputs/logo.png'},endCard:{enabled:true},segments:[{id:'a',src:'a.mp4',in:0,out:5,color:{brightness:.1}}],brolls:[{id:'b',src:'b.mp4',at:1,dur:2,color:{contrast:.2}}],texts:[{id:'spoken',title:'Gọi ngay trong lời nói'},{id:'cta',role:'cta'}],blocks:[{id:'cta-block',preset:'ca-cta'}]});
const template=()=>({id:'new',name:'New',camera:{color:{saturate:2}},audio:{music:'kit:beat-bass',sfxLevel:'nhieu',sfxVolume:.8},automotiveOptions:{music:'keep',color:'keep'}});

test('template apply respects off policy in both style modes and keeps source data immutable',()=>{
 for(const restyle of [true,false]){
  const p=project(),tpl=template();p.automotiveOptions={color:'off',beauty:'off',music:'off',sfx:'tat',watermark:'off',cta:'off'};
  const before=structuredClone(p),tplBefore=structuredClone(tpl),result=applyTemplate(p,tpl,{restyle});
  assert.equal(result.camera.color,undefined);assert.equal(result.camera.beauty,undefined);
  for(const item of [...result.segments,...result.brolls])assert.equal(item.color,undefined);
  assert.equal(result.audio.music,'');assert.equal(result.audio.sfxLevel,'tat');assert.equal(result.audio.sfxVolume,0);
  assert.equal(result.watermark.hidden,true);assert.equal(result.endCard.enabled,false);
  assert.deepEqual(result.texts,[before.texts[0]]);assert.deepEqual(result.blocks,[]);
  assert.equal(result.template.id,'new');assert.deepEqual(p,before);assert.deepEqual(tpl,tplBefore);
 }
});

test('keep preserves chosen music, color, beauty and SFX level while allowing template mix settings',()=>{
 const p=project();p.automotiveOptions={};const result=applyTemplate(p,template());
 assert.deepEqual(result.camera,p.camera);assert.deepEqual(result.segments,p.segments);assert.deepEqual(result.brolls,p.brolls);
 assert.equal(result.audio.music,p.audio.music);assert.equal(result.audio.sfxLevel,'vua');assert.equal(result.audio.sfxVolume,.8);
 assert.deepEqual(result.watermark,p.watermark);assert.deepEqual(result.endCard,p.endCard);
 const noMusic=project();noMusic.automotiveOptions={};delete noMusic.audio;
 assert.equal(applyTemplate(noMusic,template()).audio.music,undefined);
});

test('explicit natural/SFX choices win; templates cannot add policy to an ordinary project',()=>{
 const p=project();p.automotiveOptions={color:'natural',sfx:'vua'};const result=applyTemplate(p,template());
 assert.equal(result.camera.color,undefined);assert.deepEqual(result.segments[0].color,{preset:'tu-nhien'});assert.deepEqual(result.brolls[0].color,{preset:'tu-nhien'});assert.equal(result.audio.sfxLevel,'vua');
 const ordinary=applyTemplate(project(),template());assert.equal(ordinary.automotiveOptions,undefined);assert.equal(ordinary.audio.music,'kit:beat-bass');assert.deepEqual(ordinary.camera.color,template().camera.color);
});
