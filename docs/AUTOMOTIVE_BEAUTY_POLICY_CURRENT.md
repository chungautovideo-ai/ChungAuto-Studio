# Giữ hoặc tắt làm đẹp theo lượt dựng

Home → Tùy chọn dựng ngành xe bổ sung Làm đẹp: Giữ thiết lập đang có (keep, mặc định) / Không dùng làm đẹp (off). Keep khôi phục camera.beauty từ snapshot người dùng; off bỏ toàn bộ beauty, gồm personLight/bodyWhite/bodySmooth. Độc lập màu natural/keep/off. Không tự quét người/da hoặc áp preset mới. Chỉnh sâu vẫn ở Bộ lọc→Làm đẹp.

Quy tắc dùng chung applyAutomotiveOptions/enforceAutomotiveJob cho API và session/CLI completion; snapshot hash vẫn kiểm trước normalize. Snapshot cũ thiếu beauty normalize về keep để job đang chốt không bị loại nhầm. Hint cũ về chưa có end-card được thay bằng vị trí công cụ chuẩn hóa màu, làm đẹp, che biển và đoạn kết hiện hành.

UX trước code nằm cuối AUTOMOTIVE_EDIT_IMPLEMENTATION_2026-11-04.md. Dùng disclosure/select chung, không sidebar. AUTOMOTIVE_SETUP_BROWSER_SMOKE.json kiểm request có beauty off, opt-out null,5kích thước1280/1920/820/600/390; ảnh1280/390 đã xem. AUTOMOTIVE_SESSION_SMOKE.json kiểm claim/completion HTTP thực với candidate cố bật beauty; off giữ sau completion. AUTOMOTIVE_API_SMOKE.json gateway giả lập local, first-build giữ off từ baseline có bodyWhite/personLight và auto-export final fixture3s; không provider trả phí/không nghiệm thu model thật. Bài thử conflict được chấp nhận lỗi revision sớm hoặc candidate conflict, đều phải giữ chỉnh sửa thủ công; tăng thời gian chờ gateway cho ổn định, không bỏ kiểm bảo toàn dữ liệu.

Suite238/238 ở workspace/logs/automotive-beauty-suite.log. Skillv18 giữ11preset, thêm quy tắc beauty keep/off và quick_validate qua. Main5180 restart sau dispatcher0/0, render/ASR null, không Remotion worker và kiểm đúng PID; policy/helperHTTP200. Dự án thật người dùng giữ nguyên. Không tăng tỷ lệ hoàn thành toàn mục tiêu từ các bài thử này.

## Đồng bộ mức SFX trên Home

Ảnh trước sửa cho thấy override ngành xe tat nhưng radio chung nhieu. home.js hiện hiển thị mức hiệu lực và disable radio khi override tat/vua/nhieu; help chỉ nơi đổi. st.sfx nền giữ nguyên; keep hoặc bỏ áp dụng ngành xe phục hồi mức cũ. Không đổi engine/render/policy: tat ngành xe tắt toàn bộ, tat chung chỉ tiếng tự động. Label keep sửa thành Theo mức chung bên dưới, đúng vị trí màn hình.

Browser AUTOMOTIVE_SETUP_BROWSER_SMOKE.json bổ sung kiểm checked/disabled/title/keep/opt-out/payload ở1280/1920/820/600/390, không gửi job thực; ảnh1280 đã xem. Syntax home/control qua, main5180 home.jsHTTP200 có code mới, không cần restart tài nguyên tĩnh. Skillv18 nêu rõ hai nghĩa tat; quick_validate qua. Suite238 ở mốc trước không là bài kiểm riêng của thay đổi UI này.
