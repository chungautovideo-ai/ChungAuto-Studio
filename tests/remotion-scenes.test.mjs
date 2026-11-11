import test from 'node:test';import assert from 'node:assert/strict';import {normalizeRemotionScene} from '../src/services/remotion-scenes.mjs';
test('native Remotion scene accepts bounded editable parameters and rejects arbitrary entrypoints and invalid values',()=>{
 const value=normalizeRemotionScene({format:'16:9',title:'Tin mới hôm nay',duration:1.25});assert.equal(value.durationInFrames,38);assert.equal(value.width,1920);assert.equal(value.height,1080);assert.equal(value.fps,30);
 for(const invalid of [{format:'square',title:'x'},{format:'9:16',title:'x',duration:120},{format:'9:16',title:'x',color:'url(https://external)'},{format:'9:16',title:'x'.repeat(301)}])assert.throws(()=>normalizeRemotionScene(invalid));
 assert.equal('entryPoint' in normalizeRemotionScene({format:'9:16',title:'x',entryPoint:'evil.js'}),false);
});
