import {personSelectionScope} from '../lib/person-selection-scope.js';

export function personCoverageControls({h,project,src,sha256}){
 const scope=personSelectionScope(project,src,sha256),root=h('div',{'data-person-coverage':'',style:'min-width:0;overflow-wrap:anywhere'});
 const help=text=>h('div',{class:'help'},text),seconds=value=>Number(value.toFixed(3)).toString();
 if(scope.mode==='unavailable')root.append(help(scope.reason));
 else if(!scope.usedRanges.length)root.append(help('Nguồn này chưa có đoạn đang dùng trong bản dựng. Thay đổi mức không tự thêm nguồn vào video.'));
 else if(scope.mode==='all-people')root.append(help('Phạm vi vùng chỉnh: mọi người và da AI nhận diện trong nguồn này. Chọn và theo dõi người nếu chỉ muốn chỉnh một người.'));
 else if(!scope.uncoveredUsedRanges.length)root.append(help('Các đoạn đang dùng của nguồn này đều nằm trong khoảng đã chọn người. Vẫn cần kiểm vùng nhận diện; độ phủ không xác nhận đúng người.'));
 else{
  const missing=scope.uncoveredUsedRanges;
  root.append(help(`${missing.length} khoảng nguồn đang dùng chưa nằm trong vùng chọn người. Ba thanh toàn thân sẽ không chỉnh tại các khoảng này; video vẫn phát bình thường.`));
  const details=h('details',{},h('summary',{},'Xem các khoảng chưa được chỉnh'));
  for(const r of missing)details.append(help(`${seconds(r.from)}–${seconds(r.to)} giây nguồn`));
  details.append(help('Dùng Chọn và theo dõi người để thêm khoảng không chồng nhau, hoặc bỏ chọn đối tượng nếu muốn dùng mask tất cả người. Hiệu ứng Da/Môi/Mắt/Khuôn mặt vẫn có phạm vi riêng.'));
  root.append(details);
 }
 return root;
}
