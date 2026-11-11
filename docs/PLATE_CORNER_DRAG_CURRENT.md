# Kéo bốn góc vùng che biển

## Phân tích UX trước code

- Công việc: sửa vùng OCR nghiêng/rộng trên ảnh đầu nguồn bằng chuột hoặc chạm; không phải nhập8số để sửa nhanh.
- Hiện trạng: contentos-plate-privacy.js đã vẽ bốn góc và có8ô tọa độ; mọi kéo trên canvas hiện xóa polygon rồi tạo hộp mới. Contact PLATE_QUAD_TRACK_RAW_OCR.jpg cho thấy cần chỉnh lại vùng rộng. Đây khảo sát code và ảnh QA, chưa tương tác browser mới.
- Tham khảo: dùng nguyên luồng chọn vùng của VEK hiện có và điều khiển số nâng cao; không nhận đã khảo sát thao tác CapCut mới. Bốn nút góc tận dụng điểm đã hiển thị, không thêm tab/icon/theme.
- Luồng đích: polygon có sẵn hoặc mở Chỉnh4góc → kéo điểm gần góc → cập nhật hình và tọa độ → tạo/duyệt như cũ. Kéo ngoài điểm vẫn khoanh hộp mới. Góc tự cắt/lõm/quá nhỏ bị từ chối, giữ vị trí hợp lệ trước; lỗi ghi status. Hủy pointer trả hình học trước kéo, không áp dự án.
- Responsive: vùng bắt điểm tính theo pixel CSS14px, không theo độ phân giải nguồn; mobile vẫn dùng form số khi điểm quá gần. Bàn phím giữ8input có nhãn; không thêm tabstop canvas riêng. Không đổi bố cục, chưa kiểm nativebrowser ở390/1280 trong lượt này.
- Dữ liệu: chỉ bản nháp dialog, không projectWrite/render/tạoreceipt. Đổi góc vô hiệu preview cũ; Apply/Save/Undo dựán giữ luồng đã có. Không gọi model hay API trả phí.
- Nghiệm thu: hình học nghiêng, hit target theo CSS, lỗi không làm mất vùng, pointer khác/busy/cancel; productioncallbackVM. Browser/focus/touch thực còn phải kiểm.

## Kết quả

Đã thêm contentos-plate-corners.js và nối pointer callback trong dialog. Điểm hiển thị tối thiểu5pxCSS, vùng bắt14pxCSS; mở nhóm4góc vẽ ngay điểm trên hộp hiện tại. Kéo góc hợp lệ cập nhật bounds/quad/inputs và bỏ bản preview cũ. Kéo khácpointer/rightclick/busy bị bỏ qua; pointercancel/lostcapture khôi phục vùng trước. Góc lỗi giữ vị trí hợp lệ cuối và báo lỗi. Kéo xa điểm vẫn tạo hộp như cũ.

9/9 kiểm liên quan qua gồm hình học, productioncallbackVM cho góc/hộp/cancel/pointer khác và ZIP roundtrip hiện có; syntax qua. PLATE_CORNER_DRAG_SMOKE.json: HTTPmain5180 trả đúng bytes cả2module, ZIP mới11preset5refs có hướng dẫn kéo góc. StaticUI không cần restart. Chưa thao tác browser/chạm thật hoặc nghiệm thu responsive/focus; không suy QAfixture thành trải nghiệm thực. Không đổi backend/renderer/projectschema/reviewgate.
