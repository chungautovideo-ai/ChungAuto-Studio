# Đo âm lượng bản xuất · 05/11/2026

Lệnh `node editor/tools/kiem-tra-am-luong.mjs <dự án> <file tương đối trong dự án>` đo audio stream đầu, dùng FFmpeg loudnorm input_i/input_tp/input_lra/input_thresh. resolveContained ngăn đọc file ngoài project; media giữ nguyên, output chỉ JSON, không normalize hoặc render. Service kiểm size/mtime trước/sau để tránh báo trên file thay đổi. Không tự coi số đo output mô phỏng của filter là số đo file.

Mức -14LUFS/-1.5dBTP là tham khảo; warning khi integrated ngoài[-16,-12] hoặc truepeak>-1.5. Silence trả null/silent, không đổi -inf thành0. Thiếu audio/parse sai là lỗi. Chưa đọc nhiều audio stream/chọn target theo kênh, chưa khẳng định truepeak/loudness chứng minh mix hay hoặc rõ lời. Không UI mới trong lượt này; dùng cho AI/CLI sau khi đã được giao xuất.

Kiểm tests/audio-loudness.test.mjs: parser input vs output, thiếu/sai dữ liệu, silence; FFmpeg thật trên tone/silence, giữ byte, video thiếu audio bị từ chối. Suite280/280 qua, workspace/logs/audio-loudness-suite.log.

Q2_FULL_AUDIO_LOUDNESS.json đo lại file final Q2 103.7s: -14.75LUFS, -1.27dBTP, LRA5LU, warning truepeak; chỉ đọc file cũ, chưa nghe hoặc sửa/mix/render lại. Log FFmpeg phân tích ban đầu workspace/logs/q2-full-loudness.log. Không công bố chất lượng fullmix đã đạt.

Creativev42 thêm quy trình đọc báo cáo trong references/finishing.md, giữ11preset/4refs và job cũ. quick_validate/package qua, endpoint5180v42/11preset, ZIP workspace/exports/chungauto-creative-v42.zip; runtime/model/asset ngoài chưa bundle. Không restart cần thiết cho CLI/template.
