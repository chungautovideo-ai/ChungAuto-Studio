# Đối soát yêu cầu nhận diện toàn thân

Đọc lại code hiện hành và bằng chứng REA CapCut đã lưu trong CAPCUT_REA_RESOURCE_EVIDENCE.json. Bằng chứng chỉ là PE resources, không chứng minh engine/model của CapCut. Không lặp lại inventory hoặc thêm nhóm UI trùng.

Hướng đang tích hợp: MediaPipe phân vùng người/da, giao với SAM2.1 Tiny để giới hạn người được chọn. Điều khiển ở Bộ lọc → Làm đẹp → Người & da toàn thân; sáng riêng người gồm quần áo, sáng/mịn da dùng semantic skin mask. Có khoảng nguồn, chọn/theo dõi, xem vùng và Áp dụng; giới hạn theo dõi 15 giây/120 mẫu mỗi lượt.

Kiểm lại: bốn file person-selection, person-source-adjustments, person-tracking-error, person-mask-edits qua 8/8, gồm mốc cuối phân số. Runtime trả ready=true, Python3.12.10/Torch2.6.0+cu124/CUDA12.4, RTX4070Ti, model SHA256 48c14467e5cf9e51870511feb72c89688e82dd74523142c0538b663e193ac2a7. Lượt này runtime local và py launcher đều vượt 25 giây; fallback sang lệnh python hệ thống thành công sau 9,824 giây. Chưa xác định nguyên nhân timeout; không coi runtime portable đã được xác nhận qua lượt này, không cài lại hoặc dừng tiến trình app.

Không chạy inference/render mới, không nghiệm thu browser. Chưa đảm bảo nhiều người giao nhau, che khuất thật hoặc không lem nền trong mọi khung. Bằng chứng GPU 6 giây đã có ở PERSON_PORTABLE_TRACKING_CURRENT.md; không dùng kiểm readiness thay kiểm chất lượng. Chưa thêm RVM/BiRefNet vì foreground chung không tự phân biệt da và chưa có benchmark cho thấy cần thay pipeline hiện hành.
