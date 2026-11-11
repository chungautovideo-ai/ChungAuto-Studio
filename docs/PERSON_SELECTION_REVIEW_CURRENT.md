# Xem lại vùng người đã lưu — phân tích UX trước code

Nhu cầu: kiểm khoảng đượcchọn trênvideođangdựng màkhôngchạylạiGPU hoặc sửa mask. HiệnChọnlạikhoảng chỉprefillfrom/duration và đòitheodõimới đểthấymask, appchưa có nútReviewmaskđãlưu. Đãxemảnh390/1280 PERSON_SELECTION_RANGES_CURRENT.md và code contentos-person-selection.js; giữdialog và nhómBộlọc→Làmđẹp, học workflow kiểmtrướcApply của chínhVEK/ContentOS. Khôngcầnmenu mới, khôngsaochépCapCut.

Luồngđích: mởdanhsáchkhoảng→Xemvùng→dialogreadonly tựloadkhungđầu đúngrange đãlưu, tua theo cácmẫuvà bật/tắt overlay so gốc→Đóng. Không có Apply/Track, khôngđổi dirty/Undo/Save. Chọnlạivẫn luồngtạo maskmới. Header/nút/tokens chung; controlsẩn vùng kỹthuật không dùng trongreview, góc dưới cóĐóng, slider cótime/mẫu rõràng.390controls wrap/canvas fit cuộn, keyboardrange/Escape. Khôngthêmtựđánhreceiptđãduyệt.

Dữliệu: clone/normalize selection tại mốc mở; nguồn phải thuộcmanifest live vàSHAkhớprange/nguồnđãquét, revision/workspace/project khôngđổi. MediaURL dùngprimarypreviewđãcó. Ngườidùngđổi/mấtnguồn thìlỗi vàkhông hiểnoverlayhợplệ; reviewkhôngđồngnghĩa kiểmfullmask/body/identity. Chưa playtựđộng/cọsửa trongreview.

Kiểm: QA2ranges nguồn6squét/thựcSAM2đãsẵn hoặc mới; reviewhai khoảng,seekcuối,ẩn/hiệnmask thaycanvas;NetworkkhôngPOSTtracking; hashproject/face/savedmaskkhôngđổi; reviewchỉreadonlykhôngApply; readonlymissing/stalelỗi; ảnh390/1280xem, mở/đóng/keyboard. Khôngđổirenderer nênkhôngxuấtlạivideođểtestreviewUI.


## Kết quả thực tế · 05/11/2026

Đã thêm **Xem vùng** tại Bộ lọc → Làm đẹp → Người & da toàn thân → chọn nguồn → danh sách khoảng. Dialog dùng mặt nạ đã lưu, tự lấy khung đầu; tua mẫu cuối, ẩn/hiện lớp phủ, Escape và Đóng. Nút Theo dõi/Áp dụng được ẩn và chặn trong chế độ xem. Manifest nguồn được kiểm SHA lúc mở và tải lại; trạng thái project/revision được kiểm khi thao tác. Không liên tục băm lại nguồn ở mỗi lần tua.

Browser smoke thực chạy MediaPipe + SAM2 local trên dự án QA mới, hai khoảng 0–2/3–5 giây: xem cả hai, tua cuối 1.875/4.875, bật/tắt làm canvas đổi, không POST tracking trong lúc review, byte project/face giữ nguyên. Lỗi kiểm nguồn chặn slider; Escape đóng. Bằng chứng PERSON_SELECTION_REVIEW_SMOKE.json và workspace/logs/person-selection-review-dialog-smoke.log. Đã xem ảnh PERSON_SELECTION_REVIEW_0_390.png và PERSON_SELECTION_REVIEW_1_1280.png: dialog cuộn trong viewport, không thêm menu. Unit selection/scope qua (xem person-selection-review-unit.log). HTTP5180 phục vụ app.js có nút mới, static không cần restart.

Không đổi renderer nên không xuất lại chỉ để kiểm UI. Đây là kiểm ngắn một người chuyển động; chưa chứng minh đa người, che khuất hoặc mask chính xác mọi khung. Không đổi skill v37 vì không thay quy tắc dựng/schema; AI vẫn dùng scope và gap hiện hành.

Bổ sung: tải lại kiểm nguồn lỗi xóa canvas cũ, chặn slider; đóng khi load đang chờ không vẽ lại. PERSON_SELECTION_REVIEW_SMOKE.json có staleReloadClearsCanvas=true, browser chạy lại thành công trên QA mới. Lỗi harness lúc đầu thiếu revision/workspace trong URL media đã sửa; không quy lỗi server từ fixture đó.
