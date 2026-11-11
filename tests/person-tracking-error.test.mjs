import test from 'node:test';import assert from 'node:assert/strict';
import {personTrackingError} from '../editor/lib/person-selection.js';
test('tracking recovery offers only a shorter valid interval before the failing source sample',()=>{
 for(const prefix of ['Possible scene cut at source time ','Object lost or ambiguous at source time','Mask changed abruptly (relocation) at source time ']){
  const r=personTrackingError('traceback\n'+prefix+'3.000; no mask committed.',{from:0,duration:6,fps:8});assert.equal(r.shorterDuration,2.875);assert.match(r.message,/3.000 giây nguồn/);
 }
 for(const [time,from,duration,fps] of [[.1,0,6,8],[7,0,6,8],[3,3,2,8],[3,0,6,0],[3,NaN,6,8]])assert.equal(personTrackingError('Possible scene cut at source time '+time,{from,duration,fps}).shorterDuration,null);
 assert.equal(personTrackingError('custom source failure').message,'custom source failure');assert.equal(personTrackingError('custom source failure').shorterDuration,null);
});
