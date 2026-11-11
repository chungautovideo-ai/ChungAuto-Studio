import {parentPort,workerData} from 'node:worker_threads';
import {finalizeRenderArtifact} from './render-artifacts.mjs';
try{parentPort.postMessage({result:finalizeRenderArtifact(workerData)});}
catch(error){parentPort.postMessage({error:error.message});}
