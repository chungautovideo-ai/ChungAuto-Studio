import test from 'node:test';import assert from 'node:assert/strict';
import {brollSpeechOverlap} from '../src/services/broll-speech-overlap.mjs';
test('speech overlap uses output boundaries without consuming next product word',()=>{
 const words=[{text:'màn',projectStart:5,projectEnd:5.8,outputStart:1,outputEnd:1.4},{text:'phim',projectStart:7,projectEnd:8,outputStart:1.4,outputEnd:1.9}],before=JSON.stringify(words);
 const good=brollSpeechOverlap(words,1,1.4);assert.deepEqual(good.words,[words[0]]);assert.equal(good.nextWord.text,'phim');assert.equal(good.endsInsideWord,false);
 const spill=brollSpeechOverlap(words,1.2,1.6);assert.deepEqual(spill.words,words);assert.equal(spill.startsInsideWord,true);assert.equal(spill.endsInsideWord,true);
 const silence=brollSpeechOverlap(words,0,.8);assert.equal(silence.totalWords,0);assert.equal(silence.nextWord.text,'màn');
 assert.equal(JSON.stringify(words),before);assert.deepEqual(brollSpeechOverlap([],0,1).words,[]);
});
test('long overlap is bounded, flagged and returned metadata does not alias words',()=>{
 const words=Array.from({length:80},(_,i)=>({text:'xe',projectStart:i*2,projectEnd:i*2+1,outputStart:i/4,outputEnd:(i+1)/4}));
 const out=brollSpeechOverlap(words,0,20);assert.equal(out.totalWords,80);assert.equal(out.words.length,32);assert.equal(out.truncated,true);out.words[0].text='Changed';assert.equal(words[0].text,'xe');
});
