# Skill ChungAuto: đọc chuyên đề khi cần

Phân tích trước thay đổi: skill v37 chứa khoảng19KB hướng dẫn màu, da, che biển cùng cắt dựng. Tách file đơn thuần sẽ làm mất hướng dẫn trong job vì snapshot hiện chỉ chép SKILL.md/template.json; API cũng chưa có công cụ đọc tham chiếu. Do đó cần giữ tham chiếu theo đúng phiên bản job, có hash và cùng phạm vi thư mục. Không dùng file thư viện mới thay snapshot đã chốt.

Thiết kế: template.skillReferences là danh sách đường dẫn references/*.md (tối đa16file,64KB/file,256KB tổng). Snapshot giữ bytes/hash; read xác minh expected manifest và nội dung. CLI/session đọc đường dẫn tương đối từ SKILL.md snapshot. API nhận catalog đường dẫn và công cụ read_template_reference chỉ trả chuyên đề yêu cầu; không nạp mọi nội dung vào prompt. Lưu mẫu cải tiến giữ các tham chiếu của mẫu cha. Không tạo menu mới hoặc đổi timeline/render. Skill v38 giữ11preset, chỉ tổ chức hướng dẫn lại và thêm Xem vùng đã lưu.

Kiểm dự kiến: snapshot giữ nguyên sau thư viện đổi; từ chối thiếu/tamper/traversal/linkra ngoài/oversize; backwardcompat snapshot cũ; API mock gọi một reference và giữ camera; mẫu cải tiến giữ tài liệu; phiên bản mới quick_validate/hash/presets. Không coi byte giảm là token hoặc tốc độ thực.


## Triển khai và bằng chứng

Creative v38 là bản con v37, giữ nguyên11preset, poster và preview trích nguồn cũ (không phải render mới). SKILL.md nạp đầu19176→6443UTF8byte; 4 chuyên đề giữ toàn bộ phần màu/người/biển/finishing, thêm chỉ dẫn Xem vùng. Đây không đo token, thời gian hoặc chất lượng dựng.

Service template-references kiểm danh sách, phạm vi, số lượng và dung lượng; snapshot lưu file/hash, kiểm expected manifest và bytes khi đọc. Mẫu cũ không có tham chiếu vẫn dùng schema1. Save phong cách giữ tham chiếu của cha. API read_template_reference chỉ cho path đã chốt; API revise cũng nhận catalog, không tự nạp cả4file. CLI nhận thư mục snapshot từ inbox rồi đọc link tương đối. Không tự đổi job đã chốt hoặc dự án đang dựng sangv38.

Suite269/269 ở workspace/logs/template-references-suite.log: snapshot giữ topic khi thư viện đổi, phát hiện hash sai/tamper/missing, traversal/duplicate/oversize, lưu cải tiến giữ11preset vàfile; mockAPI đọc1topic rồi đổi title, camera giữ nguyên. Test copy fixture bằng fs.cpSync gây NodeWindows nativeexit3221226505; đổi sang copyFileSync tường minh đã qua. Không suy lỗi app từ lỗi harness này.

HTTP QA riêng5195: SKILL_REFERENCES_SESSION_SMOKE.json xác nhận giao việc v38 →4reference được chốt →inbox dùng đúng thư mục →guide Xem vùng tồn tại,11preset. Không dispatch model, job QA đã hủy, workspace khôi phục. Chưa chạy model thật tự quyết định đọc reference, chưa kiểm latency/token. Không đổi render/schema timeline nên không render lại cho hạng mục skill.

Triển khai5180: trước restart dispatcher0/0,render/ASR/personTrackingidle, khôngmediaworker; xác minh đúngPID/command ContentOS, chỉdừng serverđó. Endpoint /api/templates?id=chungauto-factory-quang-cao-v38 trảversion38/11presets/4references. Khôngđổijobcũ.
