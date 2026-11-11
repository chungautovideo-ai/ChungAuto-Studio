# Hoàn tất bản xuất không chặn server · phân tích trước triển khai

Hiện server close handler gọi đồng bộ FFmpeg loudnorm, ffprobe, đo audio/hash/copy. Video dài có thể chặn mọi request dù renderer đã thoát. Nhiều phiên dựng cần API/Hoạt động vẫn phản hồi. Tách finalizer hiện có vào worker thread Node, server await nhưng event loop không bị chặn; giữ cùng thuật toán/artifact/lock và không nhân pipeline.

Trong lúc hoàn tất: running=true/finalizing=true, ok chưa chốt, khóa render vẫn giữ tới kết quả/metadata. UI ghi Đang hoàn tất file và kiểm âm thanh, không giả progress mới. Hủy khi renderer đã thoát không thể đảo commit: API trả409 rõ giai đoạn, UI ẩn nút Hủy. Không tự terminate thread đang commit. Tham khảo component VEK renderRenderBox đã có và ảnh1280/390 RENDER_FINAL_AUDIO; không thêm menu. CLI chạy process riêng giữ finalizer đồng bộ; main server dùng asyncworker. Kiểm heartbeat event loop cùng FFmpeg thật/sidecar/hash, HTTP status và error, UI component. Không đổi renderer/composition/skill.


## Kết quả

Đã thêm render-finalization-async.mjs và worker entry dùng lại finalizeRenderArtifact nguyên thuật toán. Main close callback await worker exit rồi chốt result, trong lúc đó runningtrue/finalizingtrue/oknull, giữ lock render. Worker lỗi có phản hồi/exitcheck, không resolve trước khi thread thoát. CLI xuat-video chạy riêng vẫn dùng finalizer sync, không đổi hành vi. Hash/copy/FFmpeg đều ở thread của finalizer thay mainloop; renderer vẫn chạy process hiện có.

UI báo đang hoàn tất file/kiểm âm thanh, ẩn Hủy trong giai đoạn này; DELETE render-ai trả409 rõ để tránh hủy giữa commit. Không tự terminate thread hoặc công bố render xong trước verify. Chưa có crash recovery cho thread khi cả app chết, giữ giới hạn hiện hành.

Kiểm worker FFmpeg thật2s có audio: interval5ms tiếp tục chạy, sốđo/sidecar/hash và nhánh error qua. Suite292/292 tại workspace/logs/render-finalization-async-suite.log. HTTP QA0,6s cóaudio quan sát finalizingtrue, /api/ping trảlời trong giaiđoạn, DELETE bị409, sauđó success/hash/sidecar đúng: RENDER_FINAL_AUDIO_MEASUREMENT_HTTP.json. Chromecomponent renderRenderBox kiểm finalizinglabel/ẩnHủy và các trạng thái audio qua; ảnh1280/390 đã xem ở lượt audio trước, bố cục giữnguyên. Không dùng fixture ngắn nghiệmthu multijobthật/crash/throughput50–100ngày.

Đã restart riêng main11876 sau dispatcher0/0/recoverable0, render/ASR/trackeridle, xác minh command đúng5180 và khôngmediaworker; start báo ready. Khôngđổi renderer/skill snapshot, Creativev48 giữhiệnhành. WorkerCodexthật vẫn bị sandbox độc lập; khôngtựđổi agent/provider hoặc yếu sandbox.
