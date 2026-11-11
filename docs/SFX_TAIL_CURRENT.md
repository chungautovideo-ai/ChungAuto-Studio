# Đệm cuối SFX giữ thời điểm phát

## Vấn đề và quyết định

QA Q2 trước đó có cảnh báo HyperFrames: file pop-d.wav khoảng0,37s trong khi slot dài1,05s. Build cố ý giữ slot tối thiểu0,8s cộng đệm đầu0,25s để preview không bỏ lỡ tiếng quá ngắn. Giảm slot sẽ làm mất mục đích này. Giữ slot/cue/volume, bổ sung im lặng cuối file dẫn xuất; không sửa bản thu nguồn hoặc dữ liệu dự án.

`editor/lib/sfx-wav.mjs` đọc fmt/data theo chunk RIFF, kiểm truncation/PCM hoặc float, giữ nguyên sample, đệm đầu và cuối theo sample rate/block alignment. PCM8 dùng128 cho im lặng. Một mili giây dư bao phủ làm tròn metadata thời lượng. Build dùng độ dài data thật thay giả định header44byte. So sánh nội dung asset dẫn xuất để thay bản cũ thiếu tail dù timestamp mới hơn nguồn; build tiếp không ghi lại khi byte giống nhau.

## Kiểm chứng

- `tests/sfx-wav.test.mjs`: giữ byte bản thu/cue, PCM8/16, chunk JUNK lẻ, đầu/giữa/cuối timeline, ffprobe thời lượng file thật, asset cũ mtime2030 được thay, build lại ổn định; mọi WAV đi kèm đọc/đệm được.
- `node --test tests/*.test.mjs`:397/397, log `workspace/logs/sfx-tail-suite.log`.
- `node tests/sfx-tail-render-smoke.mjs --render-local`: bản sao QA tổng hợp3s `qa-sfx-tail-497b0fa2`, xuất draft thành công, hash sidecar được xác minh, không cảnh báo slot ngắn. AudioAAC có tín hiệu ở0/1,5/2,85s và im lặng hai khoảng nghỉ; nguồn/project không đổi. Bằng chứng `SFX_TAIL_RENDER_SMOKE.json`.
- Backend5180 đã nạp bản sửa ở lượt tiếp: trước restart dispatcher0/0, không entry active/queued, render/ASR/personTracking idle và không mediaworker. Xác minh đúng PID36212/command/listener rồi mở lại bằng installer/start.ps1, PID mới40256/pingOK/dispatcher0/0. `SFX_TAIL_DEPLOY_SMOKE.json`. Không đổi UI hoặc job đang chạy; QA xuất thật trước đó qua CLI mới, chưa thêm lượt xuất HTTP sau restart.

Chưa nghe mix liên tục, không coi QA tổng hợp là nghiệm thu nhạc/lời/SFX video thật. Lỗi Windows3221226505 ở QA hook trước là vấn đề riêng; một render mới thành công không chứng minh đã sửa lỗi đó.
