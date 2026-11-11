import {readFaceTracks} from './face-tracks.mjs';
import {normalizePersonExposureSummary,suggestPersonExposure} from '../../editor/lib/person-exposure.js';
import {normalizePersonSourceAdjustments,resolvePersonSourceAdjustment} from '../../editor/lib/person-source-adjustments.js';
import {personSelectionScope} from './person-selection-scope.mjs';

// Compact AI context: do not send frame masks/landmarks to a language model.
export function personExposureReport(dir,project){
 const status=readFaceTracks(dir,project),b=project.camera?.beauty||{},defaults={personLight:Number(b.personLight)||0,bodyWhite:Number(b.bodyWhite)||0,bodySmooth:Number(b.bodySmooth)||0},values=normalizePersonSourceAdjustments(b.sourceAdjustments);
 const sources=status.tracks.map(track=>{
  const selectionScope=personSelectionScope(project,track.src,track.fingerprint.sha256,!!track.skin);
  let exposure,suggestion;try{exposure=normalizePersonExposureSummary(track.exposure);suggestion=suggestPersonExposure(exposure,{selectedPerson:selectionScope.mode!=='all-people'});}catch{suggestion={available:false,reason:'Số đo đã lưu không hợp lệ; quét lại người/da.'};}
  const current=resolvePersonSourceAdjustment(values,track.src,track.fingerprint.sha256,defaults);
  return {src:track.src,sha256:track.fingerprint.sha256,hasPersonMask:!!track.skin,exposure:exposure||null,suggestion,measurementScope:'Semantic person/skin over this file, including all people; not remeasured for a selected individual or range.',selectionScope,current:{personLight:current.personLight,bodyWhite:current.bodyWhite,bodySmooth:current.bodySmooth},ownAdjustment:current!==defaults};
 });
 return {ok:true,readOnly:true,missing:status.missing,sources,policy:{beauty:project.automotiveOptions?.beauty||'unspecified',off:!!b.off,firstBuild:'beauty keep preserves staged settings; off removes beauty. A report never enables or applies it.'},limits:'Display luma only; no skin tone/HDR/Log recognition, no person identity tracking. Missing/stale scans need local editor rescan.'};
}
