# Kiểm che biển trên cảnh xe thật — 05/11/2026

Nguồn chỉ đọc D:/Edit tự động/source/broll/broll_den.mp4, 1728×3072,8.0247giây. Bản sao QA ở workspace/content/2026-11-05/contentos-smoke-real-car-plate. Không sửa nguồn hoặc dự án người dùng. Camera lùi và nghiêng, biển chính nhỏ dần. ROI đánh dấu thủ công, không detector.

Lượt đầu ROI[.025,.71,.95,.15] xử lý đủ240frame/8s/audio trong11.633s, hashnguồn giữ. Vùng hơi rộng che cản xe; thử lại ROI[.035,.735,.935,.112] xử lý9.999s, lưu nguồn dẫn xuất riêng và chỉ áp vào projectQA. Hai thời gian là tracker+encode/mux trên máy hiện tại, không end-to-end/AI/throughput6máy.

Final HyperFrames qua xuat-video.mjs exit0,8s1080×1920/30fps240frame/audio. Ảnh PLATE_REAL_FINAL_40.png lấy5fps/40mẫu và PLATE_REAL_REFINED_CONTACT.png đã xem: biển chính được che trong các ảnh lấy mẫu, viền biển có chỗ còn thấy. Không khẳng định mọi pixel/mọi biển/đủ mọiframe; không fullplayback hoặc nghe audio. Chưa ghi plate-review.json và reviewed=false. PLATE_REAL_CAR_SMOKE.json lưu nguồn/SHA256/khoảng/ROI/output/probe/evidence/giới hạn.

Phát hiện thực tế: ROI quá rộng làm che chi tiết xe, còn ROI chữ nhật không bám chính xác tứ giác biển nghiêng. Bước nâng tiếp nên có lựa chọn4góc hoặc detector cho ROI ban đầu, đánh giá độc lập coverage trên footage nhiều cảnh và biển mới vào hình. Không chỉ giảm padding cố định để làm mask đẹp vì có thể lộ chữ. Chưa chọn engine/model detector hoặc tải phụ thuộc mới trong lượt kiểm này.
