# Áp dụng mẫu giữ lựa chọn dựng ngành xe

## Phân tích trước sửa

Luồng hiện tại: Thư viện → Áp dụng gọi applyTemplate trong editor/lib/template.js, qua snapshot/changed và Undo/Save sẵn có. Hàm merge camera.color/audio từ mẫu nhưng chưa thực thi automotiveOptions của dự án. Vì vậy đổi mẫu có thể bật lại bài nhạc/SFX hoặc grade mà người dùng đã tắt. Đường staging AI có pinAutomotiveJob riêng, không bảo vệ thao tác áp dụng trực tiếp trong editor.

Giữ giao diện VEK và vị trí hiện có, không thêm menu hay điều khiển. Tham chiếu quy tắc hiện hành trong automotive-options.js: lựa chọn dự án thắng mẫu, keep giữ trạng thái đã chốt, off không bật lại, natural là preset nhẹ từng cảnh chứ không tự nhận diện Log. Áp dụng helper chung sau restyle với baseline dự án trước áp dụng. SFX keep giữ mức đã chốt khi có; chưa có mức thì dùng mặc định mẫu. Không nhập automotiveOptions từ mẫu sang dự án; không đưa media/logo/contact/mask/timeline vào mẫu. Dự án không có policy giữ hành vi applyTemplate hiện tại.

Kiểm dự kiến: off/keep/natural, restyle cả hai chế độ, không mutate đầu vào, policy của mẫu không ghi đè dự án và dự án chưa có policy. Không thay renderer/backend hoặc bố cục. Browser/UndoSave thực cần kiểm riêng; unit không chứng minh nghiệm thu giao diện.

## Kết quả

Ba test hồi quy thất bại trên code cũ, qua sau sửa. applyTemplate gọi helper automotive sau restyle và dùng project gốc làm baseline. Music keep với bài chưa chọn cũng không lấy bài mẫu. Không thay snapshot/completion AI hoặc file dự án người dùng. Bộ kiểm chung344/344 qua, log workspace/logs/template-automotive-policy-suite.log. HTTP5180 trả hai module byte khớp disk; không restart server. Tải lại editor để dùng module mới. Không kiểm browser/UndoSave/reopen hoặc render mới; renderer không đổi nhưng vẫn cần nghiệm thu luồng thực khi công cụ UI dùng được.

Skillv50 references/finishing.md cập nhật quy tắc đổi mẫu và không sao policy riêng sang mẫu. ZIP workspace/exports/chungauto-creative-v50-template-policy.zip parse được11preset/5refs; giữ job snapshot và các ZIP cũ. Bằng chứng TEMPLATE_AUTOMOTIVE_POLICY_SMOKE.json. Gói mẫu chỉ cập nhật hướng dẫn; cần app có applyTemplate mới để có hành vi trên.
