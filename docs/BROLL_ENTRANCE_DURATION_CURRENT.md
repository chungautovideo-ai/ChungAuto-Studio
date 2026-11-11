# Thời lượng hiệu ứng vào cảnh trám

## Phân tích UX trước triển khai · 05/11/2026

- Công việc: người dựng và AI giữ đủ thời gian nhìn chi tiết sản phẩm trong cảnh trám ngắn; desktop ưu tiên, mobile dùng cùng inspector.
- Hiện trạng: `editor/ui/app.js` có chip hiệu ứng trong thư viện Cảnh trám nhưng inspector chưa có thời lượng. `runtime.js` dùng fade 0,3s, slide/wipe 0,45s, zoom 0,4s, drop 0,42s cố định. QA `Q2_REVISED_FINAL_CURRENT.md` đã xem cảnh màn 0,75s bị hòa với A-roll ở đầu; chưa chứng minh thao tác dễ hiểu.
- Tham khảo: giữ luồng VEK chọn cảnh → hiệu ứng → preview, dùng điều khiển số có đơn vị và nút về mặc định như các thuộc tính hiện tại. Không tuyên bố đã khảo sát mới CapCut/Premiere.
- Tích hợp: trong inspector Cảnh trám, đặt loại hiệu ứng và thời lượng cạnh nhau; không thêm menu/tab. Dùng field/select/number/help/link và token hiện tại. Số có nhãn, Tab thao tác được; row dùng hành vi responsive có sẵn, chưa nghiệm thu render ở từng breakpoint.
- Dữ liệu: `brolls[].tInDuration` tùy chọn, số hữu hạn 0–2 giây output, 0 cắt thẳng. Vắng trường giữ chính xác mặc định cũ. Nếu cảnh bị rút ngắn, thời lượng hiệu lực không vượt thời lượng cảnh đã resolve. Không kéo dài cảnh, đổi nguồn hoặc tự đổi loại hiệu ứng. `tIn:none` bỏ hiệu ứng dù thời lượng có lưu. Không đổi hiệu ứng scene.
- Luồng: đổi số → snapshot/preview/dirty → Undo/Save/reopen; để trống hoặc nút Mặc định bỏ override. Giá trị lỗi không sửa project, báo validity ngay trên input. AI/session dùng cùng trường và validation trước build/commit; không phát sinh phí hoặc xuất tự động.
- Kiểm dự kiến: mặc định cũ, 0, none, cảnh ngắn/cắt cuối, số âm/NaN/chuỗi; API/commit từ chối trước ghi; runtime GSAP thật qua dữ liệu build và call capture, kiểm scene không đổi. UI native và final sẽ ghi đúng phạm vi thực kiểm.

## Triển khai và bằng chứng

Đã thêm control trong inspector Cảnh trám (`contentos-broll-entrance.js`), dùng snapshot/changed. Kho kiểu cảnh trám lưu và áp lại override; API `read_project` có schema hint, applyEditorFields và commitProject kiểm trước ghi. Build gửi thời lượng hiệu lực vào runtime dùng chung preview/final; scene không truyền override nên giữ thời lượng cũ. Không sửa dự án người dùng.

`tests/broll-entrance.test.mjs` kiểm mặc định/0/none/cắt cuối, input lỗi, API, commit không tạo history khi lỗi, lưu/mở lại và callback inspector. Chạy hàm entrance và vòng B-roll thật trong VM để kiểm GSAP call (không phải browser GSAP). Suite 368/368 qua tại workspace/logs/broll-entrance-suite.log; sau cập nhật skill, 7 kiểm mục tiêu B-roll/reference/package/snapshot qua.

`BROLL_ENTRANCE_FINAL_SMOKE.json`: final QA tổng hợp 2 giây, A-roll đỏ/B-roll xanh, fade0,1s từ0,4s và cảnh dài0,75s. Năm khung decode xác nhận đỏ→hòa→xanh→xanh→đỏ; contact đã xem. SHA256/bytes khớp kết quả xuất, project giữ nguyên. Chỉ chứng minh thời lượng/hiển thị trong fixture, chưa chứng minh người xem hiểu thao tác sản phẩm thật. Hai lượt fixture đầu thất bại có log: tên QA quá dài gây mkdtemp ENOENT trên Windows, sau đó nguồn không audio không khớp audio element; harness đổi tên ngắn và tạo track im lặng rõ ràng. Không coi hai vấn đề pipeline này đã được sửa trong sản phẩm.

Skill v50 references/editorial.md thêm hướng dẫn trường tùy chọn và xem thực tế; ZIP `workspace/exports/chungauto-creative-v50-broll-entrance.zip` parse qua, giữ11preset/5refs, không thay snapshot job cũ. Chưa model thật dùng quy tắc mới.

Backend5180 đã restart với dispatcher0/0/renderASRtrackingidle và xác minh PID/command, không mediaworker; xem BROLL_ENTRANCE_DEPLOY_SMOKE.json. Ba module UI/helper trả200 và byte khớp file mới. CUA thấy tab ContentOS nhưng getTab báo `browser.user is unavailable`; chưa xem UI native, responsive, keyboard hoặc Undo/Redo toàn editor trong lượt này. Không dùng CDP thay thế. Tính năng vẫn cần nghiệm thu tương tác giao diện và video thật; không tuyên bố hoàn tất mục tiêu rộng.

Kiểm UI tiếp theo qua nativecomputer-use: đã đọc hướng dẫn/confirmations và thử khởi tạo sky bằng node_repl; tool báo failed to write kernel assets: The system cannot find the path specified. (os error 3). Chưa có snapshot/nativeinput nên không cập nhật mức nghiệm thu UI. Không cài lại phần mềm hoặc dùng CDP để thay công cụ.
