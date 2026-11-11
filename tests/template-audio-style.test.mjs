import test from 'node:test';import assert from 'node:assert/strict';
import {extractTemplate,applyTemplate} from '../editor/lib/template.js';
test('audio style roundtrip preserves portable mix and never carries private media or source timing',()=>{
 const audio={music:'inputs/private-music.mp3',clips:[{id:'voice',src:'inputs/customer.wav'}],sfx:[{at:5,kind:'pop'}],musicSpeech:[[2,5]],musicLoop:'repeat',musicVolume:.12,musicFadeIn:.5,musicFadeOut:1,musicSpeechLevel:.3,duckNarration:true,duckSourceSpeech:true,duckFade:.4,duckLevel:.25,sfxLevel:'vua',sfxVolume:.6};
 const template=extractTemplate({audio},{id:'mix',name:'Mix'});
 for(const key of ['music','clips','sfx','musicSpeech'])assert.equal(Object.hasOwn(template.audio,key),false);
 const target={audio:{music:'inputs/other.mp3',clips:[{id:'other'}],sfx:[{at:8,kind:'click'}],musicSpeech:[[1,3]]}};
 const result=applyTemplate(target,template);
 assert.equal(result.audio.music,target.audio.music);assert.deepEqual(result.audio.clips,target.audio.clips);assert.deepEqual(result.audio.musicSpeech,target.audio.musicSpeech);
 for(const key of Object.keys(template.audio))assert.deepEqual(result.audio[key],audio[key]);
 assert.equal(target.audio.musicLoop,undefined);
 assert.equal(template.audio.duckSourceSpeech,true);
 assert.equal(result.audio.duckSourceSpeech,true);
});
test('only known bundled songs are reusable across projects',()=>{
 assert.equal(extractTemplate({audio:{music:'kit:ambient-pad'}}).audio.music,'kit:ambient-pad');
 assert.equal(extractTemplate({audio:{music:'kit:unknown'}}).audio.music,undefined);
});
