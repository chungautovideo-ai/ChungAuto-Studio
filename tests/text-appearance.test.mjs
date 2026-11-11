import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeTextAppearance,textAppearanceStyle,TEXT_LOOKS} from '../editor/lib/brand.js';
test('text paint preserves defaults, validates CSS and bounds custom stops and effects',()=>{
 assert.equal(textAppearanceStyle(), '');assert.equal(textAppearanceStyle({mode:'inherit'}),'');
 const a=normalizeTextAppearance({mode:'gradient',angle:999,stops:[{color:'red;url(secret)',at:120},{color:'#123456',at:-1}],strokeWidth:99,shadowX:-99,shadowBlur:999});
 assert.equal(a.angle,360);assert.equal(a.strokeWidth,16);assert.equal(a.shadowX,-50);assert.equal(a.shadowBlur,80);
 assert.match(a.gradient,/#123456 0%,#ffffff 100%/);assert.doesNotMatch(textAppearanceStyle(a),/secret|url/);
 assert.equal(normalizeTextAppearance({mode:'gradient',stops:Array(10).fill({color:'#123456',at:20})}).stops.length,8);
 for(const look of Object.values(TEXT_LOOKS))assert.match(textAppearanceStyle(look.value),/--ta-fill:/);
 const solid=textAppearanceStyle({mode:'solid',color:'#FF0011',shadowOpacity:0});assert.match(solid,/--ta-ink:#ff0011/);assert.match(solid,/rgba\(0,0,0,0\)/);
 const double=normalizeTextAppearance({...TEXT_LOOKS.limeDouble.value,outerStrokeWidth:99,outerStrokeColor:'url(secret)'});assert.equal(double.outerStrokeWidth,10);assert.equal(double.outerStrokeColor,'#75be16');assert.doesNotMatch(textAppearanceStyle(double),/secret/);
 const style=textAppearanceStyle(TEXT_LOOKS.limeDouble.value);assert.match(style,/--ta-slant:italic;--ta-weight:900/);assert.equal((style.match(/drop-shadow\(/g)||[]).length,8);assert.match(style,/--ta-stroke:6px #16220c/);
});
