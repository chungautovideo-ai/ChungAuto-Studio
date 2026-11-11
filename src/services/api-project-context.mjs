import {normalizePersonSelections} from '../../editor/lib/person-selection.js';
import {selectProjectContext} from './project-context.mjs';
export function apiProjectProjection(project){
 const selections=project.camera?.beauty?.personSelections;
 if(selections==null)return {project,omittedPaths:[]};
 const normalized=normalizePersonSelections(selections),summary=normalized.map(({f,...metadata})=>({...metadata,sampleCount:f.length,to:metadata.from+f.length/metadata.fps,maskDataOmitted:true}));
 return {project:{...project,camera:{...project.camera,beauty:{...project.camera.beauty,personSelections:summary}}},omittedPaths:normalized.length?['camera.beauty.personSelections[].f']:[]};
}
export function selectApiProjectContext(project,options){
 const projection=apiProjectProjection(project),result=selectProjectContext(projection.project,options);
 if(projection.omittedPaths.length&&(!options?.fields||options.fields.includes('camera')))return {...result,partial:true,omittedPaths:projection.omittedPaths,note:(result.note||'Bản đọc dự án.')+' Mặt nạ người là dữ liệu local chỉ đọc qua summary; không có f/RLE. Camera không thuộc nhóm API sửa được, không dựng lại mask từ summary. Dùng read_person_exposure để đọc phạm vi và khoảng thiếu.'};
 return result;
}
