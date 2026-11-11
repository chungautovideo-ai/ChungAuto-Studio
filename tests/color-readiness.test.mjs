import test from 'node:test';import assert from 'node:assert/strict';import {colorReadiness} from '../editor/lib/color-management.js';
test('normalization readiness preserves source-specific profile and LUT requirements',()=>{
 assert.equal(colorReadiness({}).ready,false);assert.equal(colorReadiness({},{batch:true}).ready,true);
 assert.equal(colorReadiness({},{profile:'slog3-sgamut3cine'}).ready,false);
 assert.equal(colorReadiness({},{profile:'slog3-sgamut3cine',technicalLut:{kind:'technical',inputProfile:'dlog-m'}}).ready,false);
 assert.equal(colorReadiness({},{profile:'slog3-sgamut3cine',technicalLut:{kind:'technical',inputProfile:'slog3-sgamut3cine'}}).ready,true);
 for(const profile of ['hlg','pq'])assert.equal(colorReadiness({},{profile}).ready,true);
 assert.equal(colorReadiness({},{profile:'rec709'}).ready,false);assert.equal(colorReadiness({},{profile:'rec709',stabilize:'fast'}).ready,true);
 assert.equal(colorReadiness({},{profile:'rec709',lookLut:{kind:'look',inputProfile:'rec709'}}).ready,true);
 assert.equal(colorReadiness({},{profile:'hlg',technicalLut:{kind:'technical',inputProfile:'applelog'}}).ready,false);
});
