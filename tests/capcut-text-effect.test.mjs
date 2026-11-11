import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {capcutTextEffectStep,packageCapcutTextEffect} from '../editor/lib/capcut-text-effect.mjs';
import {collectFavorites} from '../editor/tools/capcut-favorites.mjs';
const catalog={effects:[{id:'7526752682044968253',title:'ART 3D',cover:'covers/7526752682044968253.webp'}]};
test('CapCut text effect step only accepts ids from the favorites catalog',()=>{
 const s=capcutTextEffectStep({id:'7526752682044968253'},catalog);
 assert.match(s.instruction,/"ART 3D" \(ID 7526752682044968253\)/);
 assert.equal(capcutTextEffectStep({id:'123456789'},catalog),null);
 assert.equal(capcutTextEffectStep({id:'../x'},catalog),null);
 assert.equal(capcutTextEffectStep(undefined,catalog),null);
});
test('CapCut package copies the chosen effect cover',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cc-fx-')),ui=path.join(tmp,'ui'),out=path.join(tmp,'out');
 fs.mkdirSync(path.join(ui,'capcut-text-effects','covers'),{recursive:true});fs.mkdirSync(out);
 fs.writeFileSync(path.join(ui,'capcut-text-effects','effects.json'),JSON.stringify(catalog));
 fs.writeFileSync(path.join(ui,'capcut-text-effects',catalog.effects[0].cover),'img');
 assert.match(packageCapcutTextEffect({capcutTextEffect:{id:'7526752682044968253'}},ui,out),/Hiệu ứng chữ/);
 assert.equal(fs.readFileSync(path.join(out,'2-hieu-ung-chu.webp'),'utf8'),'img');
 assert.equal(packageCapcutTextEffect({},ui,out),null);
 fs.rmSync(tmp,{recursive:true,force:true});
});
test('Favorites keep only flower effects whose newest record is still favorited',()=>{
 const item=(id,fav,t)=>({effect_id:id,title:'T'+id,has_favorited:fav,favorite_time:t,cover_url:{small:'u'}});
 const r=collectFavorites([
  {url:'/x_flower_capcutpc_0',t:'2026-01-01 00:00:00',body:{data:[item('1',true,5),item('2',true,9)]}},
  {url:'/x_flower_capcutpc_0',t:'2026-02-01 00:00:00',body:{data:[item('1',false,0)]}},
  {url:'/x_filter_capcutpc_0',t:'2026-02-01 00:00:00',body:{data:[item('3',true,7)]}}]);
 assert.deepEqual(r.map(x=>x.id),['2']);
});
