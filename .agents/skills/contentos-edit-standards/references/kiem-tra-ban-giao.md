# Kiểm tra và bàn giao

Worker ContentOS không render/xuất. "Kiểm" ở đây là build + lint + snapshot ảnh tĩnh của candidate, rồi `--done`. Các mốc đo bản xuất (mục 4) dùng khi server/người dùng đã xuất và nhờ AI kiểm.

## 1. Build, kiểm cảnh trám và snapshot

Theo skill nhà (mkt-edit-talking-head-9-16):

```
node editor/lib/build.mjs <dir>
node editor/tools/kiem-canh-tram.mjs <dir> --project <candidate-project.json> --phu-kin
cd <dir> && npx hyperframes lint
npx hyperframes snapshot --at <mốc từng chữ/cảnh + 0.8s> --no-end -o work/snap
```

- `kiem-canh-tram.mjs`: `ok: true, loi: [], canh: []` (chặn 3 nguyên nhân gây khoảng đen và mất tiếng trên HyperFrames: `raw.mp4` lệch độ dài hình–tiếng `>0,22s` làm WebAudio từ chối bộ đệm, clip trám gốc `>25s` chưa cắt riêng vào `inputs/chuan/` với `mediaStart: 0` làm trình phát tự gỡ `src` và gọi `y.stopAll()`, và các cảnh liền kề cùng clip chưa gộp).
- Lint: 0 lỗi; cảnh báo `nested_structure_needs_subcomposition` / `timeline_track_too_dense` là bình thường (mkt-edit-talking-head-9-16).
- Ngoài mốc từng khối, chụp thêm: khung đầu, 1.5 s, ngay sau mỗi điểm cắt nhìn thấy được, và cuối video (ghost-editor approval sheet).
- Xem `work/snap/contact-sheet.jpg` thật, không chỉ đọc log.

## 2. Checklist hình

- [ ] Đúng dấu tiếng Việt, đúng font của mẫu/brand (mkt-edit-talking-head-9-16).
- [ ] Không chữ, thẻ, sticker nào đè mặt/miệng (mkt-edit-talking-head-9-16, ghost-editor).
- [ ] Trong vùng an toàn: không lấn 12% hai bên, 20% dưới (mkt-edit-talking-head-9-16); trên ≥ 120 px (short-form-video).
- [ ] Phụ đề ≥ 48 px, tương phản ≥ 3:1 (ghost-editor).
- [ ] Hook có chữ từ khung đầu; khung đầu không đen (short-form-video).
- [ ] Không khung đen ngoài ý muốn, không lóe mặt giữa hai cảnh (mkt-edit-talking-head-9-16).
- [ ] 0.4 s cuối không đen; video kết bằng khung giữ, không fade đen (ghost-editor: khung đen ở điểm lặp của nền tảng).
- [ ] Zoom không giật; SFX không dày (mkt-edit-talking-head-9-16).
- [ ] Mặt người trên màn ≥ 65%, cảnh trám toàn màn ≤ 25% (talking-head) (ghost-editor).
- [ ] Không chữ chồng thẻ, thẻ chồng phụ đề; vùng phụ đề chỉ cho phụ đề (mrtkeyword).
- [ ] Khối `layer: "behind"` đã có `camera.matte` (mkt-edit-talking-head-9-16).

## 3. Checklist nội dung

- [ ] Mọi đồ hoạ khớp lời ở đúng thời điểm; `minhHoa` đúng từ khoá (mkt-edit-talking-head-9-16). `--done` tự chạy `kiem-do-hoa.mjs`, nhưng công cụ chỉ so chữ, không hiểu hình: tự xem ảnh từng khối.
- [ ] Không còn chữ/hình/logo của video mẫu (mkt-edit-talking-head-9-16).
- [ ] Không số liệu, tên, giá ngoài lời nói/tư liệu (mkt-edit-talking-head-9-16, mrtkeyword).
- [ ] Không câu nào trên màn mà người nói không nói (ghost-editor).
- [ ] Không còn đoạn vấp, câu bỏ dở, lặp ý; không còn lặng > 0.8 s giữa lời (ghost-editor QA).
- [ ] Mốc `at`/`cues` đều là giây gốc; `src`/`mediaStart` giữ nguyên (AGENTS.md).
- [ ] Không đặt `camera.color` / `camera.beauty` khi người dùng không yêu cầu (mkt-edit-talking-head-9-16).

## 4. Mốc đo bản xuất (khi được nhờ kiểm)

| Kiểm | Chuẩn | Nguồn |
|---|---|---|
| Luồng | H.264 + AAC, 1080×1920 (dọc) hoặc 1920×1080 (ngang), có tiếng | mkt-edit-talking-head-9-16 |
| Thời lượng | ≈ tổng các đoạn giữ lại | mkt-edit-talking-head-9-16 |
| Hình và tiếng kết thúc cùng nhau | lệch ≤ 0.25 s | ffmpeg-skill |
| Độ to | −14 LUFS ±2 LU, true peak ≤ −1 dBTP | ffmpeg-skill, mrtkeyword |
| Khung đứng hình | hình không đổi ≥ 0.5 s là "đóng băng" | ffmpeg-skill (`check.py --content`) |
| Khoảng câm | ≥ 0.5 s câm bất thường cần xem | ffmpeg-skill (`check.py --content`) |
| Màu | SDR, BT.709, `yuv420p` | ffmpeg-skill |
| Khung khoá | keyframe cách nhau > ~1 s gây đứng hình khi tua: encode lại với `-g <fps>` | hyperframes `overlays.md` |

- Không dùng số test pass, ảnh ngắn hay số mẫu quét để kết luận đã xong toàn video, quyền riêng tư hay chất lượng âm thanh (AGENTS.md).
- Sửa lỗi tối đa 3 vòng; vòng 3 vẫn lỗi thì dừng và báo kèm danh sách lỗi (ghost-editor).

## 5. Bàn giao

- Việc giao từ editor: không hỏi duyệt thêm; `node editor/tools/ai-inbox.mjs --claim ID --done <dir> --tom-tat "..."` (AGENTS.md).
- Tóm tắt ngắn, gồm:
  - số giây/đoạn đã cắt và lý do chính (ffmpeg-skill: luôn báo số giây đã cắt);
  - phần không làm được: thiếu nhạc, cảnh trám, logo, font, matte;
  - câu kịch bản người nói bỏ qua (ghost-editor);
  - âm thanh được đo, không nghe (hyperframes `sound.md`);
  - cảnh báo còn lại từ lint/kiem-do-hoa.
- Không render, không xuất, không đăng; server thực hiện `completionMode` đã chốt (AGENTS.md).
- Việc bị huỷ hoặc đổi revision: dừng apply, giữ candidate để đối chiếu (AGENTS.md).
- Không làm được thì `--fail <dir> "lý do"`, không để claim treo.
