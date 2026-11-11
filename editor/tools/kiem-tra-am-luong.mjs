#!/usr/bin/env node
import path from 'node:path';
import {resolveContained} from '../../src/services/storage.mjs';
import {measureAudioLoudness} from '../../src/services/audio-loudness.mjs';
try{
 const [dir,file,...extra]=process.argv.slice(2);if(!dir||!file||extra.length)throw Error('Dùng: node editor/tools/kiem-tra-am-luong.mjs <dự án> <đường dẫn file trong dự án>');
 const media=resolveContained(path.resolve(dir),file).file;
 console.log(JSON.stringify(await measureAudioLoudness(media),null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
