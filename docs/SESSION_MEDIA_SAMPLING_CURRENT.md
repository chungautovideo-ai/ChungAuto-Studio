# Khảo sát nguồn cho CLI/session — 05/11/2026

## Lượt sửa Codex thật và kiểm bằng chứng ảnh

REAL_CODEX_MEDIA_SAMPLER_REVISE_SMOKE.json: dự án QA contentos-qa-broll-overlap-2, Codex hoàn tất sau 66,415 giây, awaiting-review, không xuất/đăng. Công cụ khảo sát nguồn được gọi với inputs/man.mp4 tại 10/11/12 giây. Kiểm nhật ký JSONL của đúng session: một call exec gọi view_image, ba input_image trả về có SHA256 khớp cả ba JPEG local. Đây xác nhận ảnh đã được đưa vào ngữ cảnh model, không chứng minh model hiểu đúng hoặc đã xem video liên tục. Log CLI báo tổng 89.233 token, chưa có cached/billed breakdown hoặc so sánh kiểm soát.

Cảnh b-man sửa về projectAt16,06/output15,52–16,27 giây trùng từ “màn”; b-mau giữ at và rút dur còn1,02 giây, output20,16–21,18 trùng “đổi màu”. Những trường còn lại và b-den/b-ghe giữ nguyên. Không lấy khớp từ làm nghiệm thu biên tập: insert màn0,75 giây có thể quá ngắn để đọc thao tác; chưa nghe/xem liên tục bản dựng.

Sửa bộ kiểm QA: regex tìm chữ view_image trong log không đủ (brief cũng chứa chữ đó). tests/helpers/codex-media-image-audit.mjs đối chiếu output ảnh của call liên quan với SHA256 JPEG; harness không báo samplerImageOpened khi thiếu session hoặc không khớp ảnh. Unit thử prompt echo, call lỗi, output call khác, ảnh lặp và đủ ảnh qua1/1; syntax harness qua. Không chạy thêm model để lặp kết quả, không đổi project/media/renderer hoặc restart app. Báo cáo cũ đã bổ sung imageAudit từ session thật.

Lượt đầu dựng thật sau resume: REAL_WORKER_Q2_V50_RESUMED_FIRST_BUILD.json, project contentos-qa-real-codex-q2-5. Codex thật hoàn tất264,169giây, candidate→awaiting-review, không xuất/đăng. Transcript nhập từ lượtqa-4 đã nhận local423từ rồi bị hủy theo yêu cầu pause; lượt này không nhậnASR mới. Dùng bốn B-roll file đầy đủ copy local; không xác minh NAS intake.

Q2_CURRENT_FIRST_BUILD_AUDIT.json đối chiếu savedtimeline106,29s:5segments lưu nhưng resolve gộp còn2,11texts/3blocks/4Broll/105caption; nhạcambient-pad0,08/SFXvua0,18/duckSourceSpeech0,45. Đèn/ghe/đổimàu giao cụm sản phẩm; màn9,07–11,27s dưới câu chung, cụm màn15,52–16,27s không có cảnh màn. Điều này chưa chứng minh montage sai nhưng chưa đạt ưu tiên cảnh chứng minh tại tên sản phẩm. Đổimàu kéo qua “Chất lượng như”; cần duyệt biên tập. Scriptaudit readonly tests/q2-first-build-audit.mjs không tự sửa hoặc nhận hình đúng từ tên file.

CLIreported209.379tokens tổng; không có cached/billed breakdown hoặc so sánh kiểmsoát, không nhận đã giảm token từ284.988 của lượt trước. Logcho thấy đọc nhiều code app, lỗi tựviết scriptảnh thừa dấu ngoặc và importmodule sai cấp. Các lỗi đã đượcworker tự sửa trước done nhưng tốn bước. Browser tựđộng khôngkhảdụng; chưa xem/nghe liên tục. Không lấy done/cấu trúc xanh làm nghiệmthu chấtlượng.

## Bổ sung công cụ dùng chung

src/services/session-media-sample.mjs và editor/tools/khao-sat-media.mjs: claim đúng first-build/revise working, candidateReview kiểm expectedpath/workspace, validate jobbytes/base/candidate revision trước và sau await. Dùng createEditorContext.sample chung API: metadata/source bounds,1–3mốc khác nhau,480pxJPEG,media/transcript/provenance guards. Tạo freshscratch dưới realpath của candidate, trảpath/time/hash/bytes, không trảdataUrl. Chỉ ghi ảnh/metadata khảo sát; không thayproject/candidate/source hoặc render, không tự suy hình-lời. Lỗi xóa đúng scratch vừa tạo, không xóa lịch sử hoặc lock.

Test mới dùng FFmpeg thật trên1s testsrc2: JPEG3mốc, payloadkhôngbase64, bytesnguồn/live/candidategiữ; wrongclaim/cancel/stale/bounds/duplicate/oversized/NaN/path/abort từchối; failedscratchdọn; revise đọc media từprojectgốc nhưng ghiảnh dưới candidateviệcsửa. Fullsuite359/359 trước bổ sungassertrevise, xem logsession-media-sample-suite.log; rerunfocused ở bước sau. Khôngbrowser/APIprovider/modelworkerthật gọi helper mới, chưa benchmarktoken/speed hoặc quan sáthànhđộngliêntục.

Creativev50 references/editorial.md thêm lệnh lấyảnh và giới hạn; snapshotjob đãxong giữ nguyên, không sửa lại để giả worker đã dùnghelper mới. Khôngbackendroute/UI/renderer mới nên không cầnrestart. Việc còn lại: thửworkerfirst-build với côngcụ mới và duyệt cảnh màn/biên đổi màu, hình/mix thực tế. Không chạy tiếp cùngQA chỉ để tăngsốtest.

Focusedtest chạy lại sauassertrevise qua (FFmpegthật4framecảfirst-build/revise), khôngHTTP/CLIprocess mới. ZIP workspace/exports/chungauto-creative-v50-media-sampler.zip parse11preset/5refs và lệnhkhảosát đúng. ServerQA5193đãdừng theo terminaldone, main5180dispatcher0/0; khôngrestartmain hoặc đổiworkspace. Nativebrowser vẫn chưa nghiệmthu. Các sửa harness thêm --source-qa/--current-workspace/--evidence và preflightport giúp khôngghiđèbằngchứng hoặc đổworkspace khi chỉcầnnewQA; khôngnhận các guard là lỗi product đãkhắcphục.
