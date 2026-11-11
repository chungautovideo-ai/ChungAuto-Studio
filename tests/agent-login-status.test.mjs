import test from 'node:test';import assert from 'node:assert/strict';import {parseAgentLoginStatus} from '../src/services/agent-login-status.mjs';
test('CLI status consumes stderr as well as stdout and never accepts negative/unknown/error output',()=>{
 assert.equal(parseAgentLoginStatus('codex',{stderr:'Logged in using ChatGPT',status:0}),true);
 assert.equal(parseAgentLoginStatus('codex',{stdout:'Logged in using API key',status:0}),true);
 for(const text of ['Not logged in','Logged out','Logged in\nNot logged in'])assert.equal(parseAgentLoginStatus('codex',{stdout:text,status:0}),false);
 assert.equal(parseAgentLoginStatus('codex',{stdout:'Unknown status',status:0}),null);
 assert.equal(parseAgentLoginStatus('codex',{stderr:'spawn failed',status:null}),null);
 assert.equal(parseAgentLoginStatus('codex',{stderr:'Logged in',status:1}),false);
 assert.equal(parseAgentLoginStatus('codex',{stderr:'Logged in',timedOut:true}),null);
 assert.equal(parseAgentLoginStatus('claude',{stdout:'{"loggedIn":true}'}),true);assert.equal(parseAgentLoginStatus('claude',{stderr:'{"loggedIn":false}'}),false);
 assert.equal(parseAgentLoginStatus('claude',{stdout:'unknown'}),null);
});
