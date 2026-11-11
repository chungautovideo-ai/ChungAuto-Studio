import test from 'node:test';import assert from 'node:assert/strict';import {textTypographyStyle} from '../editor/lib/brand.js';
test('typography serializes size/tracking/leading consistently and bounds untrusted values',()=>{
 const text={fontTitle:'iCiel Panton',fontTitleVariant:'900-italic',size:96,letterSpacing:2.5,lineHeight:1.3,labelSize:30,labelLetterSpacing:1,labelLineHeight:1.1};
 assert.match(textTypographyStyle(text,'fontTitle'),/--fs:96px;letter-spacing:2.5px;line-height:1.3/);assert.match(textTypographyStyle(text,'fontLabel'),/font-size:30px;letter-spacing:1px;line-height:1.1/);
 assert.match(textTypographyStyle({size:999,lineHeight:0},'fontTitle'),/--fs:300px;line-height:0.7/);assert.doesNotMatch(textTypographyStyle({letterSpacing:'red;background:red'},'fontTitle'),/red/);assert.equal(textTypographyStyle({},'fontTitle',{}),'');
});
