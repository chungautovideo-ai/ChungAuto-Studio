import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createWorkspaceStore } from '../src/services/workspaces.mjs';

test('Workspace persists, rejects unknown selections and invalid paths without corrupting store', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'contentos-test-'));
  t.after(() => fs.rmSync(root, { recursive:true, force:true }));
  const store = createWorkspaceStore(root);
  assert.equal(store.active().id, 'default');
  const education = store.create({name:'Giáo dục', brand:'Trường A'});
  assert.equal(createWorkspaceStore(root).active().id, education.id);
  assert.throws(() => store.select('missing'));
  assert.throws(() => store.update(education.id, {nasRoot:'relative/path'}));
  assert.equal(store.active().nasRoot, '');
  store.select('default');
  assert.equal(store.active().brand, '');
  assert.throws(() => store.create({name:' GIÁO DỤC '}));
});
