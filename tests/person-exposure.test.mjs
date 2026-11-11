import test from 'node:test';import assert from 'node:assert/strict';
import {measurePersonExposure,summarizePersonExposure,suggestPersonExposure,normalizePersonExposureSummary} from '../editor/lib/person-exposure.js';
const frame=(bg,person,skin)=>{const data=new Uint8ClampedArray(20*10*4);for(let i=0;i<200;i++){const v=i<100?bg:i<150?person:skin;data.set([v,v,v,255],i*4);}return data;};
const mask={w:20,h:10,runs:[100,0,50,1,50,2]};
test('exposure uses semantic person/skin instead of background and gives bounded manual suggestions',()=>{
 const dark=measurePersonExposure(frame(250,40,50),20,10,mask),same=measurePersonExposure(frame(0,40,50),20,10,mask);assert.deepEqual(dark,same);
 const summary=summarizePersonExposure([dark,dark,dark]);assert.deepEqual(normalizePersonExposureSummary(summary),summary);
 const suggestion=suggestPersonExposure(summary);assert.equal(suggestion.available,true);assert.equal(suggestion.personLight,30);assert.equal(suggestion.bodyWhite,0);assert.equal(suggestion.bodySmooth,0);
 const bright=measurePersonExposure(frame(0,180,160),20,10,mask);const enough=suggestPersonExposure(summarizePersonExposure([bright,bright,bright]));assert.equal(enough.personLight,0);assert.equal(enough.bodyWhite,0);
 assert.equal(suggestPersonExposure(summarizePersonExposure([dark])).available,false);
 assert.equal(suggestPersonExposure(summarizePersonExposure([dark,dark,bright,bright])).available,false);
 assert.equal(suggestPersonExposure().available,false);
 const no=measurePersonExposure(frame(20,20,20),20,10,{w:20,h:10,runs:[200,0]});assert.equal(suggestPersonExposure(summarizePersonExposure([no,no,no])).available,false);
 const tiny=measurePersonExposure(frame(20,20,20),20,10,{w:20,h:10,runs:[199,0,1,2]});assert.equal(tiny.person,null);assert.equal(tiny.skin,null);
});
test('exposure persistence rejects invalid or excessive measurements',()=>{
 const good={version:1,method:'display-luma-semantic-mask',person:{samples:3,median:.2,spread:.1,highlight:.4},skin:null};assert.deepEqual(normalizePersonExposureSummary(good),good);
 for(const extra of [{samples:121},{median:NaN},{spread:-1},{highlight:.1}])assert.throws(()=>normalizePersonExposureSummary({...good,person:{...good.person,...extra}}));
 assert.throws(()=>normalizePersonExposureSummary({...good,version:2}));
});
