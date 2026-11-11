import test from 'node:test';
import assert from 'node:assert/strict';
import {componentTab,componentEntries,componentSelected} from '../editor/lib/component-list.js';

test('text panel merges native and HTML text while preserving array identity and duplicates',()=>{
  const native={id:'same',title:'Native',at:3},html={id:'same',group:'chu',name:'HTML',at:1},graphic={id:'g',group:'dohoa'};
  const project={texts:[native],blocks:[html,graphic]},before=JSON.stringify(project);
  assert.deepEqual(componentEntries(project,'texts'),[{item:native,key:'texts'},{item:html,key:'blocks'}]);
  assert.deepEqual(componentEntries(project,'blocks'),[{item:graphic,key:'blocks'}]);
  assert.equal(componentTab(html,'blocks'),'texts');
  const state={tab:'texts',selKind:'blocks',selId:'same'};
  assert.equal(componentSelected(state,html,'blocks'),true);
  assert.equal(componentSelected(state,native,'texts'),false);
  state.selKind=null;
  assert.equal(componentSelected(state,native,'texts'),true);
  assert.equal(componentSelected(state,html,'blocks'),false);
  assert.equal(componentEntries(project,'texts')[1].item,html);
  assert.equal(JSON.stringify(project),before);
});

test('empty and other panels remain valid without adding project arrays',()=>{
  const project={segments:[{id:'s',keep:false}],blocks:[{id:'legacy'}]};
  const before=JSON.stringify(project);
  assert.deepEqual(componentEntries(null,'texts'),[]);
  assert.deepEqual(componentEntries(project,'texts'),[]);
  assert.equal(componentEntries(project,'blocks').length,1);
  assert.equal(componentEntries(project,'segments')[0].item,project.segments[0]);
  assert.equal(JSON.stringify(project),before);
});
