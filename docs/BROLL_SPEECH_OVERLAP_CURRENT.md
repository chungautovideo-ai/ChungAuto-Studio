# Đối chiếu lời theo từng cảnh trám

Hiện kiem-ban-dung trả words/brolls riêng; phải tự join theo outputclock. Bản Q2helper có đèn/màn ở lời chung, ghế và đổi màu gần ranh giới ý. Bổ sung speechOverlap trong từng Broll ở báo cáo timing: các từ giao khoảng phát và từ ngay sau điểm kết thúc. Tính theo toàn timeline đã resolve, không chỉ word slice200/window, giới hạn32từ mỗi cảnh và ghi truncated; mốc gốc/output giữ nguyên. Không sửa media/candidate hoặc tự quyết định đúng nghĩa từ tên file/minhHoa. Dùng helper chung để unitrate/cut/hidden/off/long/truncation và realCodexrevise4cảnh trên bảncopy. Không đổi UI/renderer/schema dự án.

## Kết quả kiểm chứng

Đã triển khai helper đọc lời giao khoảng trong session-candidate-check, giữ mốc project/output. Unit kiểm biên từ, khoảng im lặng, cờ cắt ngang từ, giới hạn32/80 từ và dữ liệu trả về không sửa đầu vào; integration kiểm trên timing report. Suite hiện tại321/321 qua, log workspace/logs/broll-overlap-suite.log.

Codex thật trên bản QA copy hoàn tất sau77,914giây và dừng awaiting-review. Bốn cảnh khớp các mốc phụ đề được yêu cầu: đèn14,79–15,54; màn15,54–16,29; ghế da18,09–19,14; đổi màu20,18–21,20 (giây bản dựng). Chỉ at/dur thay đổi; các trường khác giữ nguyên. Worker đã đọc speechOverlap và dùng công cụ kiểm. Bằng chứng REAL_CODEX_BROLL_OVERLAP_SMOKE.json; chưa xem/nghe toàn video hoặc xuất final, không dùng kết quả này khẳng định chất lượng ngữ nghĩa hay giảm token.

Skill v50 references/editorial.md hướng dẫn đọc lời giao cảnh/từ tiếp theo, phân biệt cờ ranh giới với lỗi dựng, thu nhỏ cửa sổ khi báo truncated. Gói workspace/exports/chungauto-creative-v50-speech-overlap.zip roundtrip11preset/5refs qua, SHA trong BROLL_OVERLAP_SKILL_SMOKE.json. Không áp ngưỡng thời lượng cố định cho mọi cảnh trám.

Main5180 đã khởi động lại sau xác minh dispatcher0/0, render/ASR/personTracking idle, không worker media ContentOS, đúng PID/command; ping ContentOS qua. BROLL_OVERLAP_DEPLOY_SMOKE.json lưu bằng chứng. Không dừng các app Python khác hoặc thay dự án gốc.

## UX tóm tắt bản dựng — phân tích trước sửa

Quan sát editor QA thật5194: tab Cảnh trám báo4 nhưng dòng tóm tắt chỉ có0cảnh minh họa (scenes), không có số B-roll. Người dùng dễ hiểu nhầm AI chưa thêm cảnh. Dùng lại dòng meta VEK, cùng tên Cảnh trám với rail/timeline, bổ sung số brolls; giữ scenes riêng vì hai loại dữ liệu khác nhau. Không thêm menu/nút, không đổi project/Undo/Save/renderer, giữ hành vi thu gọn dòng meta hiện có ở màn nhỏ. Kiểm browser dự ánQA có4Broll và không lưu thay đổi dự án; không cần test mô phỏng chuỗi UI.

Preview đã xem15,7s: màn cùng phụ đề màn, có pha chuyển mờ của preset;16,4s: A-roll cùng phim. Chỉ kiểm hai mốc, chưa xem liên tục/nghe. Không dùng hai ảnh để nghiệm thu toàn bộ nhịp dựng.

Sau sửa meta: browserQA5194 đọc đủ4cảnh trám và tab4, ảnh BROLL_OVERLAP_META_UI.png đã xem ở1280×720. Dòng meta vẫn ellipsis như trước; không nghiệm thu lại mọi breakpoint. Chỉ thay text tóm tắt, không schema/renderer. Tab QA đóng, server5194 dừng sau kiểm idle/đúngPID; main5180 giữ chạy.
