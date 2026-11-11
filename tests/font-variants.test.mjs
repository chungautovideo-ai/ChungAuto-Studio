import test from 'node:test';import assert from 'node:assert/strict';import {fontVariants,fontVariantStyle,localFontCss} from '../editor/lib/brand.js';
test('font variants expose real weights/styles and reject unavailable styles',()=>{
 assert.deepEqual(fontVariants('iCiel Panton').map(f=>f.id),['300-normal','300-italic','900-normal','900-italic']);assert.equal(fontVariants('UTM Bebas').length,1);assert.ok(fontVariants('Montserrat').some(f=>f.label==='Black Italic'));assert.equal(fontVariantStyle('UTM Bebas','900-italic'),'');assert.equal(fontVariantStyle('iCiel Panton','900-italic'),'font-weight:900;font-style:italic;');assert.equal(fontVariantStyle('iCiel Panton',undefined),'font-weight:900;font-style:normal;');assert.match(localFontCss('iCiel Panton'),/panton-black-italic.otf/);
});
