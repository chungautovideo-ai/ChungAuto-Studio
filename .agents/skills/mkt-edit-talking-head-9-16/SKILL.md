---
name: mkt-edit-talking-head-9-16
description: Dựng video talking head quay thô thành video dọc 9:16 (1080×1920) phong cách cao cấp — cắt vấp/lặp/im lặng, chữ nhấn vàng Anton căn giữa, zoom nhấn ý, motion graphic nền đen có diễn giải, cảnh trám/showcase chia màn hình, SFX + nhạc nền — rồi mở EDITOR chỉnh tay (kéo thả chữ, bật/tắt đoạn cắt, đổi thời điểm trên timeline) và xuất MP4. Chỉ dùng HyperFrames, KHÔNG ElevenLabs/HeyGen. **MUST use** khi user gửi video tự quay và nói "edit video", "dựng video này", "cắt video", "làm video talking head", "video dọc từ video quay", "thêm chữ + motion vào video", "mở editor", "chỉnh tay video".
---

# mkt-edit-talking-head-9-16

Video quay thô → **project.json** (AI dựng) → **index.html** (HyperFrames, sinh tự động) → **editor chỉnh tay** → MP4.

```
editor/
├─ server.mjs            editor chạy ở http://127.0.0.1:5173
├─ lib/build.mjs         project.json → index.html  (KHÔNG sửa tay index.html)
├─ lib/runtime.js        hiệu ứng chữ, zoom, chia màn hình, 5 kiểu motion graphic
├─ lib/kit.css           font + bảng màu + vùng an toàn
├─ tools/init-project.mjs  tạo project từ video
├─ tools/segments.mjs      chia đoạn lời nói từ transcript
└─ assets/sfx/*.wav      pop, tap, click, whoosh, paper, keys, chime (tự tổng hợp, dùng thương mại được)
```

**Nguyên tắc vàng:** mọi quyết định dựng nằm trong `project.json`. AI và người dùng cùng sửa một file → người dùng chỉnh tay được mọi thứ AI làm. Không bao giờ viết HTML cảnh riêng ngoài các kiểu có sẵn — nếu thiếu kiểu, thêm vào `build.mjs` + `runtime.js` để editor cũng chỉnh được.

Yêu cầu riêng user gửi kèm video **luôn ưu tiên hơn** mặc định trong skill này.

---

## Bước 1 — Tạo project

Nếu user đã tạo dự án bằng màn hình **Dự án** của editor (kéo video vào), project đã có sẵn ở `workspace/content/<ngày>/<tên>/` — bỏ qua lệnh init bên dưới.


```bash
node editor/tools/init-project.mjs --video "<đường dẫn video>" --slug <ten-video>
```
In ra `dir`, kích thước, thời lượng. Video gốc được copy vào `inputs/raw.*` — **giữ nguyên bản gốc**.
Cảnh trám / showcase / nhạc user gửi: copy vào `<dir>/inputs/`.

## Bước 2 — Transcript từng từ

```bash
node editor/tools/transcribe.mjs <dir>
```
Dùng chung công cụ nhận giọng của phần mềm (whisper.cpp + model large-v3-turbo, chạy trên máy, Windows / macOS / Linux).
Ghi `<dir>/work/transcript.json` (`{ words: [{ word, start, end }] }`). Video 1 phút ≈ 1 phút.
- Báo `Chưa có công cụ nhận giọng` → **hỏi user trước** rồi: Windows `node editor/tools/transcribe.mjs --install` (~550MB);
  macOS `brew install whisper-cpp` rồi `node editor/tools/transcribe.mjs --install` (tải model). Hoặc user bấm **Tải công cụ nhận giọng** trong tab Cắt của editor.
- Tạo dự án bằng màn hình **Dự án** của editor thì phần mềm **tự nhận giọng** (đã có transcript, bỏ qua bước này).
- Không có transcript thì **dừng và báo user**, không đoán lời.

## Bước 3 — Cắt và làm gọn lời nói (`segments`)

```bash
node editor/tools/segments.mjs <dir>
```
Tool chỉ tách theo khoảng lặng (>0.45s) và đệm 0.12s đầu / 0.2s cuối. Sau đó AI đọc bảng đoạn và sửa `project.json`:

- Đoạn vấp, câu bỏ dở, nói lặp → `"keep": false`. Khi nói lại một ý, **giữ lần cuối trọn câu**.
- Lặp *trong* một đoạn → tách đoạn tại mốc từ (dùng transcript) rồi tắt phần lặp.
- Không cắt sát: giữ hơi thở cần thiết, không mất phụ âm đầu/đuôi câu (đệm ≥ 0.08s).
- Không đổi tốc độ, không thay giọng.

`segments[].in/out` là **giây của video gốc**. Mọi mốc `at` khác (chữ, zoom, cảnh) cũng là **giây gốc** → bật/tắt đoạn cắt thì overlay tự dịch theo lời nói.

**DỪNG — trình bày cho user duyệt**: danh sách đoạn bị cắt (lý do) + các nhịp chữ/cảnh dự kiến. Chỉ tiếp tục khi user OK.
**Ngoại lệ — việc giao từ editor** (`work/ai-job.json`, nhận qua `node editor/tools/ai-inbox.mjs`): không dừng hỏi, làm hết Bước 4–5 (không dựng nháp/xuất), rồi `node editor/tools/ai-inbox.mjs --done <dir>` thay cho Bước 6 — editor tự mở dự án, người dùng duyệt và bật/tắt đoạn cắt ở đó.

## Bước 4 — Dựng project.json

### Chữ nhấn — `texts[]`
```json
{ "id":"t1", "at": 3.2, "dur": 2.4, "label":"BƯỚC 1", "title":"AI *edit* video", "sub":"muốn sửa phải prompt?", "fx":"words" }
```
- `title`: 2–6 từ quan trọng, tối đa 2 dòng (`|` xuống dòng). `*từ*` = marker nhấn.
- `fx` xen kẽ theo nội dung lời nói, **không dùng một hiệu ứng xuyên suốt**:
  `words` (hiện từng từ) · `slide` (trượt ngắn) · `mask` (reveal) · `marker` (nhấn từ khoá) · `type` (gõ chữ — câu lệnh, tên, từ khoá kỹ thuật).
- Vị trí mặc định: căn giữa x=540, tâm cụm chữ y=1180 (gần ngực). Chỉ đổi `y` khi chữ đè mặt/miệng; giữ trong 760–1500.
  Không đổi `x` (luôn căn giữa) trừ khi user yêu cầu.
- `at` = giây gốc của từ được nhấn trong transcript; `dur` đủ để đọc (≥ 1.8s).
- Mật độ: ~1 nhịp chữ mỗi 4–8 giây, không phủ chữ liên tục.

### Zoom — `zooms[]`
`{ "id":"z1", "at": 12.0, "dur": 3.0, "amount": 1.08 }` — 1.06–1.10, chỉ ở câu quan trọng, không liên tiếp.
`mode: "cut"` nhảy khung gần · `mode: "board"` người thu xuống khung dưới (video dọc) · `mode: "frame"` người thu vào khung giữa màn hình
`{ "mode":"frame", "amount":0.6, "x":410, "y":205, "w":1100, "h":612, "face":0.36, "ease":0.6 }` (px khung xuất; ease = giây thu / phóng mượt, 0 = cắt) — dùng khi mẫu có khối "lỗ" (khung tem, thẻ giới thiệu): đặt đúng toạ độ lỗ của khối.
Nhảy khung **kèm dời người** (jump cut đổi vị trí): `{ "mode":"cut", "at":69, "dur":5, "faceTo":0.68, "faceToY":0.63, "scale":1, "amount":1 }` — tâm mặt tới (tỉ lệ ngang / dọc khung), `scale` so với khung thường. Cảnh trám / khối cũng dời người được trong lúc hiện: `brolls[].cam` / `blocks[].cam` = `{ faceTo, faceToY, scale }` (cảnh trám toàn màn hình có `cam` thì người tách nền vẫn hiện trên cảnh trám — kiểu “người góc dưới”).
**Nền thay sau người** (mẫu đặt `brand.backdrop`, cần `camera.matte`): tấm nền đồ hoạ thay phông thật suốt video, `brand.backdrop.place` = `{ x, y, scale }` tâm mặt + cỡ người; tắt: `brand.backdrop.off: true`. Cảnh trám dải ngang trên: `mode: "pip", frame: "strip"`.

### Motion graphic nền đen — `scenes[]`
Chỉ khi giúp giải thích rõ hơn. Mỗi cảnh **một ý**, giọng thật chạy liên tục. Chọn `type` theo nội dung:

| type | dùng khi | data |
|---|---|---|
| `process` | quy trình, các bước | `title, kicker?, steps[]` |
| `stat` | số liệu | `title, value, prefix?, suffix?, max?, decimals?, label` |
| `compare` | trước – sau | `title, beforeLabel, before[], afterLabel, after[]` |
| `timeline` | mốc thời gian | `title, items[{time,label}]` |
| `doc` | tài liệu → kết quả | `title, docTitle, lines[], highlight[] (index), result` |

- `cues` (tuỳ chọn): mảng **giây gốc** lúc từng phần tử xuất hiện (bước i, mốc i…) → khớp đúng nhịp lời nói. Nên đặt cues từ transcript.
- `dur` 3.5–7s. Hết ý thì trở lại người nói. Hai cảnh nối liền nhau thì đặt `at` cảnh sau = cuối cảnh trước (build tự bỏ fade để không lóe mặt).
- **Không tự tạo số liệu, bằng chứng, giao diện, kết quả** không có trong lời nói/tư liệu.

### Cảnh trám / showcase — `brolls[]`
`{ "id":"b1", "src":"inputs/demo.mp4", "at": 20.5, "dur": 5, "mode":"split", "mediaStart": 1.2 }`
- `split`: minh hoạ ở trên (1080×960), người nói ở dưới — chỉ khi lời nói đang nhắc tới minh hoạ. `full`: toàn màn hình.
- Âm thanh clip minh hoạ luôn tắt. Website: chọn `mediaStart` lúc trang vừa tải / bắt đầu cuộn.
- Kèm 1 `texts[]` tiêu đề đặt gần ranh giới (y≈960) khi chia màn hình.
- Thiếu cảnh trám user nhắc tới → **báo rõ**; có thể dùng `scenes[]` để giải thích nhưng không giả làm demo.

### Âm thanh — `audio`
`{ "voice":1, "music":"inputs/nhac.mp3", "musicVolume":0.1, "sfxVolume":0.5, "autoSfx":true, "sfx":[{"at":14.2,"kind":"click"}] }`
- `sfxLevel` (âm tự động, thay `autoSfx`): `"nhieu"` mặc định — pop chữ / khối + pop nhẹ từng chữ phụ trong khối, whoosh vào + ra cảnh trám, swish / whoosh cho zoom, whoosh nhẹ ở chuyển cảnh, sparkle / tick cho từ khoá phụ đề có hiệu ứng · `"vua"` — chữ, khối, cảnh trám, chuyển cảnh · `"tat"`. Gõ phím cho `type`, lật giấy cho `doc`, chime cho kết quả. Mục có `sfx` riêng luôn phát. Build tự bỏ SFX trong 0.6s đầu và SFX sát nhau < 0.25s.
- `sfx[]` thêm tay cho thao tác thật (click khi demo bấm nút…). Kinds (133, bản thu CC0 — đủ danh sách: `SFX_KINDS` trong `editor/lib/build.mjs`): bật `pop glass-pop tap drop bong blip select` · bấm `click toggle switch open close keys scroll` · tích `tick mau-tick mau-tick-2` · lướt `whoosh whoosh-2 soft-whoosh swish swish-2 silk-swish card-slide knife downlift` · giấy `paper page-flip book-close` · chuông `ping crystal-ting mau-ding chime lux-chime confirm question error bell level-up` · lấp lánh `sparkle shimmer airy-sparkle coin` · dâng `riser reveal-swell mau-swell power-up` · nhấn `mau-knock wood metal glass-hit thud mau-hit deep-hit boom impact-boom explosion` · số `glitch zap laser` · khác `dice` · camera `zoom-in zoom-out shutter-2` · đếm `beep countdown clock-spin` · người `applause heartbeat` · dữ liệu `scan compute glitch-2 static power-down data-blip` · phim `vinyl rewind` · nước `water-drop splash bubble-2` · va `glass-clink metal-hit stomp rock-hit` · máy `lock unlock latch machine door-scifi chain` · văn phòng `crumple scissors snip paper-slide staple` · viết `typewriter typewriter-2 pencil chalk erase` · viễn tưởng `hum force-field laser-2` · giao diện `rollover maximize minimize back`. Từng chữ có thể đặt `"sfx":"none"`.
- `clips[]`: file âm thanh user thêm (ghi âm, tiếng động, câu nói chèn) `{"src":"inputs/ghi-am.m4a","at":12.5,"vol":1,"from":0,"dur":3}` — `at` là giây gốc.
- Nhạc: chỉ dùng file user cung cấp (bản quyền) hoặc nhạc tự tổng hợp của kit (`kit:ambient-pad`, `kit:beat-bass`). Không có → để trống và báo.
- Tư liệu user thêm qua editor (việc giao có mục TƯ LIỆU): dùng hết; có mô tả thì đặt đúng đoạn đó, không mô tả thì tự xem file và chọn câu nói liên quan nhất.

### Phụ đề karaoke — `captions`
`{ "enabled": true, "y": 1450, "x": 0, "scale": 1, "maxWords": 4, "hideOnScenes": false, "lines": [{ "id": "c1", "words": [{ "w": "Bạn", "s": 0.31, "e": 0.52 }] }] }`
- Tạo `lines` từ `work/transcript.json` (editor có nút "Tạo phụ đề từ lời nói" — dùng `groupCaptionLines()` trong `editor/lib/brand.js`). Mốc `s/e` là giây gốc; từ nằm trong đoạn đã cắt tự bị bỏ.
- Kiểu hiển thị nằm ở `brand.caption`: `style` pill | clean | bold | box, `size`, `color`, `active`, `uppercase`.

### Thương hiệu — `brand`
`{ "fontTitle": "Anton", "fontSub": "Montserrat", "fontLabel": "Montserrat", "c1": "#FFF1A1", "c2": "#F6E96B", "c3": "#EED33F", "sub": "#FAF8F0", "caption": {...} }`
Chỉ dùng font trong `FONTS` (`editor/lib/brand.js`, đều có dấu tiếng Việt). Preset lưu chung ở `editor/brands/*.json`.

### Chuyển cảnh
- Điểm cắt lời nói: `transitions.cut` (mặc định cho cả video) hoặc `segments[].tIn` — none | fade | flash | zoom | blur | slide.
- Cảnh minh hoạ / cảnh trám: `tIn` — fade | slide | zoom | wipe | none.

### Khung hình — `camera`
`{ "scale":1, "x":0, "y":0, "faceY":0.36, "color": { "brightness":1, "contrast":1, "saturate":1, "temp":0, "vignette":0 } }` — video ngang 16:9 thì tự cover; chỉnh `x` để mặt ở giữa. `faceY` = vị trí mắt theo chiều dọc (tâm zoom). `color.temp` -1 (lạnh) → 1 (ấm); preset trong `COLOR_PRESETS`.
`camera.beauty` (Làm đẹp kiểu CapCut, thang 0–100): `smooth` mịn da · `white` trắng da · `firm` căng da · `lip` son môi + `lipColor` · `eye` to mắt · `eyeBright` sáng mắt · `slim` gọt mặt · `chin` cằm V · `nose` mũi nhỏ. Cần điểm mặt `work/face.json` — chỉ quét được trong editor (Bộ lọc → Làm đẹp → "Bật làm đẹp", chạy trên máy ~1 phút / phút video); chưa quét thì bản dựng bỏ qua. **Việc AI edit tự động (giao từ editor): KHÔNG đặt `camera.color` (bộ lọc màu, kể cả màu của mẫu) và `camera.beauty`** — người dùng tự chọn sau trong tab Bộ lọc / Làm đẹp; `ai-inbox --done` tự gỡ nếu có. Chỉ đặt khi người dùng nhắn yêu cầu trong chat. Không tự bật khi người dùng không yêu cầu; mức tự nhiên: smooth 45, white 20, firm 30, eye 15, eyeBright 25, slim 20, chin 15, nose 10.

Tốc độ: `speed` gốc dự án (cả video) · `segments[].speed` (từng đoạn, ưu tiên hơn) · `brolls[].speed` (cảnh trám video) — 0,25–4, giọng giữ nguyên độ cao. Mọi mốc `at` vẫn là giây video gốc (tự quy đổi). Chỉ đặt khi người dùng yêu cầu (vd "tăng tốc 1.2x"). Tiếng gốc cảnh trám video: `brolls[].audioVol` 0–1,5 (mặc định 0 = tắt).
Cảnh trám miễn phí (gói Pro trở lên · Pexels, miễn phí bản quyền): `node editor/tools/canh-tram-free.mjs --tim "<từ khoá tiếng Anh>" [--ngang]` rồi `--tai <dự án> <id>` → `inputs/stock/pexels-<id>.mp4` (nguồn ghi ở `work/canh-tram-free.json`). Dùng khi việc giao có mục CẢNH TRÁM MIỄN PHÍ hoặc người dùng nhờ tìm cảnh trám.
Làm rõ giọng: `audio.clean` = "nhe" | "vua" | "manh" (lọc ồn quạt / xe, nén cho giọng đều; editor tạo `work/voice-<mức>.wav` khi người dùng bấm trong tab Âm thanh — AI tự đặt thì tạo trước bằng `editor/lib/voice-clean.mjs` makeVoice).

### Đồ hoạ phải hợp nội dung (bắt buộc, thắng ví dụ trong SKILL.md của mẫu)
Thẻ của mẫu chỉ cho **phong cách**: khung, màu, cỡ, vị trí, chuyển động, tiếng. Phần **nội dung trong thẻ** lấy từ video mẫu nên phải làm mới theo lời nói. Video nói về nấu ăn mà còn logo phần mềm dựng phim là lỗi.
Trước khi chèn thẻ, trả lời: người nói đang nói gì đúng lúc này, hình này có minh hoạ đúng điều đó không. Chọn theo thứ tự:
1. **Lời nhắc tên thương hiệu, sản phẩm, công cụ thật:** dùng logo khi người dùng có file trong `inputs/`. Không có thì giữ khung của thẻ, ghi tên bằng chữ. Không vẽ phỏng theo logo thật, không dùng logo nơi khác.
2. **Ý chung, hình dung được** (tiền, thời gian, khách hàng, bếp, sức khoẻ…): tự vẽ icon SVG đơn giản trong đúng khung, đúng màu, đúng nét của thẻ, thay `<svg>` hoặc `<img>` cũ.
3. **Cần ảnh thật:** dùng ảnh, video người dùng có; cảnh trám miễn phí hoặc cảnh trám AI chỉ khi việc giao có bật.
4. **Không có gì hợp:** bỏ thẻ, không chèn cho đủ số lượng. Mật độ hiệu ứng của mẫu không được lấy làm lý do giữ đồ hoạ lạc đề.
Đổi số lượng phần tử theo nội dung (thẻ 3 icon mà lời chỉ nhắc 2 thứ thì còn 2). Chữ trong thẻ viết lại từ lời nói, số liệu chỉ lấy số người nói nhắc tới, không tự nghĩ ra.
Mỗi khối ghi `minhHoa` là từ khoá đúng như trong lời nói quanh lúc khối hiện (vd `"minhHoa": "công thức"`). Khối không mang nghĩa (viền, sóng âm, mũi tên, vệt sáng) ghi `"minhHoa": "trang trí"`. Việc giao từ editor: `--done` tự chạy `node editor/tools/kiem-do-hoa.mjs <dir>` và chặn nếu còn chữ / hình của mẫu hoặc từ khoá không có trong lời. Cuối cùng xem ảnh từng khối để chắc hình đúng nghĩa: công cụ chỉ so được chữ, không hiểu nghĩa của hình.

### Mẫu video (thư viện) — `template`
Nếu `project.json` có `"template": {"id": ...}`, **đọc `editor/templates/<id>/SKILL.md` và làm đúng quy tắc của mẫu** (nhịp chữ, hiệu ứng, kiểu cảnh, cách cắt) — quy tắc mẫu ưu tiên hơn mặc định ở trên, nhưng yêu cầu riêng của user vẫn cao nhất.
Áp dụng mẫu bằng code: `applyTemplate(project, template)` trong `editor/lib/template.js` (chỉ đổi phong cách, giữ nội dung).
- Việc giao có `fx: "nhieu"` (người dùng chọn **Mức độ hiệu ứng: Nhiều**): giữ đúng phong cách mẫu nhưng chữ nhấn / hiệu ứng / zoom dày hơn mẫu ~1,5–2 lần (gần như mỗi ý một chữ nhấn). `fx: "vua"` (mặc định) = đúng tần suất của mẫu.
- Khung ngang: `project.format: "16:9"` (người dùng chọn khi tải video / bước thiết lập) → khung 1920×1080: toạ độ y trong khung cao 1080, chữ nhấn không che mặt (đặt 2 bên / phía dưới), khối đồ hoạ của mẫu (viết cho 1080×1920) chỉnh lại vị trí, chia màn hình = minh hoạ trái / người nói phải. Không có `format` = 9:16 dọc như mặc định.

- Mỗi mẫu có `industries[]` = ngành nghề phù hợp (website và thư viện trong editor lọc theo ngành). Danh sách ngành hiển thị trên website ở `industries` trong `editor/tools/build-site.mjs` hoặc `site.config.json`.
- `editor/library/<id>/`: mẫu có sẵn để xem trước (`template.json`, `SKILL.md`, `preview.mp4`, `poster.jpg`).
- `editor/templates/<id>/`: mẫu đã **tải về** (cài) — editor và AI chỉ dùng mẫu ở đây.
- Tạo video xem trước cho mẫu: `node editor/tools/build-preview.mjs <id> <projectDir> --seconds 12` (dùng footage của chính bạn).
- Thư viện online (tuỳ chọn): đặt `LIBRARY_URL` trong `.env` → editor đọc `<url>/catalog.json` và tải `<url>/<id>/<file>`.

### Tách nền khi có hiệu ứng nằm SAU người (bắt buộc kiểm)
Dự án có khối `layer: "behind"` (chữ / hiệu ứng nằm sau người — kể cả chèn từ thẻ mẫu, Kho hiệu ứng) hoặc `notes.needMatte: true`
mà `camera.matte` còn trống → **tách nền trước khi bàn giao**:
`npx hyperframes remove-background inputs/raw.mp4 -o inputs/matte.webm` (video dài: làm bản 540×960 rồi `--quality fast`), đặt
`camera.matte = "inputs/matte.webm"`, xoá `notes.needMatte`, build lại. Không tách nền thì khối "sau người" sẽ đè lên mặt.
Thẻ có nhãn cam **"Sau người · cần tách nền"** trong editor / Kho hiệu ứng là loại này.

## Bước 5 — Build, kiểm tra, dựng nháp

```bash
node editor/lib/build.mjs <dir>
cd <dir> && npx hyperframes lint
npx hyperframes snapshot --at <mốc từng chữ/cảnh + 0.8s> --no-end -o work/snap
```
Đọc `work/snap/contact-sheet.jpg` và rà **checklist**:
- Đúng dấu tiếng Việt, đúng font (Anton / Montserrat), gradient vàng, không viền dày.
- Cụm chữ căn giữa, không đè mặt/miệng, không lấn 12% hai bên và 20% dưới.
- Motion graphic có diễn giải thật, khớp lời; không có khung đen ngoài ý muốn hay lóe mặt giữa 2 cảnh.
- Zoom không giật. SFX không dày đặc.

Lint chỉ có cảnh báo `nested_structure_needs_subcomposition` / `timeline_track_too_dense` là bình thường (cấu trúc có chủ đích để editor quản lý).

## Bước 6 — Mở editor cho user chỉnh tay

Việc giao từ editor: chỉ cần `node editor/tools/ai-inbox.mjs --done <dir>`. Sau đó chạy lại `node editor/tools/ai-inbox.mjs --wait --agent claude` (nền) để nhận việc tiếp.

```bash
node editor/server.mjs <dir> --port 5173 --open
```
(chạy nền). Báo user link `https://autosocial.topexpert.vn/app` và cách dùng:

| Mục | Làm được |
|---|---|
| **Chữ** | chọn → kéo khung xanh trên video để di chuyển (tự hít trục giữa), kéo ô góc để phóng to; sửa nhãn/tiêu đề/chữ phụ, hiệu ứng, thời điểm |
| **Cắt** | **bôi đen chữ trong transcript rồi Delete để cắt** (Descript-style), "Tự cắt khoảng lặng", chuyển cảnh ở điểm cắt; bật/tắt từng đoạn, nới in/out, tách tại playhead; **kéo mép clip trên track Video** để nới/thu |
| **Phụ đề** | bật phụ đề karaoke, chọn kiểu/màu/cỡ, sửa chữ từng dòng, gộp/tách dòng, kéo vị trí trên video |
| **Thương hiệu** | font + màu cho toàn video, lưu/áp dụng preset cho từng khách |
| **Thư viện** (header) | xem video mẫu (rê chuột để chạy, bấm để xem lớn), **Tải về** để cài mẫu + skill vào phần mềm, **Áp dụng vào video này**; "Lưu kiểu video này thành mẫu" để tự tạo mẫu |
| **Header** | **Lịch sử** (mở lại bản đã lưu), **Nhờ AI sửa** (Claude sửa project.json theo câu lệnh — cần Claude Code CLI hoặc `ANTHROPIC_API_KEY` trong `.env`, thư viện cài bằng `cd editor && npm install`) |
| **Kéo thả file** | thả video/ảnh vào cửa sổ → thành cảnh trám khung nổi tại playhead; thả nhạc → nhạc nền |
| **Zoom / Minh hoạ / Cảnh trám** | thêm, sửa nội dung, đổi kiểu cảnh. **Bấm thẳng lên video** để chọn tiêu đề / nội dung cảnh minh hoạ hoặc cảnh trám, kéo để di chuyển, kéo 4 góc để phóng to/thu nhỏ (lưu vào `scenes[].layout.{head,body}` và `brolls[].x/y/scale`). Cảnh trám có thêm `mode: "pip"` (khung nổi) |
| **Âm thanh / Khung hình** | âm lượng giọng/nhạc/SFX, SFX thêm tay; vị trí & tỷ lệ khung người nói |
| **Timeline** | kéo khối để đổi thời điểm, kéo mép phải để đổi thời lượng, bấm thước để tua |

Phím tắt: Space phát/dừng · Ctrl+Z / Ctrl+Y · Ctrl+S lưu · ←/→ từng frame · Delete xoá mục đang chọn.
Nút **Dựng nháp** → `renders/<slug>-nhap.mp4` (nhanh) · **Xuất Final** → `renders/<slug>-final.mp4`.

Nếu user nhờ AI sửa tiếp ("đổi chữ cảnh 3", "cắt đoạn ..."): sửa `project.json` (editor phải đang **đã lưu** — hỏi user bấm Lưu trước), rồi `node editor/lib/build.mjs <dir>`; user F5 editor.

## Bước 7 — Xuất và bàn giao

- Final: bấm **Xuất Final** trong editor, hoặc `cd <dir> && npx hyperframes@0.9.6 render --quality high --fps 30 -o renders/<slug>-final.mp4`.
- Kiểm tra: `ffprobe` → h264 + aac, 1080×1920, đúng thời lượng (≈ tổng các đoạn giữ lại), có tiếng.
- Gửi file bằng SendUserFile. **Không báo hoàn thành khi chưa có file MP4 kiểm tra được.**
- Phần không làm được (thiếu font, thiếu cảnh trám, thiếu nhạc) → nói rõ.

---

## Cài công cụ nhận giọng (1 lần)

- Windows: `node editor/tools/transcribe.mjs --install` — tải `whisper-bin-x64.zip` (bản chính thức ggml-org/whisper.cpp) + model `ggml-large-v3-turbo-q5_0.bin` vào `tools/whisper/`. Hỏi user trước khi tải.
- macOS: `brew install whisper-cpp` (Homebrew: https://brew.sh), rồi `node editor/tools/transcribe.mjs --install` để tải model.
- Kiểm tra: `node editor/tools/transcribe.mjs --status`.
