# Hook căn giữa — kiểm Codex thực tế

## Vấn đề

QA fresh-ASR Q2-7 có hook `texts[].x=540`; build textBox dùng x như dịch ngang từ giữa nên chữ bị cắt phải. Catalog session-presets và reference editorial đã làm rõ x0 mới căn giữa. Không sửa schema vì có dự án dùng dịch ngang hợp lệ.

## Kiểm mô hình sau sửa chỉ dẫn

`tests/real-codex-hook-center-smoke.mjs --run-local-codex` tạo bản sao QA2d7c43 với media/transcript, không thay nguồn Q2-7. Giao yêu cầu sửa vị trí ngang về giữa, yêu cầu đọc danh mục nhưng không cho sẵn sốx. Codex đọc `textCoordinates`, chỉ đổi x540→0 đúng hook; mọi trường khác deepEqual, workspace và dự án nguồn byteEqual. Thời gian07:48:37→07:49:24UTC, done/awaiting-review; không render/đăng. QAserver5193 dừng sau terminal. Bằng chứng `REAL_CODEX_HOOK_CENTER_SMOKE.json`.

Đây là sửa đúng một trường từ chỉ dẫn catalog, chưa chứng minh worker first-build luôn đặt chữ đúng, chưa đo token, không thay kiểm bố cục thật.

## Bản xem thử

Harness fullpreview được thêm --source-qa/--evidence để đọc bản sao QA và giữ bằng chứng trước. Nguồn phải nằm trong workspace/content với tên QA, không ../; file evidence riêng không ghi đè. Bản sao `qa-current-preview-0119f5a3` xuất104,24s thành công từ đầu ra Codex ở trên, nạp sửa SFXtail. Kiểm sidecar/hash và nguồn/projectworker không đổi; `Q2_CODEX_HOOK_PREVIEW_SMOKE.json` đo−15,25LUFS/−1,67dBTP/LRA5/warnings[],chưa nghe. Snapshot17cue đều đủ WAV so với slot, `Q2_CODEX_HOOK_SFX_ASSET_SMOKE.json`.

Đã xem20ảnh contact: hook căn giữa, không cắt mép; màn vẫn ở lời chung thay vì tênmàn, đèn/ghế có ảnh tương ứng, biển còn hiện vì không có yêu cầu che. Chưa xem/nghe liên tục, chưa nghiệm thu toàn hình/âm hoặc first-build tự bố cục. Lỗi HF Windows ở QA ngắn trước không tái hiện trong lần xuất full này; chưa xác định nguyên nhân và không coi đã sửa.
