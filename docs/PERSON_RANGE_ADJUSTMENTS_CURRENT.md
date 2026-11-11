# Chỉnh người/da riêng từng khoảng — phân tích trước triển khai

Nhiệm vụ: cùng file có cảnh tối và sáng, người dùng muốn chỉnh sáng người/da/mịn riêng khoảng đã theo dõi mà không thay mọi đoạn dùng file. Hiện code app.js chỉ có mức chung và sourceAdjustments; personSelections đã có khoảng nguồn/hash và mặt nạ. Tham khảo UX hiện có PERSON_SOURCE_ADJUSTMENTS_CURRENT.md và PERSON_SELECTION_RANGES_CURRENT.md: giữ cách chọn nguồn, ba thanh và danh sách khoảng; không suy engine CapCut từ tài nguyên REA.

Luồng đích: Bộ lọc→Làm đẹp→Người & da toàn thân→nguồn→Phạm vi: toàn nguồn hoặc một khoảng SAM2 đã lưu. Chọn phạm vi không sửa dữ liệu/không chạy GPU; kéo thanh mới lưu mức riêng khoảng. Nút Dùng mức nguồn xóa override khoảng, giữ mask. Gợi ý đo sáng toàn nguồn không áp khi đang chỉnh riêng khoảng. Ngoài khoảng vẫn tuân theo mask gate hiện hành, không tự chỉnh mọi người.

Dữ liệu: adjustments optional nằm trong từng personSelection,3mức0–100, đầy đủ; không đổi source/hash/time hoặc khuôn mặt. Mức ưu tiên khoảng→nguồn→chung, mốc nửa mở theo sourceclock. Chọn lại đúng khoảng giữ mức riêng; xóa khoảng xóa mức cùng mask. Tắt làm đẹp xóa cả mức khoảng. Preview/final dùng chung helper. Undo/Save/reopen hiện có.

UI dùng select/field/help/link/range VEK; nhãn có giây nguồn, chọn bằng bàn phím; không thêm sidebar/dialog. Desktop/mobile giữ wrap theo component. Cần kiểm schema,clock/hash/zero, previewWebGL, UIUndoSave/reopen và final. Chưa công bố đa người độc lập trong cùng khoảng, tracking xuyên cut hoặc tự xác định tông da.

## Kết quả triển khai

Đã triển khai schema adjustments trong selection, helper source/hash/time chung preview/final, giữ mức khi chọn lại đúng khoảng, UIselect/ba thanh/reset và Tắt làm đẹp xóa mức khoảng. Báo cáo selectionScope.ranges có adjustments; CLI/API đổi mức file vẫn giữ mức khoảng, trả mô tả rõ. Skillv50person.md cập nhật, ZIPmới chungauto-creative-v50-person-ranges.zip giữ11preset/5refs và bản ZIP/job snapshot cũ.

Unit307/307 trong workspace/logs/person-range-adjustments-suite.log. PERSON_RANGE_ADJUSTMENTS_WEBGL_SMOKE.json kiểm0/30 theo sourceclock speed2/tua; fixture đầu thất bại do fps30 và rate1 còn từ bước trước, đã sửa fixture tường minhfps1/rate2, không thay ngưỡng để nhận đạt. UI trên bản copy6giây và mask MediaPipe/SAM2 trước đó qua chọn không ghi, chỉnh riêng45, UndoRedoSave/mở lại, reset giữ2mask và explicit0; không chạy inference mới. Fixture sao face lúc đầu mất fingerprintmtime, đã pin lại metadata file copy sau xác minhSHA giống; chưa phải kiểm tracking mới. PERSON_RANGE_ADJUSTMENTS_UI_SMOKE.json và ảnh1280/390 đã xem; hai nút reset đổi block để không dính chữ.

Final hai bảnQA6giây tại contentos-qa-range-adjustments-3: baseline0, khoảng0–2s personLight40, khoảng3–5s explicit0, chung0. Bốn khung .5/2.5/3.5/5.5s: sốpixelkhác>8 lần lượt67402/23/25/11; hash/sidecar khớp. Contact đã xem cho thấy người sáng hơn chỉ ở khoảng đầu; nền và ngoài khoảng có nhiễu codec nhỏ, không nhận bất biếnlossless. PERSON_RANGE_ADJUSTMENTS_FINAL_SMOKE.json/FINAL_CONTACT.png. Không thay nguồn/dựánngườidùng, không nhận đa người/chekhuất/fullvideo từ kiểm này.

Main5180 đã restart sau dispatcher0/0/renderASRpersonidle/khôngworkerphùhợp và PID64252commandchínhxác; ping/UI/refHTTP mới qua. PERSON_RANGE_ADJUSTMENTS_DEPLOY_SMOKE.json. Chỉ cần tải lại trang để nhận UI mới.
