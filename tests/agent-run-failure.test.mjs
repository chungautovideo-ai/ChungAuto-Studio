import test from 'node:test';import assert from 'node:assert/strict';
import {classifyAgentRunFailure} from '../src/services/agent-run-failure.mjs';
test('worker terminal failure retains execution setup cause ahead of unrelated authentication chatter',()=>{
 const output='OAuth load warning\nFailed to create unified exec process: helper_unknown_error: setup refresh had errors\nChưa sửa dự án\n=== thoát mã 0';
 const failure=classifyAgentRunFailure('codex',output);assert.equal(failure.code,'CLI_EXEC_UNAVAILABLE');assert.match(failure.message,/không tạo được tiến trình/);assert.equal(failure.message.includes(output),false);
 assert.equal(classifyAgentRunFailure('codex','authentication failed HTTP 401').code,'CLI_AUTH_REQUIRED');
 assert.equal(classifyAgentRunFailure('claude','Please login').code,'CLI_AUTH_REQUIRED');
 for(const output of ['authentication telemetry enabled; login status checked','log file contains401frames','=== thoát mã 0','quota exceeded'])assert.equal(classifyAgentRunFailure('codex',output).code,'CLI_RUN_FAILED');
 assert.equal(classifyAgentRunFailure('claude','setup refresh had errors').code,'CLI_RUN_FAILED');
});
