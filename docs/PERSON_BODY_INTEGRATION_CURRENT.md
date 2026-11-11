# Người và da toàn thân — hiện trạng 05/11/2026

## Kiểm tra lại trên bản app hiện tại

Đối chiếu mã `editor/ui/app.js` và dialog `contentos-person-selection.js`: đã có ba thanh sáng người/sáng da/mịn da, chọn và theo dõi người, nhiều khoảng nguồn, xem vùng, chọn lại và bỏ vùng. Đây là tích hợp MediaPipe + SAM2; không phải mã engine CapCut được sao chép. Bằng chứng REA tài nguyên CapCut đã lưu được đọc lại, không chạy lại inventory để tạo bằng chứng trùng.

Kiểm tra lại ngày 05/11/2026: endpoint Activity5180 phản hồi, render/ASR/personTracking đều idle; bốn file test person-selection, person-source-adjustments, person-tracking-error và person-mask-edits qua 7/7. Kiểm này xác nhận logic vùng chọn/nguồn/mốc/cọ và phục hồi lỗi, không chạy lại inference GPU hay nghiệm thu clip dài. Giới hạn vẫn là tối đa 15 giây/120 mẫu mỗi lượt theo dõi, cần kiểm vùng trước Áp dụng; chưa đảm bảo danh tính khi nhiều người giao cắt hoặc che khuất.

Chọn phương án tích hợp công cụ mở: MediaPipe Selfie Multiclass đã có trong ContentOS; không tuyên bố sao chép được engine CapCut. Bằng chứng REA đã lưu ở CAPCUT_REA_RESOURCE_EVIDENCE.json chỉ là tài nguyên PE CapCut 9.3, không chứng minh thuật toán, trọng số hoặc chất lượng tương đương.

## Luồng sử dụng

Studio → Bộ lọc → Làm đẹp → chọn 15/30 fps → Quét khuôn mặt các nguồn A-roll/B-roll & da toàn thân. Quét không tự bật làm đẹp. Ba thanh riêng: Sáng riêng người (gồm tóc/quần áo), Sáng da mặt, cổ & tay, Mịn da toàn thân. Xem vùng người/da để kiểm và Thu viền trong Nâng cao để giảm lem. Dữ liệu theo nguồn/hash/media clock, dùng chung preview và xuất; không nhận vùng da bằng chọn màu toàn khung.

Giữ nhóm Bộ lọc và component VEK, không thêm menu. Đã sửa binding sau Undo/Redo và ghi snapshot cho thao tác bàn phím trên slider; chế độ xem mask giữ khi preview nạp lại. Chế độ xem mask chỉ là trạng thái UI, không ghi vào project hoặc video xuất.

## Công cụ đã đối chiếu

Kiểm metadata GitHub ngày 05/11/2026:

| Repo | Vai trò | License repo | Quyết định |
|---|---|---|---|
| https://github.com/google-ai-edge/mediapipe | Phân vùng da mặt, da cơ thể, tóc, quần áo, nền | Apache-2.0 | Tiếp tục dùng runtime đang tích hợp |
| https://github.com/PeterL1n/RobustVideoMatting | Tách foreground theo thời gian | GPL-3.0 | Có thể khảo sát viền chuyển động; riêng nó không tách da |
| https://github.com/ZhengPeng7/BiRefNet | Tách foreground độ phân giải cao | MIT | Có thể khảo sát ảnh/viền; riêng nó không tách da |

License repo không tự xác nhận mọi trọng số được phép phân phối. Không tải thêm model/phụ thuộc trong lượt kiểm này.

## Bằng chứng và giới hạn

BEAUTY_UNDO_BROWSER_SMOKE.json: MediaPipe thật trên hai nguồn A/B-roll crop Q2 1 giây, 30fps/31 mẫu mỗi nguồn; lưu sáng da25, Undo thu viền50 về35 rồi sửa40, Save/mở lại40; xem mask không đổi project, không lỗi trang. Ảnh BEAUTY_UNDO_UI_1280.png và _390.png; unit suite248/248 ở workspace/logs/settings-undo-suite.log. Âm thanh đã kiểm tương tự ở AUDIO_UNDO_BROWSER_SMOKE.json. Không dùng các kiểm ngắn này làm benchmark toàn video.

Đã tách toàn thân và đã bổ sung cọ sửa vùng nhận diện (PERSON_MASK_BRUSH_CURRENT.md), thu viền và giảm dao động giữa các mẫu (PERSON_MASK_STABILITY_CURRENT.md). Cọ theo tọa độ nguồn cố định; ổn định mask chưa bù chuyển động. Đã có chọn người bằng SAM2 trong dialog, kiểm ngắn; xem PERSON_SELECTION_DIALOG_CURRENT.md. Không cam kết nền không bao giờ bị ảnh hưởng khi mask nhận sai. Ưu tiên tiếp theo là chọn từng người và theo dõi qua chuyển động; giữ ánh sáng da tự nhiên và cho tắt riêng từng tác động.

## Đối soát theo yêu cầu nhận diện toàn cơ thể · 05/11/2026

Chọn phương án kết hợp công cụ mở, tái sử dụng phần đã tích hợp thay vì thêm hệ làm đẹp trùng. Kiểm lại metadata GitHub của MediaPipe, RobustVideoMatting, BiRefNet và SAM 2: lần lượt Apache-2.0, GPL-3.0, MIT, Apache-2.0 ở cấp repo. Model MediaPipe local 16.371.837 byte khớp SHA256 trong person-model.json; trang ContentOS5180 trả HTTP200. Chạy lại tests/person-mask-edits.test.mjs: 2/2 qua. Đây là kiểm hẹp, không phải nghiệm thu toàn video.

SAM 2 (https://github.com/facebookresearch/sam2) là ứng viên cho chọn một người bằng điểm/khung và truyền mask qua video; không tự phân biệt da với quần áo. Nếu triển khai cần kết hợp mask cá thể với mask da MediaPipe, không thay semantic mask bằng foreground chung. RVM/BiRefNet cũng không đủ cho riêng da. SAM2.1 Tiny đã tải và tích hợp CUDA local với dialog; RVM/BiRefNet chưa tích hợp, chưa benchmark VRAM/tốc độ trên4070S và chưa xác minh toàn bộ điều khoản trọng số.

Thiết kế bước tiếp: giữ Bộ lọc → Làm đẹp; chế độ Toàn bộ người / Người được chọn, điểm chọn trên preview, nút theo dõi và xem mask, báo đoạn mất đối tượng để người dùng sửa. Dữ liệu phải theo nguồn/hash/media clock, dùng cùng mask cho preview và xuất, có Undo/Save và hủy tác vụ. Khi mất đối tượng hoặc đổi cảnh không được tự chuyển hiệu chỉnh sang người khác. Chỉ công bố đã có sau khi kiểm chuyển động, che khuất, nhiều người và bản xuất thực tế.

REA: tái sử dụng bằng chứng CAPCUT_REA_RESOURCE_EVIDENCE.json đã lưu; không mở lại cùng artifact chỉ để lặp inventory. Bằng chứng tài nguyên PE không đủ kết luận đã sao chép tính năng, model hoặc chất lượng CapCut.
