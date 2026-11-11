# Kiểm bản xuất chỉ nâng sáng da

Mục tiêu: xác minh ba thanh toàn thân có tách đúng hành vi, đặc biệt bodyWhite không làm sáng quần áo/tóc hoặc nền theo nhãn mặt nạ đã lưu. Đây là kiểm đường bản xuất hiện tại, không thay quét/chọn người hay tự đổi dự án đang mở.

tests/skin-only-final-smoke.mjs --render-local tạo hai QA có UUID riêng từ bản sao đã có. Nguồn là proxy6giây của người thật đã làm tối trong QA trước đó; không gọi đây là nguồn camera nguyên trạng. Hai bản giữ cùng semantic/SAM2 mask, đặt mọi mức làm đẹp khác bằng0, sourceAdjustments bodyWhite0 và30. Xóa override mức của khoảng trên hai bản copy để phép kiểm không bị ưu tiên phạm vi che mất. Không sửa dự án/media dùng làm gốc, không đăng hoặc gọi API trả phí.

Render final và kiểm hashsidecar; giải mã toàn frame ở144×256, dùng label2da/label1người khác/label0nền. Bỏ vùng biên2pixel, đo gain sáng da và sai khác tuyệt đối quần áo/tóc/nền; kiểm frame ngoài khoảng tắt. Không bỏ qua frame thiếu vùng an toàn để nhận đạt. Contact trước/sau chỉ là hỗ trợ xem, không thay kiểm toàn frame hoặc nghe/xem liên tục.

Giới hạn: kiểm cô lập theo nhãn có sẵn không chứng minh nhãn đúng ở bàn tay/chân, màu da tự nhiên, viền hay đa người/che khuất. Sai số codec/chuyển kích thước được tính, không yêu cầu ảnh nền bit-exact. Không đổi renderer; nhãn UI được làm rõ bên dưới, không suy năng suất.

## Phân tích nhãn trước đổi UI

Code app.js nhóm Người & da toàn thân đã dùng bodyWhite nhưng nhãn chỉ “Sáng da mặt, cổ & tay”, trợ giúp cũng bỏ chân. Model phân loại body-skin chung nên người dùng có thể hiểu nhầm khả năng bị giới hạn ở ba vùng. Tham khảo luồng VEK hiện có và đối chiếu tách mask trong PERSON_BODY_INTEGRATION_CURRENT.md; không có khảo sát CapCut runtime mới. Dùng lại chính field/help, đổi nhãn thành “Sáng da toàn thân”, giải thích gồm phần da lộ ra được AI nhận diện. Không thêm tab, token, control, không đổi bố cục/Save/Undo hoặc dữ liệu. Nhãn ngắn hơn, không có thay focus/keyboard/breakpoint; kiểm staticHTTP/component sau đổi, chưa nhận responsive/nativeUI mới.

## Kết quả final

Hai final6,006s xuất bằng code hiện tại, hashsidecar đúng, source/dựánQA gốc giữ nguyên. SKIN_ONLY_FINAL_SMOKE.json:181frame giải mã,180frame có vùng chọn đều đủ vùng an toàn để đo,1frame ngoài khoảng. Không frame bỏ qua/lỗi. Gain sáng da tối thiểu8,456/255; sai khác RGB trung bình tối đa quần áo-tóc0,409/255, nền0,471/255. Khung cuối ngoài khoảng sai khác0,462/255 theo codec. Đây sai khác theo nhãnmask ở144×256, bỏbiên2px, không chứng minh mọi da đều được phân loại đúng.

Đã xem SKIN_ONLY_FINAL_CONTACT.png: hàng trên0/hàng dưới30 tại bốn mốc, mặt và phần da tay sáng nhẹ, áo/quần và cảnh nền nhìn tương tự. Chân chỉ có vùng nhỏ lộ da, ảnh nhỏ không đủ nghiệm thu da chân/ngón tay, tông da tự nhiên hoặc viền chuyển động liên tục. Bản im lặng, không nghiệm thu audio.

UI nhãn/trợ giúp đã sửa trong app.js, syntax và10kiểm component/template qua; HTTP5180 trả đúng byte file mới. Skillperson.md thêm phần da lộ ra và kiểm cô lập/khôngnâng toàn người bù mask; ZIP11preset5refs/1.635.718byte đãparse lại. Chỉstatic, khôngrestartbackend hoặc kiểmbrowsernative mới. Tải lại trang để nhậnnhãn.
