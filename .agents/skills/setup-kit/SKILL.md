---
name: setup-kit
description: Tự cài đặt đầy đủ Video Edit Kit trên máy người dùng (Windows / macOS) — Node.js portable, thư viện editor, ffmpeg, nhận giọng nói tiếng Việt (whisper + model), Chrome dựng video, file .env — rồi mở editor. Người dùng không phải làm tay. **MUST use** khi lần đầu mở thư mục (chưa có tools/.setup-done.json), hoặc user nói "setup", "cài đặt", "cài phần mềm", "lần đầu dùng", "kiểm tra máy", "không chạy được", "lỗi whisper", "transcribe lỗi", "thiếu ffmpeg", hoặc gõ /setup-kit.
---

# setup-kit — Cài đặt tự động Video Edit Kit

Người dùng chỉ tải phần mềm về và mở thư mục bằng Claude Code / Codex. **Bạn lo hết phần cài đặt.**
Mọi thứ cài vào ngay trong thư mục phần mềm (`tools/`, `editor/node_modules`) — không cần quyền admin, không cần sudo.

## 1. Kiểm tra

```bash
node editor/tools/setup.mjs --check
```
Máy chưa có Node → lệnh lỗi "node not found": bỏ qua, sang bước 2 (bộ cài tự tải Node portable).
`setupDone: true` và whisper `ready: true`, `ffmpeg: true` → đã cài, sang bước 4.

## 2. Hỏi 1 lần

Báo ngắn: sẽ tự cài, tải khoảng 0,8–1 GB một lần (Node.js portable nếu thiếu, ffmpeg nếu thiếu, công cụ nhận giọng
tiếng Việt ~550MB, Chrome riêng để dựng video ~150MB), không đụng phần mềm khác trên máy. Chờ người dùng đồng ý.

## 3. Chạy bộ cài (1 lệnh)

- **Windows:** `powershell -NoProfile -ExecutionPolicy Bypass -File cai-dat.ps1`
- **macOS:** `bash cai-dat.sh`

Chạy nền nếu được (5–15 phút). Bộ cài in 5 bước: thư viện → ffmpeg → nhận giọng → trình dựng video → cấu hình.
Đọc dòng cuối:
- `✓ Cài đặt xong` → bước 4.
- `⚠ … còn N việc` → xử lý từng dòng rồi chạy lại đúng lệnh trên (phần đã tải không tải lại):
  - macOS **Command Line Tools**: hộp thoại Apple đã hiện → nhờ người dùng bấm **Install**, xong chạy lại.
    (Máy có Homebrew thì bộ cài tự `brew install whisper-cpp`, không cần bước này.)
  - Lỗi mạng / tải dở: chạy lại.
  - `npm` lỗi: chạy lại; vẫn lỗi thì xoá `editor/node_modules` rồi chạy lại.

## 4. Mở editor

Chạy: Windows `tools\node\node.exe editor\tools\mo-phan-mem.mjs` · macOS `tools/node/bin/node editor/tools/mo-phan-mem.mjs` (Codex: chạy với quyền ngoài hộp cát) — báo ✓ rồi mới mở http://127.0.0.1:5173/ trong trình duyệt của chính AI (Claude: khung trình duyệt trong app / Claude in Chrome · Codex: trình duyệt của Codex); không có công cụ trình duyệt mới dùng `--open`.
(máy có sẵn Node thì dùng `node`). **Tin nhắn báo xong trong khung chat bắt buộc ghi nguyên đường dẫn https://autosocial.topexpert.vn/app dạng bấm được**, kể cả khi không mở được trình duyệt — lần sau bấm đúp `Mo-Editor.bat` / `Mo-Editor.command`.
Claude Code: chạy thêm (nền) `node editor/tools/ai-inbox.mjs --wait --agent claude` để nhận việc người dùng giao từ editor (chọn video + mẫu) — xem AGENTS.md.

## 5. Tóm tắt cho người dùng

Bảng ngắn: thành phần · trạng thái. Nhắc: kéo video vào màn hình **Dự án** là phần mềm tự nghe lời nói và dựng sẵn;
muốn AI dựng theo mẫu thì gửi video và nói "dựng video này".
