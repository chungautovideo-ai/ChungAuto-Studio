import test from 'node:test';import assert from 'node:assert/strict';import {applyEditorFields} from '../src/services/api-editor.mjs';
test('AI can select bundled or inspected audio as music but cannot invent paths or invalid mix values',()=>{
 const base={audio:{music:'inputs/old.mp3',musicVolume:.1,sfxLevel:'vua'}};
 assert.equal(applyEditorFields(base,{audio:{...base.audio,music:'kit:ambient-pad'}}).audio.music,'kit:ambient-pad');
 assert.throws(()=>applyEditorFields(base,{audio:{music:'../../secret.wav'}}),/inspect_media/);
 assert.throws(()=>applyEditorFields(base,{audio:{music:'https:\/\/example.com\/audio.mp3'}}),/inspect_media/);
 assert.equal(applyEditorFields(base,{audio:{...base.audio,music:'inputs/new.mp3'}},{media:[{src:'inputs/new.mp3',kind:'audio',duration:4}]}).audio.music,'inputs/new.mp3');
 assert.throws(()=>applyEditorFields(base,{audio:{music:'inputs/picture.png'}},{media:[{src:'inputs/picture.png',kind:'image'}]}),/inspect_media/);
 assert.throws(()=>applyEditorFields(base,{audio:{musicVolume:2}}),/phạm vi/);
 assert.throws(()=>applyEditorFields(base,{audio:{musicLoop:'invented'}}),/lặp nhạc/);
 assert.equal(applyEditorFields(base,{audio:{...base.audio,duckNarration:true,duckFade:.4}}).audio.music,base.audio.music);
});
