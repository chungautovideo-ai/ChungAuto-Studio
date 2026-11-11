# File dự án .cosproj và chọn nơi xuất · 07/11/2026

## Phân tích UX (theo UX_CHANGE_RECORD_TEMPLATE)

- **Công việc người dùng:** lưu dự án thành một file mang đi được, mở lại để sửa/render tiếp; khi xuất thì tự chọn thư mục, tên file, chất lượng. Máy bàn Windows, thao tác hằng ngày.
- **Hiện trạng (code):** dự án chỉ sống trong `workspace/content/<ngày>/<tên>/project.json`, mở từ Home; Lưu = `PUT /api/project` (revision/xung đột qua `commitProject`). Hộp Xuất chỉ đổi thư mục, tên tự đặt `<dự án>-final[-N].mp4`, không có ô tên/chất lượng, không hỏi ghi đè. Không có tự lưu khôi phục; chỉ có `beforeunload`.
- **Tham khảo:** Premiere Pro — File > New/Open/Save/Save As (Ctrl+O/S/Shift+S), Link Media khi media offline, Auto Save; Export Settings: Output Name + nơi lưu + preset. Chỉ học luồng, không chép giao diện. Chưa mở Premiere thật trong phiên này.
- **Bản đồ tích hợp:** menu ⋯ của editor (cạnh Lưu/Lịch sử bản lưu) → `editor/ui/app.js`; Home > Dự án → nút "Mở file dự án"; hộp Xuất `exportBox`; service mới `src/services/project-file.mjs`; dialog mở dùng chung `editor/ui/contentos-project-file.js`; render dùng lại `startRender` + `finalizeRenderArtifact`. Không thêm tab/menu mới.
- **Luồng đích:**
  - *Lưu thành…* → hộp Lưu của Windows (`.cosproj`) → ghi file, gắn với dự án; từ đó *Lưu* (Ctrl+S) cập nhật cả `project.json` và file `.cosproj`.
  - *Mở dự án…* (Ctrl+O, hoặc Home) → hộp Mở → kiểm media → thiếu thì "Chọn lại…" từng file → mở. Còn chỉnh sửa chưa lưu thì hỏi Lưu / Không lưu / Hủy.
  - *Dự án mới…* → Home (luồng tạo dự án sẵn có; trình duyệt cảnh báo nếu chưa lưu).
  - *Xuất*: Chất lượng (Cao/Nháp), Tên file, Lưu vào + "Chọn nơi lưu…" (hộp Lưu của Windows). Bấm Xuất: file đã có → hỏi ghi đè; từ chối thì hộp giữ nguyên; Hủy thì không render. Xong: thanh trạng thái hiện đường dẫn và "Mở thư mục chứa video".
- **Trạng thái:** hủy hộp chọn = không làm gì; thiếu media chặn nút Mở; thư mục dự án có bản mới hơn file → chọn giữ bản nào; lỗi ghi `.cosproj` báo riêng, không làm hỏng bản lưu chính; đang xuất thì không cho mở dự án khác.
- **Thiết kế chung:** nút primary/outline/ghost, input/select chung của app.css, dialog dùng token `--surface/--ink/--line`. Không thêm CSS.

## Định dạng `.cosproj` (JSON)

`{format:"contentos-project", schemaVersion:1, savedAt, name, projectFolder:{rel,abs}, revision, project:{…project.json…}, media:[{ref:"inputs/raw.mp4", rel, abs}]}`. `rel` tính từ thư mục chứa file `.cosproj` và được ưu tiên khi mở; khác ổ/gốc thì `rel=null`, dùng `abs`. Media = mọi chuỗi `inputs/|assets/|work/…` có đuôi media trong project.

Khi mở: thư mục dự án tìm thấy và nằm trong kho → ghi trạng thái từ file qua `commitProject` (giữ `.history`). Không thấy hoặc nằm ngoài kho (kể cả khác gốc UNC/ổ ánh xạ) → tạo dự án mới trong kho, hard link (khác ổ thì chép) media vào đúng `ref`. Media tìm theo: thư mục dự án → `rel` → `abs` → cùng tên cạnh file `.cosproj` → file người dùng chọn lại.

Phụ trợ trong dự án: `work/project-file.json` (file `.cosproj` đang gắn), `work/recovery.json` (tự lưu 30 giây/lần khi còn chỉnh sửa chưa lưu; xoá khi lưu; mở editor thấy bản khác bản đã lưu thì hỏi Khôi phục / Bỏ).

## API

`POST /api/project-file/save-as|pick|inspect|open`, `GET|PUT|DELETE /api/project-recovery`, `POST /api/export-target` (`pick:true` mở hộp Lưu; không thì kiểm file đã có), `POST /api/render` nhận `target:{dir,name,overwrite}`. `/api/project-file/*` được phép khi chưa mở dự án (màn Home).

## Đã kiểm (07/11/2026)

- `tests/project-file.test.mjs` (8 test): lưu/mở, ánh xạ đường dẫn tương đối/tuyệt đối/khác ổ, mang thư mục sang chỗ khác, báo + chọn lại media thiếu, bản mới hơn trên đĩa, khôi phục, tên file xuất, ghi đè chỉ khi đã đồng ý. Toàn bộ suite 454: 453 qua lần chạy chung, 1 lỗi EPERM rename ở `session-job-claims` (khoá file Windows, không liên quan) — chạy riêng 3/3 lần qua.
- Giao diện thật (server 5180, dự án QA `workspace/content/2026-11-07/qa-cosproj`, file `workspace/qa-save/QA dự án.cosproj`): thêm chữ → bản tự lưu ghi sau 30 giây → đóng trang không lưu → mở lại hiện hộp Khôi phục → Khôi phục + Ctrl+S lưu đúng, `recovery.json` bị xoá. Ctrl+S báo "Đã lưu QA dự án.cosproj". Khởi động lại server → mở file dự án (inspect + open) → editor có đúng 2 chữ, tiêu đề tab là tên file. Hộp Xuất: đổi Nháp đổi tên mặc định; file trùng → hỏi ghi đè, từ chối giữ hộp; Hủy không tạo lượt render.
- Lỗi tìm ra khi kiểm và đã sửa: `/api/project-file/*` bị chặn khi chưa mở dự án; thư mục dự án khác gốc (UNC vs `X:`) bị coi là "trong kho".

## Chưa kiểm / giới hạn

- Hộp Lưu/Mở của Windows hiện trên máy người dùng; chưa bấm thật trong phiên này. Bước sau khi chọn file đã kiểm bằng cùng hàm/API.
- Chưa xuất được video end-to-end trên máy này: `node_modules/hyperframes` thiếu thư mục `bin/` nên app rơi về `npx`, và `npx` báo "'hyperframes' is not recognized". Ngoài ra khởi động bằng đường dẫn UNC (`\\chungauto\…\start.ps1`) làm `cmd.exe` không đặt được thư mục làm việc khi chạy qua `npx`. Logic tên file/ghi đè của bước hoàn tất có unit test với ffmpeg thật.
- Responsive 820/600/390px chưa xem cho hộp Xuất mới (dùng lại bố cục cột `.exp-side` sẵn có).
- Định dạng xuất chỉ MP4 30 fps (HyperFrames `--quality draft|high`); không thêm lựa chọn render không hỗ trợ.
