# Thư viện Skill AI và quy chuẩn edit ContentOS · 06/11/2026

## Phân tích UX (theo UX_CHANGE_RECORD_TEMPLATE)

- Hành trình: người dựng muốn biết AI đang có những kỹ năng nào, đọc quy tắc của một kỹ năng, rồi yêu cầu AI dùng nó cho video kế tiếp. Trước đây skill chỉ nằm trong thư mục `.agents/skills`, không xem được trong app.
- Hiện trạng: menu Tài nguyên có Thư viện (mẫu/hiệu ứng/tư liệu). Skill AI là loại tài nguyên khác (cho worker), nên đặt một mục riêng "Skill AI" trong nhóm Tài nguyên, không nhân menu theo provider.
- Tham khảo: lưới thẻ + ô tìm + chip lọc (kiểu marketplace extension của VS Code/Raycast). UI UX Pro Max (ux: chip collection reflow, compact control semantics): chip là `<button aria-pressed>`, xuống dòng khi thiếu chỗ, focus-visible, trạng thái đếm `aria-live`.
- Token/icon: dùng `--surface/--line2/--lime/--ink2`, icon nét 20px chung của `contentos-navigation.js`, dialog native.

## Đã làm

- `src/services/skill-library.mjs`: đọc `.agents/skills` + `.claude/skills` (chỉ đọc, chặn tên có `..`), gộp trùng tên, nhóm theo mục đích và theo gói nguồn (`skills-lock.json`). Kết quả scan được cache theo mtime 2 thư mục skill và lock (scan đầy đủ trên NAS ~0,65 s, cache ~2 ms).
- API: `GET /api/v1/skills`, `GET /api/v1/skills/detail?name=`.
- UI `editor/ui/contentos-skills.js` (route `#skills`): thống kê, tìm, lọc theo mục đích/nguồn, xem SKILL.md, nút "Dùng cho video này" ghi `Dùng skill <tên>` vào ô ghi chú Trang chủ, "Chép lệnh gọi skill".
- Gói skill đã nạp (bản copy, khóa trong `skills-lock.json`): Remotion, HyperFrames, OpenMontage, Ghost Editor, MRT Keyword, TikTok Video, Data Animation; `ffmpeg-skill` (npx), Ponytail 5.3.3 (chỉ `skills/`, không cài hook).
- `contentos-edit-standards` (SKILL.md + 5 references): quy chuẩn nhà rút từ các skill trên, mỗi con số ghi nguồn; thứ tự ưu tiên: người dùng > SKILL mẫu snapshot > mkt-* > chuẩn này > bên thứ ba.
- `ai-inbox.mjs`: việc dựng đầu và việc sửa nhắc đọc `contentos-edit-standards`; ghi chú "Dùng skill <tên>" được đọc như tài liệu tham khảo, không chạy lệnh cài/API trả phí trong skill.
- `ContentOS.exe` (launcher 15 KB, `installer/build-exe.ps1` + `installer/ContentOS-launcher.cs`, csc .NET Framework): chạy `installer/start.ps1`, mở `/home` trong cửa sổ app Chrome (dự phòng Edge, rồi trình duyệt mặc định).

## Kiểm chứng và giới hạn

- `tests/skill-library.test.mjs` 3/3 (frontmatter, phân nhóm, gộp 2 thư mục, chặn traversal, cache/rescan).
- Browser: `#skills` hiện 131 skill/10 nguồn/9 nhóm, lọc "phụ đề" ra 2, nút dùng skill ghi đúng ô ghi chú và về Trang chủ.
- Exe: mở được cửa sổ "ContentOS · Video Editor" trong Chrome. Không gom node/runtime vào exe; exe phải nằm ở gốc app.
- Chưa chạy worker model thật với `contentos-edit-standards`; chưa đo chất lượng/token. Skill bên thứ ba có thể nhắc API trả phí — chỉ là tài liệu tham khảo.
