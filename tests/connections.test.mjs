import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {createConnectionStore,validateImageConnection} from '../src/services/connections.mjs';
test('workspace connection secrets stay encrypted, hidden, and cannot follow a changed endpoint',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'contentos-connection-'));
 try{
  const store=createConnectionStore(root,{env:{},secretDir:path.join(root,'secrets')});
  store.save('one',{baseUrl:'http://127.0.0.1:9999/v1',model:'fixture-image',apiKey:'synthetic-credential-only'});
  assert.equal(store.get('one').apiKey,'synthetic-credential-only');assert.equal(store.status('one').hasKey,true);assert.equal(store.status('one').apiKey,undefined);
  assert.equal(store.status('one').supportsReferences,false);
  store.save('one',{baseUrl:'http://127.0.0.1:9999/v1',model:'fixture-image',supportsReferences:true});assert.equal(store.status('one').supportsReferences,true);
  assert.equal(fs.readFileSync(path.join(root,'secrets/one.json'),'utf8').includes('synthetic-credential-only'),false);
  store.save('one',{baseUrl:'http://127.0.0.1:9999/v1',model:'next-image'});assert.equal(store.get('one').apiKey,'synthetic-credential-only');
  store.save('one',{baseUrl:'http://127.0.0.1:9998/v1',model:'next-image'});assert.equal(store.status('one').hasKey,false);
  assert.equal(store.status('two').hasKey,false);assert.throws(()=>validateImageConnection({baseUrl:'http://remote.example/v1',model:'image'}));
  assert.throws(()=>validateImageConnection({baseUrl:'https://user:secret@example.com',model:'image'}));
  store.remove('one');assert.equal(store.status('one').source,'environment');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
