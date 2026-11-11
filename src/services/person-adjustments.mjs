import {personExposureReport} from './person-exposure-report.mjs';
import {normalizePersonSourceAdjustments} from '../../editor/lib/person-source-adjustments.js';
import {normalizePersonSelections} from '../../editor/lib/person-selection.js';
export function applyPersonAdjustment(dir,project,request){
 if(!request||typeof request!=='object'||Array.isArray(request)||Object.keys(request).some(k=>!['src','sha256','levels','range'].includes(k))||typeof request.src!=='string'||!request.src||! /^[a-f0-9]{64}$/.test(request.sha256||''))throw Error('Chọn nguồn và SHA256 từ báo cáo người/da.');
 const levels=request.levels,keys=['personLight','bodyWhite','bodySmooth'];if(!levels||typeof levels!=='object'||Array.isArray(levels)||!Object.keys(levels).length||Object.keys(levels).some(k=>!keys.includes(k)||!Number.isFinite(levels[k])||levels[k]<0||levels[k]>100))throw Error('Chỉ chỉnh sáng người, sáng da hoặc mịn da từ 0 đến 100.');
 const beauty=project.camera?.beauty||{};if(beauty.off||project.automotiveOptions?.beauty==='off')throw Error('Làm đẹp đang tắt theo bản dựng; bật hoặc đổi lựa chọn trong editor trước.');
 const report=personExposureReport(dir,project),source=report.sources.find(s=>s.src===request.src);if(!source?.hasPersonMask||source.sha256!==request.sha256||source.selectionScope.mode==='unavailable')throw Error('Nguồn thiếu mask, đã đổi hoặc phạm vi chọn không hợp lệ; quét/chọn lại trước.');
 if(request.range!==undefined){
  const range=request.range;
  if(!range||typeof range!=='object'||Array.isArray(range)||Object.keys(range).some(k=>!['from','to'].includes(k))||!Number.isFinite(range.from)||!Number.isFinite(range.to)||range.from<0||range.to<=range.from)throw Error('Khoảng nguồn cần from/to đúng từ báo cáo, không dùng mốc timeline.');
  const selections=normalizePersonSelections(beauty.personSelections),selection=selections.find(s=>s.src===source.src&&s.sha256===source.sha256&&s.from===range.from&&s.from+s.f.length/s.fps===range.to);
  if(!selection)throw Error('Không tìm thấy đúng khoảng người đã lưu; đọc lại báo cáo, không tự tạo hoặc mở rộng vùng.');
  selection.adjustments={...source.current,...selection.adjustments,...levels};
  return {project:{...project,camera:{...project.camera,beauty:{...beauty,personSelections:selections}}},result:{ok:true,src:source.src,sha256:source.sha256,range:{from:range.from,to:range.to},current:{...selection.adjustments},appliedToCandidateOnly:true,review:'Chỉ đổi mức của đúng khoảng nguồn đã lưu. Giữ mask, mọi khoảng khác, mức file/chung và hiệu ứng mặt; kiểm preview trước duyệt.'}};
 }
 const adjustment={src:source.src,sha256:source.sha256,...source.current,...levels},values=normalizePersonSourceAdjustments([...(beauty.sourceAdjustments||[]).filter(v=>v.src!==source.src),adjustment]);
 return {project:{...project,camera:{...project.camera,beauty:{...beauty,sourceAdjustments:values}}},result:{ok:true,src:source.src,sha256:source.sha256,current:adjustment,selectionScope:source.selectionScope,appliedToCandidateOnly:true,review:'Đổi mức nguồn; khoảng có adjustments riêng giữ mức riêng. Kiểm preview toàn khoảng; ngoài các khoảng chọn sẽ không chỉnh ba mức toàn thân. Không thay mask hoặc hiệu ứng mặt.'}};
}
